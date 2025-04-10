'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Import the custom hook
import { usePathname } from 'next/navigation'; // To check current path

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const PUBLIC_PATHS = ['/login', '/signup']; // Routes accessible without login

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth(); // Use the custom hook and correct state name
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) {
      return; // Wait until loading is complete
    }

    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    if (!user && !isPublicPath) {
      // If not logged in and trying to access a protected route, redirect to login
      router.push('/login');
    } else if (user && isPublicPath) {
      // If logged in and trying to access login/signup, redirect to home
      router.push('/');
    }
  }, [user, isLoading, router, pathname]);

  // Show loading indicator or null while checking auth state, unless it's a public path
  if (isLoading && !PUBLIC_PATHS.includes(pathname)) {
    // You might want to return a proper loading spinner component here
    return <div>Loading...</div>;
  }

  // Prevent rendering protected content before redirect happens
  if (!user && !PUBLIC_PATHS.includes(pathname)) {
      return <div>Loading...</div>; // Or null, or a spinner
  }

  // Allow rendering public paths immediately or protected paths if user exists
  return <>{children}</>;
};

export default ProtectedRoute;