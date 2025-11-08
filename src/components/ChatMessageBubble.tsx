import { Message } from '@/lib/types';

interface ChatMessageBubbleProps {
  message: Message;
}

export default function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
          isUser
            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-br-none'
            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
      </div>
    </div>
  );
}