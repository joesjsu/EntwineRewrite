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

  const typingText = userName ? `${userName} is typing...` : 'Typing...';

  return (
    <div style={{ height: '20px', padding: '0 10px', fontStyle: 'italic', color: '#888', fontSize: '0.9em' }}>
      {typingText}
      {/* Optional: Add animated dots or other visual cues */}
    </div>
  );
};

export default TypingIndicator;