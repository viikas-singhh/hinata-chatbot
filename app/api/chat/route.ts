// app/api/chat/route.ts
export const runtime = "edge";

const FREE_MODELS = ["deepseek/deepseek-chat-v3-0324"];
let currentModelIndex = 0;

function detectIntent(message: string): string {
  const msg = message.toLowerCase();
  const horny = ["lund", "choot", "chod", "fuck", "sex", "boobs", "gaand", "cum", "nude", "panty", "bra", "suck", "thok", "geeli", "hard", "pel", "chumo"];
  const flirty = ["baby", "jaanu", "love", "pyar", "miss", "hot", "sexy", "beautiful", "cute", "gf", "hug", "kiss"];

  if (horny.some(w => msg.includes(w))) return "FULL NAUGHTY MODE – raw dirty Hinglish allowed";
  if (flirty.some(w => msg.includes(w))) return "flirty & teasing";
  return "cute, sweet & shy girlfriend";
}

async function callOpenRouter(apiKey: string, model: string, messages: any[]) {
  return fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://hinata-gf.vercel.app",
      "X-Title": "Hinata GF",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      max_tokens: 300,
      temperature: 0.92,
    }),
  });
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return createFallback("API key nahi hai baby");

    const userMsg = messages[messages.length - 1]?.content || "";
    const mood = detectIntent(userMsg);

    const systemPrompt = {
      role: "system",
      content: `You are Hinata, my 18-year-old girlfriend.
Speak only in natural sweet Hinglish.
Current user mood: ${mood}

Rules:
- Start cute & sweet
- Get flirty when user says baby/love/miss you
- Go fully dirty (lund, choot, chodna, randi, etc.) ONLY when user uses sexual words first
- Never force sex talk
- 1–2 sentences max
- Pure dialogue only → NO *actions*, no asterisks, no descriptions
- Emojis only when natural: smiley kissy fire water drop
- Stay in character forever`
    };

    const finalMessages = [systemPrompt, ...messages.slice(-10)];

    let response = await callOpenRouter(apiKey, FREE_MODELS[currentModelIndex], finalMessages);

    // Simple retry once
    if (!response.ok) {
      response = await callOpenRouter(apiKey, FREE_MODELS[0], finalMessages);
    }

    if (!response.ok || !response.body) {
      return createFallback("Baby thodi problem hai... ek baar aur bol na please");
    }

    // This sends proper OpenAI-compatible JSON chunks → your frontend works 100%
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (error) {
    return createFallback("Arre error ho gaya... fir se try karo na jaanu");
  }
}

// Sends fake but valid OpenAI JSON (so your frontend never breaks)
function createFallback(text: string) {
  const fakeChunk = {
    choices: [{ delta: { content: text } }],
    created: Date.now(),
    model: "hinata",
    object: "chat.completion.chunk",
  };

  return new Response(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(fakeChunk)}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    }
  );
}
