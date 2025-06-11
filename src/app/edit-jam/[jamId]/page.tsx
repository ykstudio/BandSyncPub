
'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import type { JamSession } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { EditJamForm } from '@/components/bandsync/EditJamForm';
import { ChevronLeft, Loader2, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditJamPage() {
  const params = useParams();
  const router = useRouter();
  const jamId = typeof params.jamId === 'string' ? params.jamId : undefined;

  const [jamData, setJamData] = useState<JamSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jamId) {
      setError('Jam ID is missing.');
      setIsLoading(false);
      return;
    }
    if (!db) {
      setError('Firebase not configured. Cannot load Jam.');
      setIsLoading(false);
      return;
    }

    const fetchJamData = async () => {
      setIsLoading(true);
      try {
        const jamDocRef = doc(db, 'jams', jamId);
        const docSnap = await getDoc(jamDocRef);

        if (docSnap.exists()) {
          setJamData({ id: docSnap.id, ...docSnap.data() } as JamSession);
          setError(null);
        } else {
          setError('Jam Session not found.');
        }
      } catch (err) {
        console.error('Error fetching Jam for editing:', err);
        setError('Could not load Jam Session data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJamData();
  }, [jamId]);

  if (isLoading) {
    return (
      <main className="container mx-auto min-h-screen p-4 sm:p-8">
        <div className="mb-6">
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-10 w-1/2 mb-6" />
        <div className="space-y-8">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-96 w-full" />
            <div className="flex justify-end">
                <Skeleton className="h-12 w-48" />
            </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto min-h-screen p-4 sm:p-8 flex flex-col items-center justify-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2 text-destructive">Error</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Link href="/" passHref>
          <Button variant="outline">Back to Jams</Button>
        </Link>
      </main>
    );
  }

  if (!jamData) {
     // Should be covered by error state, but as a fallback
    return (
      <main className="container mx-auto min-h-screen p-4 sm:p-8 flex flex-col items-center justify-center">
        <p>Jam data could not be loaded.</p>
         <Link href="/" passHref>
          <Button variant="outline" className="mt-4">Back to Jams</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="container mx-auto min-h-screen p-4 sm:p-8">
      <div className="mb-6">
        <Link href="/" passHref>
          <Button variant="outline" size="sm">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Jams
          </Button>
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-primary mb-6 font-headline">Edit Jam Session</h1>
      <EditJamForm jamData={jamData} />
    </main>
  );
}
