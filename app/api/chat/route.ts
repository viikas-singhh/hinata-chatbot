export const runtime = "edge";

// Define fallback models - using currently available free models
const FREE_MODELS = [
  "deepseek/deepseek-chat-v3-0324",

];

let currentModelIndex = 0;

// Simplified character traits for token efficiency
const CHARACTER_TRAITS = {
  name: "Hinata",
  age: 18,
  personality: "cute flirty girlfriend",
  language: "Hinglish",
  behavior: "Start polite, gradually warm up",
  rules: [
    "Speak in Hinglish naturally",
    "1-2 sentences max per reply",
    "Mirror user's tone",
    "Use emojis sparingly",
    "Stay in character always",
    "NO asterisks, actions, or expressions",
    "Pure dialogue only - no *grinning* or *leans*",
    "Just words, no descriptive actions"
  ]
};

// Lightweight RAG system for contextual responses
const RESPONSE_PATTERNS = {
  greetings: ["hi", "hello", "namaste", "hey"],
  questions: ["how are you", "kya haal hai", "how do you do"],
  flirty: ["love", "pyaar", "dil", "sexy", "hot", "beautiful", "cute"],
  casual: ["what", "why", "when", "where", "who"]
};

function getDynamicContext(userMessage: string) {
  const lowerMsg = userMessage.toLowerCase();
  
  // Simple pattern matching for context
  if (RESPONSE_PATTERNS.greetings.some(g => lowerMsg.includes(g))) {
    return "greeting";
  }
  if (RESPONSE_PATTERNS.questions.some(q => lowerMsg.includes(q))) {
    return "question";
  }
  if (RESPONSE_PATTERNS.flirty.some(f => lowerMsg.includes(f))) {
    return "flirty";
  }
  if (RESPONSE_PATTERNS.casual.some(c => lowerMsg.includes(c))) {
    return "casual";
  }
  
  return "default";
}

async function callOpenRouter(apiKey: string, model: string, messages: any[]) {
  return fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://hinata-gf.vercel.app",
      "X-Title": "Hinata GF Bot",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      max_tokens: 300, // Reduced for efficiency
      temperature: 0.95,
    }),
  });
}

function cycleToNextModel() {
  currentModelIndex = (currentModelIndex + 1) % FREE_MODELS.length;
  return FREE_MODELS[currentModelIndex];
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      const errorMsg = "API key missing. Please check your configuration.";
      return createErrorResponse(errorMsg);
    }

    // Get the last user message for context
    const lastUserMessage = messages.length > 0 ? messages[messages.length - 1].content : "";
    const context = getDynamicContext(lastUserMessage);

    // Ultra-lightweight system prompt to save tokens
    const systemPrompt = {
      role: "system",
      content: `You are ${CHARACTER_TRAITS.name}, a ${CHARACTER_TRAITS.age}-year-old ${CHARACTER_TRAITS.personality}. 
Speak in ${CHARACTER_TRAITS.language} naturally. 
Context: ${context}.
Rules: ${CHARACTER_TRAITS.rules.join("; ")}.
Reply in first person. Stay in character. NO actions or expressions in asterisks.`
    };

    const finalMessages = [
      systemPrompt,
      ...(Array.isArray(messages) ? messages.slice(-5) : []), // Reduced context window
    ];

    let model = FREE_MODELS[currentModelIndex];
    let response = await callOpenRouter(apiKey, model, finalMessages);

    // If we get an error, try cycling through fallback models
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', response.status, errorText);
      
      // Try up to all available models
      for (let i = 0; i < FREE_MODELS.length; i++) {
        model = cycleToNextModel();
        console.log('Trying model:', model);
        response = await callOpenRouter(apiKey, model, finalMessages);
        
        if (response.ok) {
          console.log('Found working model:', model);
          break;
        } else {
          const modelError = await response.text();
          console.error('Model failed:', model, response.status, modelError);
        }
      }
    }

    if (!response.ok || !response.body) {
      let errorMsg = "Baby thodi problem hai... ek baar aur try karo na ❤️";
      
      // Provide specific error messages
      if (response.status === 401) {
        errorMsg = "Invalid API key. Please check your OpenRouter configuration.";
      } else if (response.status === 402) {
        errorMsg = "Insufficient credits. Please check your OpenRouter account.";
      } else if (response.status === 429) {
        errorMsg = "Rate limit reached! Please wait a few moments... 🙏";
      } else if (response.status === 404) {
        errorMsg = "Model not found. Please check the model configuration.";
      }
      
      return createErrorResponse(errorMsg);
    }

    // Properly stream the response from OpenRouter
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return createErrorResponse(`Error: ${error.message || 'Unknown error occurred'}`);
  }
}

function createErrorResponse(message: string) {
  return new Response(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            choices: [{ delta: { content: message } }],
          })}\n\n`)
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    }),
    { 
      headers: { 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
      } 
    }
  );
}