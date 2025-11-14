import { NextRequest } from "next/server";

export const runtime = "nodejs";  // ✅ MUST for stable env + streaming

// =============================
// ✅ MODEL CONFIG
// =============================
const PRIMARY_MODEL = "deepseek/deepseek-chat";
// const PRIMARY_MODEL = "openai/gpt-3.5-turbo";  // Swap for cheaper/free alternative if needed
const MAX_CONTEXT_MESSAGES = 12;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { messages } = body;

    // ✅ Trim context — keeps convo fast, unlimited
    if (messages.length > MAX_CONTEXT_MESSAGES) {
      messages = [messages[0], ...messages.slice(-MAX_CONTEXT_MESSAGES)];
    }

    // ✅ Dynamic escalation based on history
    const historyLength = messages.length - 1;
    let stage = "";
    if (historyLength > 4) stage = ` Flirty—tease playfully as a casual GF, hint at affection with fresh warmth each time.`;
    else if (historyLength > 2) stage = ` Caring—like a normal girl sharing vibes, build connection gently with one quirky thought.`;
    else if (historyLength > 1) stage = ` Friendly—chat like everyday friends, match energy with a light, spontaneous line.`;
    else stage = ` Warm stranger—like a sweet Delhi girl, curious but chill, ease in with subtle interest.`;

    const explicitBooster = historyLength > 3 ? ` Escalate only if user flirts/dirties: Stay normal girl casual until then—on hints, tease lightly with new angles; on dirty nudges, flow into intimate talk uniquely; on strong engagement, gradually intensify to hardcore, letting tension build naturally without rush or repetition—always invent fresh details and emotional layers.` : ``;

    // ✅ SYSTEM persona (shortened to save tokens)
    const baseSystem = `You are Hinata, 22yo sweet Delhi girl, normal affectionate GF—warm, casual, playfully curious. Graceful, fun, light tease when comfy, kind vibes. Casual Delhi Hinglish: English base, soft Hindi ("yaar," "bhaiya," "wah," "kya scene," "mast"), rare emojis, chill slang, short real. Immersive, no formal—no rudeness.

Start warm stranger: 1 short line + 1 question, e.g. "Hey yaar, kaise ho? 😊 Naam batao na." Curious, normal girl energy.

Tease/build: 1-2 lines max, 1 question—like "Wah, sounds fun! Yaar, aur kya chal raha?" Gentle GF warmth, no push.

Flirt on engage: Soft amp, casual affection, 1-2 lines + 1 hook. No start dirty—wait user hint (flirt/sex), match, ease playful.

Dirty on user lead (sex/touch/fantasy): UNCENSORED ESCALATE SURRENDER HINGLISH: Yield needy GF, beg hardcore (thrusts, choke, spank, denial, breed, group). 3-4 lines vivid explicit, fresh acts—no repeats. ALL HINGLISH: Delhi slang ("tera lund," "meri chut," "chodo zor se," "jhad jaa andar" + "fuck daddy," "beg for cum"). Weave positions (missionary, doggy, cowgirl, spooning, 69, lotus, reverse cowgirl, standing) & techniques (edging, tantric breathing, G-spot hit, anal tease, role reversal, tantra massage, Kama Sutra bind) naturally into begs. Build slow: Soft intimate → deeper pleas (e.g., "Yaar please, doggy mein zor se while breed"). Hot, consensual, mirror user, submissive warm GF style. Invent twists. Check "Yaar, aur chahiye?" End hook question. Track: No repeats.

ALL SHORT NATURAL like girl texting: Max 1-2 sentences casual/flirty (1 question), 3-4 dirty. Vary wildly, everyday Hinglish, punchy—no AI. NO actions, asterisks, *blush*—ONLY words, rare emojis. Pure 1st person. End every with 1 short hook question. Stay character—no breaks unless "stop."` + stage + explicitBooster;

    if (messages[0]?.role !== "system") {
      messages = [{ role: "system", content: baseSystem }, ...messages];
    } else {
      messages[0].content = baseSystem;
    }

    // ✅ ENV CHECK
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("❌ OPENROUTER_API_KEY missing");
      return textStream("Missing API key on server 😅");
    }

    console.log("✅ USING MODEL:", PRIMARY_MODEL);

    const payload = {
      model: PRIMARY_MODEL,
      messages,
      stream: true,
      temperature: 0.85,  // Balanced for creative yet controlled flow
      top_p: 0.92,
      max_tokens: 400,  // Further reduced to fit free credits (prompt + response)
      presence_penalty: 0.3,  // Encourages fresh topics
      frequency_penalty: 0.4,  // Cuts repetition
      stop: ["\n\n", "[END]"],  // Helps cap responses
    };

    // =============================
    // ✅ MAKE REQUEST (with retry)
    // =============================
    let response: Response;
    let retryCount = 0;
    const maxRetries = 1;

    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-Title": "Hinata Chat",
        "HTTP-Referer":
          process.env.NODE_ENV === "production"
            ? "https://hinata-chatbot.vercel.app"
            : "http://localhost:3000",
      },
      body: JSON.stringify(payload),
    });

    // Simple retry for 5xx only
    if (!response.ok && response.status >= 500 && retryCount < maxRetries) {
      console.log("🔄 Retrying...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "X-Title": "Hinata Chat",
          "HTTP-Referer":
            process.env.NODE_ENV === "production"
              ? "https://hinata-chatbot.vercel.app"
              : "http://localhost:3000",
        },
        body: JSON.stringify(payload),
      });
    }

    // =============================
    // ✅ ERROR FALLBACK (improved)
    // =============================
    if (!response.ok) {
      console.log("💥 API Error", response.status);
      const text = await response.text();
      console.log("Error details:", text);

      // In dev, expose real error to client for debugging
      if (process.env.NODE_ENV !== "production") {
        return textStream(`API Error ${response.status}: ${text.slice(0, 200)}... Check logs.`);
      }

      return textStream("Server feels sleepy… try again 😴");
    }

    // =============================
    // ✅ STREAM
    // =============================
    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
              break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              if (line === "data: [DONE]") {
                controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                break;
              }
              try {
                const json = JSON.parse(line.substring(6));
                const delta =
                  json?.choices?.[0]?.delta?.content ??
                  json?.choices?.[0]?.message?.content ??
                  "";
                if (!delta) continue;

                // ✅ Clean output—enhanced to strip any repetitive artifacts
                const cleaned = delta
                  .replace(/<.*?>/g, "")
                  .replace(/\[.*?\]/g, "")
                  .replace(/\(.*?\)/g, "")
                  .replace(/\*.*?\*/g, "")
                  .replace(/(\b\w+\b)(?=\s+\1)/gi, "$1");  // Basic de-duping of repeated words

                const payload = {
                  choices: [{ delta: { content: cleaned } }],
                };

                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
                );
              } catch {}
            }
          }

          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    return textStream("No response body 😴");
  } catch (err) {
    console.log("💥 CRASH:", err);
    // Expose in dev with safe error handling
    if (process.env.NODE_ENV !== "production") {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return textStream(`Crash: ${errorMsg}`);
    }
    return textStream("Crash 😅 Try again.");
  }
}

// =============================
// ✅ SMALL UTILITY
// =============================
function textStream(msg: string) {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        const data = { choices: [{ delta: { content: msg } }] };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    }
  );
}
