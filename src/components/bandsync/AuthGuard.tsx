'use client';

import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster } from "@/components/ui/toaster";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If on the login page, just render the page itself without the app chrome
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // If authenticated, render the full app layout with chrome
  if (isAuthenticated) {
     return (
        <div data-name="auth-guard-wrapper">
            <div className="fixed top-4 right-4 z-50" data-name="theme-toggle-container">
              <ThemeToggle />
            </div>
            {children}
            <Toaster />
        </div>
     );
  }

  // Fallback while redirecting from a protected route
  return (
     <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
     </div>
  );
}
