
'use client';

import type { Artist, SongEntry } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import React from 'react';

interface SongSelectionProps {
  artists: Artist[];
  allSongs: SongEntry[];
  selectedArtistId: string | null;
  onArtistChange: (artistId: string) => void;
  selectedSongId: string | null;
  onSongChange: (songId: string) => void;
}

export function SongSelection({
  artists,
  allSongs,
  selectedArtistId,
  onArtistChange,
  selectedSongId,
  onSongChange,
}: SongSelectionProps) {
  const songsBySelectedArtist = React.useMemo(() => {
    if (!selectedArtistId) return [];
    return allSongs.filter(song => song.artistId === selectedArtistId);
  }, [allSongs, selectedArtistId]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border-b">
      <div>
        <Label htmlFor="artist-select" className="text-sm font-medium mb-1 block">Artist</Label>
        <Select
          value={selectedArtistId || undefined}
          onValueChange={(value) => {
            if (value) onArtistChange(value);
          }}
        >
          <SelectTrigger id="artist-select" className="w-full">
            <SelectValue placeholder="Select an artist" />
          </SelectTrigger>
          <SelectContent>
            {artists.map((artist) => (
              <SelectItem key={artist.id} value={artist.id}>
                {artist.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="song-select" className="text-sm font-medium mb-1 block">Song</Label>
        <Select
          value={selectedSongId || undefined}
          onValueChange={(value) => {
            if (value) onSongChange(value);
          }}
          disabled={!selectedArtistId || songsBySelectedArtist.length === 0}
        >
          <SelectTrigger id="song-select" className="w-full">
            <SelectValue placeholder={selectedArtistId ? "Select a song" : "First select an artist"} />
          </SelectTrigger>
          <SelectContent>
            {songsBySelectedArtist.map((song) => (
              <SelectItem key={song.id} value={song.id}>
                {song.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
