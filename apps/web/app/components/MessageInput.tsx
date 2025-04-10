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
    <div style={{ display: 'flex', alignItems: 'center', padding: '10px', borderTop: '1px solid #eee' }}>
      <textarea
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        disabled={disabled}
        rows={2} // Start with 2 rows, can adjust or make dynamic
        style={{
          flexGrow: 1,
          marginRight: '10px',
          padding: '8px 10px',
          borderRadius: '5px',
          border: '1px solid #ccc',
          resize: 'none', // Prevent manual resizing by user
          fontFamily: 'inherit', // Use the same font as the rest of the app
          fontSize: '1em',
        }}
      />
      <button
        onClick={handleSendClick}
        disabled={disabled || inputValue.trim().length === 0}
        style={{
          padding: '10px 15px',
          borderRadius: '5px',
          border: 'none',
          backgroundColor: disabled || inputValue.trim().length === 0 ? '#ccc' : '#007bff', // Example styling
          color: 'white',
          cursor: disabled || inputValue.trim().length === 0 ? 'not-allowed' : 'pointer',
        }}
      >
        Send
      </button>
    </div>
  );
};

export default MessageInput;