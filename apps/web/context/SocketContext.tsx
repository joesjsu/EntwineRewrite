'use client'; // This needs to be a client component

import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'; // Added useRef
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext'; // Import useAuth

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
  const { accessToken, isLoading } = useAuth(); // Get accessToken and isLoading from AuthContext
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const currentSocketRef = useRef<Socket | null>(null); // Ref to hold the current socket instance for cleanup

  // Define socketUrl outside the effect
  // TODO: Replace with actual API URL from environment variables
  const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

  useEffect(() => {

    // Use the accessToken from AuthContext
    console.log(`SocketProvider: Auth token state changed. Current token: ${accessToken ? 'Exists' : 'Null'}`);

    // Disconnect previous socket if it exists and token changes (or becomes null)
    if (currentSocketRef.current) {
        console.log('SocketProvider: Disconnecting previous socket due to token change or effect re-run.');
        currentSocketRef.current.disconnect();
        setSocket(null);
        setIsConnected(false);
        currentSocketRef.current = null;
    }

    // Wait until auth is resolved AND token is available
    if (isLoading || !accessToken) {
        if (isLoading) {
            console.log('SocketProvider: Auth context is loading, waiting to connect socket.');
        } else {
            // This case means loading is false, but accessToken is still null (i.e., user is not logged in)
            console.warn('SocketProvider: Auth context loaded, but no auth token available. Socket connection not established.');
        }
        return; // Don't attempt connection if loading or no token
    }

    console.log(`SocketProvider: Attempting to connect to ${socketUrl} with token.`);
    console.log('[Socket Context Debug] Token being sent for auth:', accessToken ? `${accessToken.substring(0, 10)}...` : 'null');
    const newSocket = io(socketUrl, {
      auth: {
        token: accessToken, // Use the token from AuthContext
      },
      // Optional: Add reconnection options if needed
      // reconnectionAttempts: 5,
      // reconnectionDelay: 1000,
    });
setSocket(newSocket);
currentSocketRef.current = newSocket; // Store the new socket instance in the ref

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
    // --- Cleanup on component unmount or before effect re-runs ---
    return () => {
      console.log('SocketProvider: Cleaning up effect. Disconnecting socket.');
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
      currentSocketRef.current = null; // Clear the ref on cleanup
    };
  }, [accessToken, isLoading, socketUrl]); // Re-run effect if accessToken, isLoading, or socketUrl changes

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};