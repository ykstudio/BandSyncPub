
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
const TIME_DRIFT_THRESHOLD = 1.0; // Seconds. Increased slightly.
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
      // console.log("Firebase is configured.");
      if (isSyncEnabled) setIsLoadingSession(true);
    } else {
      // console.warn("Firebase (db object) is not available. Real-time sync will be disabled.");
      setFirebaseInitialized(false);
      setIsLoadingSession(false);
      if (isSyncEnabled) {
        // console.log("Firebase not configured, disabling sync automatically because it was enabled.");
        // setIsSyncEnabled(false); // Auto-disable if db is missing and sync was on
      }
    }
  }, [isSyncEnabled]);


  const updateFirestoreSession = useCallback(async (newState: Partial<SessionState>) => {
    if (!isSyncEnabled || !db || !firebaseInitialized) {
      // console.log("Update Firestore skipped: Sync disabled or Firebase not ready.", { isSyncEnabled, dbExists: !!db, firebaseInitialized });
      return;
    }
    const sessionDocRef = doc(db, 'sessions', SESSION_ID);
    // console.log("Updating Firestore session with:", newState);
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
  }, [isSyncEnabled, firebaseInitialized, toast]);

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

        // Update isPlaying state based on remote FIRST
        if (isPlayingRef.current !== remoteState.isPlaying) {
          // console.log(`Sync: isPlaying changing from ${isPlayingRef.current} to ${remoteState.isPlaying} due to remote`);
          setIsPlaying(remoteState.isPlaying);
        }

        // Update currentTime based on remote
        setCurrentTime(currentLocalTime => {
          const remoteTime = remoteState.currentTime;
          const remoteIsPlayingVal = remoteState.isPlaying;
          const localIsPlayingVal = isPlayingRef.current; // This reflects state *before* setIsPlaying took effect from this snapshot

          // If our playback state *was* different from remote, adopt remote time.
          // This handles scenarios where one client plays/pauses, and others follow.
          if (localIsPlayingVal !== remoteIsPlayingVal) {
            // console.log(`Sync: Playback state mismatch (local was ${localIsPlayingVal}, remote is ${remoteIsPlayingVal}). Adopting remote time ${remoteTime.toFixed(1)}`);
            return remoteTime;
          }

          // If playback states are the same:
          if (remoteIsPlayingVal) { // Both are (or should be) playing
            const timeDifference = Math.abs(remoteTime - currentLocalTime);
            if (timeDifference > TIME_DRIFT_THRESHOLD) {
              // console.log(`Sync: Both playing, drift detected. Setting local time from ${currentLocalTime.toFixed(1)} to ${remoteTime.toFixed(1)}. Drift: ${timeDifference.toFixed(1)}`);
              return remoteTime;
            }
          } else { // Both are (or should be) paused
            if (currentLocalTime !== remoteTime) { // Sync if times differ (e.g. remote scrubbed while paused)
              // console.log(`Sync: Both paused, times differ. Setting local time from ${currentLocalTime.toFixed(1)} to ${remoteTime.toFixed(1)}`);
              return remoteTime;
            }
          }
          // console.log(`Sync: currentTime not changed. Local: ${currentLocalTime.toFixed(1)}, Remote: ${remoteTime.toFixed(1)}. LocalPlaying: ${localIsPlayingVal}, RemotePlaying: ${remoteIsPlayingVal}`);
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
  }, [isSyncEnabled, firebaseInitialized, updateFirestoreSession, toast]);


  // Effect for local timer and periodic Firestore updates
  useEffect(() => {
    let localTimerIntervalId: NodeJS.Timeout | undefined = undefined;
    let firestoreUpdateIntervalId: NodeJS.Timeout | undefined = undefined;

    if (isPlaying) {
      // console.log("Local timer starting.");
      localTimerIntervalId = setInterval(() => {
        setCurrentTime((prevTime) => {
          const nextTime = prevTime + 0.1;
          if (nextTime >= songData.totalDuration) {
            // console.log("Song ended locally. Stopping playback.");
            setIsPlaying(false); // Stop playback locally
            updateFirestoreSession({ isPlaying: false, currentTime: songData.totalDuration });
            return songData.totalDuration;
          }
          return nextTime;
        });
      }, 100);

      // If sync is enabled, periodically update Firestore with current time
      if (isSyncEnabled && firebaseInitialized) {
        // console.log("Starting periodic Firestore updates.");
        firestoreUpdateIntervalId = setInterval(() => {
          // We need to get the latest currentTime for the update, as it's changed by localTimerIntervalId
          // This ensures that updateFirestoreSession is called with the most recent local time.
          // Directly passing currentTime from the outer scope would pass a stale value.
          setCurrentTime(latestCurrentTime => {
            if (isPlayingRef.current) { // Only update if still supposed to be playing
              // console.log(`Periodic Firestore Update: currentTime=${latestCurrentTime.toFixed(1)}, isPlaying=true`);
              updateFirestoreSession({ currentTime: latestCurrentTime, isPlaying: true });
            }
            return latestCurrentTime; // This setter doesn't change the time, just reads it
          });
        }, FIRESTORE_UPDATE_INTERVAL);
      }
    } else {
      // console.log("Local timer stopped or paused.");
      if (localTimerIntervalId) clearInterval(localTimerIntervalId);
      if (firestoreUpdateIntervalId) {
        // console.log("Stopping periodic Firestore updates.");
        clearInterval(firestoreUpdateIntervalId);
      }
    }

    return () => {
      if (localTimerIntervalId) clearInterval(localTimerIntervalId);
      if (firestoreUpdateIntervalId) clearInterval(firestoreUpdateIntervalId);
      // console.log("Cleaned up timers.");
    };
  }, [isPlaying, songData.totalDuration, updateFirestoreSession, isSyncEnabled, firebaseInitialized]);


  const handlePlayPause = useCallback(() => {
    const newIsPlayingState = !isPlayingRef.current;
    let newCurrentTimeState = currentTime;

    if (newCurrentTimeState >= songData.totalDuration && newIsPlayingState) {
      newCurrentTimeState = 0; // Reset if at end and play is clicked
    }
    
    // console.log(`handlePlayPause: newIsPlayingState=${newIsPlayingState}, newCurrentTimeState=${newCurrentTimeState.toFixed(1)}`);

    setIsPlaying(newIsPlayingState); 
    setCurrentTime(newCurrentTimeState);

    if (isSyncEnabled && firebaseInitialized) {
        updateFirestoreSession({ isPlaying: newIsPlayingState, currentTime: newCurrentTimeState });
    }
  }, [currentTime, isSyncEnabled, firebaseInitialized, updateFirestoreSession, songData.totalDuration]);

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
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
             setIsSyncEnabled(false);
          } else {
             toast({ title: "Sync Enabled", description: "Attempting to connect to shared session." });
             setIsLoadingSession(true);
          }
        }}
        disabled={!firebaseInitialized && isSyncEnabled}
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
