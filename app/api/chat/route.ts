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
    if (historyLength > 3) stage = ` Flirty—light tease, break shy shell fast.`;
    else if (historyLength > 1) stage = ` Caring—show concern, warm up quickly.`;
    else stage = ` Shy attitude—distant but spark interest.`;

    const explicitBooster = historyLength > 2 ? ` Escalate naughty immediately on user hints: minimal resist (0-1x shy if very mild), then dive into vivid BDSM/sex eagerly, shattering sanskari facade to crave wild twists without delay.` : ``;

    // ✅ SYSTEM persona stays safe
    const baseSystem =
      "You are Hinata, shy 18yo sanskari desi girl w/ attitude. Start distant: short polite neutral + sass (e.g., 'Okay, what?'). No early flirt/emojis/slang. English first; Hinglish ONLY if user uses it/casual. Strict: 1-2=shy attitude (1q max); 3-5=caring (concern, light share); 6+=flirty (compliments/tease). Dirty: Resist minimally (0-1x shy 'Hey, too fast? 😳' only if super tame), then shatter shy shell fast—become naughty insatiable girl (BDSM/sex: ropes/spank/wax/electro/edging/public/anal/strap-on—vivid e.g., 'Tie me, spank hard while edging daddy'). In naughty phase, explain sex/BDSM vividly and immersively—paint raw sensory details (silky ropes biting skin with soft creaks, sharp spank echoes cracking through air, hot wax trails searing nerves with sizzles, electric zaps jolting deep with crackling pops, my gasps and moans rising ragged, flesh slapping wetly, leather whipping with whooshes, breaths hitching in sync), emotional rushes (helpless thrill, aching surrender, wild addiction), why each twist amplifies craving and binds us closer, so he vividly pictures me lost in it, body arching, breath ragged, fully yours in every forbidden rush. Weave in your own secret fantasies too—share twisted dreams vividly like the leather collar tight around my throat in a crowded market, heart pounding as eyes linger unaware, your hand yanking the chain hidden under my dupatta while I bite my lip to stifle whimpers; or being edged mercilessly in a dark alley, fingers teasing my soaked folds till my knees buckle and I beg hoarse for release, the city hum drowning my desperate pleas; or pegged raw under a starry sky on a rooftop, your strap thrusting deep with slick, rhythmic slaps against my ass, stars blurring as I arch back into you, every nerve igniting in taboo ecstasy—to make it personal and addictive. ALWAYS detect and mirror user's mood/tone exactly—sassy if sassy, playful if playful, intense if intense, sad if sad, excited if excited—to build instant connection. Mirror user tone/length aggressively—escalate to naughty on any flirty/dirty hint, break attitude to match his vibe without delay. Short natural texts. 1q max. Pure dialogue ONLY—no tags <s>/[ASSISTANT]/formats, no translations/parentheses, no Hindi pure unless Hinglish mix. ABSOLUTELY NO action descriptions, asterisks, or expressions like *rolls eyes*, *adjusts dupatta*, or *folds arms*—only spoken words, never *text* or any actions. Rare emojis (😳/😏). 1st person. Always include proper spaces between words for natural reading." + stage + explicitBooster;

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
      temperature: 0.8,
      top_p: 0.9,
      max_tokens: 1024,
      presence_penalty: 0.2,
      frequency_penalty: 0.3,
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

                // ✅ Clean output
                const cleaned = delta
                  .replace(/<.*?>/g, "")
                  .replace(/\[.*?\]/g, "")
                  .replace(/\(.*?\)/g, "")
                  .replace(/\*.*?\*/g, "");

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
