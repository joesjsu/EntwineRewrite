'use client'; // Make it a client component to use hooks

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LoginForm } from '@/app/auth/components/LoginForm';
import { Loader2 } from 'lucide-react'; // For loading indicator
import { AppLayout } from '@/components/layout/AppLayout';

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if loading is complete and user is logged in
    if (!isLoading && user) {
      if (user.role === 'ADMIN') {
        console.log('User is ADMIN, redirecting to /admin/users');
        router.push('/admin/users'); // Redirect admin to user management
      } else {
        console.log('User is USER, redirecting to /');
        router.push('/'); // Redirect regular user to home page
      }
    }
  }, [user, isLoading, router]); // Dependencies for the effect

  // Show loading indicator while checking auth status
  if (isLoading) {
    return (
      <AppLayout showFooter={false}>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="mt-4 text-muted-foreground">Loading...</span>
        </div>
      </AppLayout>
    );
  }

  // If not loading and user is not logged in, show the login form
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Branding/Illustration Side */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-purple-600 to-purple-900 justify-center items-center p-8">
          <div className="max-w-md text-center md:text-left">
            <h1 className="text-4xl font-bold text-white mb-4">
              Find your perfect match, intelligently.
            </h1>
            <p className="text-purple-100">
              Entwine uses advanced AI to understand your preferences and connect
              you with truly compatible partners. Sign in to continue your journey.
            </p>
            {/* Optional: Add an illustration or logo here */}
          </div>
        </div>

        {/* Form Side */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-background">
          {/* Ensure LoginForm itself doesn't have excessive margins */}
          <div className="w-full max-w-md">
             <LoginForm />
          </div>
        </div>
      </div>
    );
  }

  // If user is logged in but redirection hasn't happened yet (should be brief), show loading
  return (
    <AppLayout showFooter={false}>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mt-4 text-muted-foreground">Redirecting...</span>
      </div>
    </AppLayout>
  );
}