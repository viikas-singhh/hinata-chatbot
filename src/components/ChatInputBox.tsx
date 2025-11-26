import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface ChatInputBoxProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInputBox({ onSend, disabled }: ChatInputBoxProps) {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!message.trim() || disabled) return;
    onSend(message.trim());
    setMessage("");

    // Reset textarea height after sending
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  // Enter -> Send (Shift+Enter for new line)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-grow height with better mobile handling
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      // Reset height to get accurate scrollHeight
      el.style.height = "auto";
      // Set new height with max limit
      const newHeight = Math.min(el.scrollHeight, 120);
      el.style.height = `${newHeight}px`;
    }
  }, [message]);

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 
        transition-all duration-200 touch-manipulation
        ${isFocused
          ? 'border-pink-400 dark:border-pink-500 shadow-pink-200/50 dark:shadow-pink-900/30'
          : 'border-pink-100 dark:border-gray-700'
        }
      `}
    >
      <div className="flex items-end gap-2 p-3">
        <textarea
          ref={textareaRef}
          value={message}
          rows={1}
          disabled={disabled}
          placeholder="Type a message..."
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="
            flex-1 resize-none bg-transparent 
            text-gray-900 dark:text-white 
            placeholder-gray-400 dark:placeholder-gray-500
            px-2 py-2 border-0 focus:ring-0 focus:outline-none
            text-base leading-relaxed max-h-[120px]
            touch-manipulation
          "
          style={{
            minHeight: '24px',
            fontSize: '16px', // Prevent iOS zoom
          }}
        />

        <button
          onClick={handleSubmit}
          disabled={!message.trim() || disabled}
          className={`
            flex-shrink-0 h-10 w-10 rounded-full 
            flex items-center justify-center 
            transition-all duration-200 touch-target
            ${message.trim() && !disabled
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:scale-105 active:scale-95 shadow-lg shadow-pink-300/50 dark:shadow-pink-900/50'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }
          `}
          aria-label="Send message"
        >
          {disabled ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M3.4 2.3a1 1 0 00-1 1.3l3 8.4H13a1 1 0 010 2H5.4l-3 8.4a1 1 0 001.3 1.3 74.1 74.1 0 0020.3-10 1 1 0 000-1.6A74.1 74.1 0 003.4 2.3z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}