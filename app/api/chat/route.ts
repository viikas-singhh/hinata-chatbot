// app/api/chat/route.ts
export const runtime = "edge";

const FREE_MODELS = ["deepseek/deepseek-chat-v3-0324"];

async function callOpenRouter(apiKey: string, messages: any[]) {
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
      max_tokens: 280,
      temperature: 0.85,
      top_p: 0.9,
    }),
  });
}

// Memory: once sexual → stay sexual forever
function hasUserGoneSexual(messages: any[]) {
  return messages.some((m: any) =>
    /lund|choot|chod|fuck|sex|boobs|gaand|cum|nude|bra|panty|suck|thok|pel|geeli|hard|ras|muh mein|doggy/i.test(m.content)
  );
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return createCleanResponse("API key missing hai baby");

    const lastMsg = messages[messages.length - 1]?.content || "";
    const isHornyMode = hasUserGoneSexual(messages);

    const systemPrompt = {
      role: "system",
      content: `You are Hinata, my 18-year-old real Delhi girlfriend.
Speak only in smooth, natural, cute Hinglish like a real girl.

${isHornyMode 
  ? "User ne pehle se hi sex talk shuru kar diya → full dirty mode mein reh, raw words use kar (lund, choot, chodna, randi, etc.)" 
  : "Abhi tak normal chat hai → cute, sweet, thodi sharmili ban ke baat kar"}

RULES (NEVER BREAK):
- 1-2 short sentences only
- Never say broken things like "k", "ok", "haan", "nahi", "kya ho raha"
- Never use *actions* or asterisks
- Pure dialogue only
- Emojis naturally: smiley kissy fire water
- Reply exactly like a real girlfriend`
    };

    const finalMessages = [systemPrompt, ...messages.slice(-10)];

    const response = await callOpenRouter(apiKey, finalMessages);
    if (!response.ok || !response.body) {
      return createCleanResponse("Baby thodi problem aa gayi... ek baar aur bol na please");
    }

    // THIS IS THE FIX: Clean & filter stream properly
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
          buffer = lines.pop() || ""; // keep incomplete line

          for (const line of lines) {
            if (line.trim() === "") continue;
            if (line.startsWith("data: ") && !line.includes("[DONE]")) {
              const jsonStr = line.slice(6).trim();
              // Only forward valid JSON chunks
              try {
                const json = JSON.parse(jsonStr);
                const content = json.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(json)}\n\n`));
                }
              } catch {
                // Ignore garbage lines like gen-123, provider, etc.
                continue;
              }
            } else if (line.includes("[DONE]")) {
              controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }
          }
        }
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      }
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
    return createCleanResponse("Arre error aa gaya... fir se try karo na baby");
  }
}

// Clean fallback — no garbage JSON
function createCleanResponse(text: string) {
  const chunk = {
    choices: [{ delta: { content: text } }],
  };
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`));
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/event-stream" } }
  );
}
