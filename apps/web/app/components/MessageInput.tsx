'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  onTypingChange: (isTyping: boolean) => void;
  disabled?: boolean; // To disable input when not connected, etc.
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, onTypingChange, disabled = false }) => {
  const [inputValue, setInputValue] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false); // Ref to track typing state without causing re-renders on every keystroke

  // Debounced function to signal "stop typing"
  const signalStopTyping = useCallback(() => {
    if (isTypingRef.current) {
      console.log('Signaling stop typing');
      onTypingChange(false);
      isTypingRef.current = false;
    }
  }, [onTypingChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setInputValue(value);

    // Signal "start typing" immediately if not already typing
    if (!isTypingRef.current && value.trim().length > 0) {
       console.log('Signaling start typing');
       onTypingChange(true);
       isTypingRef.current = true;
    }

    // Reset the "stop typing" timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // If there's text, set a timeout to signal "stop typing" after a delay
    // If text is cleared, signal "stop typing" immediately
    if (value.trim().length > 0) {
        typingTimeoutRef.current = setTimeout(signalStopTyping, 1500); // Adjust delay as needed (e.g., 1.5 seconds)
    } else {
        signalStopTyping(); // Signal immediately if input is empty
    }

  };

  const handleSendClick = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue) {
      onSendMessage(trimmedValue);
      setInputValue(''); // Clear input after sending
      // Ensure "stop typing" is signaled after sending
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      signalStopTyping();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Optional: Send message on Enter press (Shift+Enter for newline)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent default newline behavior
      handleSendClick();
    }
  };

  return (
    <div className="flex items-center p-3 border-t border-purple-100 bg-white rounded-b-lg">
      <textarea
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        disabled={disabled}
        rows={2}
        className={`flex-grow mr-3 p-3 rounded-lg border ${
          disabled ? 'border-gray-200 bg-gray-50' : 'border-purple-200 focus:border-purple-400'
        } resize-none font-inherit text-base focus:outline-none focus:ring-2 focus:ring-purple-200`}
      />
      <button
        onClick={handleSendClick}
        disabled={disabled || inputValue.trim().length === 0}
        className={`px-4 py-3 rounded-lg border-none ${
          disabled || inputValue.trim().length === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-purple-600 text-white hover:bg-purple-700 cursor-pointer transition-colors'
        } font-medium`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="inline-block"
        >
          <path d="M22 2L11 13"></path>
          <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
        </svg>
      </button>
    </div>
  );
};

export default MessageInput;