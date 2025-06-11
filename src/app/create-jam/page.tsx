
'use client';

import { CreateJamForm } from '@/components/bandsync/CreateJamForm';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CreateJamPage() {
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
      <h1 className="text-3xl font-bold text-primary mb-6 font-headline">Create a New Jam Session</h1>
      <CreateJamForm />
    </main>
  );
}
