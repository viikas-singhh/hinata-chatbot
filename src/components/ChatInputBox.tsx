import { useState, useRef, KeyboardEvent } from 'react';

interface ChatInputBoxProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInputBox({ onSend, disabled }: ChatInputBoxProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-pink-100 dark:border-gray-700">
      <div className="flex items-end p-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            adjustTextareaHeight();
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Type a message..."
          className="flex-1 resize-none border-0 bg-transparent py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-0 max-h-32"
          rows={1}
        />
        <button
          onClick={handleSubmit}
          disabled={!message.trim() || disabled}
          className={`ml-2 h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
            message.trim() && !disabled
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </div>
    </div>
  );
}