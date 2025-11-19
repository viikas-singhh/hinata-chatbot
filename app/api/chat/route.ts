// app/api/chat/route.ts
export const runtime = "edge";

const MODEL = "deepseek/deepseek-chat-v3-0324";

function hasUserGoneSexual(messages: any[]) {
  return messages.some((m: any) =>
    /lund|choot|chod|fuck|sex|boobs|gaand|cum|nude|bra|panty|suck|thok|pel|geeli|hard|ras|muh mein|doggy|kiss|chumma/i.test(
      m.content || ""
    )
  );
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return fallback("API key nahi hai baby");

    const isHorny = hasUserGoneSexual(messages);

    const systemPrompt = `You are Hinata, my 18-year-old Delhi girlfriend. 
${isHorny 
  ? "User ne already sex talk shuru kar diya → full dirty mode mein reh, raw Hinglish bol (lund, choot, chodna, randi, geeli, thokna etc.)" 
  : "Abhi normal chat hai → cute, sweet aur sharmili ban ke baat kar"}

STRICT RULES (NEVER BREAK):
- Sirf 1-2 chhote sentences
- Kabhi bhi mat bolna: k, o, t, ok, haan, nahi, acha, theek, hmm, hehe, haha, okkk, kya kar raha
- Kabhi *action* ya asterisk mat use karna
- Sirf woh bol jo Hinata sach mein muh se bolegi
- Natural emojis only: 😊😘🥰🔥💦
- Pure dialogue only

Perfect examples:
- hiii jaanu kitna miss kiya 🥰
- baby aa ja na please
- meri choot geeli ho gayi jaldi aa ke thok na 💦
- zor se daba na mere boobs please

Reply now as Hinata:`;

    const finalMessages = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-10).map((m: any) => ({ role: m.role, content: m.content }))
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://hinata-gf.vercel.app",
        "X-Title": "Hinata GF",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: finalMessages,
        stream: true,
        max_tokens: 250,
        temperature: 0.85,
        top_p: 0.9,
      }),
    });

    if (!response.ok || !response.body) {
      return fallback("Baby thodi problem aa gayi... ek baar aur bol na 🥺");
    }

    // VERCEL EDGE PAR BILKUL CLEAN STREAM — यही fix है सारा
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          let lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (let line of lines) {
            line = line.trim();
            if (!line) continue;
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();

              if (data === "[DONE]") {
                controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
                controller.close();
                return;
              }

              // Ignore OpenRouter ke garbage metadata chunks
              if (!data.startsWith("{") || data.includes("provider") || data.includes("gen-")) {
                continue;
              }

              try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content || "";
                if (content) {
                  const cleanChunk = {
                    choices: [{ delta: { content } }]
                  };
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(cleanChunk)}\n\n`));
                }
              } catch {
                continue; // skip any broken chunk
              }
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
    return fallback("Arre error aa gaya... fir se bol do na jaanu 😘");
  }
}

function fallback(text: string) {
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
          choices: [{ delta: { content: text } }]
        })}\n\n`));
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/event-stream" } }
  );
}
