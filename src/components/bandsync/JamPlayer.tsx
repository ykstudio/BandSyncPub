
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
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Play, Pause, SkipBack, SkipForward, ListMusic, Settings2, Wifi, WifiOff,
  AlertTriangle, Loader2, RefreshCw,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

const TIME_DRIFT_THRESHOLD = 1.0;
const FIRESTORE_UPDATE_INTERVAL = 2000;
const SESSION_ID_PREFIX = 'global-bandsync-session-jam-';
const LYRIC_ACTIVE_BUFFER_MS = 0.1; // 100ms buffer

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
    if (!isSyncEnabled || !db || !firebaseInitialized || localUpdateInProgressRef.current) return;
    const sessionDocRef = doc(db, 'sessions', currentSessionId);
    try {
      await setDoc(sessionDocRef, { ...newState, lastUpdated: serverTimestamp() }, { merge: true });
    } catch (error) {
      console.error("Error updating Firestore session:", error);
      toast({ title: "Sync Error", description: "Could not update shared session.", variant: "destructive" });
    }
  }, [isSyncEnabled, db, firebaseInitialized, toast, currentSessionId]);

  useEffect(() => {
    if (!isSyncEnabled || !db || !firebaseInitialized || !jamSession) {
      setIsLoadingSessionState(false);
      setIsLoadingJamData(false);
      if (jamSession && playlist.length > 0) setIsLoadingJamData(false);
      return;
    }
    
    setIsLoadingSessionState(true);
    setIsLoadingJamData(true);

    const sessionDocRef = doc(db, 'sessions', currentSessionId);
    const unsubscribe = onSnapshot(sessionDocRef, (snapshot) => {
      setIsLoadingSessionState(false);
      setIsLoadingJamData(false);

      if (snapshot.metadata.hasPendingWrites || localUpdateInProgressRef.current) return;

      if (snapshot.exists()) {
        const remoteState = snapshot.data() as SessionState;
        localUpdateInProgressRef.current = true;

        if (remoteState.currentSongIndexInJam !== undefined && 
            remoteState.currentSongIndexInJam !== currentSongIndexRef.current &&
            playlist.length > 0 &&
            remoteState.currentSongIndexInJam < playlist.length) {
          setCurrentSongIndex(remoteState.currentSongIndexInJam);
        }

        const remoteIsPlaying = remoteState.isPlaying;
        const remoteTime = remoteState.currentTime;
        
        if (isPlayingRef.current !== remoteIsPlaying) {
          setIsPlaying(remoteIsPlaying);
        }
        
        if (Math.abs(latestCurrentTimeRef.current - remoteTime) > TIME_DRIFT_THRESHOLD || isPlayingRef.current !== remoteIsPlaying) {
             setCurrentTime(remoteTime);
        }
        
        localUpdateInProgressRef.current = false;
      } else {
        updateFirestoreSession({ isPlaying: false, currentTime: 0, currentSongIndexInJam: 0 });
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

  useEffect(() => {
    let localTimerIntervalId: NodeJS.Timeout | undefined = undefined;
    let firestoreUpdateIntervalId: NodeJS.Timeout | undefined = undefined;

    if (isPlayingRef.current && playlist.length > 0 && playableSongData.totalDuration > 0) {
      localTimerIntervalId = setInterval(() => {
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
                updateFirestoreSession({ isPlaying: true, currentTime: 0, currentSongIndexInJam: nextSongIndex });
              }
              localUpdateInProgressRef.current = false;
              return 0; 
            } else { 
              if (isSyncEnabled && firebaseInitialized) {
                 localUpdateInProgressRef.current = true;
                 updateFirestoreSession({ isPlaying: false, currentTime: playableSongData.totalDuration, currentSongIndexInJam: currentSongIndexRef.current });
                 localUpdateInProgressRef.current = false;
              }
              return playableSongData.totalDuration;
            }
          }
          return nextTime;
        });
      }, 100);

      if (isSyncEnabled && firebaseInitialized) {
        firestoreUpdateIntervalId = setInterval(() => {
          if (isPlayingRef.current) { 
            localUpdateInProgressRef.current = true;
            updateFirestoreSession({ currentTime: latestCurrentTimeRef.current, isPlaying: true, currentSongIndexInJam: currentSongIndexRef.current });
            localUpdateInProgressRef.current = false;
          }
        }, FIRESTORE_UPDATE_INTERVAL);
      }
    }
    return () => {
      if (localTimerIntervalId) clearInterval(localTimerIntervalId);
      if (firestoreUpdateIntervalId) clearInterval(firestoreUpdateIntervalId);
    };
  }, [isPlaying, playableSongData.totalDuration, updateFirestoreSession, isSyncEnabled, firebaseInitialized, playlist]);


  const handlePlayPause = useCallback(() => {
    if (playlist.length === 0 || playableSongData.totalDuration === 0) return;
    const newIsPlayingState = !isPlayingRef.current;
    let newCurrentTimeState = latestCurrentTimeRef.current;
    if (newCurrentTimeState >= playableSongData.totalDuration && newIsPlayingState) {
      newCurrentTimeState = 0;
    }
    localUpdateInProgressRef.current = true;
    setIsPlaying(newIsPlayingState);
    setCurrentTime(newCurrentTimeState);
    if (isSyncEnabled && firebaseInitialized) {
      updateFirestoreSession({ isPlaying: newIsPlayingState, currentTime: newCurrentTimeState, currentSongIndexInJam: currentSongIndexRef.current });
    }
    localUpdateInProgressRef.current = false;
  }, [isSyncEnabled, firebaseInitialized, updateFirestoreSession, playableSongData.totalDuration, playlist.length]);

  const handleResetCurrentSong = useCallback(() => {
    if (playlist.length === 0) return;
    localUpdateInProgressRef.current = true;
    setIsPlaying(false);
    setCurrentTime(0);
    if (isSyncEnabled && firebaseInitialized) {
      updateFirestoreSession({ isPlaying: false, currentTime: 0, currentSongIndexInJam: currentSongIndexRef.current });
    }
    localUpdateInProgressRef.current = false;
  }, [isSyncEnabled, firebaseInitialized, updateFirestoreSession, playlist.length]);
  
  const handleSongNavigation = useCallback((direction: 'next' | 'prev') => {
    if (playlist.length === 0) return;
    let newIndex = currentSongIndexRef.current;
    if (direction === 'next') {
      newIndex = Math.min(playlist.length - 1, currentSongIndexRef.current + 1);
    } else {
      newIndex = Math.max(0, currentSongIndexRef.current - 1);
    }

    if (newIndex !== currentSongIndexRef.current || latestCurrentTimeRef.current > 0 || isPlayingRef.current) {
      localUpdateInProgressRef.current = true;
      setCurrentSongIndex(newIndex);
      setCurrentTime(0);
      setIsPlaying(false);
      if (isSyncEnabled && firebaseInitialized) {
        updateFirestoreSession({ isPlaying: false, currentTime: 0, currentSongIndexInJam: newIndex });
      }
      localUpdateInProgressRef.current = false;
    }
  }, [playlist.length, isSyncEnabled, firebaseInitialized, updateFirestoreSession]);

  const handleReplayJam = useCallback(() => {
    if (playlist.length === 0) return;
    localUpdateInProgressRef.current = true;
    setCurrentSongIndex(0);
    setCurrentTime(0);
    setIsPlaying(false); 
    if (isSyncEnabled && firebaseInitialized) {
      updateFirestoreSession({ isPlaying: false, currentTime: 0, currentSongIndexInJam: 0 }); 
    }
    localUpdateInProgressRef.current = false;
  }, [playlist.length, isSyncEnabled, firebaseInitialized, updateFirestoreSession]);


  const handleSectionSelect = useCallback((newTime: number) => {
    if (playlist.length === 0 || playableSongData.totalDuration === 0) return;
    localUpdateInProgressRef.current = true;
    setCurrentTime(newTime);
    if (isSyncEnabled && firebaseInitialized) {
      updateFirestoreSession({ currentTime: newTime, isPlaying: isPlayingRef.current, currentSongIndexInJam: currentSongIndexRef.current });
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
          setIsSyncEnabled(checked);
          if (!checked) toast({ title: "Sync Disabled", description: "Playback is now local." });
          else if (!firebaseInitialized || !db) {
            toast({ title: "Sync Failed", description: "Firebase not configured. Sync remains off.", variant: "destructive" });
            setIsSyncEnabled(false);
          } else {
            toast({ title: "Sync Enabled", description: "Attempting to connect to shared session." });
            setIsLoadingSessionState(true);
            if (db && firebaseInitialized && jamSession) {
                const sessionDocRef = doc(db, 'sessions', currentSessionId);
                getDoc(sessionDocRef).then(snapshot => {
                    setIsLoadingSessionState(false);
                    if (snapshot.exists()) {
                        const remoteState = snapshot.data() as SessionState;
                        localUpdateInProgressRef.current = true;
                        if (remoteState.currentSongIndexInJam !== undefined && remoteState.currentSongIndexInJam < playlist.length) {
                          setCurrentSongIndex(remoteState.currentSongIndexInJam);
                        }
                        setIsPlaying(remoteState.isPlaying);
                        setCurrentTime(remoteState.currentTime);
                        localUpdateInProgressRef.current = false;
                    } else {
                       updateFirestoreSession({ isPlaying: false, currentTime: 0, currentSongIndexInJam: currentSongIndexRef.current });
                    }
                }).catch(() => setIsLoadingSessionState(false));
            }
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
        {isLoadingJamData && <SyncToggle />}
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
    <div className="w-full space-y-2">
      <Card className="shadow-xl w-full">
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
              {(!firebaseInitialized || !db) && (<p className="text-xs text-destructive mt-1 text-right"> (Firebase not configured,<br />Sync disabled)</p>)}
            </div>
          </div>
          <div className="mt-4 text-center md:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <h2 className="text-lg font-semibold text-primary">{jamSession?.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      Song {currentSongIndex + 1} of {playlist.length}
                    </p>
                </div>
                {playlist.length > 0 && (
                    <Button onClick={handleReplayJam} variant="outline" size="sm" className="self-center sm:self-auto">
                        <RefreshCw className="mr-2 h-4 w-4" /> Restart Jam
                    </Button>
                )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
           <div className="flex items-center justify-between p-2 mb-3 border-b border-border">
            <Button
                onClick={() => handleSongNavigation('prev')}
                disabled={currentSongIndex === 0}
                variant="outline"
                size="sm"
              >
                <SkipBack className="mr-2 h-4 w-4"/> Previous Song
              </Button>
              <div className="text-sm text-muted-foreground text-center px-2 truncate">
                Up Next: {currentSongIndex + 1 < playlist.length ? playlist[currentSongIndex + 1].title : "End of Jam"}
              </div>
              <Button
                onClick={() => handleSongNavigation('next')}
                disabled={currentSongIndex >= playlist.length - 1}
                variant="outline"
                size="sm"
              >
                Next Song <SkipForward className="ml-2 h-4 w-4"/>
              </Button>
          </div>

          <div className="flex items-center justify-between p-2 bg-secondary rounded-md">
            <div className="flex items-center gap-1 sm:gap-2">
              <Button onClick={handlePlayPause} variant="ghost" size="icon" aria-label={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Pause className="w-6 h-6 text-primary" /> : <Play className="w-6 h-6 text-primary" />}
              </Button>
              <Button onClick={handleResetCurrentSong} variant="ghost" size="icon" aria-label="Reset song">
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
      </Card>
    </div>
  );
}
