'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react"; // Icon for completion

const Step6_CompletionScreen: React.FC = () => {
  const router = useRouter();

  const goToDashboard = () => {
    // Navigate to the main application dashboard
    router.push('/'); // Assuming dashboard is at root '/'
  };

  // Optional: Add a useEffect to automatically redirect after a few seconds?
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     goToDashboard();
  //   }, 5000); // Redirect after 5 seconds
  //   return () => clearTimeout(timer);
  // }, [router]);

  return (
    <Card className="w-full max-w-md mx-auto text-center">
      <CardHeader>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
        </div>
        <CardTitle className="mt-4">Registration Complete!</CardTitle>
        <CardDescription>
          Your profile is set up. You can now explore all the features of Entwine.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={goToDashboard} className="w-full">
          Go to Dashboard
        </Button>
      </CardContent>
    </Card>
  );
};

export default Step6_CompletionScreen;