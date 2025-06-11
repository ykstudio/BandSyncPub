
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { SongData, SessionState, ChordChange } from '@/lib/types';
import { sampleSong } from '@/lib/song-data';
import { SongInfo } from './SongInfo';
import { Metronome } from './Metronome';
import { SectionProgressBar } from './SectionProgressBar';
import { LyricsDisplay } from './LyricsDisplay';
import { ChordsDisplay } from './ChordsDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, SkipBack, Settings2, Wifi, WifiOff } from 'lucide-react';
import { db } from '@/lib/firebase'; // Firebase Firestore instance
import { doc, onSnapshot, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";


const SESSION_ID = 'global-bandsync-session'; // All users share this one session
const TIME_DRIFT_THRESHOLD = 1.0; // Seconds. If remote is AHEAD by more than this, local catches up.
const FIRESTORE_UPDATE_INTERVAL = 2000; // Milliseconds (2 seconds)

export function SongDisplay() {
  const songData: SongData = sampleSong;
  const { toast } = useToast();

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const [isSyncEnabled, setIsSyncEnabled] = useState(true);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);

  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (db) {
      setFirebaseInitialized(true);
      if (isSyncEnabled) setIsLoadingSession(true);
    } else {
      setFirebaseInitialized(false);
      setIsLoadingSession(false);
    }
  }, [isSyncEnabled]);


  const updateFirestoreSession = useCallback(async (newState: Partial<SessionState>) => {
    if (!isSyncEnabled || !db || !firebaseInitialized) {
      return;
    }
    const sessionDocRef = doc(db, 'sessions', SESSION_ID);
    try {
      await setDoc(sessionDocRef, {
        ...newState,
        lastUpdated: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error updating Firestore session:", error);
      toast({
        title: "Sync Error",
        description: "Could not update shared session. Changes might not be synced.",
        variant: "destructive",
      });
    }
  }, [isSyncEnabled, firebaseInitialized, toast]);

  // Effect for Firestore listener
  useEffect(() => {
    if (!isSyncEnabled || !db || !firebaseInitialized) {
      setIsLoadingSession(false);
      return;
    }

    setIsLoadingSession(true);
    const sessionDocRef = doc(db, 'sessions', SESSION_ID);

    const unsubscribe = onSnapshot(sessionDocRef, (snapshot) => {
      setIsLoadingSession(false);
      if (snapshot.metadata.hasPendingWrites) {
        return;
      }

      if (snapshot.exists()) {
        const remoteState = snapshot.data() as SessionState;
        
        setCurrentTime(currentLocalTime => {
            const remoteIsPlaying = remoteState.isPlaying;
            const remoteTime = remoteState.currentTime;
            const localWantsToPlay = isPlayingRef.current;

            // Scenario A: Local client has definitively finished the song.
            // Its state (paused at end) should be resilient against stale updates.
            if (!localWantsToPlay && currentLocalTime >= songData.totalDuration) {
                // If remote is trying to play something *before* the end, ignore it. Stay finished.
                if (remoteIsPlaying && remoteTime < songData.totalDuration) {
                    if (isPlaying) setIsPlaying(false); // Ensure React state `isPlaying` is also false if it wasn't.
                    return songData.totalDuration; // Stay at the end.
                }
                // If remote is also paused, but at an earlier time (and not a reset to 0), stay finished.
                if (!remoteIsPlaying && remoteTime < songData.totalDuration && remoteTime > 0.1) {
                    return songData.totalDuration; // Stay at the end.
                }
                // Fall through for other cases (e.g., remote resets to 0, or remote is also at/past end).
            }

            // Scenario B: General state mismatch (play/pause status)
            if (localWantsToPlay !== remoteIsPlaying) {
                setIsPlaying(remoteIsPlaying);
                return remoteTime;
            }

            // Scenario C: Both agree on play/pause status
            if (localWantsToPlay) { // Both are playing
                const timeDifference = remoteTime - currentLocalTime;
                if (timeDifference > TIME_DRIFT_THRESHOLD) { // Remote is significantly ahead
                    return remoteTime;
                }
                return currentLocalTime; // Local is ahead or close enough
            } else { // Both are paused
                if (Math.abs(currentLocalTime - remoteTime) > 0.05) { // Times differ significantly
                    return remoteTime;
                }
                return currentLocalTime;
            }
        });

      } else {
        updateFirestoreSession({
          isPlaying: false,
          currentTime: 0,
        });
      }
    }, (error) => {
      console.error("Error listening to Firestore session:", error);
      toast({
        title: "Connection Error",
        description: "Could not connect to shared session. Real-time sync may be affected.",
        variant: "destructive",
      });
      setIsLoadingSession(false);
    });

    return () => {
      unsubscribe();
    };
  }, [isSyncEnabled, firebaseInitialized, updateFirestoreSession, toast, songData.totalDuration, isPlaying]);


  // Effect for local timer and periodic Firestore updates
  useEffect(() => {
    let localTimerIntervalId: NodeJS.Timeout | undefined = undefined;
    let firestoreUpdateIntervalId: NodeJS.Timeout | undefined = undefined;

    if (isPlaying) {
      localTimerIntervalId = setInterval(() => {
        setCurrentTime((prevTime) => {
          const nextTime = prevTime + 0.1;
          if (nextTime >= songData.totalDuration) {
            const thisClientWasPlaying = isPlayingRef.current; // Capture before setIsPlaying call
            setIsPlaying(false); // Stop local playback behavior, this will trigger cleanup of intervals via its own useEffect

            if (thisClientWasPlaying && isSyncEnabled && firebaseInitialized) {
              updateFirestoreSession({ isPlaying: false, currentTime: songData.totalDuration });
            }
            return songData.totalDuration; // Update React state to totalDuration
          }
          return nextTime;
        });
      }, 100);

      if (isSyncEnabled && firebaseInitialized) {
        firestoreUpdateIntervalId = setInterval(() => {
          if (isPlayingRef.current) { 
             setCurrentTime(latestCurrentTime => { 
                updateFirestoreSession({ currentTime: latestCurrentTime, isPlaying: true });
                return latestCurrentTime; 
             });
          }
        }, FIRESTORE_UPDATE_INTERVAL);
      }
    } else {
      if (localTimerIntervalId) clearInterval(localTimerIntervalId);
      if (firestoreUpdateIntervalId) clearInterval(firestoreUpdateIntervalId);
    }

    return () => {
      if (localTimerIntervalId) clearInterval(localTimerIntervalId);
      if (firestoreUpdateIntervalId) clearInterval(firestoreUpdateIntervalId);
    };
  }, [isPlaying, songData.totalDuration, updateFirestoreSession, isSyncEnabled, firebaseInitialized]);


  const handlePlayPause = useCallback(() => {
    const newIsPlayingState = !isPlayingRef.current; 
    let newCurrentTimeState = currentTime;

    if (newCurrentTimeState >= songData.totalDuration && newIsPlayingState) {
      newCurrentTimeState = 0; 
    }
    
    setIsPlaying(newIsPlayingState); 
    setCurrentTime(newCurrentTimeState); 

    if (isSyncEnabled && firebaseInitialized) {
        updateFirestoreSession({ isPlaying: newIsPlayingState, currentTime: newCurrentTimeState });
    }
  }, [currentTime, isSyncEnabled, firebaseInitialized, updateFirestoreSession, songData.totalDuration]);

  const handleReset = useCallback(() => {
    setIsPlaying(false); 
    setCurrentTime(0);   
    if (isSyncEnabled && firebaseInitialized) {
        updateFirestoreSession({ isPlaying: false, currentTime: 0 });
    }
  }, [isSyncEnabled, firebaseInitialized, updateFirestoreSession]);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const SyncToggle = () => (
    <div className="flex items-center space-x-2">
      <Switch
        id="sync-toggle"
        checked={isSyncEnabled}
        onCheckedChange={(checked) => {
          setIsSyncEnabled(checked);
          if (!checked) {
            toast({ title: "Sync Disabled", description: "Playback is now local." });
          } else if (!firebaseInitialized) {
             toast({ title: "Sync Failed", description: "Firebase not configured. Sync remains off.", variant: "destructive" });
             setIsSyncEnabled(false);
          } else {
             toast({ title: "Sync Enabled", description: "Attempting to connect to shared session." });
             setIsLoadingSession(true); 
          }
        }}
        disabled={!firebaseInitialized}
      />
      <Label htmlFor="sync-toggle" className="text-sm flex items-center gap-1">
        {isSyncEnabled && firebaseInitialized ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
        Real-time Sync
      </Label>
      {!firebaseInitialized && (
        <p className="text-xs text-destructive"> (Firebase not configured)</p>
      )}
    </div>
  );

  if (isSyncEnabled && isLoadingSession && firebaseInitialized) {
    return (
      <div className="container mx-auto p-4 flex flex-col justify-center items-center min-h-[400px] space-y-4">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-primary"></div>
          <p className="text-lg text-muted-foreground">Connecting to session...</p>
        </div>
        <SyncToggle />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <SongInfo title={songData.title} author={songData.author} />
            <div className="flex flex-col items-center md:items-end gap-2">
              <Metronome bpm={songData.bpm} isPlaying={isPlaying} />
              <SyncToggle />
            </div>
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
            currentSectionId={songData.sections.find(s => currentTime >= s.startTime && currentTime < s.endTime)?.id || null}
            currentTime={currentTime}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LyricsDisplay lyrics={songData.lyrics} currentTime={currentTime} chords={songData.chords} />
            <ChordsDisplay chords={songData.chords} currentTime={currentTime} songBpm={songData.bpm} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

  