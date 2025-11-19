import React, { useState } from 'react';
import ProfileSidebar from '@/components/ProfileSidebar';

export default function HeaderAvatar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleAvatarClick = () => {
    setIsProfileOpen(true);
  };

  const closeProfile = () => {
    setIsProfileOpen(false);
  };

  return (
    <>
      <button 
        onClick={handleAvatarClick}
        className="flex items-center space-x-3 bg-transparent border-none cursor-pointer"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center overflow-hidden">
          <img 
            src="/hinata.jpg" 
            alt="Hinata" 
            className="w-full h-full object-contain"
            loading="eager"
          />
        </div>
        <div>
          <h1 className="font-bold text-gray-900 dark:text-white">Hinata</h1>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Online</span>
          </div>
        </div>
      </button>
      <ProfileSidebar isOpen={isProfileOpen} onClose={closeProfile} />
    </>
  );
}