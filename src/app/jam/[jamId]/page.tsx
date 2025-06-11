
'use client';

import { useParams } from 'next/navigation';
import { JamPlayer } from '@/components/bandsync/JamPlayer';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function JamPage() {
  const params = useParams();
  const jamId = typeof params.jamId === 'string' ? params.jamId : undefined;

  if (!jamId) {
    // This case should ideally be handled by Next.js routing if jamId is missing,
    // but as a fallback:
    return (
      <main className="container mx-auto min-h-screen p-4 sm:p-8 flex flex-col items-center justify-center">
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
  
  // Display loading skeletons while JamPlayer might be fetching initial data
  const loadingFallback = (
    <div className="container mx-auto p-4 space-y-6">
      <Skeleton className="h-[40px] w-1/4 mb-4" /> {/* Back button placeholder */}
      <Skeleton className="h-[120px] w-full rounded-xl" /> {/* SongInfo + Metronome + Sync area */}
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" /> {/* Controls + Timer */}
        <Skeleton className="h-12 w-full" /> {/* SectionProgressBar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 md:h-96" /> {/* LyricsDisplay */}
          <Skeleton className="h-24 md:h-96" /> {/* ChordsDisplay */}
        </div>
      </div>
       <Skeleton className="h-[60px] w-full rounded-xl mt-4" /> {/* Playlist controls */}
    </div>
  );


  return (
    <main className="min-h-screen py-8">
       <div className="container mx-auto px-4 mb-4">
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
