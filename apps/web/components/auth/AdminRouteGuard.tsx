'use client';

import React, { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AdminRouteGuardProps {
  children: ReactNode;
}

export default function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    // Show loading state while checking auth status
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Verifying access...</span>
      </div>
    );
  }

  // If not loading and user is not found or not an admin, redirect or show forbidden
  if (!user || user.role !== 'ADMIN') {
    // Option 1: Redirect to home page (or login)
    // useEffect(() => { // Use useEffect for redirection after initial render
    //   router.push('/');
    // }, [router]);
    // return null; // Render nothing while redirecting

    // Option 2: Show a forbidden message
    return (
       <div className="container mx-auto p-4 flex items-center justify-center h-screen">
         <Alert variant="destructive" className="w-full max-w-md">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access this page. Please contact an administrator if you believe this is an error.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If user is an admin, render the children components
  return <>{children}</>;
}