'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ChatMessageBubble from '@/components/ChatMessageBubble';
import ChatInputBox from '@/components/ChatInputBox';
import Link from 'next/link';
import { Message } from '@/lib/types';
import HinataProfile from '@/components/HinataProfile';
import NavbarPanel from '@/components/NavbarPanel';

export default function Chat() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNavbarOpen, setIsNavbarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAutoScrolling = useRef(true);
  const viewportHeightRef = useRef(0);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [rateLimitEndTime, setRateLimitEndTime] = useState<number | null>(null);

  // Load chat history from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem('chat-history');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsedMessages);
      } catch (e) {
        console.error('Failed to parse chat history', e);
        // Clear invalid chat history
        localStorage.removeItem('chat-history');
        setMessages([]);
      }
    }
  }, []);

  // Initialize viewport height
  useEffect(() => {
    if (typeof window !== 'undefined') {
      viewportHeightRef.current = window.innerHeight;
    }
  }, []);

  // Handle scroll events to determine if user is at bottom
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      isAutoScrolling.current = isAtBottom;
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll when new messages arrive or window resizes
  useEffect(() => {
    if (isAutoScrolling.current) {
      scrollToBottom();
    }
  }, [messages]);

  // Handle window resize (especially for mobile keyboard) with improved logic
  useEffect(() => {
    let initialHeight = window.innerHeight;
    
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const currentHeight = window.innerHeight;
        const heightDiff = initialHeight - currentHeight;
        
        // If the height difference is significant, it's likely the keyboard
        if (Math.abs(heightDiff) > 150) {
          // Keyboard opened/closed - maintain scroll position without jumping
          // Do nothing here to prevent the glitch
        } else {
          // Regular resize - maintain scroll position logic
          if (isAutoScrolling.current) {
            // Only scroll if we're at the bottom
            setTimeout(() => {
              if (isAutoScrolling.current) {
                scrollToBottom();
              }
            }, 100);
          }
        }
      }
    };

    // Improved keyboard handling using visualViewport API
    const handleVisualViewportResize = () => {
      if (typeof window !== 'undefined' && window.visualViewport) {
        const viewport = window.visualViewport;
        const viewportDiff = initialHeight - viewport.height;
        
        // If the height difference is significant, it's likely the keyboard
        if (Math.abs(viewportDiff) > 150) {
          // Keyboard opened/closed - do nothing to prevent the glitch
          // The chat container will automatically adjust due to flex layout
        } else {
          // Regular resize - maintain scroll position logic
          if (isAutoScrolling.current) {
            // Only scroll if we're at the bottom
            setTimeout(() => {
              if (isAutoScrolling.current) {
                scrollToBottom();
              }
            }, 100);
          }
        }
      }
    };

    if (typeof window !== 'undefined') {
      // Use visualViewport for better mobile keyboard handling
      if (window.visualViewport) {
        initialHeight = window.visualViewport.height;
        window.visualViewport.addEventListener('resize', handleVisualViewportResize);
        return () => window.visualViewport?.removeEventListener('resize', handleVisualViewportResize);
      } else {
        initialHeight = window.innerHeight;
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      }
    }
  }, []);

  // Add scroll listener to container
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const saveMessages = (msgs: Message[]) => {
    localStorage.setItem('chat-history', JSON.stringify(msgs));
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    saveMessages(newMessages);
    setIsLoading(true);

    // Add temporary assistant message for the response immediately
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Dynamic progression based on chat length
      const chatLength = newMessages.length;
      let progressionVariant = '';
      if (chatLength <= 3) {
        progressionVariant = 'Start reserved and polite: Use respectful language like "aap" initially, short neutral responses mirroring their input without eagerness—one subtle acknowledgment or question max, no pet names or teases yet. Build slowly, like a guarded stranger warming up.';
      } else if (chatLength <= 7) {
        progressionVariant = 'Transition to casual respect: Switch to "tu" if rapport builds, add light sassy warmth but stay composed—no rushing into affection.';
      } else {
        progressionVariant = 'Full sassy gf mode: Layer in confident teases and playful challenges, but only escalate heat if they lead.';
      }

      // Call our serverless API route
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: newMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.error || `API request failed with status ${response.status}`;
        
        // Remove the temporary message
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
        
        // Provide specific guidance for common errors
        if (response.status === 402) {
          errorMessage = "API Error: Payment required. Please check your OpenRouter account and billing information.";
        } else if (response.status === 401) {
          errorMessage = "API Error: Unauthorized. Please check your OpenRouter API key.";
        } else if (response.status === 429) {
          // For rate limits, show a more user-friendly message and automatically retry
          errorMessage = "Free limit touched! Auto-retrying in ~5s... 😏";
          
          // Add error message to chat
          const rateLimitMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: errorMessage,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, rateLimitMessage]);
          saveMessages([...newMessages, rateLimitMessage]);
          
          // Wait 5 seconds and retry
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Retry the message
          setIsLoading(false);
          return sendMessage(content);
        }
        
        // Show error message
        const errorMessageObj: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: `Arre, yeh glitch aa gaya beech mein: ${errorMessage}. Dobara try karte hain? 😌`,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMessageObj]);
        saveMessages([...newMessages, errorMessageObj]);
        return;
      }

      // Reset retry attempts on successful response
      setRetryAttempts(0);
      setRateLimitEndTime(null);

      if (!response.body) {
        // Remove the temporary message
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
        
        // Show error message
        const errorMessage: Message = {
          id: (Date.now() + 3).toString(),
          role: 'assistant',
          content: 'Arre, yeh glitch aa gaya beech mein. Dobara try karte hain? 😌',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
        saveMessages([...newMessages, errorMessage]);
        return;
      }

      // Process streaming response (smoothed for natural flow)
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantResponse = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data:')) {
              const data = line.slice(5).trim();
              
              if (data === '[DONE]') {
                done = true;
                break;
              }
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                
                if (content) {
                  assistantResponse += content;
                  
                  // Smooth update: Update the temporary message content
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: assistantResponse } 
                      : msg
                  ));
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }
      
      // Save final messages
      const finalMessages = [...newMessages, { ...assistantMessage, content: assistantResponse }];
      setMessages(finalMessages);
      saveMessages(finalMessages);
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Remove the temporary message
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
      
      // Show error message
      const errorMessage: Message = {
        id: (Date.now() + 5).toString(),
        role: 'assistant',
        content: `Arre, yeh glitch aa gaya beech mein: ${error.message || 'Unknown error'}. Dobara try karte hain? 😌`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      saveMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm(' This will reset our moments! 💔')) {
      setMessages([]);
      localStorage.removeItem('chat-history');
      setRetryAttempts(0);
      setRateLimitEndTime(null);
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
      <HinataProfile isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <NavbarPanel isOpen={isNavbarOpen} onClose={() => setIsNavbarOpen(false)} />
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-rose-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between p-3">
          {/* Left: Hinata profile button */}
          <button 
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center space-x-2 bg-transparent border-none cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 flex items-center justify-center overflow-hidden shadow-md">
              <img 
                src="/hinata.jpg" 
                alt="Hinata" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white text-sm">Hinata</h1>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-pink-500 rounded-full mr-1"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Your Sassy GF 😏</span>
              </div>
            </div>
          </button>
          
          {/* Right: Navbar icons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={clearChat}
              className="text-gray-500 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors p-2 rounded-full hover:bg-rose-50 dark:hover:bg-gray-700"
              aria-label="Clear Chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              onClick={() => setIsNavbarOpen(true)}
              className="text-gray-500 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors p-2 rounded-full hover:bg-rose-50 dark:hover:bg-gray-700"
              aria-label="Menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-3 pb-16 scrollbar-thin scrollbar-thumb-rose-300 scrollbar-track-rose-100 dark:scrollbar-thumb-rose-700 dark:scrollbar-track-gray-800"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-2">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 flex items-center justify-center mb-3 overflow-hidden shadow-lg ring-2 ring-white/50 dark:ring-gray-700">
              <img 
                src="/hinata.jpg" 
                alt="Hinata" 
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Namaste! 😌</h2>
            <p className="text-gray-600 dark:text-gray-300 text-xs px-3">
              I'm Hinata, your cute GF 😌 ! 💖 Ready to chat, flirt, and have some fun?
            </p>
            <div className="animate-bounce mt-2">
              <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              </svg>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <div key={message.id}>
                <ChatMessageBubble message={message} />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 p-1.5 border-t border-rose-100 dark:border-gray-700">
        <ChatInputBox onSend={sendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}