'use client';

import React, { useRef, useEffect } from 'react';

// Define a basic structure for a message object
// TODO: Align this with the actual message structure from the backend/shared types
interface Message {
  id: number | string; // Unique identifier for the message
  senderId: string;
  text: string;
  createdAt: Date | string; // Changed from timestamp
  readAt?: Date | string | null; // Optional: Timestamp when the message was read
  // Add any other relevant message properties
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string; // ID of the currently logged-in user to determine message alignment
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId }) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null); // Ref for the scroll target

  // Effect to scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]); // Dependency array includes messages

  return (
    <div style={{ flexGrow: 1, overflowY: 'auto', border: '1px solid #eee', marginBottom: '10px', padding: '10px' }}> {/* Changed height to flexGrow */}
      {messages.length === 0 ? (
        <p>No messages yet. Start the conversation!</p>
      ) : (
        messages.map((msg) => {
          const isCurrentUser = msg.senderId === currentUserId;
          const messageAlignment = isCurrentUser ? 'flex-end' : 'flex-start';
          const messageBackground = isCurrentUser ? '#DCF8C6' : '#FFFFFF'; // Simple styling differentiation

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: messageAlignment,
                marginBottom: '8px',
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  backgroundColor: messageBackground,
                  border: '1px solid #ddd',
                  wordBreak: 'break-word', // Prevent long words from overflowing
                }}
              >
                <p style={{ margin: 0, fontSize: '0.9em' }}>{msg.text}</p>
                <span style={{ fontSize: '0.7em', color: '#888', display: 'block', textAlign: 'right', marginTop: '4px' }}>
                  {/* Format createdAt nicely */}
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {/* Add read indicator if applicable */}
                  {isCurrentUser && msg.readAt && ' (Read)'}
                </span>
              </div>
            </div>
          );
        })
      )}
      {/* Empty div at the end to act as a scroll target */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;