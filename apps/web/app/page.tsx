'use client'; // Make this a client component to use hooks

import { useState, useEffect } from 'react';
import Image, { type ImageProps } from "next/image";
// import { Button } from "@repo/ui/button"; // Assuming this Button component exists and works
import styles from "./page.module.css";
import { useSocket } from '@/context/SocketContext'; // Import the custom hook
import { useAuth } from '@/context/AuthContext'; // Import the auth hook
import ChatWindow from './components/ChatWindow'; // Import the new ChatWindow component
import ProtectedRoute from '@/components/auth/ProtectedRoute'; // Import the ProtectedRoute component
// Keep ThemeImage component as is
type Props = Omit<ImageProps, "src"> & {
  srcLight: string;
  srcDark: string;
};
const ThemeImage = (props: Props) => {
  const { srcLight, srcDark, ...rest } = props;
  return (
    <>
      <Image {...rest} src={srcLight} className="imgLight" />
      <Image {...rest} src={srcDark} className="imgDark" />
    </>
  );
};

export default function Home() {
  const { socket, isConnected } = useSocket(); // Use the socket context
  const { user } = useAuth(); // Get user from auth context

  // Placeholder for the current user's ID - replaced below
  // const currentUserId = "user_123";
  // Placeholder for a chat to display
  const exampleMatchId = "match_456";
  const exampleRecipientId = "user_789";
  const exampleRecipientName = "Jane Doe"; // Optional name
  // Global listeners (like connect/disconnect) can remain if needed,
  // but chat-specific listeners are now in ChatWindow.
  useEffect(() => {
    if (socket) {
      const handleConnect = () => console.log('Socket connected:', socket.id);
      const handleDisconnect = () => console.log('Socket disconnected');

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
      };
    }
  }, [socket]);


  return (
    <ProtectedRoute>
      <div className={styles.page}>
      <main className={styles.main}>
        {/* Keep existing logo/header */}
        <ThemeImage
          className={styles.logo}
          srcLight="/turborepo-dark.svg" // Ensure leading slash for public assets
          srcDark="/turborepo-light.svg"  // Ensure leading slash
          alt="Turborepo logo"
          width={180}
          height={38}
          priority
        />

        {/* Socket Status */}
        <h2>Socket Status: {isConnected ? 'Connected' : 'Disconnected'}</h2>
        {socket && <p>Socket ID: {socket.id}</p>}

        {/* Render the Chat Window */}
        {/* Render the Chat Window only if connected and user is loaded */}
        {isConnected && user ? (
          <ChatWindow
            matchId={exampleMatchId}
            recipientId={exampleRecipientId}
            currentUserId={user.id} // Use the actual user ID
            recipientName={exampleRecipientName}
          />
        ) : (
          <p>Connecting to chat...</p>
        )}


        {/* Keep existing links/footer */}
        <div className={styles.ctas}>
          {/* ... existing links ... */}
        </div>
        {/* <Button appName="web" className={styles.secondary}>Open alert</Button> */}
      </main>
      <footer className={styles.footer}>
        {/* ... existing footer links ... */}
      </footer>
      </div>
    </ProtectedRoute>
  );
}
