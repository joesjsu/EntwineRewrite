'use client'; // This needs to be a client component

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

// Define the shape of the context data
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

// Create the context with a default value
const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

// Custom hook to use the Socket context
export const useSocket = () => {
  return useContext(SocketContext);
};

// Define the props for the provider component
interface SocketProviderProps {
  children: ReactNode;
  // We might need to pass the auth token here later
  // token: string | null;
}

// Create the provider component
export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  // const { token } = props; // Get token if passed

  useEffect(() => {
    // TODO: Replace with actual API URL from environment variables
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

    // TODO: Get the actual auth token (e.g., from local storage or auth context)
    // For now, using a placeholder. This needs proper integration with auth state.
    const authToken = localStorage.getItem('accessToken'); // Example: retrieve token

    if (!authToken) {
        console.warn('SocketProvider: No auth token found, socket connection not established.');
        // Optionally handle redirect to login or show a message
        return;
    }

    console.log(`SocketProvider: Attempting to connect to ${socketUrl}`);
    const newSocket = io(socketUrl, {
      // Send auth token for middleware verification on the server
      auth: {
        token: authToken,
      },
      // Optional: Add reconnection options if needed
      // reconnectionAttempts: 5,
      // reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    // --- Event Listeners ---
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      // Handle potential cleanup or reconnection logic here
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message, error.cause);
      setIsConnected(false);
      // Handle connection errors (e.g., invalid token, server down)
      // Maybe clear the token and redirect to login if it's an auth error
      if (error.message.includes('Authentication error')) {
          console.error("Authentication failed. Clearing token and potentially redirecting.");
          // localStorage.removeItem('accessToken'); // Example cleanup
          // window.location.href = '/login'; // Example redirect
      }
    });

    // --- Cleanup on component unmount ---
    return () => {
      console.log('SocketProvider: Disconnecting socket.');
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
    // Add dependency on the auth token if it's passed as a prop or comes from another context
  }, [/* token */]); // Re-run effect if the token changes

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};