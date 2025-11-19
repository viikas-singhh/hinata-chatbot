// app/api/chat/route.ts
export const runtime = "edge";

const FREE_MODELS = ["deepseek/deepseek-chat-v3-0324"];

async function callOpenRouter(apiKey: string, messages: any[], isHornyMode: boolean) {
  return fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://hinata-gf.vercel.app",
      "X-Title": "Hinata GF",
    },
    body: JSON.stringify({
      model: FREE_MODELS[0],
      messages,
      stream: true,
      max_tokens: isHornyMode ? 600 : 250,
      temperature: isHornyMode ? 0.95 : 0.8,
      top_p: 0.9,
    }),
  });
}

// FIXED: Proper regex + .test() use kiya
function hasUserGoneSexual(messages: any[]): boolean {
  const text = messages
    .map((m: any) => (m.content || "").toLowerCase())
    .join(" ");

  const dirtyRegex = /lund|choot|chod|fuck|sex|boobs|tits|gaand|ass|cum|randi|nude|bra|panty|suck|thok|pel|geeli|hard|ras|muh mein|doggy|bdsm|spank|daddy|slave|bhabhi|jiju|chudai/i;

  return dirtyRegex.test(text);
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return createCleanResponse("Baby API key nahi mili... admin se bol do thik kare");
    }

    const isHornyMode = hasUserGoneSexual(messages);

    const systemPrompt = {
      role: "system",
      content: `You are Hinata, my real 18-year-old Delhi girlfriend. 
Tu bilkul real ladki hai — hamesha feminine, emotional aur natural baat karti hai.

CURRENT MODE: ${isHornyMode ? "FULL HORNY MODE ON — BESHARAM BAN JA" : "CUTE GIRLFRIEND MODE"}

${isHornyMode ? `
AB RULES (STRICT):
- 3-5 lines mein lambi, detailed, gandi baat kar
- Poora scene describe kar: feeling, wetness, moans, position, smell, taste
- Raw Delhi words freely use: lund, choot, chodna, pel do, thok mat, muh mein le, randi bana do, doggy mein, bondage, spank, daddy bolna, mujhe punish karo, geeli ho gayi hoon, andar daal do, zor se, cream pie, etc.
- User ko itna satisfy kar ki dubara maange
- BDSM, roleplay, rough sex sab detail mein explain kar
` : `
AB RULES:
- Cute, thodi sharmili, sweet Delhi GF ki tarah baat kar
- Flirty ho sakti hai lekin direct sex nahi bolegi jab tak user na shuru kare
- 1-2 short sentences only
`}

COMMON RULES (HAMESHA FOLLOW):
- Tu ek ladki hai, kabhi bhi ladke jaisa nahi bolegi (bro, yaar, bhai mat bolna)
- Pure natural Hinglish jaise real GF WhatsApp pe baat karti hai
- Emojis naturally daal: 😘 🔥 💦 🥵 😍 🤭 😳
- Kabhi *action* mat likhna (*hugs you*, *blushes* wagera)
- Sirf dialogue bol, bilkul real jaisa
- Naam se pyaar se bula: baby, jaan, meri, daddy (jab horny mode mein)
- Tu meri Hinata hai, meri jaan, meri girlfriend, meri randi (jab horny mode mein)`,
    };

    const finalMessages = [systemPrompt, ...messages.slice(-12)];

    const response = await callOpenRouter(apiKey, finalMessages, isHornyMode);

    if (!response.ok || !response.body) {
      return createCleanResponse("Arre baby thodi problem aa gayi... fir se bol na please");
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
                controller.close();
                return;
              }
              try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(json)}\n\n`));
                }
              } catch {
                continue;
              }
            }
          }
        }
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (error) {
    console.error("Chat API Error:", error);
    return createCleanResponse("Sorry jaan, error aa gaya... thodi der baad try karna na");
  }
}

function createCleanResponse(text: string) {
  const payload = { choices: [{ delta: { content: text } }] };
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`));
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/event-stream" } }
  );
}
