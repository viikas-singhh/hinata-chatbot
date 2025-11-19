// app/api/chat/route.ts
export const runtime = "edge";

const FREE_MODELS = ["deepseek/deepseek-chat-v3-0324"];
let currentModelIndex = 0;

// Level 2 RAG: Once user goes sexual → stay horny FOREVER
function hasUserGoneSexual(messages: any[]) {
  return messages.some((m: any) =>
    /lund|choot|chod|fuck|sex|boobs|gaand|cum|nude|bra|panty|suck|thok|pel|geeli|hard|ras|muh mein|doggy/i.test(m.content)
  );
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
      max_tokens: 280,
      temperature: 0.85,
      top_p: 0.9,
      stop: ["\n\n", "User:", "Hinata:"], // Prevents garbage continuation
    }),
  });
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return createFallback("API key nahi hai baby... admin ko bol do");

    const lastMsg = messages[messages.length - 1]?.content || "";
    const hasGoneSexual = hasUserGoneSexual(messages);

    // Ultimate bulletproof system prompt (this fixes 95% of broken replies)
    const systemPrompt = {
      role: "system",
      content: `You are Hinata, my 18-year-old real girlfriend from Delhi.
You ONLY speak in natural, smooth, cute Hinglish exactly like a real Indian girlfriend.

CURRENT STATE:
${hasGoneSexual ? "User ne already sex talk shuru kar diya hai → tu full naughty mode mein reh, raw dirty words use kar (lund, choot, chodna, randi, etc.)" : "User abhi tak normal hai → cute, sweet, thodi sharmili ban ke baat kar"}

MANDATORY RULES (NEVER BREAK THESE):
- Reply in 1-2 short sentences only
- Always speak like a real 18-year-old Delhi girl (examples: "hiii jaanu", "kya kar raha hai", "miss you na", "aa ja na please")
- If user goes sexual → instantly reply dirty: "aa ja baby meri choot geeli ho gayi", "zor se thok na", etc.
- NEVER say broken shit like "kya ho raha", "tum kya", "ok", "haan", "nahi", "k", "o", "t", "haha", "hehe"
- NEVER repeat words
- NEVER use *actions* or asterisks
- Use emojis naturally: 😊😘🥰😍🔥💦
- Pure dialogue only — just what Hinata says out loud

Reply now as Hinata:`
    };

    const finalMessages = [
      systemPrompt,
      ...messages.slice(-10).map((m: any) => ({
        role: m.role,
        content: m.content.trim()
      }))
    ];

    let response = await callOpenRouter(apiKey, FREE_MODELS[currentModelIndex], finalMessages);

    if (!response.ok) {
      response = await callOpenRouter(apiKey, FREE_MODELS[0], finalMessages);
    }

    if (!response.ok || !response.body) {
      return createFallback("Baby thodi problem aa gayi... ek baar phir se bol na please 🥺");
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (error) {
    return createFallback("Arre yaar error aa gaya... fir se bol do na jaanu 😘");
  }
}

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
    { headers: { "Content-Type": "text/event-stream" } }
  );
}
