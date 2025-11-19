'use client';

import { useState, useEffect, useRef } from 'react';
import { Message } from '@/lib/types';
import ChatMessageBubble from '@/components/ChatMessageBubble';
import ChatInputBox from '@/components/ChatInputBox';
import HinataProfile from '@/components/HinataProfile';
import NavbarPanel from '@/components/NavbarPanel';
import ClientViewport from '@/components/ClientViewport';

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNavbarOpen, setIsNavbarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrolling = useRef(true);

  // Load history safely
  useEffect(() => {
    const saved = localStorage.getItem("chat-history");
    if (saved) {
      const parsed = JSON.parse(saved).map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      }));
      setMessages(parsed);
    }
  }, []);

  // Handle scroll events to determine if user is at bottom
  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      isAutoScrolling.current = isAtBottom;
    }
  };

  // Auto scroll with better control
  useEffect(() => {
    if (isAutoScrolling.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Add scroll listener to container
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const saveMessages = (m: Message[]) =>
    localStorage.setItem("chat-history", JSON.stringify(m));

  // SEND MESSAGE
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date()
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    saveMessages(updated);

    // temp assistant message
    const tempId = `${Date.now()}-temp`;

    setMessages(prev => [
      ...prev,
      {
        id: tempId,
        role: "assistant",
        content: "",
        timestamp: new Date()
      }
    ]);

    let finalResponse = "";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.body) throw new Error("No stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let done = false;

      while (!done) {
        const { value, done: finished } = await reader.read();
        done = finished;

        if (!value) continue;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith("data:")) continue;

          const data = trimmedLine.replace("data:", "").trim();

          if (data === "[DONE]") {
            done = true;
            break;
          }

          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;

            if (delta) {
              finalResponse += delta;

              // update bubble live
              setMessages(prev =>
                prev.map(m =>
                  m.id === tempId ? { ...m, content: finalResponse } : m
                )
              );
            }
          } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            console.error('Problematic data:', data);
            
            // Check if this is an error message from the API
            if (data.includes('Error:')) {
              const errorMatch = data.match(/Error: (.*)/);
              if (errorMatch && errorMatch[1]) {
                const errorMessage = errorMatch[1];
                setMessages(prev =>
                  prev.map(m =>
                    m.id === tempId ? { ...m, content: `Error: ${errorMessage}` } : m
                  )
                );
                finalResponse = `Error: ${errorMessage}`;
              }
            }
          }
        }
      }

      // final fix — replace temp message with actual message
      const finalMessages = updated.concat([
        {
          id: `${Date.now()}`,
          role: "assistant",
          content: finalResponse,
          timestamp: new Date()
        }
      ]);

      setMessages(finalMessages);
      saveMessages(finalMessages);

    } catch (err: any) {
      console.error(err);
      
      let errorMessage = "Error… try again ❤️";
      if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === tempId ? { ...m, content: errorMessage } : m
        )
      );
    }

    setIsLoading(false);
  };

  return (
    <>
      <ClientViewport />

      <div
        className="flex flex-col bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 h-screen max-h-screen overflow-hidden"
      >

        {/* HEADER FIXED 100% */}
        <header className="flex-shrink-0 bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-b border-pink-100 dark:border-gray-700 shadow-sm z-20">
          <div className="flex items-center justify-between p-3">
            <button
              className="flex items-center space-x-2"
              onClick={() => setIsProfileOpen(true)}
            >
              <img
                src="/hinata.jpg"
                className="w-10 h-10 rounded-full shadow-md object-cover"
                alt="Hinata"
              />
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  Hinata
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                  <span className="w-2 h-2 bg-pink-500 rounded-full mr-1"></span>
                  Your Sassy GF 😏
                </p>
              </div>
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setMessages([]);
                  localStorage.removeItem("chat-history");
                }}
                className="text-gray-600 dark:text-gray-300 hover:text-pink-600 text-xl"
                aria-label="Clear chat"
              >
                🗑️
              </button>

              <button
                onClick={() => setIsNavbarOpen(true)}
                className="text-gray-700 dark:text-gray-200 hover:text-pink-600 text-xl"
                aria-label="Menu"
              >
                ☰
              </button>
            </div>
          </div>
        </header>

        {/* PROFILE PANELS */}
        <HinataProfile isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        <NavbarPanel isOpen={isNavbarOpen} onClose={() => setIsNavbarOpen(false)} />

        {/* CHAT AREA - FIXED SCROLLING AND LAYOUT */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-3 space-y-4 pb-4"
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          {messages.map(m => (
            <div key={m.id} className="w-full clear-both">
              <ChatMessageBubble message={m} />
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT - FIXED POSITIONING AND KEYBOARD ISSUES */}
        <div
          className="flex-shrink-0 p-2 bg-white dark:bg-gray-900 border-t dark:border-gray-700 z-10"
          style={{ 
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <ChatInputBox onSend={sendMessage} disabled={isLoading} />
        </div>

      </div>
    </>
  );
}