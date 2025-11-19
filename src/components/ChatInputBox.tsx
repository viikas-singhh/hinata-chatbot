import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface ChatInputBoxProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInputBox({ onSend, disabled }: ChatInputBoxProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!message.trim() || disabled) return;
    onSend(message.trim());
    setMessage("");
  };

  // Enter -> Send
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-grow height
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "0px";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Improved mobile keyboard handling
  useEffect(() => {
    const el = textareaRef.current;
    const viewport = typeof window !== "undefined" ? window.visualViewport : null;

    if (!el || !viewport) return;

    const handleViewportChange = () => {
      // Only adjust when keyboard is open
      if (viewport.height < window.innerHeight * 0.8) {
        // Keyboard is likely open, scroll input into view
        setTimeout(() => {
          el.scrollIntoView({ 
            block: "nearest", 
            behavior: "smooth",
            inline: "nearest"
          });
        }, 100);
      }
    };

    // Add visual viewport listeners
    viewport.addEventListener("resize", handleViewportChange);
    
    // Also handle focus events
    const handleFocus = () => {
      setTimeout(() => {
        // Prevent scrolling the entire page, just ensure input is visible
        const rect = el.getBoundingClientRect();
        const viewportHeight = viewport ? viewport.height : window.innerHeight;
        
        if (rect.bottom > viewportHeight - 20) {
          el.scrollIntoView({ 
            block: "nearest", 
            behavior: "smooth",
            inline: "nearest"
          });
        }
      }, 300); // Slightly longer delay for keyboard to fully open
    };

    el.addEventListener("focus", handleFocus);

    return () => {
      viewport.removeEventListener("resize", handleViewportChange);
      el.removeEventListener("focus", handleFocus);
    };
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-100 dark:border-gray-700 p-2">
      <div className="flex items-end space-x-2">
        <textarea
          ref={textareaRef}
          value={message}
          rows={1}
          disabled={disabled}
          placeholder="Type a message..."
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="
            flex-1 resize-none bg-transparent text-gray-900 dark:text-white 
            placeholder-gray-400 dark:placeholder-gray-500
            px-3 py-2 border-0 focus:ring-0 focus:outline-none
            rounded-xl text-sm max-h-[120px]
          "
        />

        <button
          onClick={handleSubmit}
          disabled={!message.trim() || disabled}
          className={`h-9 w-9 rounded-full flex items-center justify-center transition-all duration-200 ${
            message.trim() && !disabled
              ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:scale-105 shadow-md"
              : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
          }`}
          aria-label="Send message"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="M3.4 2.3a1 1 0 00-1 1.3l3 8.4H13a1 1 0 010 2H5.4l-3 8.4a1 1 0 001.3 1.3 74.1 74.1 0 0020.3-10 1 1 0 000-1.6A74.1 74.1 0 003.4 2.3z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}