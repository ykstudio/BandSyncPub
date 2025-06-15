
'use client';

import { useParams } from 'next/navigation';
import { JamPlayer } from '@/components/bandsync/JamPlayer';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export default function JamPage() {
  const params = useParams();
  const jamId = typeof params.jamId === 'string' ? params.jamId : undefined;
  const isMobile = useIsMobile();
  const [isBackButtonVisible, setIsBackButtonVisible] = useState(true);
  const hideBackButtonTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showAndRestartBackButtonHideTimer = useCallback(() => {
    if (isMobile) {
      setIsBackButtonVisible(true);
      if (hideBackButtonTimerRef.current) {
        clearTimeout(hideBackButtonTimerRef.current);
      }
      hideBackButtonTimerRef.current = setTimeout(() => {
        setIsBackButtonVisible(false);
      }, 5000);
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      showAndRestartBackButtonHideTimer(); // Initial show and start timer

      const handleInteraction = () => {
        showAndRestartBackButtonHideTimer();
      };

      window.addEventListener('click', handleInteraction);
      window.addEventListener('touchmove', handleInteraction);

      return () => {
        if (hideBackButtonTimerRef.current) {
          clearTimeout(hideBackButtonTimerRef.current);
        }
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('touchmove', handleInteraction);
      };
    } else {
      // Ensure button is always visible and timer is cleared on desktop
      setIsBackButtonVisible(true);
      if (hideBackButtonTimerRef.current) {
        clearTimeout(hideBackButtonTimerRef.current);
        hideBackButtonTimerRef.current = null;
      }
    }
  }, [isMobile, showAndRestartBackButtonHideTimer]);

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
      ? "opacity-100 max-h-14 mb-4"
      : "opacity-0 max-h-0 mb-0 overflow-hidden pointer-events-none"
    : "opacity-100 max-h-14 mb-4";

  // Consistent padding for main container to avoid content being cut off
  const mainContainerPadding = "py-8";


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

