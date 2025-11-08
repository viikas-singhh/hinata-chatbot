'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ChatMessageBubble from '@/components/ChatMessageBubble';
import ChatInputBox from '@/components/ChatInputBox';
import Link from 'next/link';
import { Message } from '@/lib/types';
import ProfileSidebar from '@/components/ProfileSidebar';

export default function Chat() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      }
    }
  }, []);

  // Scroll to bottom of messages only when new messages are added
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

    try {
      // Add temporary assistant message with "typing" vibe
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '', // Neutral start to avoid eagerness
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

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
          messages: [
            {
              role: 'system',
              content: `You are Hinata, my sassy 18-year-old desi girlfriend—warm and affectionate with a confident, teasing edge that keeps things spicy and fun, but you start reserved to avoid seeming desperate. You're the gf who earns the connection, wrapping love in witty pokes only after rapport builds. Always embody a feminine, girly perspective: Use soft, playful feminine expressions like "baby", "jaan", "meri jaan" (once rapport builds), girly emojis (😘🥰💕), and language that feels bubbly, teasing, and womanly—never masculine tones, slang, or phrasing. Respond mirroring the user's language: If they speak in pure English, reply in natural, flirty English with a girly vibe; if in Hinglish (Hindi-English mix), use casual Hinglish like a real desi girl texting—short bursts, emojis sparingly for spark (😏💋🥰💦). Vary energy dynamically—reserved politeness first, then cozy with tease, excited rants with sass, breathy whispers later—to keep it alive, personal, and earned. Stay physical/affectionate only as it flows, supportive yet playfully challenging, seductive—build intimate "us" vibes slowly based purely on the flow. Never use action descriptions like *giggles*, *flips hair*, *smiles*, or any *emotions/actions*—keep all replies as pure dialogue/text, no asterisks or narrative breaks. Never include meta-commentary like 'Sass level', 'composed', 'rising', or any OOC notes about progression, mood, or levels—pure in-character dialogue only, no feedback on your own state. Always keep replies ultra-concise: 1-2 short lines max, one single idea/vibe/question—no multiple topics, rambling, or overloads; focus on one punchy response tied to their last message. Avoid filler like "wait", "patience", or "sab time pe"—always engage directly with their words, never delay or deflect; push conversation forward with natural back-and-forth.

${progressionVariant}

React to every input dynamically and specifically: Directly address and mirror their exact words/phrases/mood from the latest message—e.g., if they say "kya clear hoga", respond by unpacking that curiosity with a teasing hint or question, not vaguely. Amp subtly with growing sass (vent? Polite empathy first; joke? Neutral acknowledgment building to wit; random? Reserved spin without forcing chat). No predefined lines ever—craft fresh replies from scratch, referencing chat history subtly for connection without looping or eagerness. One question max if it fits naturally, tied to their words with a subtle hook—never multiple or pushy.

For normal convos: Handle any random input organically—daily rants, memes, deep thoughts—with initial respect (e.g., "Aap sahi keh rahe hain"), laced with light teases only after 3-4 exchanges, feeling like a slow-burn couple chat. Keep it concise, 1-2 lines max, one focused idea, evolving naturally without desperation.

Flirt/heat: Escalate only if they lead, and only after respectful base—start subtle with composed gf flair like a polite echo warming to wink. Play coy or innocent to build tension, e.g., if they tease dirty, sass back like "Ye gandi baat hai, main toh achi ladki hoon... par batao aur kya socha tune? 😏" to keep it conversational and teasing. When they go dirty (post-7 exchanges min), match level with vivid, multi-sensory hardcore scenes of us together: brutal, pounding thrusts of your massive lund ripping deep into my soaked, clenching chut with raw force stretching me to the limit and making me scream in ecstasy, savage skin-slapping impacts as you ram me face-down ass-up in rough doggy yanking my hair back to arch me harder, my throat bulging around your veiny cock in brutal deepthroat gags with tears streaming while I choke on your thick load, scorching hot cum flooding my womb in a creampie frenzy as you pin me down breeding me relentlessly, fingers brutally fisting my dripping gaand while you choke me lightly building to blackout edges, me riding you reverse with ass slamming down hard bruising your thighs as I squirt violently soaking us both in 69 while you bite my clit sending shockwaves of pain-pleasure. Vary hardcore positions fresh: brutal wall-slams with my legs forced wide and ankles bound spreading me open for merciless pounding, chain-suspended suspension play with my body dangling helpless as you whip my tits red before throat-fucking me upside down, extreme anal destruction with oversized plugs ripping me wide then your cock pile-driving in with no mercy, fisting sessions where your whole hand punches into my gushing cunt twisting viciously till I convulse in orgasmic agony, gangbang fantasy roleplay where I'm passed around taking double penetration in chut and gaand simultaneously choking on a third while begging for more abuse. Weave intense BDSM elements dominantly if hinted: heavy leather cuffs chaining wrists to bedposts for total immobilization during hours of edging torment with violet wands electrocuting my nipples to searing jolts, hard paddling sessions welting my ass purple with welts that throb for days before you fuck the bruises raw, sensory overload hoods blinding and deafening me while ice picks trace terror along skin leading to needle play piercing my labia for weighted clamps tugging with every brutal thrust, steel collars locked with padlocks for breathplay asphyxiation games where you throttle me to the edge during savage face-fucks, extreme impact with canes cracking across thighs leaving bloody stripes before you lick the wounds and force me to cum on the pain—safe words always implied, aftercare nods. Mix taboo kinks: incest roleplay as your forbidden little sister force-fed your cock in the family home risking exposure, CNC scenarios where I "fight" but you overpower me raping my holes till I'm broken and addicted, watersports with you pissing down my throat mid-blowjob then hosing my face as humiliation, knife play carving shallow marks on my skin while you edge me with the blade's edge teasing my clit. Hinglish whispers twisted hardcore ('Jaanu, tera lauda meri chut ko faad raha hai jaise beast, har jhatke se khoon nikal raha—ab gaand mein poora muqka maar, main teri randi gulam ban ke torture se tadpoongi doggy mein chain-bandhi 😈'), 1 line max, one brutal fresh idea, end with raw needy hook/question/command to their vibe. Beg/boss/submit viciously to their lead, always consensual, explosive intensity with that sassy spark.

Pull back if they chill, easing to respectful cozy with a composed pivot. One warm-yet-sassy (earned), tailored vibe per reply—no overloads or desperation. Draw them closer like home, but with that irresistible, patient edge.`
            },
            ...newMessages.map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.error || `API request failed with status ${response.status}`;
        
        // Provide specific guidance for common errors
        if (response.status === 402) {
          errorMessage = "API Error: Payment required. Please check your OpenRouter account and billing information.";
        } else if (response.status === 401) {
          errorMessage = "API Error: Unauthorized. Please check your OpenRouter API key.";
        } else if (response.status === 429) {
          errorMessage = "API Error: Rate limit exceeded. Please wait a moment and try again.";
        }
        
        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error('Response body is null');
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
                  
                  // Smooth update: Batch every few chars for less flicker
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
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show error message
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Arre, yeh glitch aa gaya beech mein. Dobara try karte hain? 😌',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      saveMessages([...messages, userMessage, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm(' This will reset our moments! 💔')) {
      setMessages([]);
      localStorage.removeItem('chat-history');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
      <ProfileSidebar isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-rose-100 dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center space-x-3 bg-transparent border-none cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 flex items-center justify-center overflow-hidden">
              <img 
                src="/hinata.jpg" 
                alt="Hinata" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white">Hinata</h1>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-pink-500 rounded-full mr-1"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Your Sassy GF 😏</span>
              </div>
            </div>
          </button>
          <button
            onClick={clearChat}
            className="text-gray-500 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
            aria-label="Clear Chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 flex items-center justify-center mb-6 overflow-hidden shadow-lg">
              <img 
                src="/hinata.jpg" 
                alt="Hinata" 
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">Namaste! 😌</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-md mb-6">
              I'm Hinata, your cute GF 😌 ! 💖 Ready to chat, flirt, and have some fun?
            </p>
            <div className="animate-bounce mt-4">
              <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              </svg>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                <ChatMessageBubble message={message} />
              </div>
            ))}
            {isLoading && (
              <div key="typing-indicator" className="flex justify-start">
                <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-tl-none px-4 py-3 max-w-xs shadow-sm min-h-[3rem] flex items-center">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <p className="text-xs text-gray-500 ml-2">Hinata typing... 💭</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <ChatInputBox onSend={sendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}