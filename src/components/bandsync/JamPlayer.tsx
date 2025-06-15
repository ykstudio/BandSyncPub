
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { SongData, SessionState, ChordChange, LyricWord, SongSection, SongDisplayInfo, JamSession, SongEntry } from '@/lib/types';
import { FULL_SONG_DATA, placeholderPlayableSongData } from '@/lib/song-data';
import { SongInfo } from './SongInfo';
import { Metronome } from './Metronome';
import { SectionProgressBar } from './SectionProgressBar';
import { LyricsDisplay } from './LyricsDisplay';
import { ChordsDisplay } from './ChordsDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import {
  Play, Pause, SkipBack, SkipForward, ListMusic, Wifi, WifiOff,
  AlertTriangle, Loader2, RefreshCw,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { cn } from '@/lib/utils';

const FIRESTORE_UPDATE_INTERVAL = 2000; // Milliseconds
const SESSION_ID_PREFIX = 'global-bandsync-session-jam-';
const LYRIC_ACTIVE_BUFFER_MS = 0.1; // 100ms buffer
const TIME_DRIFT_TOLERANCE_PLAYING = 0.15; // seconds


interface JamPlayerProps {
  jamId: string;
  fallback?: React.ReactNode;
}

export function JamPlayer({ jamId, fallback }: JamPlayerProps) {
  const { toast } = useToast();

  const [jamSession, setJamSession] = useState<JamSession | null>(null);
  const [playlist, setPlaylist] = useState<SongEntry[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  
  const [playableSongData, setPlayableSongData] = useState<SongData>(placeholderPlayableSongData); 
  const [currentDisplaySongInfo, setCurrentDisplaySongInfo] = useState<SongDisplayInfo>(placeholderPlayableSongData);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSyncEnabled, setIsSyncEnabled] = useState(true);
  const [isLoadingJamData, setIsLoadingJamData] = useState(true);
  const [isLoadingSessionState, setIsLoadingSessionState] = useState(true);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPlayingRef = useRef(isPlaying);
  const currentSongIndexRef = useRef(currentSongIndex);
  const localUpdateInProgressRef = useRef(false); 
  const latestCurrentTimeRef = useRef(currentTime); 

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { currentSongIndexRef.current = currentSongIndex; }, [currentSongIndex]);
  useEffect(() => { latestCurrentTimeRef.current = currentTime; }, [currentTime]);


  const currentSessionId = `${SESSION_ID_PREFIX}${jamId}`;

  useEffect(() => {
    setIsLoadingJamData(true);
    setError(null);
    if (!db || !jamId) {
      setError(!db ? "Firebase not configured." : "Jam ID is missing.");
      setIsLoadingJamData(false);
      return;
    }

    const jamDocRef = doc(db, 'jams', jamId);
    getDoc(jamDocRef).then(docSnap => {
      if (docSnap.exists()) {
        const jamData = docSnap.data() as Omit<JamSession, 'id'>;
        setJamSession({ id: docSnap.id, ...jamData });
        
        const jamPlaylist: SongEntry[] = jamData.songIds
          .map(songId => {
            const songMeta = FULL_SONG_DATA[songId]; 
            if (songMeta) {
              return { 
                id: songMeta.id,
                title: songMeta.title,
                artistId: "", 
                artistName: songMeta.author,
                key: songMeta.key,
                bpm: songMeta.bpm,
              };
            }
            const fallbackEntry = placeholderPlayableSongData;
            return {
                id: songId, 
                title: "Unknown Song",
                artistId: "",
                artistName: "Unknown Artist",
                key: fallbackEntry.key,
                bpm: fallbackEntry.bpm,
            };
          })
          .filter(Boolean) as SongEntry[];
        
        setPlaylist(jamPlaylist);
        if (jamPlaylist.length === 0) {
          setError("This Jam has no songs.");
        }
      } else {
        setError("Jam Session not found.");
      }
    }).catch(err => {
      console.error("Error fetching Jam:", err);
      setError("Could not load Jam Session data.");
    }).finally(() => {
        // setIsLoadingJamData(false) handled by Firestore listener or sync off
    });
  }, [jamId]);

  useEffect(() => {
    if (playlist.length > 0 && currentSongIndex >= 0 && currentSongIndex < playlist.length) {
      const currentSongEntry = playlist[currentSongIndex];
      const songDataForPlayback = FULL_SONG_DATA[currentSongEntry.id] || {
        ...placeholderPlayableSongData, 
        id: currentSongEntry.id,
        title: currentSongEntry.title,
        author: currentSongEntry.artistName,
        bpm: currentSongEntry.bpm,
        key: currentSongEntry.key,
      };
      
      setPlayableSongData(songDataForPlayback);
      setCurrentDisplaySongInfo({
        id: songDataForPlayback.id,
        title: songDataForPlayback.title,
        author: songDataForPlayback.author,
        key: songDataForPlayback.key,
        bpm: songDataForPlayback.bpm,
      });

    } else if (playlist.length === 0 && jamSession) { 
      const defaultEmptySong = placeholderPlayableSongData;
      setCurrentDisplaySongInfo({id: 'empty', title: 'No songs in Jam', author:'', bpm: defaultEmptySong.bpm, key: defaultEmptySong.key});
      setPlayableSongData(defaultEmptySong);
    }
  }, [currentSongIndex, playlist, jamSession]);


  useEffect(() => {
    if (db) setFirebaseInitialized(true);
    setIsLoadingSessionState(isSyncEnabled && db);
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
    let localTimerIntervalId: NodeJS.Timeout | undefined = undefined;

    if (isPlayingRef.current && playlist.length > 0 && playableSongData.totalDuration > 0) {
      localTimerIntervalId = setInterval(() => {
        if (localUpdateInProgressRef.current) return; 

        setCurrentTime((prevTime) => {
          const nextTime = prevTime + 0.1; 
          if (nextTime >= playableSongData.totalDuration) {
            setIsPlaying(false); 
            const nextSongIndex = currentSongIndexRef.current + 1;
            if (nextSongIndex < playlist.length) { 
              localUpdateInProgressRef.current = true;
              setCurrentSongIndex(nextSongIndex);
              setCurrentTime(0);
              setIsPlaying(true); 
              if (isSyncEnabled && firebaseInitialized) {
                updateFirestoreSession({ isPlaying: true, currentTime: 0, currentSongIndexInJam: nextSongIndex })
                  .finally(() => { localUpdateInProgressRef.current = false; });
              } else {
                localUpdateInProgressRef.current = false;
              }
              return 0; 
            } else { 
              if (isSyncEnabled && firebaseInitialized) {
                localUpdateInProgressRef.current = true;
                updateFirestoreSession({ isPlaying: false, currentTime: playableSongData.totalDuration, currentSongIndexInJam: currentSongIndexRef.current })
                  .finally(() => { localUpdateInProgressRef.current = false; });
              } else {
                localUpdateInProgressRef.current = false;
              }
              return playableSongData.totalDuration; 
            }
          }
          return nextTime; 
        });
      }, 100);
    }
    return () => {
      if (localTimerIntervalId) clearInterval(localTimerIntervalId);
    };
  }, [isPlaying, playableSongData.totalDuration, isSyncEnabled, firebaseInitialized, playlist, updateFirestoreSession]);

  useEffect(() => {
    let firestoreUpdateIntervalId: NodeJS.Timeout | undefined = undefined;
    if (isPlayingRef.current && isSyncEnabled && firebaseInitialized && playlist.length > 0) {
      firestoreUpdateIntervalId = setInterval(() => {
        if (!localUpdateInProgressRef.current) { 
          localUpdateInProgressRef.current = true; 
          updateFirestoreSession({ 
            currentTime: latestCurrentTimeRef.current, 
            isPlaying: true, 
            currentSongIndexInJam: currentSongIndexRef.current 
          }).finally(() => {
            localUpdateInProgressRef.current = false; 
          });
        }
      }, FIRESTORE_UPDATE_INTERVAL);
    }
    return () => {
      if (firestoreUpdateIntervalId) clearInterval(firestoreUpdateIntervalId);
    };
  }, [isPlaying, isSyncEnabled, firebaseInitialized, playlist.length, updateFirestoreSession]);


  useEffect(() => {
    if (!isSyncEnabled || !db || !firebaseInitialized || !jamSession) {
      setIsLoadingSessionState(false);
      setIsLoadingJamData(false); 
      if (jamSession && playlist.length > 0) setIsLoadingJamData(false); 
      return;
    }
    
    setIsLoadingSessionState(true); 
    if (!jamSession) setIsLoadingJamData(true); 

    const sessionDocRef = doc(db, 'sessions', currentSessionId);
    const unsubscribe = onSnapshot(sessionDocRef, (snapshot) => {
      setIsLoadingSessionState(false); 
      if (!jamSession && snapshot.exists()) { 
          setIsLoadingJamData(false);
      } else if (jamSession) {
          setIsLoadingJamData(false); 
      }

      if (snapshot.metadata.hasPendingWrites || localUpdateInProgressRef.current) {
        return;
      }

      if (snapshot.exists()) {
        const remoteState = snapshot.data() as SessionState;
        
        localUpdateInProgressRef.current = true;

        const remoteSongIndex = remoteState.currentSongIndexInJam;
        const remoteIsPlaying = remoteState.isPlaying;
        const remoteCurrentTime = remoteState.currentTime;

        const localSongIndex = currentSongIndexRef.current;
        const localIsPlaying = isPlayingRef.current;
        const localCurrentTime = latestCurrentTimeRef.current;

        if (remoteSongIndex !== undefined && remoteSongIndex !== localSongIndex &&
            playlist.length > 0 && remoteSongIndex < playlist.length) {
            setCurrentSongIndex(remoteSongIndex);
            setCurrentTime(remoteCurrentTime); 
            setIsPlaying(remoteIsPlaying);
        }
        else if (remoteIsPlaying !== localIsPlaying) {
            setIsPlaying(remoteIsPlaying);
            // Only set time if it's a state change to playing (to get latest time)
            // or if becoming paused (to sync final position)
            if (remoteIsPlaying || !localIsPlaying) {
                setCurrentTime(remoteCurrentTime);
            }
        }
        else { // Song and IsPlaying state are the same
            if (remoteIsPlaying) { // Both are playing
                 if (remoteCurrentTime > localCurrentTime && (remoteCurrentTime - localCurrentTime > TIME_DRIFT_TOLERANCE_PLAYING)) {
                    setCurrentTime(remoteCurrentTime);
                }
                 // Do NOT go backwards if remote time is less than local time while playing
            } else { // Both are paused
                if (Math.abs(localCurrentTime - remoteCurrentTime) > 0.05) { 
                    setCurrentTime(remoteCurrentTime);
                }
            }
        }
        localUpdateInProgressRef.current = false; 
      } else {
        localUpdateInProgressRef.current = true;
        updateFirestoreSession({
            isPlaying: isPlayingRef.current, 
            currentTime: latestCurrentTimeRef.current,
            currentSongIndexInJam: currentSongIndexRef.current
        }).finally(() => {
            localUpdateInProgressRef.current = false;
        });
      }
    }, (err) => {
      console.error("Error listening to Firestore session:", err);
      toast({ title: "Connection Error", description: "Could not connect to shared Jam session.", variant: "destructive" });
      setIsLoadingSessionState(false);
      setIsLoadingJamData(false);
      localUpdateInProgressRef.current = false;
    });
    return () => {
      unsubscribe();
      localUpdateInProgressRef.current = false; 
    }
  }, [isSyncEnabled, db, firebaseInitialized, updateFirestoreSession, toast, currentSessionId, jamSession, playlist.length]);


  const handlePlayPause = useCallback(async () => {
    if (playlist.length === 0 || playableSongData.totalDuration === 0) return;
    
    localUpdateInProgressRef.current = true;
    const newIsPlayingState = !isPlayingRef.current;
    let newCurrentTimeState = latestCurrentTimeRef.current;

    if (newCurrentTimeState >= playableSongData.totalDuration && newIsPlayingState) {
      newCurrentTimeState = 0; 
    }

    setIsPlaying(newIsPlayingState);
    setCurrentTime(newCurrentTimeState);

    if (isSyncEnabled && firebaseInitialized) {
      await updateFirestoreSession({ isPlaying: newIsPlayingState, currentTime: newCurrentTimeState, currentSongIndexInJam: currentSongIndexRef.current });
    }
    localUpdateInProgressRef.current = false;
  }, [isSyncEnabled, firebaseInitialized, updateFirestoreSession, playableSongData.totalDuration, playlist.length]);

  const handleResetCurrentSong = useCallback(async () => {
    if (playlist.length === 0) return;
    localUpdateInProgressRef.current = true;
    setIsPlaying(false);
    setCurrentTime(0);
    if (isSyncEnabled && firebaseInitialized) {
      await updateFirestoreSession({ isPlaying: false, currentTime: 0, currentSongIndexInJam: currentSongIndexRef.current });
    }
    localUpdateInProgressRef.current = false;
  }, [isSyncEnabled, firebaseInitialized, updateFirestoreSession, playlist.length]);
  
  const handleSongNavigation = useCallback(async (direction: 'next' | 'prev') => {
    if (playlist.length === 0) return;
    localUpdateInProgressRef.current = true;
    let newIndex = currentSongIndexRef.current;
    if (direction === 'next') {
      newIndex = Math.min(playlist.length - 1, currentSongIndexRef.current + 1);
    } else {
      newIndex = Math.max(0, currentSongIndexRef.current - 1);
    }

    if (newIndex !== currentSongIndexRef.current || latestCurrentTimeRef.current > 0 || isPlayingRef.current) {
      setCurrentSongIndex(newIndex);
      setCurrentTime(0);
      setIsPlaying(false);
      if (isSyncEnabled && firebaseInitialized) {
        await updateFirestoreSession({ isPlaying: false, currentTime: 0, currentSongIndexInJam: newIndex });
      }
    }
    localUpdateInProgressRef.current = false;
  }, [playlist.length, isSyncEnabled, firebaseInitialized, updateFirestoreSession]);

  const handleReplayJam = useCallback(async () => {
    if (playlist.length === 0) return;
    localUpdateInProgressRef.current = true;
    setCurrentSongIndex(0);
    setCurrentTime(0);
    setIsPlaying(false); 
    if (isSyncEnabled && firebaseInitialized) {
      await updateFirestoreSession({ isPlaying: false, currentTime: 0, currentSongIndexInJam: 0 }); 
    }
    localUpdateInProgressRef.current = false;
  }, [playlist.length, isSyncEnabled, firebaseInitialized, updateFirestoreSession]);


  const handleSectionSelect = useCallback(async (newTime: number) => {
    if (playlist.length === 0 || playableSongData.totalDuration === 0) return;
    localUpdateInProgressRef.current = true;
    setCurrentTime(newTime);
    if (isSyncEnabled && firebaseInitialized) {
      await updateFirestoreSession({ currentTime: newTime, isPlaying: isPlayingRef.current, currentSongIndexInJam: currentSongIndexRef.current });
    }
    localUpdateInProgressRef.current = false;
  }, [isSyncEnabled, firebaseInitialized, updateFirestoreSession, playlist.length, playableSongData.totalDuration]);


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
          localUpdateInProgressRef.current = true; 
          setIsSyncEnabled(checked);
          if (!checked) {
            toast({ title: "Sync Disabled", description: "Playback is now local." });
            setIsLoadingSessionState(false); 
            localUpdateInProgressRef.current = false;
          } else if (!firebaseInitialized || !db) {
            toast({ title: "Sync Failed", description: "Firebase not configured. Sync remains off.", variant: "destructive" });
            setIsSyncEnabled(false); 
            setIsLoadingSessionState(false);
            localUpdateInProgressRef.current = false;
          } else {
            toast({ title: "Sync Enabled", description: "Attempting to connect to shared session." });
            setIsLoadingSessionState(true); 
            // Allow Firestore to establish connection and sync
            setTimeout(() => { localUpdateInProgressRef.current = false; }, 500); // A small delay
          }
        }}
        disabled={!firebaseInitialized && !db}
      />
      <Label htmlFor="sync-toggle" className="text-sm flex items-center gap-1">
        {isSyncEnabled && firebaseInitialized && db ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
        Real-time Sync
      </Label>
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
        return typeof firstWordTime === 'number' && firstWordTime >= section.startTime && firstWordTime < section.endTime;
      });
      for (let lineIndex = 0; lineIndex < lyricLinesInSection.length; lineIndex++) {
        const line = lyricLinesInSection[lineIndex];
        for (const word of line) {
          if (currentTime >= word.startTime && currentTime < (word.endTime + LYRIC_ACTIVE_BUFFER_MS)) {
            return { word, sectionId: section.id, lineIndexWithinSection: lineIndex };
          }
        }
      }
    }
    return null;
  }, [currentTime, playableSongData.lyrics, playableSongData.sections]);
  
  const activeLineKeyForHighlight = useMemo(() => {
    if (activeLyricWordInfo) {
      return `${activeLyricWordInfo.sectionId}_${activeLyricWordInfo.lineIndexWithinSection}`;
    }
    return null;
  }, [activeLyricWordInfo]);

  const currentSectionId = useMemo(() => {
    if (activeLyricWordInfo?.sectionId) return activeLyricWordInfo.sectionId;
    if (activeSongChord) {
      const sectionForChord = playableSongData.sections.find(s => activeSongChord.startTime >= s.startTime && activeSongChord.startTime < s.endTime);
      if (sectionForChord) return sectionForChord.id;
    }
    const sectionByTime = playableSongData.sections.find(s => currentTime >= s.startTime && currentTime < s.endTime);
    if (sectionByTime) return sectionByTime.id;
    
    if (playableSongData.sections.length > 0 && currentTime < playableSongData.sections[0].startTime) {
        return playableSongData.sections[0].id;
    }
    if (playableSongData.sections.length > 0 && currentTime >= playableSongData.sections[playableSongData.sections.length -1].endTime) {
        return playableSongData.sections[playableSongData.sections.length -1].id;
    }
    return null;
  }, [currentTime, playableSongData.sections, activeLyricWordInfo, activeSongChord]);


  if (isLoadingJamData || (isSyncEnabled && isLoadingSessionState && firebaseInitialized && db)) {
    return fallback || (
      <div className="w-full flex flex-col justify-center items-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">
          {isLoadingJamData ? "Loading Jam Session..." : "Connecting to session..."}
        </p>
        <div className="mt-2"> <SyncToggle /> </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col justify-center items-center min-h-[400px] text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2 text-destructive">Error Loading Jam</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Link href="/" passHref>
          <Button variant="outline">Go to Homepage</Button>
        </Link>
      </div>
    );
  }
  
  if (playlist.length === 0) {
     return (
      <div className="w-full flex flex-col justify-center items-center min-h-[400px] text-center">
        <ListMusic className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Empty Jam</h2>
        <p className="text-muted-foreground mb-6">This Jam Session doesn't have any songs yet.</p>
        <Link href="/create-jam" passHref>
          <Button>Create a New Jam</Button>
        </Link>
         <div className="mt-8">
          <SyncToggle />
          {(!firebaseInitialized || !db) && (<p className="text-xs text-destructive mt-1"> (Firebase not configured - Sync disabled)</p>)}
        </div>
      </div>
    );
  }


  return (
    <Card className="shadow-xl w-full flex flex-col h-[calc(100vh-4rem)]">
      <CardHeader className="flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-primary truncate max-w-xs sm:max-w-md md:max-w-lg">{jamSession?.name}</h2>
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            Song {currentSongIndex + 1} of {playlist.length}
          </p>
        </div>
        <SongInfo
          title={currentDisplaySongInfo.title}
          author={currentDisplaySongInfo.author}
          songKey={currentDisplaySongInfo.key}
        />
        <div className="flex justify-between items-center mt-3 gap-4">
          <Metronome bpm={currentDisplaySongInfo.bpm} isPlaying={isPlaying} />
          <SyncToggle />
          {playlist.length > 0 && (
              <Button onClick={handleReplayJam} variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" /> Restart Jam
              </Button>
          )}
        </div>
         {(!firebaseInitialized || !db) && (<p className="text-xs text-destructive mt-1 text-right"> (Firebase not configured, Sync disabled)</p>)}
      </CardHeader>

      <CardContent className="flex-grow overflow-y-auto space-y-2 p-3 md:p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-full">
          <LyricsDisplay
            lyrics={playableSongData.lyrics}
            chords={playableSongData.chords}
            sections={playableSongData.sections}
            currentTime={currentTime}
            activeSongChord={activeSongChord}
            activeLyricWordInfo={activeLyricWordInfo}
            currentSectionId={currentSectionId}
            activeLineKeyForHighlight={activeLineKeyForHighlight}
            songIsPlaying={isPlayingRef.current}
          />
          <ChordsDisplay 
            chords={playableSongData.chords} 
            currentTime={currentTime} 
            songBpm={currentDisplaySongInfo.bpm}
            isPlaying={isPlaying} 
          />
        </div>
      </CardContent>

      <CardFooter className="flex-shrink-0 flex flex-col gap-2 p-3 border-t bg-background">
        <SectionProgressBar
            sections={playableSongData.sections}
            currentSectionId={currentSectionId}
            currentTime={currentTime}
            onSectionSelect={handleSectionSelect}
        />
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1">
                <Button 
                    onClick={() => handleSongNavigation('prev')} 
                    variant="secondary" 
                    size="icon" 
                    aria-label="Previous Song"
                    disabled={currentSongIndex === 0}
                    className="rounded-xl"
                >
                    <SkipBack className="w-5 h-5" />
                </Button>
                <Button 
                  onClick={handlePlayPause} 
                  size="icon" 
                  aria-label={isPlaying ? 'Pause' : 'Play'} 
                  className={cn(
                    "w-10 h-10 rounded-xl text-accent-foreground",
                    isPlaying && "bg-accent hover:bg-accent/90"
                  )}
                  style={!isPlaying ? { backgroundColor: 'hsl(var(--play-button-paused-bg))' } : {}}
                >
                    {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
                </Button>
                <Button 
                    onClick={() => handleSongNavigation('next')} 
                    variant="secondary" 
                    size="icon" 
                    aria-label="Next Song"
                    disabled={currentSongIndex >= playlist.length - 1}
                    className="rounded-xl"
                >
                    <SkipForward className="w-5 h-5" />
                </Button>
                 <Button 
                    onClick={handleResetCurrentSong} 
                    variant="secondary" 
                    size="icon" 
                    aria-label="Reset Current Song"
                    className="rounded-xl"
                  >
                    <RefreshCw className="w-5 h-5" />
                </Button>
            </div>
            <div className="text-sm font-mono text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(playableSongData.totalDuration)}
            </div>
        </div>
      </CardFooter>
    </Card>
  );
}

