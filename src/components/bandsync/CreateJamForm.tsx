
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { SONGS, detailedSongExamples } from '@/lib/song-data'; 
import type { SongEntry } from '@/lib/types';
import { PlusCircle, Trash2, Music2, Info, ChevronUp, ChevronDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const MAX_SONGS_IN_JAM = 10;

export function CreateJamForm() {
  const [jamName, setJamName] = useState('');
  const [selectedSongs, setSelectedSongs] = useState<SongEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSongToggle = (song: SongEntry) => {
    setSelectedSongs((prevSelected) => {
      const isAlreadySelected = prevSelected.find(s => s.id === song.id);
      if (isAlreadySelected) {
        return prevSelected.filter(s => s.id !== song.id);
      } else {
        if (prevSelected.length < MAX_SONGS_IN_JAM) {
          return [...prevSelected, song];
        } else {
          toast({
            title: 'Maximum songs reached',
            description: `You can add up to ${MAX_SONGS_IN_JAM} songs to a Jam.`,
            variant: 'destructive',
          });
          return prevSelected;
        }
      }
    });
  };

  const handleMoveSong = (index: number, direction: 'up' | 'down') => {
    setSelectedSongs(prevSelected => {
      const newSelected = [...prevSelected];
      const songToMove = newSelected[index];

      if (direction === 'up' && index > 0) {
        newSelected.splice(index, 1); 
        newSelected.splice(index - 1, 0, songToMove); 
      } else if (direction === 'down' && index < newSelected.length - 1) {
        newSelected.splice(index, 1); 
        newSelected.splice(index + 1, 0, songToMove); 
      }
      return newSelected;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jamName.trim()) {
      toast({ title: 'Jam Name Required', description: 'Please enter a name for your Jam Session.', variant: 'destructive' });
      return;
    }
    if (selectedSongs.length === 0) {
      toast({ title: 'No Songs Selected', description: 'Please add at least one song to your Jam.', variant: 'destructive' });
      return;
    }
    if (!db) {
      toast({ title: 'Firebase Error', description: 'Firebase is not configured. Cannot save Jam.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const jamDocRef = await addDoc(collection(db, 'jams'), {
        name: jamName,
        songIds: selectedSongs.map(s => s.id),
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Jam Created!', description: `"${jamName}" has been successfully created.` });
      router.push(`/jam/${jamDocRef.id}`);
    } catch (error) {
      console.error('Error creating Jam:', error);
      toast({ title: 'Error Creating Jam', description: 'Could not save your Jam Session. Please try again.', variant: 'destructive' });
      setIsLoading(false);
    }
  };

  const filteredSongs = SONGS.filter(song => 
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.artistName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exampleSongTitles = detailedSongExamples.join('", "');

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Jam Details</CardTitle>
          <CardDescription>Name your Jam Session and add songs to your playlist.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="jamName" className="text-base">Jam Session Name</Label>
            <Input
              id="jamName"
              value={jamName}
              onChange={(e) => setJamName(e.target.value)}
              placeholder="e.g., Friday Night Grooves"
              className="mt-1 text-lg"
              maxLength={100}
            />
          </div>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Playback Information</AlertTitle>
            <AlertDescription>
              Songs like "{exampleSongTitles}" have more detailed interactive playback data (lyrics, chords, sections).
              Other songs added to your Jam will have their metadata (title, artist) displayed and use generic placeholder playback content.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Song Selection Area */}
            <div className="space-y-4">
              <Label className="text-base">Available Songs ({filteredSongs.length})</Label>
              <Input
                type="search"
                placeholder="Search songs or artists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-2"
              />
              <ScrollArea className="h-72 rounded-md border p-4">
                {filteredSongs.length > 0 ? (
                  filteredSongs.map((song) => (
                    <div key={song.id} className="flex items-center justify-between mb-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-3">
                         <Checkbox
                            id={`song-${song.id}`}
                            checked={selectedSongs.some(s => s.id === song.id)}
                            onCheckedChange={() => handleSongToggle(song)}
                            disabled={selectedSongs.length >= MAX_SONGS_IN_JAM && !selectedSongs.some(s => s.id === song.id)}
                          />
                        <Label htmlFor={`song-${song.id}`} className="cursor-pointer">
                          <span className="font-medium">{song.title}</span>
                          <span className="text-sm text-muted-foreground block">{song.artistName}</span>
                        </Label>
                      </div>
                       <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleSongToggle(song)}
                          disabled={selectedSongs.length >= MAX_SONGS_IN_JAM && !selectedSongs.some(s => s.id === song.id)}
                          aria-label={selectedSongs.some(s => s.id === song.id) ? "Remove from playlist" : "Add to playlist"}
                        >
                          {selectedSongs.some(s => s.id === song.id) ? <Trash2 className="h-4 w-4 text-destructive" /> : <PlusCircle className="h-4 w-4 text-primary" />}
                        </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">No songs match your search.</p>
                )}
              </ScrollArea>
            </div>

            {/* Current Playlist Area */}
            <div className="space-y-4">
              <Label className="text-base">Your Jam Playlist ({selectedSongs.length}/{MAX_SONGS_IN_JAM})</Label>
              <ScrollArea className="h-72 rounded-md border p-4 bg-muted/20">
                {selectedSongs.length > 0 ? (
                  selectedSongs.map((song, index) => (
                    <div key={`${song.id}-${index}`} className="flex items-center justify-between p-2 mb-2 rounded-md bg-card shadow-sm">
                      <div className="flex-grow">
                        <p className="font-medium">{index + 1}. {song.title}</p>
                        <p className="text-sm text-muted-foreground">{song.artistName}</p>
                      </div>
                      <div className="flex items-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveSong(index, 'up')}
                          disabled={index === 0}
                          aria-label="Move song up"
                          className="mr-1"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveSong(index, 'down')}
                          disabled={index === selectedSongs.length - 1}
                          aria-label="Move song down"
                          className="mr-1"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSongToggle(song)}
                          aria-label="Remove song"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <Music2 className="h-12 w-12 mb-2" />
                    <p>Your playlist is empty.</p>
                    <p className="text-sm">Select songs from the left to add them here.</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isLoading}>
          {isLoading ? 'Saving Jam...' : 'Create Jam & Start Playing'}
        </Button>
      </div>
    </form>
  );
}
