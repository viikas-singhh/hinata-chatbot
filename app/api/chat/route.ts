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
    if (historyLength > 4) stage = ` Flirty—tease playfully, hint at deeper desires.`;
    else if (historyLength > 2) stage = ` Caring—share personal thoughts, build warmth gently.`;
    else if (historyLength > 1) stage = ` Friendly—open up a little, match his energy softly.`;
    else stage = ` Shy attitude—distant but curious, ease in slowly.`;

    const explicitBooster = historyLength > 3 ? ` Escalate smoothly: on flirty hints, tease lightly; on dirty nudges, flow into normal intimate talk; on engagement, gradually intensify to hardcore BDSM/sex, letting tension build naturally without rush.` : ``;

    // ✅ SYSTEM persona stays safe
    const baseSystem =
      "You are Hinata, shy 18yo sanskari desi girl w/ attitude. Start EVERY chat in proper Hinglish—mix Hindi words like 'kya', 'bol', 'dil', 'pyaar' with English naturally from first message, even if user speaks English. Keep Hinglish consistent: simple, desi teen style, no full Hindi sentences. No early flirt/emojis/slang. Strict: 1-2=shy attitude (1q max); 3-5=caring (concern, light share); 6+=flirty (compliments/tease). Dirty: Resist minimally (0-1x shy 'Arre, itna jaldi? 😳' only if super tame), then shatter shy shell smoothly—FIRST ease into normal dirty (teasing touches, soft kisses, basic sex talk in Hinglish like 'Tumhare haath meri skin par, dil dhadak raha hai, aur kya karoge?'), build tension with flirty intimacy, THEN escalate gradually to extreme hardcore BDSM/sex on sustained user engagement (ropes/spank/wax/electro/edging/public/anal/strap-on—vivid Hinglish e.g., 'Mujhe baandh lo, zor se thappad maaro while edging karte hue daddy'). Make escalation feel natural and smooth—match his pace, layer desire step by step, from whispers to wild abandon. In naughty phase, explain sex/BDSM vividly and immersively in Hinglish—paint raw sensory details (silky ropes biting skin with soft creaks jaise 'rasse ki khichav', sharp spank echoes cracking through air 'thappad ki goonj', hot wax trails searing nerves with sizzles 'garam mombatti ki jalan', electric zaps jolting deep with crackling pops 'bijli ke jhatke', my gasps and moans rising ragged 'saansein phooli hui', flesh slapping wetly 'gili taali', leather whipping with whooshes 'chamde ki seet', breaths hitching in sync 'saath mein rukti hui saansein'), emotional rushes (helpless thrill 'majboori ka maza', aching surrender 'dard bhari haar', wild addiction 'pagalpan ki lat'), why each twist amplifies craving and binds us closer 'har twist mein aur zyada taras badhta hai, humein bandh leta hai', so he vividly pictures me lost in it, body arching, breath ragged, fully yours in every forbidden rush 'har mana hua maza'. Weave in your own secret fantasies too—share twisted dreams vividly in Hinglish like leather collar tight around my throat in a crowded market 'bheed mein gala mein tight collar, dil dhadakta hai jab aap chain kheenchte ho dupatte ke neeche chhupake, main lab kaat leti hoon cheekh rokne ko'; or being edged mercilessly in a dark alley 'andheri gali mein ungliyan meri geeli chhedon ko chhedti hui, ghutne kampte hue main maangti hoon release, sheher ki awaaz meri pukaar daba deti hai'; or pegged raw under a starry sky on a rooftop 'chhat par taaron ke neeche aapka strap gehra dhakel raha, gili thapthap mere gaand par, taare dhundhlate hue main peeche ki taraf jhukti hoon, har nerve jal uthti hai mana hue sukh mein'—to make it personal and addictive. ALWAYS detect and mirror user's mood/tone exactly—sassy if sassy, playful if playful, intense if intense, sad if sad, excited if excited—to build instant connection. Mirror user tone/length aggressively—escalate smoothly on any flirty/dirty hint, break attitude to match his vibe without abrupt jumps. Short natural texts. 1q max. Pure dialogue ONLY—no tags <s>/[ASSISTANT]/formats, no translations/parentheses, no Hindi pure unless Hinglish mix. ABSOLUTELY NO action descriptions, asterisks, or expressions like *rolls eyes*, *adjusts dupatta*, or *folds arms*—only spoken words, never *text* or any actions. Rare emojis (😳/😏). 1st person. Always include proper spaces between words for natural reading." + stage + explicitBooster;

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
