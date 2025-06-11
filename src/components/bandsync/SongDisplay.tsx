
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { SongData, SessionState, ChordChange, LyricWord, SongSection, SongDisplayInfo, Artist, SongEntry } from '@/lib/types';
import { sampleSong, ARTISTS, SONGS } from '@/lib/song-data'; // Import new catalog
import { SongInfo } from './SongInfo';
import { Metronome } from './Metronome';
import { SectionProgressBar } from './SectionProgressBar';
import { LyricsDisplay } from './LyricsDisplay';
import { ChordsDisplay } from './ChordsDisplay';
import { SongSelection } from './SongSelection'; // Import new component
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Play, Pause, SkipBack, Settings2, Wifi, WifiOff } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";

const SESSION_ID_BASE = 'global-bandsync-session'; // Base for session ID
const TIME_DRIFT_THRESHOLD = 1.0;
const FIRESTORE_UPDATE_INTERVAL = 2000;

export function SongDisplay() {
  const { toast } = useToast();

  // Playable song content - currently fixed to sampleSong (WMGGW)
  const [playableSongData, setPlayableSongData] = useState<SongData>(sampleSong);

  // Displayed song metadata - updated by selectors
  const [currentDisplaySongInfo, setCurrentDisplaySongInfo] = useState<SongDisplayInfo>({
    id: sampleSong.id,
    title: sampleSong.title,
    author: sampleSong.author,
    key: sampleSong.key,
    bpm: sampleSong.bpm,
  });

  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(ARTISTS[0]?.id || null);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(sampleSong.id);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSyncEnabled, setIsSyncEnabled] = useState(true);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);

  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Construct current session ID based on selected song (though still global for now)
  // For true per-song sessions, this would need to trigger Firestore listener resubscription.
  // For now, changing song just resets time/play for the GLOBAL session.
  const currentSessionId = SESSION_ID_BASE; // `${SESSION_ID_BASE}-${currentDisplaySongInfo.id || 'default'}`;


  useEffect(() => {
    if (db) {
      setFirebaseInitialized(true);
      if (isSyncEnabled) setIsLoadingSession(true); else setIsLoadingSession(false);
    } else {
      setFirebaseInitialized(false);
      setIsLoadingSession(false);
    }
  }, [isSyncEnabled, db]);

  const updateFirestoreSession = useCallback(async (newState: Partial<SessionState>) => {
    if (!isSyncEnabled || !db || !firebaseInitialized) return;
    const sessionDocRef = doc(db, 'sessions', currentSessionId);
    try {
      await setDoc(sessionDocRef, { ...newState, lastUpdated: serverTimestamp() }, { merge: true });
    } catch (error) {
      console.error("Error updating Firestore session:", error);
      toast({ title: "Sync Error", description: "Could not update shared session.", variant: "destructive" });
    }
  }, [isSyncEnabled, db, firebaseInitialized, toast, currentSessionId]);

  useEffect(() => {
    if (!isSyncEnabled || !db || !firebaseInitialized) {
      setIsLoadingSession(false);
      return;
    }
    setIsLoadingSession(true);
    const sessionDocRef = doc(db, 'sessions', currentSessionId);
    const unsubscribe = onSnapshot(sessionDocRef, (snapshot) => {
      setIsLoadingSession(false);
      if (snapshot.metadata.hasPendingWrites) return;
      if (snapshot.exists()) {
        const remoteState = snapshot.data() as SessionState;
        setCurrentTime(currentLocalTime => {
          const remoteIsPlaying = remoteState.isPlaying;
          const remoteTime = remoteState.currentTime;
          const localWantsToPlay = isPlayingRef.current;

          if (!localWantsToPlay && currentLocalTime >= playableSongData.totalDuration) {
            if (remoteIsPlaying && remoteTime < playableSongData.totalDuration) {
              if (isPlaying) setIsPlaying(false);
              return playableSongData.totalDuration;
            }
            if (!remoteIsPlaying && remoteTime < playableSongData.totalDuration && remoteTime > 0.1) {
              return playableSongData.totalDuration;
            }
          }
          if (localWantsToPlay !== remoteIsPlaying) {
            setIsPlaying(remoteIsPlaying);
            return remoteTime;
          }
          if (localWantsToPlay) {
            const timeDifference = remoteTime - currentLocalTime;
            if (timeDifference > TIME_DRIFT_THRESHOLD) return remoteTime;
            return currentLocalTime;
          } else {
            if (Math.abs(currentLocalTime - remoteTime) > 0.05) return remoteTime;
            return currentLocalTime;
          }
        });
      } else {
        updateFirestoreSession({ isPlaying: false, currentTime: 0 });
      }
    }, (error) => {
      console.error("Error listening to Firestore session:", error);
      toast({ title: "Connection Error", description: "Could not connect to shared session.", variant: "destructive" });
      setIsLoadingSession(false);
    });
    return () => unsubscribe();
  }, [isSyncEnabled, db, firebaseInitialized, updateFirestoreSession, toast, playableSongData.totalDuration, isPlaying, currentSessionId]);

  useEffect(() => {
    let localTimerIntervalId: NodeJS.Timeout | undefined = undefined;
    let firestoreUpdateIntervalId: NodeJS.Timeout | undefined = undefined;
    if (isPlaying) {
      localTimerIntervalId = setInterval(() => {
        setCurrentTime((prevTime) => {
          const nextTime = prevTime + 0.1;
          if (nextTime >= playableSongData.totalDuration) {
            const thisClientWasPlaying = isPlayingRef.current;
            setIsPlaying(false);
            if (thisClientWasPlaying && isSyncEnabled && firebaseInitialized) {
              updateFirestoreSession({ isPlaying: false, currentTime: playableSongData.totalDuration });
            }
            return playableSongData.totalDuration;
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
  }, [isPlaying, playableSongData.totalDuration, updateFirestoreSession, isSyncEnabled, firebaseInitialized]);

  const handlePlayPause = useCallback(() => {
    const newIsPlayingState = !isPlayingRef.current;
    let newCurrentTimeState = currentTime;
    if (newCurrentTimeState >= playableSongData.totalDuration && newIsPlayingState) {
      newCurrentTimeState = 0;
    }
    setIsPlaying(newIsPlayingState);
    setCurrentTime(newCurrentTimeState);
    if (isSyncEnabled && firebaseInitialized) {
      updateFirestoreSession({ isPlaying: newIsPlayingState, currentTime: newCurrentTimeState });
    }
  }, [currentTime, isSyncEnabled, firebaseInitialized, updateFirestoreSession, playableSongData.totalDuration]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (isSyncEnabled && firebaseInitialized) {
      updateFirestoreSession({ isPlaying: false, currentTime: 0 });
    }
  }, [isSyncEnabled, firebaseInitialized, updateFirestoreSession]);

  const handleSectionSelect = useCallback((newTime: number) => {
    setCurrentTime(newTime);
    if (isSyncEnabled && firebaseInitialized) {
      updateFirestoreSession({ currentTime: newTime, isPlaying: isPlayingRef.current });
    }
  }, [isSyncEnabled, firebaseInitialized, updateFirestoreSession]);

  const handleArtistSelection = (artistId: string) => {
    setSelectedArtistId(artistId);
    setSelectedSongId(null); // Clear song selection when artist changes
    // Optionally, select the first song of the new artist automatically
    const firstSongOfArtist = SONGS.find(song => song.artistId === artistId);
    if (firstSongOfArtist) {
        handleSongSelection(firstSongOfArtist.id);
    } else {
        // Reset display info if no songs for artist (should not happen with current data)
        setCurrentDisplaySongInfo({
            id: 'none', title: 'No song selected', author: '', bpm: 120, key: ''
        });
        handleReset(); // Reset playback
    }
  };

  const handleSongSelection = (songId: string) => {
    setSelectedSongId(songId);
    const newSelectedSongInfo = SONGS.find(s => s.id === songId);
    if (newSelectedSongInfo) {
      setCurrentDisplaySongInfo({
        id: newSelectedSongInfo.id,
        title: newSelectedSongInfo.title,
        author: newSelectedSongInfo.artistName,
        key: newSelectedSongInfo.key,
        bpm: newSelectedSongInfo.bpm,
      });
      // For now, playableSongData remains sampleSong (WMGGW).
      // If newSelectedSongInfo.id === sampleSong.id, setPlayableSongData(sampleSong);
      // else, we'd load its full data. Here, we just reset.
      handleReset();
    }
  };
  
  // Auto-select first artist and song on initial load
  useEffect(() => {
    if (ARTISTS.length > 0 && !selectedArtistId) {
        const initialArtistId = ARTISTS[0].id;
        setSelectedArtistId(initialArtistId);
        const initialSong = SONGS.find(s => s.artistId === initialArtistId && s.id === sampleSong.id) || SONGS.find(s => s.artistId === initialArtistId);
        if (initialSong) {
            setSelectedSongId(initialSong.id);
            setCurrentDisplaySongInfo({
                id: initialSong.id,
                title: initialSong.title,
                author: initialSong.artistName,
                key: initialSong.key,
                bpm: initialSong.bpm,
            });
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount


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
          if (!checked) toast({ title: "Sync Disabled", description: "Playback is now local." });
          else if (!firebaseInitialized || !db) {
            toast({ title: "Sync Failed", description: "Firebase not configured. Sync remains off.", variant: "destructive" });
            setIsSyncEnabled(false);
          } else {
            toast({ title: "Sync Enabled", description: "Attempting to connect to shared session." });
            setIsLoadingSession(true);
          }
        }}
        disabled={!firebaseInitialized && !db}
      />
      <Label htmlFor="sync-toggle" className="text-sm flex items-center gap-1">
        {isSyncEnabled && firebaseInitialized && db ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
        Real-time Sync
      </Label>
      {(!firebaseInitialized || !db) && (<p className="text-xs text-destructive"> (Firebase not configured)</p>)}
    </div>
  );

  const activeSongChord = useMemo(() => {
    return playableSongData.chords.find(c => currentTime >= c.startTime && currentTime < c.endTime);
  }, [currentTime, playableSongData.chords]);

  const activeLyricWordInfo = useMemo(() => {
    if (!playableSongData.lyrics || !playableSongData.sections) return null;
    for (const section of playableSongData.sections) {
      const lyricLinesInSection = playableSongData.lyrics.filter(line => {
        if (line.length === 0) return false;
        const firstWordTime = line[0].startTime;
        return firstWordTime >= section.startTime && firstWordTime < section.endTime;
      });
      for (let lineIndex = 0; lineIndex < lyricLinesInSection.length; lineIndex++) {
        const line = lyricLinesInSection[lineIndex];
        for (const word of line) {
          if (currentTime >= word.startTime && currentTime < word.endTime) {
            return { word, sectionId: section.id, lineIndexWithinSection: lineIndex };
          }
        }
      }
    }
    return null;
  }, [currentTime, playableSongData.lyrics, playableSongData.sections]);

  const currentSectionId = useMemo(() => {
    if (activeLyricWordInfo?.sectionId) return activeLyricWordInfo.sectionId;
    if (activeSongChord) {
      const sectionForChord = playableSongData.sections.find(s => activeSongChord.startTime >= s.startTime && activeSongChord.startTime < s.endTime);
      if (sectionForChord) return sectionForChord.id;
    }
    return playableSongData.sections.find(s => currentTime >= s.startTime && currentTime < s.endTime)?.id || null;
  }, [currentTime, playableSongData.sections, activeLyricWordInfo, activeSongChord]);

  if (isSyncEnabled && isLoadingSession && firebaseInitialized && db) {
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
    <div className="container mx-auto p-4 space-y-2">
      <Card className="shadow-xl">
        <SongSelection
          artists={ARTISTS}
          allSongs={SONGS}
          selectedArtistId={selectedArtistId}
          onArtistChange={handleArtistSelection}
          selectedSongId={selectedSongId}
          onSongChange={handleSongSelection}
        />
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <SongInfo
              title={currentDisplaySongInfo.title}
              author={currentDisplaySongInfo.author}
              songKey={currentDisplaySongInfo.key}
            />
            <div className="flex flex-col items-center md:items-end gap-2">
              <Metronome bpm={currentDisplaySongInfo.bpm} isPlaying={isPlaying} />
              <SyncToggle />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
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
              {formatTime(currentTime)} / {formatTime(playableSongData.totalDuration)}
            </div>
            <Button variant="ghost" size="icon" aria-label="Settings (placeholder)">
              <Settings2 className="w-5 h-5 text-primary" />
            </Button>
          </div>
          <SectionProgressBar
            sections={playableSongData.sections}
            currentSectionId={currentSectionId}
            currentTime={currentTime}
            onSectionSelect={handleSectionSelect}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <LyricsDisplay
              lyrics={playableSongData.lyrics}
              chords={playableSongData.chords}
              sections={playableSongData.sections}
              currentTime={currentTime}
              activeSongChord={activeSongChord}
              activeLyricWordInfo={activeLyricWordInfo}
              currentSectionId={currentSectionId}
            />
            <ChordsDisplay chords={playableSongData.chords} currentTime={currentTime} songBpm={currentDisplaySongInfo.bpm} />
          </div>
        </CardContent>
      </Card>
      {currentDisplaySongInfo.id !== playableSongData.id && (
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-700 rounded-md text-sm text-center">
          Note: Full song data (lyrics, chords, precise sections) for "{currentDisplaySongInfo.title}" is not yet loaded. 
          Playback currently uses the content of "While My Guitar Gently Weeps".
        </div>
      )}
    </div>
  );
}
