
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { SongData, SessionState } from '@/lib/types';
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
const TIME_DRIFT_THRESHOLD = 0.5; // Seconds

export function SongDisplay() {
  const songData: SongData = sampleSong;
  const { toast } = useToast();

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const [isSyncEnabled, setIsSyncEnabled] = useState(true);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);

  // Ref to hold the current isPlaying state to avoid stale closures in onSnapshot
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (db) {
      setFirebaseInitialized(true);
      // console.log("Firebase is configured.");
      if (isSyncEnabled) setIsLoadingSession(true); 
    } else {
      // console.warn("Firebase (db object) is not available. Real-time sync will be disabled.");
      setFirebaseInitialized(false);
      setIsLoadingSession(false);
      if (isSyncEnabled) {
        // console.log("Firebase not configured, disabling sync automatically because it was enabled.");
        // setIsSyncEnabled(false); // Auto-disable if db is missing and sync was on - this can cause an infinite loop if not careful
      }
    }
  }, [isSyncEnabled]);


  const updateFirestoreSession = useCallback(async (newState: Partial<SessionState>) => {
    if (!isSyncEnabled || !db || !firebaseInitialized) {
      // console.log("Update Firestore skipped: Sync disabled or Firebase not ready.", { isSyncEnabled, dbExists: !!db, firebaseInitialized });
      return;
    }
    const sessionDocRef = doc(db, 'sessions', SESSION_ID);
    // console.log("Updating Firestore session:", newState);
    try {
      await setDoc(sessionDocRef, {
        ...newState,
        lastUpdated: serverTimestamp()
      }, { merge: true });
      // console.log("Firestore session updated successfully.");
    } catch (error) {
      console.error("Error updating Firestore session:", error);
      toast({
        title: "Sync Error",
        description: "Could not update shared session. Changes might not be synced.",
        variant: "destructive",
      });
    }
  }, [isSyncEnabled, firebaseInitialized, toast]); // db is stable, not needed as dep

  // Effect for Firestore listener
  useEffect(() => {
    if (!isSyncEnabled || !db || !firebaseInitialized) {
      setIsLoadingSession(false);
      // console.log("Firestore listener not attached: Sync disabled or Firebase not ready.");
      return;
    }

    // console.log("Attempting to attach Firestore listener...");
    setIsLoadingSession(true);
    const sessionDocRef = doc(db, 'sessions', SESSION_ID);

    const unsubscribe = onSnapshot(sessionDocRef, (snapshot) => {
      setIsLoadingSession(false);
      if (snapshot.metadata.hasPendingWrites) {
        // console.log("Firestore snapshot ignored (local echo with pending writes)");
        return; // Ignore local echoes
      }

      // console.log("Firestore snapshot received:", snapshot.id, snapshot.data());
      if (snapshot.exists()) {
        const remoteState = snapshot.data() as SessionState;
        // console.log("Processing remote state:", remoteState);

        const currentLocalIsPlaying = isPlayingRef.current;

        // Update isPlaying state based on remote
        if (currentLocalIsPlaying !== remoteState.isPlaying) {
          // console.log(`Sync: isPlaying changing from ${currentLocalIsPlaying} to ${remoteState.isPlaying}`);
          setIsPlaying(remoteState.isPlaying);
        }

        // Update currentTime based on remote
        setCurrentTime(currentLocalTime => {
          const timeDifference = Math.abs(remoteState.currentTime - currentLocalTime);

          // Sync time if:
          // 1. Playback state has changed locally due to this remote update (e.g., remote started/stopped playing)
          // 2. Or, if both are supposed to be playing and time has drifted significantly
          // 3. Or, if remote is paused, and we are not, sync to their paused time (covered by #1)
          // 4. Or, if both are paused but times differ (e.g. one scrubbed while paused - not yet a feature but for robustness)
          if (currentLocalIsPlaying !== remoteState.isPlaying ||
              (remoteState.isPlaying && currentLocalIsPlaying && timeDifference > TIME_DRIFT_THRESHOLD) ||
              (!remoteState.isPlaying && !currentLocalIsPlaying && currentLocalTime !== remoteState.currentTime) // Sync if both paused and times differ
          ) {
            // console.log(`Sync: currentTime changing from ${currentLocalTime.toFixed(1)} to ${remoteState.currentTime.toFixed(1)}. Reason: playstate change (${currentLocalIsPlaying !== remoteState.isPlaying}), drift (${timeDifference > TIME_DRIFT_THRESHOLD}), both paused time diff (${!remoteState.isPlaying && !currentLocalIsPlaying && currentLocalTime !== remoteState.currentTime})`);
            return remoteState.currentTime;
          }
          // console.log(`Sync: currentTime not changed. Local: ${currentLocalTime.toFixed(1)}, Remote: ${remoteState.currentTime.toFixed(1)}. Drift: ${timeDifference.toFixed(1)}`);
          return currentLocalTime;
        });

      } else {
        // console.log("Session document doesn't exist, initializing with defaults...");
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
      // console.log("Unsubscribing from Firestore session");
      unsubscribe();
    };
  }, [isSyncEnabled, firebaseInitialized, updateFirestoreSession, toast]); // Removed isPlaying, using isPlayingRef.current inside.

  // Effect for local timer (advances currentTime when isPlaying)
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined = undefined;
    if (isPlaying) {
      // console.log("Local timer starting / continuing because isPlaying is true.");
      intervalId = setInterval(() => {
        setCurrentTime((prevTime) => {
          const nextTime = prevTime + 0.1;
          if (nextTime >= songData.totalDuration) {
            // console.log("Song ended locally. Stopping playback.");
            setIsPlaying(false); // Stop playback locally
            updateFirestoreSession({ isPlaying: false, currentTime: songData.totalDuration });
            return songData.totalDuration;
          }
          // console.log(`Local timer tick: ${nextTime.toFixed(1)}s`);
          return nextTime;
        });
      }, 100);
    } else {
      // console.log("Local timer stopping / paused because isPlaying is false.");
      if (intervalId) clearInterval(intervalId);
    }
    return () => {
      if (intervalId) {
        // console.log("Clearing local timer interval on cleanup.");
        clearInterval(intervalId);
      }
    };
  }, [isPlaying, songData.totalDuration, updateFirestoreSession]);


  const handlePlayPause = useCallback(() => {
    const newIsPlayingState = !isPlayingRef.current; // Use ref for current value
    let newCurrentTimeState = currentTime;

    if (newCurrentTimeState >= songData.totalDuration && newIsPlayingState) {
      newCurrentTimeState = 0; // Reset if at end and play is clicked
    }
    
    // console.log(`handlePlayPause: newIsPlayingState=${newIsPlayingState}, newCurrentTimeState=${newCurrentTimeState.toFixed(1)}`);

    // Set local state immediately for responsiveness
    setIsPlaying(newIsPlayingState); 
    setCurrentTime(newCurrentTimeState);

    if (isSyncEnabled && firebaseInitialized) {
        updateFirestoreSession({ isPlaying: newIsPlayingState, currentTime: newCurrentTimeState });
    }
  }, [currentTime, isSyncEnabled, firebaseInitialized, updateFirestoreSession, songData.totalDuration]); // isPlayingRef is not a state/prop, so not needed here. currentTime is.

  const handleReset = useCallback(() => {
    // console.log("handleReset called.");
    setIsPlaying(false);
    setCurrentTime(0);
    if (isSyncEnabled && firebaseInitialized) {
        updateFirestoreSession({ isPlaying: false, currentTime: 0 });
    }
  }, [isSyncEnabled, firebaseInitialized, updateFirestoreSession]);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const tenths = Math.floor((timeInSeconds * 10) % 10); // For debugging if needed
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    // return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`; // Debug with tenths
  };

  const SyncToggle = () => (
    <div className="flex items-center space-x-2">
      <Switch
        id="sync-toggle"
        checked={isSyncEnabled}
        onCheckedChange={(checked) => {
          // console.log(`Sync toggle changed to: ${checked}`);
          setIsSyncEnabled(checked);
          if (!checked) {
            toast({ title: "Sync Disabled", description: "Playback is now local." });
          } else if (!firebaseInitialized) {
             toast({ title: "Sync Failed", description: "Firebase not configured. Sync remains off.", variant: "destructive" });
             setIsSyncEnabled(false); // Force off if Firebase isn't there
          } else {
             toast({ title: "Sync Enabled", description: "Attempting to connect to shared session." });
             setIsLoadingSession(true); // Show loading when re-enabling
          }
        }}
        disabled={!firebaseInitialized && isSyncEnabled} // Disable toggle if firebase not init but user wants to turn on
      />
      <Label htmlFor="sync-toggle" className="text-sm flex items-center gap-1">
        {isSyncEnabled ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
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
        <p className="text-lg text-muted-foreground">Connecting to session...</p>
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
            <LyricsDisplay lyrics={songData.lyrics} currentTime={currentTime} />
            <ChordsDisplay chords={songData.chords} currentTime={currentTime} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


    