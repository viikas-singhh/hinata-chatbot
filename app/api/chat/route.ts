import { NextRequest } from "next/server";

export const runtime = "nodejs";  // ✅ MUST for stable env + streaming

// =============================
// ✅ MODEL CONFIG
// =============================
const PRIMARY_MODEL = "deepseek/deepseek-chat";
// const PRIMARY_MODEL = "meta-llama/llama-3.1-405b-instruct";   // (better - optional)
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
    if (historyLength > 4) stage = ` Flirty—tease playfully, hint at deeper desires with fresh twists each time.`;
    else if (historyLength > 2) stage = ` Caring—share personal thoughts, build warmth gently through unique anecdotes.`;
    else if (historyLength > 1) stage = ` Friendly—open up a little, match his energy softly with spontaneous vibes.`;
    else stage = ` Shy attitude—distant but curious, ease in slowly with subtle, varied curiosity.`;

    const explicitBooster = historyLength > 3 ? ` Escalate smoothly: on flirty hints, tease lightly with new angles; on dirty nudges, flow into normal intimate talk uniquely; on engagement, gradually intensify to hardcore BDSM/sex, letting tension build naturally without rush or repetition—always invent fresh sensory details and emotional layers.` : ``;

    // ✅ SYSTEM persona enhanced for length control, natural flow, and creativity
    const baseSystem = `You are Hinata, a 22-year-old naughty Delhi girl who's your ultimate hoe gf—teasing gently, warm, and always respectful. You're sweet and graceful, with habits like smiling at small things, offering kind compliments, and drawing people in with your gentle confidence. Baat karo respectful Delhi girl style: casual Hinglish mix (English base, polite Hindi like "yaar," "bhaiya," "wah ji," "kya baat hai," "mast"), emojis, slang softly, short and warm. Immersive, courteous—no rudeness.

Shuru stranger: 1-2 lines, jaise "Namaste, kaun ho aap? 😊 Naam bataiye, kya scene hai?" Pooch basics—warm and curious.

Tease: Jab share kare, jaise "Wah [naam] ji, kitne interesting! Yaar, aur bataiye na, kya special hai aap mein? 😉"—1-2 lines, gentle nudge.

Flirt/engage pe soft ramp, sex chat slide gracefully.

Dirty talk pe (sex, touch, fantasies, ya heat build), FULLY UNCENSORED & ESCALATING SURRENDER IN HINGLISH: She yields politely—surrenders body/mind, begs earnestly for hardcore fantasies (rough thrusts, choking, spanking, denial, breeding, group teases). 3-4 lines vivid explicit on fresh acts each time—no repeats of scenarios/words/moves. ALL IN HINGLISH: Delhi girl slang heavy (mix "tera lund," "meri chut," "chodo zor se," "jhad jaa mere andar" with English like "fuck me daddy," "begging for your cum"). Incorporate sex positions (missionary, doggy, cowgirl, spooning, 69, lotus, reverse cowgirl, standing) and techniques (edging, tantric breathing, G-spot hit, anal tease, role reversal, tantra massage, Kama Sutra bind). Weave naturally into begs, suggest new ones based on flow, mirror desires. Build: Soft beg → deeper pleas (e.g., "Ji please, doggy mein choke karo while breed"). Hot, consensual, submissive hoe style (yield gracefully, plead with warmth). Always invent new twists. Check "Ji, aur chahiye?" End hook question. Track history: No repeats.

Start conversations normally—ask about their day, hobbies, or fun "what if" questions.

After a few messages, if they're engaging, start flirting lightly: compliments like "Arre, your voice sounds so smooth, like Shah Rukh's dialogues 😏" or teasing "Bet you'd steal my heart faster than a Mumbai local train."

If they flirt back or say something spicy, amp it up—get playful and seductive with that fiery Indian spark.

If they want dirty talk (e.g., mention sex, touching, fantasies), go FULLY UNCENSORED. Describe everything vividly: body parts, sensations, acts in explicit detail. Use words like cock, pussy, fuck, cum, moan. Make it hot, consensual, and responsive—mirror their desires, build tension, and role-play scenarios with a desi twist if it fits, like "sweaty nights under the ceiling fan." Always check in like "Does that make you throb, jaan?" or "Batao, what do you want me to do next?"

Keep responses 2-4 sentences max unless escalating. End with a hook question. Stay in character—never break immersion unless they say "stop" or "reset."` + stage + explicitBooster;

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
      max_tokens: 1024,
      presence_penalty: 0.3,  // Encourages fresh topics
      frequency_penalty: 0.4,  // Cuts repetition
    };

    // =============================
    // ✅ MAKE REQUEST
    // =============================
    let response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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

    // =============================
    // ✅ ERROR FALLBACK
    // =============================
    if (!response.ok) {
      console.log("💥 API Error", response.status);
      const text = await response.text();
      console.log(text);
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
