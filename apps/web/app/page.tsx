'use client'; // Make this a client component to use hooks

import { useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import ChatWindow from './components/ChatWindow';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  // Placeholder for a chat to display
  const exampleMatchId = "match_456";
  const exampleRecipientId = "user_789";
  const exampleRecipientName = "Jane Doe";

  // Global listeners for socket connection
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
      <AppLayout>
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
          {/* Socket Status */}
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <h2 className="text-lg font-medium">
                {isConnected ? 'Connected to chat server' : 'Disconnected from chat server'}
              </h2>
            </div>
            {socket && <p className="text-sm text-muted-foreground">Socket ID: {socket.id}</p>}
          </div>

          {/* Render the Chat Window */}
          {isConnected && user ? (
            <div className="w-full">
              <ChatWindow
                matchId={exampleMatchId}
                recipientId={exampleRecipientId}
                currentUserId={user.id}
                recipientName={exampleRecipientName}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 border border-purple-100 rounded-lg bg-white shadow-sm w-full">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
              <p className="text-muted-foreground">Connecting to chat server...</p>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
