'use client';

import React, { ReactNode } from 'react';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
}

export function AppLayout({
  children,
  className,
  showHeader = true,
  showFooter = true,
}: AppLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {showHeader && (
        <header className="sticky top-0 z-50 w-full border-b border-border/20 bg-background/80 py-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
          <div className="container flex max-w-screen-2xl items-center">
            <Logo className="mr-4" />
            <nav className="hidden flex-1 items-center justify-center md:flex">
              {/* Desktop Navigation Links Placeholder */}
            </nav>
            <div className="flex flex-1 items-center justify-end space-x-2">
              {/* User Menu Placeholder */}
              <button className="md:hidden p-2 rounded-md hover:bg-accent transition-all duration-[var(--transition-medium)] ease-[var(--ease-in-out)] transform active:scale-95">
                {/* Mobile Menu Button Placeholder (e.g., Hamburger Icon) */}
                <span className="sr-only">Open menu</span>
              </button>
            </div>
          </div>
        </header>
      )}
      
      <main className={cn("flex-1 container py-6", className)}>
        {children}
      </main>

      {showFooter && (
        <footer className="border-t border-border/40 bg-background py-6">
          <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
            <Logo size="sm" />
            <p className="text-center text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Entwine. All rights reserved.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}