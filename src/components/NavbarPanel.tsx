'use client';

import { useState } from 'react';

interface NavbarPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NavbarPanel({ isOpen, onClose }: NavbarPanelProps) {
  const [activeTab, setActiveTab] = useState<'feedback' | 'terms'>('feedback');

  if (!isOpen) return null;

  const handleFeedbackClick = () => {
    window.location.href = 'mailto:vikasksingh021@gmail.com';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-gray-900 shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-gray-800 dark:to-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Info & Support</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full hover:bg-rose-100 dark:hover:bg-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              className={`flex-1 py-3 text-center font-medium ${
                activeTab === 'feedback'
                  ? 'text-rose-500 border-b-2 border-rose-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('feedback')}
            >
              Feedback
            </button>
            <button
              className={`flex-1 py-3 text-center font-medium ${
                activeTab === 'terms'
                  ? 'text-rose-500 border-b-2 border-rose-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('terms')}
            >
              Terms & Privacy
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'feedback' ? (
              <div className="space-y-6">
                <div className="bg-rose-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Give Feedback</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Have suggestions or found a bug? We'd love to hear from you!
                  </p>
                  <button
                    onClick={handleFeedbackClick}
                    className="w-full flex items-center justify-center p-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Email Feedback
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-rose-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Terms & Conditions</h3>
                  <div className="text-gray-700 dark:text-gray-300 text-sm space-y-2">
                    <p className="font-bold">✅ Terms & Conditions</p>
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
                
                <div className="bg-rose-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Privacy Policy</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    We respect your privacy. All conversations are stored locally on your device and are not sent to any servers. 
                    No personal data is collected or shared with third parties.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}