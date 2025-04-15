import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12'
  };

  return (
    <div className={cn("flex items-center", className)}>
      <svg 
        className={cn("text-primary", sizeClasses[size])} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M8 12C8 12 9.5 14 12 14C14.5 14 16 12 16 12C16 12 14.5 10 12 10C9.5 10 8 12 8 12Z" 
          fill="currentColor" 
          stroke="currentColor" 
          strokeWidth="1" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M9 16C9 16 10.5 18 12 18C13.5 18 15 16 15 16" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M9 8C9 8 10.5 6 12 6C13.5 6 15 8 15 8" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
      <span className="ml-2 font-bold text-primary text-xl">Entwine</span>
    </div>
  );
}