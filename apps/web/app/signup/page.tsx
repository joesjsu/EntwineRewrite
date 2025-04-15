'use client'; // Make it a client component

import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { SignupForm } from '@/app/auth/components/SignupForm';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { AppLayout } from '@/components/layout/AppLayout';
import { Loader2 } from 'lucide-react';

export default function SignupPage() {
  const { user, isLoading } = useAuth(); // Get auth state
  const router = useRouter();

  useEffect(() => {
    // Redirect if user is logged in and auth state is not loading
    if (!isLoading && user) {
      console.log('User authenticated after signup, redirecting...');
      // Redirect based on role, or just to the main page
      if (user.role === 'ADMIN') {
        router.push('/admin/users'); // Redirect admin to user list
      } else {
        router.push('/'); // Redirect regular user to home
      }
    }
  }, [user, isLoading, router]);

  // Optionally show loading state or prevent rendering form while redirecting
  if (isLoading || user) {
     return (
       <AppLayout showFooter={false}>
         <div className="flex flex-col items-center justify-center min-h-[60vh]">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
           <span className="mt-4 text-muted-foreground">Loading...</span>
         </div>
       </AppLayout>
     );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Branding/Illustration Side */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-pink-500 to-rose-700 justify-center items-center p-8">
        <div className="max-w-md text-center md:text-left">
          <h1 className="text-4xl font-bold text-white mb-4">
            Start Your Connection Journey.
          </h1>
          <p className="text-rose-100">
            Create your Entwine profile and let our AI help you discover
            meaningful connections based on deeper compatibility.
          </p>
          {/* Optional: Add an illustration or logo here */}
        </div>
      </div>

      {/* Form Side */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-background">
        {/* Ensure SignupForm itself doesn't have excessive margins */}
        <div className="w-full max-w-md">
           <SignupForm />
        </div>
      </div>
    </div>
  );
}