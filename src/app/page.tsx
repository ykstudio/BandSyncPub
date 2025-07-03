'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTypedSupabaseClient, JamRecord } from '@/lib/supabase';
import React, { useEffect, useState } from 'react';
import { ListMusic, PlusCircle, Pencil } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const [jams, setJams] = useState<JamRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getTypedSupabaseClient();

    const fetchInitialJams = async () => {
      const { data, error: fetchError } = await supabase
        .from('jams')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error("Error fetching Jams:", fetchError);
        setError("Could not fetch Jam Sessions. Please try again later.");
        setJams([]);
      } else {
        setJams(data || []);
        setError(null);
      }
      setIsLoading(false);
    };

    fetchInitialJams();

    const channel = supabase
      .channel('jams-follow-on')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'jams' },
        (payload) => {
          setJams((currentJams) => [payload.new as JamRecord, ...currentJams]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <main className="container mx-auto min-h-screen py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-4xl font-bold text-primary font-headline">BandSync Jams</h1>
          <p className="text-muted-foreground mt-1">Create, share, and play your Jam Sessions in real-time.</p>
        </div>
        <Link href="/create-jam" passHref>
          <Button size="lg">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Jam
          </Button>
        </Link>
      </div>

      {error && (
        <Card className="mb-6 bg-destructive/10 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-1" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2 mt-3">
                  <Skeleton className="h-10 w-1/3" />
                  <Skeleton className="h-10 w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : jams.length === 0 && !error ? (
        <Card className="text-center py-12">
          <CardHeader>
            <ListMusic className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle>No Jam Sessions Yet</CardTitle>
            <CardDescription className="mt-2">
              Be the first to create a Jam! Click the "Create New Jam" button to get started.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jams.map((jam) => (
            <Card key={jam.id} className="flex flex-col">
              <CardHeader className="flex-grow">
                <CardTitle className="text-primary hover:underline">
                  <Link href={`/jam/${jam.id}`}>
                    {jam.name}
                  </Link>
                </CardTitle>
                <CardDescription>
                  {jam.song_ids.length} song{jam.song_ids.length !== 1 ? 's' : ''}
                  {jam.created_at && (
                    <span className="block text-xs mt-1">
                      Created: {new Date(jam.created_at).toLocaleDateString()}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Link href={`/jam/${jam.id}`} passHref>
                  <Button className="flex-grow sm:flex-grow-0">
                    <ListMusic className="mr-2 h-4 w-4" /> Open Jam
                  </Button>
                </Link>
                <Link href={`/edit-jam/${jam.id}`} passHref>
                  <Button variant="outline" className="flex-grow sm:flex-grow-0">
                    <Pencil className="mr-2 h-4 w-4" /> Edit Jam
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
