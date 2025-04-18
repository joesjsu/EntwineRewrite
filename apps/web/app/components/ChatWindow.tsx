'use client';

import React, { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useQuery } from '@apollo/client'; // Import useQuery
import { GET_MESSAGES_QUERY } from '@/graphql/queries'; // Corrected: Use path alias
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';

interface ChatWindowProps {
  matchId: string; // Or number, depending on your ID type
  recipientId: string;
  currentUserId: string; // ID of the logged-in user
  recipientName?: string; // Optional: Display name of the recipient
}

// Define a type for the message object based on the GraphQL query
interface MessageType {
  id: string;
  text: string;
  senderId: string;
  recipientId: string;
  matchId: string;
  createdAt: string; // Or Date, depending on how it's returned
  readAt?: string | null; // Optional Date
}

const ChatWindow: React.FC<ChatWindowProps> = ({ matchId, recipientId, currentUserId, recipientName }) => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<MessageType[]>([]); // Use the defined MessageType
  const [isTyping, setIsTyping] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null); // State for message sending errors

  // Fetch initial messages using Apollo Client
  const { loading: loadingMessages, error: errorMessages, data: messagesData } = useQuery(GET_MESSAGES_QUERY, {
    variables: { matchId },
    skip: !matchId, // Don't run query if matchId isn't available yet
    fetchPolicy: 'cache-and-network', // Fetch from network but use cache if available
  });

  // Effect to load fetched messages into state
  useEffect(() => {
    if (messagesData?.messages) {
      // Sort messages by createdAt just in case they aren't ordered by the backend
      const sortedMessages = [...messagesData.messages].sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages(sortedMessages);
      console.log(`Loaded ${sortedMessages.length} initial messages for match ${matchId}`);
    }
  }, [messagesData, matchId]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // --- Socket Event Listeners specific to this chat window ---

    // Listener for new messages in this specific match
    const handleNewMessage = (message: MessageType) => { // Use MessageType
      console.log(`New message received for match ${matchId}:`, message);
      // Add logic to only add message if it belongs to this matchId
      // Also prevent adding duplicates if the message is already in state (e.g., from initial fetch)
      if (message.matchId === matchId) {
         setMessages((prevMessages) => {
            if (prevMessages.some(m => m.id === message.id)) {
                return prevMessages; // Already exists, don't add again
            }
            return [...prevMessages, message];
         });
      }
    };

    // Listener for typing indicator in this specific match
    const handleUserTyping = (data: { senderId: string; matchId: string | number }) => {
       if (String(data.matchId) === String(matchId) && data.senderId === recipientId) {
         console.log(`User ${data.senderId} is typing in match ${matchId}`);
         setIsTyping(true);
       }
    };

    // Listener for stopped typing indicator in this specific match
    const handleUserStoppedTyping = (data: { senderId: string; matchId: string | number }) => {
       if (String(data.matchId) === String(matchId) && data.senderId === recipientId) {
         console.log(`User ${data.senderId} stopped typing in match ${matchId}`);
         setIsTyping(false);
       }
    };

     // Listener for message read confirmation relevant to this chat
     const handleMessageWasRead = (data: { messageId: number; matchId: number; readerId: string; readAt: Date }) => {
        if (String(data.matchId) === String(matchId)) {
            console.log(`Message ${data.messageId} read confirmation received for match ${matchId}`);
            // Update the status of the specific message in the 'messages' state
            setMessages(prevMessages => prevMessages.map(msg =>
                String(msg.id) === String(data.messageId) ? { ...msg, readAt: data.readAt ? new Date(data.readAt).toISOString() : null } : msg // Convert Date to ISO string
            ));
        }
     };


    // Register listeners
    socket.on('chat message', handleNewMessage); // Assuming 'chat message' is the event for new messages
    socket.on('user typing', handleUserTyping);
    socket.on('user stopped typing', handleUserStoppedTyping);
    socket.on('message was read', handleMessageWasRead);


    // Cleanup listeners on component unmount or socket/matchId change
    return () => {
      console.log(`Cleaning up chat listeners for match ${matchId}`);
      socket.off('chat message', handleNewMessage);
      socket.off('user typing', handleUserTyping);
      socket.off('user stopped typing', handleUserStoppedTyping);
      socket.off('message was read', handleMessageWasRead);
    };
  }, [socket, isConnected, matchId, recipientId]);


  const handleSendMessage = (text: string) => {
    if (!socket || !isConnected || !text.trim()) {
        setSendError(!isConnected ? "Cannot send message: Disconnected." : null);
        return;
    }
    setSendError(null); // Clear previous errors

    const messageData = {
      matchId: matchId,
      recipientId: recipientId,
      text: text,
      // senderId should ideally be added server-side based on the authenticated socket
    };

    console.log(`Sending message to match ${matchId}:`, messageData);
    // Emit with acknowledgement
    socket.emit('chat message', messageData, (response: { success: boolean; error?: string; message?: MessageType }) => {
        if (!response.success) {
            console.error("Error sending message:", response.error);
            setSendError(`Failed to send message: ${response.error || 'Unknown error'}`);
        } else {
            console.log("Message sent successfully and acknowledged by server:", response.message);
            // Optionally add the acknowledged message to state immediately for optimistic UI,
            // but ensure handleNewMessage listener handles potential duplicates.
            // Example (if server sends back the created message):
            // if (response.message && response.message.matchId === matchId) {
            //     setMessages((prevMessages) => {
            //         if (prevMessages.some(m => m.id === response.message!.id)) {
            //             return prevMessages;
            //         }
            //         return [...prevMessages, response.message];
            //     });
            // }
        }
    });
  };

  const handleTypingChange = (isCurrentlyTyping: boolean) => {
     if (!socket || !isConnected) return;
     const eventName = isCurrentlyTyping ? 'start typing' : 'stop typing';
     console.log(`Emitting ${eventName} for match ${matchId}`);
     socket.emit(eventName, { recipientId, matchId });
  };

  // TODO: Add logic to fetch recipientName if not provided
  const displayName = recipientName || recipientId;

  return (
    <div className="flex flex-col h-[600px] border border-purple-200 rounded-lg shadow-md bg-white overflow-hidden">
      <div className="bg-purple-600 text-white px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
          {displayName}
        </h2>
        <div className="text-xs opacity-75">Match ID: {matchId}</div>
      </div>
      
      {/* Connection Status / Error Banner */}
      {!isConnected && (
        <div className="px-4 py-2 bg-red-100 text-red-800 text-center text-sm border-b border-red-200">
          Connection lost. Attempting to reconnect...
        </div>
      )}

      {/* Message List Area - Show loading/error states */}
      {loadingMessages && (
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-pulse flex space-x-2">
            <div className="h-2 w-2 bg-purple-400 rounded-full"></div>
            <div className="h-2 w-2 bg-purple-400 rounded-full"></div>
            <div className="h-2 w-2 bg-purple-400 rounded-full"></div>
          </div>
        </div>
      )}
      
      {errorMessages && (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-red-500 text-center px-4">
            Error loading messages: {errorMessages.message}
          </p>
        </div>
      )}
      
      {!loadingMessages && !errorMessages && (
        <MessageList messages={messages} currentUserId={currentUserId} />
      )}

      {/* Typing Indicator Area */}
      <TypingIndicator isTyping={isTyping} userName={displayName} />

      {/* Message Input Area */}
      <div className="border-t border-purple-100">
        <MessageInput
          onSendMessage={handleSendMessage}
          onTypingChange={handleTypingChange}
          disabled={!isConnected}
        />
        {/* Display sending errors */}
        {sendError && (
          <p className="text-red-500 text-xs px-4 pb-2 text-center">{sendError}</p>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;