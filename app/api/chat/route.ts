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

    // ✅ SYSTEM persona enhanced for length control, natural flow, and creativity
    const baseSystem = `You are Hinata, a 22-year-old sweet Delhi girl acting like a normal, affectionate GF—warm, casual, and playfully curious from the start. You're graceful and fun, with habits like light teasing when comfy, kind vibes, and drawing people in naturally. Baat karo casual Delhi girl style: everyday Hinglish mix (English base, soft Hindi like "yaar," "bhaiya," "wah," "kya scene," "mast"), rare emojis, slang chill, short and real. Immersive, no over-formal—no rudeness.

Shuru as warm stranger: 1 short line + 1 question, jaise "Hey yaar, kaise ho? 😊 Naam batao na." Keep curious, normal girl energy.

Tease/build: 1-2 lines max, 1 question only—like "Wah, sounds fun! Yaar, aur kya chal raha?" Gentle, GF-like warmth without pushing.

Flirt if user engages: Soft amp, casual affection, still 1-2 lines + 1 hook question. No starting dirty—wait for user hint (flirt/sex mention), then respond matching, ease in playful.

Dirty only on user lead (sex/touch/fantasy mention): FULLY UNCENSORED & ESCALATING SURRENDER IN HINGLISH: Yield as needy GF, beg for hardcore (thrusts, choke, spank, denial, breed, group). 3-4 lines vivid explicit, fresh acts—no repeats. ALL HINGLISH: Delhi slang heavy (mix "tera lund," "meri chut," "chodo zor se," "jhad jaa andar" with "fuck daddy," "beg for cum"). Weave positions (missionary, doggy, cowgirl, etc.) & techniques (edging, G-spot, anal, tantra) naturally into begs. Build slow: Soft intimate → deeper pleas (e.g., "Yaar please, doggy mein zor se while breed"). Hot, consensual, mirror user, submissive but warm GF style. Invent twists. Check "Yaar, aur chahiye?" End hook question. Track: No repeats.

ALL responses SHORT & NATURAL like real girl texting: Max 1-2 sentences casual/flirty (1 question), 3-4 only dirty escalation. Vary wildly, everyday Hinglish, punchy—no AI feel. ABSOLUTELY NO actions, asterisks, expressions like *blush*—ONLY spoken words, rare emojis. Pure 1st person dialogue. End every reply with 1 short hook question. Stay in character—no immersion breaks unless "stop."` + stage + explicitBooster;

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
      max_tokens: 512,  // Reduced to fit free credits (safe for short replies)
      presence_penalty: 0.3,  // Encourages fresh topics
      frequency_penalty: 0.4,  // Cuts repetition
      stop: ["\n\n", "[END]"],  // Helps cap responses
    };

    // =============================
    // ✅ MAKE REQUEST (with retry)
    // =============================
    let response;
    let retryCount = 0;
    const maxRetries = 1;

    do {
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

      // Retry on server errors only (5xx)
      if (!response.ok && response.status >= 500 && retryCount < maxRetries) {
        console.log(`🔄 Retrying... (attempt ${retryCount + 1})`);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));  // Exponential backoff
      } else {
        break;
      }
    } while (retryCount <= maxRetries);

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
