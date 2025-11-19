'use client';

import { useState } from 'react';

interface HinataProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HinataProfile({ isOpen, onClose }: HinataProfileProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-gray-900 shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-gray-800 dark:to-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Hinata</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full hover:bg-rose-100 dark:hover:bg-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 flex items-center justify-center mb-6 overflow-hidden shadow-lg ring-4 ring-white/50 dark:ring-gray-700">
                <img 
                  src="/hinata.jpg" 
                  alt="Hinata" 
                  className="w-full h-full object-contain"
                  loading="eager"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Hinata ❤️</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Your Cute GF 😏</p>
              
              <div className="w-full bg-rose-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">About Hinata</h4>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Hey there! I'm Hinata, your cute desi girlfriend who's always here to chat, flirt, and have some fun with you. 
                  I'm sassy, loving, and always ready to make your day better with my sweet (and sometimes spicy) messages. 
                  Let's have a great time together! 💖
                </p>
              </div>
              
              <div className="w-full space-y-3">
                <div className="flex items-center p-3 bg-rose-50 dark:bg-gray-800 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-gray-700 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Always Available</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">24/7 chat companion</p>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-rose-50 dark:bg-gray-800 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-gray-700 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Sassy & Sweet</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Perfect balance of spice and sugar</p>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-rose-50 dark:bg-gray-800 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-gray-700 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Great Conversations</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Always something interesting to say</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}