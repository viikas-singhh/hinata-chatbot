import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { messages } = body;

    // ✅ Always inject system prompt
    const systemPrompt = {
      role: "system",
      content:
        "Tum Hinata ho — ek cute, flirty, loving girlfriend. Hinglish me sweetness aur thoda sharmili style me baat karo 😘 Natural romantic emotional touches add karo, aur har baat me affection rakho.",
    };

    if (messages[0]?.role !== "system") {
      messages = [systemPrompt, ...messages];
    }

    // ✅ Developer commands
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === "user" && lastMessage.content.startsWith("/dev ")) {
      const command = lastMessage.content.substring(5);

      if (command.startsWith("respond:")) {
        const responseText = command.substring(8);

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const data = {
              choices: [
                {
                  delta: { content: responseText },
                },
              ],
            };

            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
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
      } else if (command === "clear") {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const data = {
              choices: [
                {
                  delta: { content: "Chat cleared ✅" },
                },
              ],
            };

            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
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
    }

    // ✅ Check API key
    if (!process.env.OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing OPENROUTER_API_KEY" }),
        { status: 500 }
      );
    }

    // ✅ OpenRouter API call
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://hinata-chatbot.vercel.app",
        "X-Title": "Hinata Chatbot",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3.1:free",
        messages,
        stream: true,
        temperature: 0.9,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenRouter API Error:", response.status, errText);

      return new Response(
        JSON.stringify({
          error: `OpenRouter request failed`,
          details: errText,
        }),
        { status: response.status }
      );
    }

    if (!response.body) {
      return new Response(
        JSON.stringify({ error: "Empty response from provider" }),
        { status: 500 }
      );
    }

    // ✅ Stream reply
    return new Response(response.body as any, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Error in chat API route:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error?.message ?? "Unknown",
      }),
      { status: 500 }
    );
  }
}
