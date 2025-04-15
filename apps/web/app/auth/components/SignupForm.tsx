'use client';

import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { REGISTER_MUTATION } from '@/graphql/auth.gql'; // Assuming alias setup
import { useAuth } from '@/context/AuthContext'; // Assuming alias setup
import { Button } from '@/components/ui/button'; // Assuming Shadcn UI setup
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react"; // For alert icon

// Define the input type based on the GraphQL schema
interface RegisterInput {
  phoneNumber: string;
  password: string;
  firstName?: string;
  lastName?: string;
  email: string; // Added email
}

export function SignupForm() {
  const [formData, setFormData] = useState<RegisterInput>({
    phoneNumber: '',
    password: '',
    firstName: '',
    lastName: '',
    email: '', // Added email state
  });
  const { login: loginUser } = useAuth(); // Use login from context to set tokens after successful registration
  const [registerMutation, { loading, error }] = useMutation(REGISTER_MUTATION);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const result = await registerMutation({
        variables: {
          input: formData,
        },
      });
      if (result.data?.register) {
        // Automatically log the user in after successful registration
        loginUser({ // Use the login function from context
            phoneNumber: formData.phoneNumber,
            password: formData.password
        });
        console.log('Registration successful, attempting login...');
        // Optionally redirect user here after successful context update
      }
    } catch (err) {
      // Error is already captured by the 'error' object from useMutation
      console.error('Registration failed:', err);
    }
  };

  return (
    <Card className="w-full max-w-md border-purple-200 shadow-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-purple-700">Create Account</CardTitle>
        <CardDescription className="text-center">Enter your information to create an account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                disabled={loading}
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                disabled={loading}
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john.doe@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-sm font-medium">Phone Number</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              placeholder="+1234567890"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              disabled={loading}
              className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
            />
          </div>
          {error && (
             <Alert variant="destructive">
               <Terminal className="h-4 w-4" />
               <AlertTitle>Signup Error</AlertTitle>
               <AlertDescription>
                 {error.message || 'An unknown error occurred. Please try again.'}
               </AlertDescription>
             </Alert>
          )}
          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-center w-full text-gray-600">
          Already have an account? <a href="/login" className="text-purple-600 hover:text-purple-800 font-medium">Sign in</a>
        </p>
      </CardFooter>
    </Card>
  );
}