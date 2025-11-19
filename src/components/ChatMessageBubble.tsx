import { Message } from '@/lib/types';

interface ChatMessageBubbleProps {
  message: Message;
}

export default function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';
  
  // For empty assistant messages, show typing indicator
  if (!isUser && !message.content) {
    return (
      <div className="flex justify-start w-full">
        <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-tl-none px-3 py-2 max-w-xs shadow-xs min-h-[2rem] flex items-center">
          <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-xs text-gray-500 ml-2">Hinata typing... 💭</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
      <div
        className={`max-w-[85%] px-3 py-2 rounded-2xl shadow-xs text-sm transition-all duration-200 ease-in-out ${
          isUser
            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-br-none rounded-tl-2xl rounded-tr-2xl'
            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none rounded-tr-2xl rounded-br-2xl'
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>

        {/* ✅ FIXED LINE */}
        <div className={`text-xs mt-1 transition-opacity duration-200 ${isUser ? 'text-pink-100' : 'text-gray-500 dark:text-gray-400'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>

      </div>
    </div>
  );
}