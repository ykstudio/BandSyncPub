'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { SongData, SongSection } from '@/lib/types';
import { sampleSong } from '@/lib/song-data'; // Using the pre-processed data
import { SongInfo } from './SongInfo';
import { Metronome } from './Metronome';
import { SectionProgressBar } from './SectionProgressBar';
import { LyricsDisplay } from './LyricsDisplay';
import { ChordsDisplay } from './ChordsDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, SkipBack, Settings2 } from 'lucide-react'; // Added Settings2 icon

export function SongDisplay() {
  const songData: SongData = sampleSong; // Use the imported, processed song data

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isPlaying) {
      intervalId = setInterval(() => {
        setCurrentTime((prevTime) => {
          const nextTime = prevTime + 0.1;
          if (nextTime >= songData.totalDuration) {
            setIsPlaying(false);
            return songData.totalDuration;
          }
          return nextTime;
        });
      }, 100);
    }
    return () => clearInterval(intervalId);
  }, [isPlaying, songData.totalDuration]);

  const currentSection = useMemo(() => {
    return songData.sections.find(
      (section) => currentTime >= section.startTime && currentTime < section.endTime
    ) || null;
  }, [currentTime, songData.sections]);

  const handlePlayPause = useCallback(() => {
    if (currentTime >= songData.totalDuration && !isPlaying) {
      setCurrentTime(0); // Reset if at end and play is clicked
    }
    setIsPlaying((prev) => !prev);
  }, [currentTime, songData.totalDuration, isPlaying]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  // Format time as MM:SS
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <SongInfo title={songData.title} author={songData.author} />
            <Metronome bpm={songData.bpm} isPlaying={isPlaying} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-2 bg-secondary rounded-md">
             <div className="flex items-center gap-2">
                <Button onClick={handlePlayPause} variant="ghost" size="icon" aria-label={isPlaying ? 'Pause' : 'Play'}>
                  {isPlaying ? <Pause className="w-6 h-6 text-primary" /> : <Play className="w-6 h-6 text-primary" />}
                </Button>
                <Button onClick={handleReset} variant="ghost" size="icon" aria-label="Reset song">
                  <SkipBack className="w-5 h-5 text-primary" />
                </Button>
             </div>
            <div className="text-sm font-mono text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(songData.totalDuration)}
            </div>
             <Button variant="ghost" size="icon" aria-label="Settings (placeholder)">
                <Settings2 className="w-5 h-5 text-primary" />
            </Button>
          </div>

          <SectionProgressBar
            sections={songData.sections}
            currentSectionId={currentSection?.id || null}
            currentTime={currentTime}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LyricsDisplay lyrics={songData.lyrics} currentTime={currentTime} />
            <ChordsDisplay chords={songData.chords} currentTime={currentTime} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
