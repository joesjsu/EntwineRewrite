'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router
import { Skeleton } from '@/components/ui/skeleton';
import Step1_BasicProfileForm from './components/Step1_BasicProfileForm';
import Step2_DatingPreferencesForm from './components/Step2_DatingPreferencesForm';
import Step3_PhotoRatingInterface from './components/Step3_PhotoRatingInterface';
import Step4_AICoachInteraction from './components/Step4_AICoachInteraction';
import Step5_AIPersonaChat from './components/Step5_AIPersonaChat';
import Step6_CompletionScreen from './components/Step6_CompletionScreen';
import RegistrationContainer from './components/RegistrationContainer';

const RegisterPage: React.FC = () => {
  const { user, isLoading, accessToken } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    // Redirect if not loading, not authenticated (no access token), and not already on login/signup
    // Added accessToken check for more robust auth check before redirecting
    if (!isLoading && !accessToken) {
      console.log('RegisterPage: Not authenticated, redirecting to /login');
      router.push('/login');
    }
    // Redirect if profile is already complete
    else if (!isLoading && user?.profileComplete) {
      console.log('RegisterPage: Profile complete, redirecting to /dashboard');
      router.push('/'); // Assuming main dashboard is at root '/'
    }
  }, [isLoading, user, accessToken, router]);

  if (isLoading || !user) {
    // Show loading state while auth context is loading or if user is null (even briefly before redirect)
    // Using Skeleton for a better loading UX
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-10 w-full mt-4" />
        </div>
      </div>
    );
  }

  // If profile is complete, render null or loading while redirect effect runs
  if (user.profileComplete) {
     return null; // Or a loading indicator
  }

  const renderStepComponent = () => {
    // Ensure registrationStep is treated as a number, default to 0 if undefined/null
    const currentStep = user?.registrationStep ?? 0;

    console.log(`RegisterPage: Rendering step for registrationStep: ${currentStep}`);

    switch (currentStep) {
      case 0:
        // Step 0 is handled by /signup, user should arrive here at step 1+
        // If they somehow land here at step 0, maybe redirect or show step 1?
        // For now, let's assume they start at step 1 after signup.
        // Fallthrough to step 1 might be reasonable, or redirect.
        // Redirecting might be safer if backend guarantees step >= 1 after signup.
        console.warn("RegisterPage: User arrived with registrationStep 0. Redirecting to Step 1 logic.");
        // return <Step1_BasicProfileForm />; // Or handle differently
         // If user lands here at step 0, render Step 1 as they should have completed signup
         return <Step1_BasicProfileForm />;
      case 1:
        // return <Step1_BasicProfileForm />;
        return <Step1_BasicProfileForm />;
      case 2:
        // return <Step2_DatingPreferencesForm />;
        return <Step2_DatingPreferencesForm />;
      case 3:
        return <Step3_PhotoRatingInterface />;
      case 4:
        return <Step4_AICoachInteraction />;
      case 5:
        // return <Step5_AIPersonaChat />;
        return <Step5_AIPersonaChat />;
      case 6:
         // This step indicates completion, but profileComplete might not be true yet
         // if there's a final backend step. Render completion screen.
        // return <Step6_CompletionScreen />;
         return <Step6_CompletionScreen />;
      default:
        console.error(`RegisterPage: Unknown registrationStep: ${currentStep}`);
        // Redirect to dashboard or show an error?
        router.push('/');
        return <div>Invalid registration step. Redirecting...</div>;
    }
  };

  return (
    <RegistrationContainer currentStep={user.registrationStep ?? 0} totalSteps={6}>
      {renderStepComponent()}
    </RegistrationContainer>
  );
};

export default RegisterPage;