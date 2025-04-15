'use client';

import React from 'react';

interface TypingIndicatorProps {
  isTyping: boolean;
  userName?: string; // Optional: Name of the user who is typing
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isTyping, userName }) => {
  if (!isTyping) {
    return null; // Don't render anything if no one is typing
  }

  const typingText = userName ? `${userName} is typing` : 'Typing';

  return (
    <div className="h-6 px-4 py-1 text-sm text-purple-500 font-medium flex items-center">
      <span>{typingText}</span>
      <span className="ml-1 flex">
        <span className="animate-bounce mx-0.5 delay-0">.</span>
        <span className="animate-bounce mx-0.5 delay-150">.</span>
        <span className="animate-bounce mx-0.5 delay-300">.</span>
      </span>
    </div>
  );
};

export default TypingIndicator;