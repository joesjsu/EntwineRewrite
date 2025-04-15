
'use client';

import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { REGISTER_MUTATION } from '@/graphql/auth.gql';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Heart, UserPlus, Lock } from "lucide-react";

interface RegisterInput {
  phoneNumber: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export function SignupForm() {
  const [formData, setFormData] = useState<RegisterInput>({
    phoneNumber: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const { login: loginUser } = useAuth();
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
        loginUser({
          phoneNumber: formData.phoneNumber,
          password: formData.password
        });
        console.log('Registration successful, attempting login...');
      }
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-xl">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-center">
          <Heart className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
        <CardDescription className="text-center">
          Join our community and start your journey to meaningful connections
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium">
                First Name
              </Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                disabled={loading}
                className="transition-all focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium">
                Last Name
              </Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                disabled={loading}
                className="transition-all focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-sm font-medium">
              Phone Number
            </Label>
            <div className="relative">
              <UserPlus className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                placeholder="+1234567890"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                disabled={loading}
                className="pl-10 transition-all focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                className="pl-10 transition-all focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          {error && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Registration Error</AlertTitle>
              <AlertDescription>
                {error.message || 'An unknown error occurred. Please try again.'}
              </AlertDescription>
            </Alert>
          )}
          <Button 
            type="submit" 
            className="w-full h-11 text-base font-medium transition-all"
            disabled={loading}
          >
            {loading ? 'Creating your account...' : 'Sign Up'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 text-center">
        <p className="text-sm text-muted-foreground">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
        <p className="text-sm">
          Already have an account?{' '}
          <a href="/login" className="text-primary hover:underline font-medium">
            Log in
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}
