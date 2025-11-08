'use client';

import { useState } from 'react';

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileSidebar({ isOpen, onClose }: ProfileSidebarProps) {
  const [showTerms, setShowTerms] = useState(false);

  if (!isOpen) return null;

  const handleFeedbackClick = () => {
    window.location.href = 'mailto:vikasksingh021@gmail.com';
  };

  const handleTermsClick = () => {
    setShowTerms(!showTerms);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col items-center mb-8">
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 flex items-center justify-center mb-4 overflow-hidden">
              <img 
                src="/hinata.jpg" 
                alt="Hinata" 
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Hinata</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your Sassy GF 😏</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleFeedbackClick}
              className="w-full flex items-center justify-between p-4 bg-rose-50 dark:bg-gray-800 rounded-lg hover:bg-rose-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="font-medium text-gray-900 dark:text-white">Give Feedback</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>

            <button
              onClick={handleTermsClick}
              className="w-full flex items-center justify-between p-4 bg-rose-50 dark:bg-gray-800 rounded-lg hover:bg-rose-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="font-medium text-gray-900 dark:text-white">Terms & Conditions</span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-500 dark:text-gray-400 transform transition-transform ${showTerms ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showTerms && (
              <div className="p-4 bg-rose-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <p className="font-bold mb-2">✅ Terms & Conditions</p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>This web app is open-source.</li>
                    <li>No login / no database — we do not store or own your data.</li>
                    <li>Use this AI chatbot only for good / legal purposes.</li>
                    <li>Do not harm, abuse, harass, scam, or mislead others using this app.</li>
                    <li>The AI may be incorrect sometimes — use at your own risk; developer is not responsible.</li>
                    <li>Developer is not liable for any loss, damage, or misuse caused by using this app.</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}