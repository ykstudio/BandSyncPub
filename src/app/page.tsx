
'use client'; // Add 'use client' if using hooks like useState for loading, or if dynamic import itself requires it.
            // However, for basic dynamic import of a client component, the page itself can remain a Server Component.
            // Let's assume page.tsx can remain a Server Component and dynamic handles client boundary.

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton'; // For a more structured loader

const SongDisplay = dynamic(() => import('@/components/bandsync/SongDisplay').then(mod => mod.SongDisplay), {
  ssr: false, // Firestore interactions are client-side
  loading: () => (
    <div className="container mx-auto p-4 space-y-6">
      <Skeleton className="h-[120px] w-full rounded-xl" />
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 md:h-96" />
          <Skeleton className="h-24 md:h-96" />
        </div>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="min-h-screen py-8">
      <SongDisplay />
    </main>
  );
}
