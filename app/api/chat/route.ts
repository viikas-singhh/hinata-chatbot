import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;
    
    // Check if the last message is a developer command
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'user' && lastMessage.content.startsWith('/dev ')) {
      const command = lastMessage.content.substring(5); // Remove "/dev "
      
      // Handle developer commands
      if (command.startsWith('respond:')) {
        // Custom response command: /dev respond:Your custom response here
        const responseText = command.substring(8); // Remove "respond:"
        
        // Return a mock streaming response with the custom text
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            // Send the custom response as a single chunk
            const data = {
              choices: [{
                delta: {
                  content: responseText
                }
              }]
            };
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();
          }
        });
        
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        });
      } else if (command === 'clear') {
        // Return a system message indicating chat cleared
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const data = {
              choices: [{
                delta: {
                  content: "Chat history cleared by developer command."
                }
              }]
            };
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();
          }
        });
        
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        });
      }
    }
    
    // Regular AI response - Call OpenRouter API
    // Check if API key is available
    if (!process.env.OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenRouter API key is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://hinata-chatbot.vercel.app',
        'X-Title': 'Hinata Chatbot',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: messages,
        stream: true,
        max_tokens: 500 // Limit token usage to prevent credit issues
      })
    });

    if (!response.ok) {
      // Log the actual error for debugging
      const errorText = await response.text();
      console.error('OpenRouter API Error:', response.status, errorText);
      
      return new Response(
        JSON.stringify({ 
          error: `OpenRouter API request failed with status ${response.status}`,
          details: errorText
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!response.body) {
      return new Response(
        JSON.stringify({ error: 'Response body is null' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return the response as a stream
    return new Response(response.body as any, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
  } catch (error: any) {
    console.error('Error in chat API route:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message || 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export const runtime = 'edge';