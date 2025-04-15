'use client';

import React, { useState, useContext } from 'react';
// Remove direct useMutation import for login, context handles it
import { LOGIN_MUTATION } from '@/graphql/auth.gql'; // Assuming alias setup
import { useAuth } from '@/context/AuthContext'; // Use the custom hook
import { Button } from '@/components/ui/button'; // Assuming Shadcn UI setup
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react"; // For alert icon

export function LoginForm() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const { login: loginUser } = useAuth(); // Use the custom hook
  // State for loading and error, managed by the context call
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null); // Clear previous errors
    try {
      const success = await loginUser({ phoneNumber, password });
      if (success) {
        console.log('Login successful (handled by context)');
        // Optionally redirect user here after successful context update
      } else {
        // Context's login function returned false, likely due to API error handled within context
        // We might want a generic error if the context doesn't throw/expose specific errors
         setError(new Error('Login failed. Please check your credentials.'));
         console.log('Login failed (handled by context)');
      }
    } catch (err: any) {
      // Catch errors potentially thrown by useAuth or unexpected issues
      console.error('Login failed:', err);
      setError(err instanceof Error ? err : new Error('An unexpected error occurred.'));
    } finally {
       setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-purple-200 shadow-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-purple-700">Welcome Back</CardTitle>
        <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-sm font-medium">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
              required
              disabled={isLoading}
              className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <a href="#" className="text-xs text-purple-600 hover:text-purple-800">Forgot password?</a>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
            />
          </div>
          {error && (
             <Alert variant="destructive">
               <Terminal className="h-4 w-4" />
               <AlertTitle>Login Error</AlertTitle>
               <AlertDescription>
                 {error.message || 'An unknown error occurred. Please try again.'}
               </AlertDescription>
             </Alert>
          )}
          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-center w-full text-gray-600">
          Don't have an account? <a href="/signup" className="text-purple-600 hover:text-purple-800 font-medium">Sign up</a>
        </p>
      </CardFooter>
    </Card>
  );
}