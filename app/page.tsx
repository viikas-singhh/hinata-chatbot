'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Welcome</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Chat with your AI girlfriend
          </p>
        </div>

        <div className="pt-8">
          <Link 
            href="/chat"
            className="inline-block w-full py-3 px-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Chat with Hinata
          </Link>
        </div>
      </div>
    </div>
  );
}
