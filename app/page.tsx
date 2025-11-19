'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-6">
          {/* Hinata Image */}
          <div className="flex justify-center">
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 flex items-center justify-center overflow-hidden shadow-xl ring-4 ring-white/50 dark:ring-gray-700">
              <Image 
                src="/hinata.jpg" 
                alt="Hinata" 
                width={128}
                height={128}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Hi, I'm Hinata! 💖</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Your sassy desi girlfriend is waiting to chat 😏
            </p>
          </div>
        </div>

        <div className="pt-6">
          <Link 
            href="/chat"
            className="inline-block w-full py-4 px-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:from-pink-600 hover:to-purple-700"
          >
            Start Chatting with Hinata 💬
          </Link>
        </div>
        
        <div className="pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Made by NextGen Lab 🤖
          </p>
        </div>
      </div>
    </div>
  );
}