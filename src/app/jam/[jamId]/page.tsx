
'use client';

import { useParams } from 'next/navigation';
import { JamPlayer } from '@/components/bandsync/JamPlayer';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export default function JamPage() {
  const params = useParams();
  const jamId = typeof params.jamId === 'string' ? params.jamId : undefined;
  const isMobile = useIsMobile();
  const [isBackButtonVisible, setIsBackButtonVisible] = useState(true);

  useEffect(() => {
    if (isMobile) {
      setIsBackButtonVisible(true); // Reset visibility on mobile switch or initial load
      const timer = setTimeout(() => {
        setIsBackButtonVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setIsBackButtonVisible(true); // Always visible on desktop
    }
  }, [isMobile]);

  if (!jamId) {
    return (
      <main className="container mx-auto min-h-screen py-8 flex flex-col items-center justify-center">
         <div className="mb-6 self-start">
          <Link href="/" passHref>
            <Button variant="outline" size="sm">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Jams
            </Button>
          </Link>
        </div>
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Jam Not Found</h1>
        <p className="text-muted-foreground">The Jam ID is missing or invalid.</p>
      </main>
    );
  }
  
  const loadingFallback = (
    <div className="w-full p-4 space-y-6">
      <Skeleton className="h-[40px] w-1/4 mb-4" />
      <Skeleton className="h-[120px] w-full rounded-xl" />
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 md:h-96" />
          <Skeleton className="h-24 md:h-96" />
        </div>
      </div>
       <Skeleton className="h-[60px] w-full rounded-xl mt-4" />
    </div>
  );

  const backButtonContainerClasses = isMobile
    ? isBackButtonVisible
      ? "opacity-100 max-h-14 mb-4" // Adjusted max-h for Button size="sm" (h-9) + mb-4
      : "opacity-0 max-h-0 mb-0 overflow-hidden pointer-events-none"
    : "opacity-100 max-h-14 mb-4";

  const mainContainerPadding = isMobile
    ? isBackButtonVisible
      ? "py-8"
      : "pt-2 pb-8" // Reduced top padding when button is hidden
    : "py-8";


  return (
    <main className={cn("container mx-auto min-h-screen", mainContainerPadding)}>
       <div className={cn("transition-all duration-300 ease-in-out", backButtonContainerClasses)}>
         <Link href="/" passHref>
           <Button variant="outline" size="sm">
             <ChevronLeft className="mr-1 h-4 w-4" />
             Back to Jams
           </Button>
         </Link>
       </div>
      <JamPlayer jamId={jamId} fallback={loadingFallback} />
    </main>
  );
}
