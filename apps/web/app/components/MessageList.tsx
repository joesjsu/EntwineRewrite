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
    <div className="flex-grow overflow-y-auto bg-white rounded-lg border border-purple-100 mb-3 p-4">
      {messages.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No messages yet. Start the conversation!</p>
      ) : (
        messages.map((msg) => {
          const isCurrentUser = msg.senderId === currentUserId;
          
          return (
            <div
              key={msg.id}
              className={`flex mb-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] px-4 py-3 rounded-2xl break-words ${
                  isCurrentUser
                    ? 'bg-purple-600 text-white rounded-tr-none'
                    : 'bg-gray-100 text-gray-800 rounded-tl-none'
                }`}
              >
                <p className="m-0 text-sm">{msg.text}</p>
                <span className={`text-xs block text-right mt-1 ${
                  isCurrentUser ? 'text-purple-200' : 'text-gray-500'
                }`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isCurrentUser && msg.readAt && (
                    <span className="ml-1 inline-flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;