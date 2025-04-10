'use client'; // Mark this as a Client Component

import React from 'react';
import { SocketProvider } from "@/context/SocketContext";
import { AuthProvider } from "@/context/AuthContext";
import { ApolloProvider } from "@apollo/client";
import client from "@/lib/apolloClient";
import { Toaster } from "@/components/ui/sonner";

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        <SocketProvider>
          {children}
        </SocketProvider>
        <Toaster richColors position="top-right" /> {/* Keep Toaster within client boundary */}
      </AuthProvider>
    </ApolloProvider>
  );
}