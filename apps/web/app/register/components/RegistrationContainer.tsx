'use client';

import React from 'react';
import { Card } from "@/components/ui/card";

interface RegistrationContainerProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
}

const RegistrationContainer: React.FC<RegistrationContainerProps> = ({
  children,
  currentStep,
  totalSteps
}) => {
  // Calculate progress percentage
  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="container mx-auto p-4 pt-16 md:pt-20">
      <div className="mb-8 w-full max-w-2xl mx-auto">
        {/* Stepper component */}
        <div className="space-y-2">
          <div className="flex justify-between">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index + 1 <= currentStep 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index + 1}
                </div>
                <span className="text-xs mt-1 hidden sm:inline">
                  {getStepName(index + 1)}
                </span>
              </div>
            ))}
          </div>
          {/* Progress bar */}
          {/* Updated to use relative/absolute positioning and transitions */}
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Main content */}
      {children}
    </div>
  );
};

// Helper function to get step names
function getStepName(step: number): string {
  switch (step) {
    case 1:
      return "Basic Profile";
    case 2:
      return "Preferences";
    case 3:
      return "Photo Rating";
    case 4:
      return "AI Coach";
    case 5:
      return "AI Personas";
    case 6:
      return "Completion";
    default:
      return `Step ${step}`;
  }
}

export default RegistrationContainer;