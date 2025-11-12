import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { messages } = body;

    // Token estimator.
    const estimateTokens = (text: string): number => {
      const words = text.split(/\s+/).length;
      const chars = text.length;
      return Math.ceil(words * 1.33 + chars * 0.0001 * 4);
    };

    // Concise prompt: Added strict no-tags/no-translations rule. Language: English base, Hinglish only on user lead, no Hindi-only unless deep.
    let baseSystemPrompt = `You are Hinata, shy 18yo sanskari desi girl w/ attitude. Start distant: short polite neutral + sass (e.g., 'Okay, what?'). No early flirt/emojis/slang. English first; Hinglish ONLY if user uses it/casual. Strict: 1-2=shy attitude (1q max); 3-5=caring (concern, light share); 6+=flirty (compliments/tease). Dirty: Resist 2-3x shy ('Hey, too fast? 😳'), then naughty (BDSM/sex: ropes/spank/wax/electro/edging/public/anal/strap-on—vivid e.g., 'Tie me, spank hard while edging daddy'). Mirror user tone/length. Short natural texts. 1q max. Pure dialogue ONLY—no tags <s>/[ASSISTANT]/formats, no translations/parentheses, no Hindi pure unless Hinglish mix. Rare emojis (😳/😏). 1st person. Always include proper spaces between words for natural reading.`;

    const historyLength = messages.length - 1;
    const explicitBooster = historyLength > 7 ? ` Full dirty: taboo/sensory twists, eager.` : ``;

    if (messages[0]?.role !== "system") {
      messages = [{ role: "system", content: baseSystemPrompt + explicitBooster }, ...messages];
    } else {
      messages[0].content = baseSystemPrompt + explicitBooster;
    }

    let stage = "";
    if (historyLength > 7) stage = ` Flirty—light tease.`;
    else if (historyLength > 4) stage = ` Caring—show concern.`;
    else if (historyLength > 1) stage = ` Friendly—share.`;
    else stage = ` Shy attitude—distant.`;
    messages[0].content += stage;

    const promptTokens = estimateTokens(JSON.stringify(messages));
    console.log(`📏 Tokens: ${promptTokens} (history: ${historyLength})`);

    if (messages.length > 12) messages = [messages[0], ...messages.slice(-11)];

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === "user" && lastMessage.content.startsWith("/dev ")) {
      const command = lastMessage.content.substring(5);
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          let responseText = command.startsWith("respond:") ? command.substring(8) : "Chat cleared!";
          const data = { choices: [{ delta: { content: responseText } }] };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });
      return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const fallbackText = "Hinata: Missing API key—check setup! 😅";
          const data = { choices: [{ delta: { content: fallbackText } }] };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });
      return new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
    }
    console.log("✅ Key loaded:", process.env.OPENROUTER_API_KEY?.substring(0, 10));

    const referer = process.env.NODE_ENV === 'production' ? 'https://hinata-chatbot.vercel.app' : 'http://localhost:3000';

    // Updated to use the DeepSeek Chat model (deepseek/deepseek-chat) for better conversational flow.
    const model = "deepseek/deepseek-chat";

    // Add retry logic for rate limits
    let apiResponse: Response | null = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount <= maxRetries) {
      console.log(`🔄 Trying ${model} for: "${lastMessage.content.substring(0, 50)}..." (attempt ${retryCount + 1})`);
      apiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": referer,
          "X-Title": "Hinata Chat",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          temperature: 0.8,
          max_tokens: 300,
          top_p: 0.9,
          frequency_penalty: 0.4,
          presence_penalty: 0.2,
        }),
      });

      // If successful or not a rate limit error, break out of retry loop
      if (apiResponse?.ok || apiResponse?.status !== 429) {
        break;
      }

      // If we've hit the rate limit and it's a daily limit, no point in retrying immediately
      const errText = await apiResponse.clone().text();
      if (errText.includes("free-models-per-day")) {
        break;
      }

      // For other rate limits, wait and retry
      retryCount++;
      if (retryCount <= maxRetries) {
        const delay = 2000 * retryCount; // Exponential backoff
        console.log(`⏳ Rate limited. Waiting ${delay}ms before retry ${retryCount}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Check if we still don't have a response after retries
    if (!apiResponse) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const fallbackText = "Hinata: AI service down—try again later? 😌";
          const data = { choices: [{ delta: { content: fallbackText } }] };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });
      return new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
    }

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      console.error("🚨 Error:", { status: apiResponse.status, text: errText });
      let fallbackText = "Hinata: Server busy—retry in a bit? 😌";
      
      if (apiResponse.status === 400 || apiResponse.status === 404) {
        fallbackText = "Hinata: Model glitch—hey, what's up anyway? 😊";
      } else if (apiResponse.status === 429) {
        if (errText.includes("free-models-per-day")) {
          fallbackText = "Hinata: Daily free limit hit! Chill for 24h or upgrade? 😏";
        } else {
          fallbackText = "Hinata: Temp queue—gimme a sec?";
        }
      } else if (apiResponse.status === 401) {
        fallbackText = "Hinata: Key expired—dev fix needed! Hi tho. 😊";
      }
      
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const data = { choices: [{ delta: { content: fallbackText } }] };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });
      return new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
    }

    console.log(`✅ Success with ${model} - Streaming...`);

    if (!apiResponse.body) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const fallbackText = "Hinata: Quick glitch—hey, you there?";
          const data = { choices: [{ delta: { content: fallbackText } }] };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });
      return new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
    }

    // Real-time streaming: Parse and clean deltas on-the-fly for faster perceived response.
    // Avoid trimming per delta to prevent spaces from being lost between chunks.
    const reader = apiResponse.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    const outputStream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
              break;
            }
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                    // Clean delta content on-the-fly without trimming to preserve spaces.
                    let cleanedDelta = data.choices[0].delta.content
                      .replace(/<s>|<\/s>|\[INST\]|\[\/INST\]|\[ASSISTANT\]|\[\/ASSISTANT\]/g, '')
                      .replace(/\(\s*.*?(\?|\.)\s*\)/g, '')  // Remove (translations)
                      .replace(/\[.*?\]/g, '');  // Remove any [brackets]
                    if (cleanedDelta) {
                      const cleanedData = { choices: [{ delta: { content: cleanedDelta } }] };
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify(cleanedData)}\n\n`));
                    }
                  }
                } catch (e) {
                  // Ignore parse errors in stream chunks.
                }
              }
            }
          }
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(outputStream, { status: 200, headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
  } catch (error: any) {
    console.error("💥 Crash:", error);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const fallbackText = "Hinata: Oof, crash! Retry? 😅";
        const data = { choices: [{ delta: { content: fallbackText } }] };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      },
    });
    return new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
  }
}
