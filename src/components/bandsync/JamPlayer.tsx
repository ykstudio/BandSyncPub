'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { SongData, ChordChange, LyricWord, SongSection, SongEntry, SongDisplayInfo, JamSession as FirebaseJamSession } from '@/lib/types';
import { FULL_SONG_DATA, placeholderPlayableSongData } from '@/lib/song-data';
import { SongInfo } from './SongInfo';
import { SectionProgressBar } from './SectionProgressBar';
import { LyricsDisplay } from './LyricsDisplay';
import { ChordsDisplay } from './ChordsDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Play, Pause, SkipBack, SkipForward, ListMusic, Wifi, WifiOff, AlertTriangle, Loader2, ChevronLeft } from 'lucide-react';
import { getTypedSupabaseClient, JamRecord, SessionRecord, generateSessionId } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const SESSION_STATE_PERSIST_INTERVAL = 5000;
const LYRIC_ACTIVE_BUFFER_MS = 0.1; 
const TIME_DRIFT_TOLERANCE_PLAYING = 0.25;

interface JamPlayerProps {
  jamId: string;
  fallback?: React.ReactNode;
}

export function JamPlayer({ jamId, fallback }: JamPlayerProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [jamSession, setJamSession] = useState<JamRecord | null>(null);
  const [playlist, setPlaylist] = useState<SongEntry[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [playableSongData, setPlayableSongData] = useState<SongData>(placeholderPlayableSongData);
  const [currentDisplaySongInfo, setCurrentDisplaySongInfo] = useState<SongDisplayInfo>(placeholderPlayableSongData);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSyncEnabled, setIsSyncEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaybackControlsVisible, setIsPlaybackControlsVisible] = useState(true);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const isPlayingRef = useRef(isPlaying);
  const latestCurrentTimeRef = useRef(currentTime);
  const localUpdateInProgressRef = useRef(false);
  const animationFrameRef = useRef<number>();
  const lastPersistTimeRef = useRef<number>(Date.now());
  const hidePlaybackControlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { latestCurrentTimeRef.current = currentTime; }, [currentTime]);
  const showAndRestartPlaybackControlsHideTimer = useCallback(() => {
    if (isMobile) {
      setIsPlaybackControlsVisible(true);
      if (hidePlaybackControlsTimerRef.current) clearTimeout(hidePlaybackControlsTimerRef.current);
      hidePlaybackControlsTimerRef.current = setTimeout(() => setIsPlaybackControlsVisible(false), 5000);
    }
  }, [isMobile]);
  useEffect(() => {
    if (isMobile) {
      showAndRestartPlaybackControlsHideTimer();
      const handleInteraction = () => showAndRestartPlaybackControlsHideTimer();
      window.addEventListener('click', handleInteraction);
      window.addEventListener('touchmove', handleInteraction);
      return () => {
        if (hidePlaybackControlsTimerRef.current) clearTimeout(hidePlaybackControlsTimerRef.current);
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('touchmove', handleInteraction);
      };
    } else {
      setIsPlaybackControlsVisible(true);
      if (hidePlaybackControlsTimerRef.current) clearTimeout(hidePlaybackControlsTimerRef.current);
    }
  }, [isMobile, showAndRestartPlaybackControlsHideTimer]);
  useEffect(() => {
    const supabase = getTypedSupabaseClient();
    const rtChannel = supabase.channel(`jam-session-${jamId}`, { config: { broadcast: { self: false } } });
    setChannel(rtChannel);
    const setupJam = async () => {
      setIsLoading(true);
      setError(null);
      const { data: jamData, error: jamError } = await supabase.from('jams').select('*').eq('id', jamId).single();
      if (jamError || !jamData) { setError("Jam Session not found."); setIsLoading(false); return; }
      setJamSession(jamData);
      const jamPlaylist: SongEntry[] = jamData.song_ids.map((songId: string) => {
        const songMeta = FULL_SONG_DATA[songId];
        return songMeta ? { id: songId, title: songMeta.title, artistId: "", artistName: songMeta.author, key: songMeta.key, bpm: songMeta.bpm } : null;
      }).filter(Boolean) as SongEntry[];
      setPlaylist(jamPlaylist);
      if (jamPlaylist.length === 0) setError("This Jam has no songs.");
      const sessionId = generateSessionId(jamId);
      const { data: sessionData } = await supabase.from('sessions').select('*').eq('id', sessionId).single();
      let effectiveSession: SessionRecord;
      if (sessionData) {
        effectiveSession = sessionData;
      } else {
        const { data: newSession, error: createError } = await supabase.from('sessions').insert({ id: sessionId, jam_id: jamId }).select().single();
        if (createError || !newSession) { setError("Could not create a session for this jam."); setIsLoading(false); return; }
        effectiveSession = newSession;
      }
      setCurrentTime(effectiveSession.playback_time);
      setIsPlaying(effectiveSession.is_playing);
      setCurrentSongIndex(effectiveSession.current_song_index_in_jam);
      setIsLoading(false);
    };
    setupJam();
    rtChannel.on('broadcast', { event: 'PLAYBACK_STATE_UPDATE' }, ({ payload }) => {
      if (localUpdateInProgressRef.current) return;
      const { time: remoteTime, playing: remoteIsPlaying, songIndex: remoteSongIndex } = payload;
      if (typeof remoteIsPlaying === 'boolean' && isPlayingRef.current !== remoteIsPlaying) setIsPlaying(remoteIsPlaying);
      if (typeof remoteSongIndex === 'number' && remoteSongIndex !== currentSongIndex) {
        setCurrentSongIndex(remoteSongIndex);
        setCurrentTime(0);
      }
      if (typeof remoteTime === 'number') {
        if (Math.abs(latestCurrentTimeRef.current - remoteTime) > TIME_DRIFT_TOLERANCE_PLAYING) setCurrentTime(remoteTime);
      }
    }).subscribe();
    return () => { supabase.removeChannel(rtChannel); setChannel(null); };
  }, [jamId]);
  useEffect(() => {
    if (playlist.length > 0 && currentSongIndex >= 0 && currentSongIndex < playlist.length) {
      const entry = playlist[currentSongIndex];
      const data = FULL_SONG_DATA[entry.id] || { ...placeholderPlayableSongData, id: entry.id, title: entry.title, author: entry.artistName, bpm: entry.bpm, key: entry.key };
      setPlayableSongData(data);
      setCurrentDisplaySongInfo({ id: data.id, title: data.title, author: data.author, key: data.key, bpm: data.bpm });
    } else if (playlist.length === 0 && jamSession) {
      const d = placeholderPlayableSongData;
      setCurrentDisplaySongInfo({id: 'empty', title: 'No songs in Jam', author:'', bpm: d.bpm, key: d.key});
      setPlayableSongData(d);
    }
  }, [currentSongIndex, playlist, jamSession]);

  const broadcastPlaybackState = useCallback((state: any) => {
    if (channel && isSyncEnabled) channel.send({ type: 'broadcast', event: 'PLAYBACK_STATE_UPDATE', payload: state });
  }, [channel, isSyncEnabled]);

  const persistSessionState = useCallback(async (state: any) => {
    if (!isSyncEnabled) return;
    const supabase = getTypedSupabaseClient();
    await supabase.from('sessions').update({ is_playing: state.isPlaying, playback_time: state.currentTime, current_song_index_in_jam: state.currentSongIndex }).eq('id', generateSessionId(jamId));
  }, [isSyncEnabled, jamId]);
  
  const handleSongChange = useCallback((newIndex: number, options: { play?: boolean } = {}) => {
    const { play = false } = options;
    localUpdateInProgressRef.current = true;
    setCurrentSongIndex(newIndex);
    setCurrentTime(0);
    setIsPlaying(play);
    broadcastPlaybackState({ songIndex: newIndex, time: 0, playing: play });
    persistSessionState({ isPlaying: play, currentTime: 0, currentSongIndex: newIndex });
    setTimeout(() => { localUpdateInProgressRef.current = false; }, 200);
  }, [broadcastPlaybackState, persistSessionState]);

  useEffect(() => {
    const tick = () => {
      if (!isPlayingRef.current) return;

      const newTime = Math.min(latestCurrentTimeRef.current + (16 / 1000), playableSongData.totalDuration);

      if (newTime >= playableSongData.totalDuration && playableSongData.totalDuration > 0) {
        if (currentSongIndex < playlist.length - 1) {
          handleSongChange(currentSongIndex + 1, { play: true });
        } else {
          setIsPlaying(false);
          setCurrentTime(playableSongData.totalDuration);
          persistSessionState({ isPlaying: false, currentTime: playableSongData.totalDuration, currentSongIndex });
        }
      } else {
        setCurrentTime(newTime);

        if (Date.now() - lastPersistTimeRef.current > SESSION_STATE_PERSIST_INTERVAL) {
          persistSessionState({ isPlaying: isPlayingRef.current, currentTime: newTime, currentSongIndex });
          lastPersistTimeRef.current = Date.now();
        }

        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(tick);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, playableSongData.totalDuration, currentSongIndex, playlist.length, handleSongChange, persistSessionState]);

  const handlePlayPause = () => {
    localUpdateInProgressRef.current = true;
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);
    broadcastPlaybackState({ playing: newIsPlaying, time: currentTime });
    persistSessionState({ isPlaying: newIsPlaying, currentTime, currentSongIndex });
    setTimeout(() => { localUpdateInProgressRef.current = false; }, 200);
  };
  const handleSeek = (direction: 'forward' | 'backward') => {
    localUpdateInProgressRef.current = true;
    const newTime = Math.max(0, Math.min(currentTime + (direction === 'forward' ? 10 : -10), playableSongData.totalDuration));
    setCurrentTime(newTime);
    broadcastPlaybackState({ time: newTime });
    persistSessionState({ isPlaying, currentTime: newTime, currentSongIndex });
    setTimeout(() => { localUpdateInProgressRef.current = false; }, 200);
  };
  const handleScrub = (newTime: number) => {
    localUpdateInProgressRef.current = true;
    setCurrentTime(newTime);
    broadcastPlaybackState({ time: newTime });
    persistSessionState({ isPlaying, currentTime: newTime, currentSongIndex });
    setTimeout(() => { localUpdateInProgressRef.current = false; }, 200);
  };

  const handleNextSong = () => { if (currentSongIndex < playlist.length - 1) handleSongChange(currentSongIndex + 1, { play: isPlaying }); };
  const handlePrevSong = () => { if (currentTime > 3 && playableSongData.totalDuration > 3) handleScrub(0); else if (currentSongIndex > 0) handleSongChange(currentSongIndex - 1, { play: isPlaying }); else handleScrub(0); };
  
  const { activeSection, progress, activeLyricWordInfo, activeLineKeyForHighlight, activeChord } = useMemo(() => {
    if (!playableSongData || !playableSongData.sections || playableSongData.sections.length === 0) {
      return { activeSection: null, progress: 0, activeLyricWordInfo: null, activeLineKeyForHighlight: null, activeChord: null };
    }

    const currentSection = playableSongData.sections.find(s => currentTime >= s.startTime && currentTime < s.endTime) || null;
    const sectionProgress = currentSection ? ((currentTime - currentSection.startTime) / currentSection.duration) * 100 : 0;

    let currentWordInfo: { word: LyricWord; sectionId: string; lineIndexWithinSection: number; } | null = null;
    let currentLineKey: string | null = null;
    
    if (currentSection) {
      const linesInSection = playableSongData.lyrics.filter(line => 
          line.length > 0 && 
          line[0].startTime >= currentSection.startTime && 
          line[0].startTime < currentSection.endTime
      );
      
      for (let i = 0; i < linesInSection.length; i++) {
          const line = linesInSection[i];
          if (line.length > 0 && currentTime >= line[0].startTime - LYRIC_ACTIVE_BUFFER_MS && currentTime <= line[line.length - 1].endTime + LYRIC_ACTIVE_BUFFER_MS) {
              currentLineKey = `${currentSection.id}_${i}`;
              
              const activeWord = line.find(word => currentTime >= word.startTime && currentTime < word.endTime);
              if (activeWord) {
                  currentWordInfo = {
                      word: activeWord,
                      sectionId: currentSection.id,
                      lineIndexWithinSection: i,
                  };
              }
              break; 
          }
      }
    }

    const activeChord = playableSongData.chords.find(c => currentTime >= c.startTime && currentTime < c.endTime) || null;

    return {
      activeSection: currentSection,
      progress: sectionProgress,
      activeLyricWordInfo: currentWordInfo,
      activeLineKeyForHighlight: currentLineKey,
      activeChord
    };
  }, [currentTime, playableSongData]);

  const formatTime = (timeInSeconds: number) => `${Math.floor(timeInSeconds / 60)}:${Math.floor(timeInSeconds % 60).toString().padStart(2, '0')}`;
  const SyncToggle = () => <div className="flex items-center space-x-2">{isSyncEnabled ? <Wifi className="h-4 w-4 text-primary" /> : <WifiOff className="h-4 w-4 text-muted-foreground" />}<Label htmlFor="sync-mode" className={cn("text-sm", !isSyncEnabled && "text-muted-foreground")}>Real-time Sync</Label><Switch id="sync-mode" checked={isSyncEnabled} onCheckedChange={setIsSyncEnabled} /></div>;
  if (isLoading) return fallback;
  if (error) return <Card className="max-w-md mx-auto"><CardHeader><div className="flex items-center gap-4"><AlertTriangle className="h-8 w-8 text-destructive" /><h1 className="text-xl font-semibold text-destructive">Error Loading Jam</h1></div></CardHeader><CardContent><p className="text-muted-foreground">{error}</p></CardContent><CardFooter><Link href="/" passHref><Button variant="outline"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Jams</Button></Link></CardFooter></Card>;
  const playbackControlsClasses = isMobile ? isPlaybackControlsVisible ? "opacity-100" : "opacity-0 pointer-events-none" : "opacity-100";
  return (
    <Card className="w-full h-full flex flex-col mx-auto overflow-hidden shadow-2xl bg-card/80 backdrop-blur-sm border-border/20" data-name="jam-player-card">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start gap-4 px-6 pt-4 flex-shrink-0" data-name="jam-player-header">
        <div data-name="header-title-section">
          <h1 className="text-2xl font-bold text-primary font-headline tracking-tight">{jamSession?.name}</h1>
          <p className="text-muted-foreground">Playing: {currentDisplaySongInfo.title} by {currentDisplaySongInfo.author}</p>
        </div>
        <div className="flex-shrink-0" data-name="header-sync-toggle-section">
            <SyncToggle />
        </div>
      </CardHeader>
      <CardContent className="space-y-6 flex-grow min-h-0 flex flex-col" data-name="jam-player-content">
        <div data-name="content-song-info-wrapper" className="flex-shrink-0">
            <SongInfo title={currentDisplaySongInfo.title} author={currentDisplaySongInfo.author} songKey={currentDisplaySongInfo.key} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow min-h-0" data-name="content-lyrics-chords-grid">
          <div data-name="lyrics-display-wrapper" className="overflow-y-auto">
              <LyricsDisplay lyrics={playableSongData.lyrics} chords={playableSongData.chords} sections={playableSongData.sections} currentTime={currentTime} activeSongChord={activeChord || undefined} activeLyricWordInfo={activeLyricWordInfo} currentSectionId={activeSection?.id || null} activeLineKeyForHighlight={activeLineKeyForHighlight} songIsPlaying={isPlaying} />
          </div>
          <div data-name="chords-display-wrapper" className="overflow-y-auto">
             <ChordsDisplay chords={playableSongData.chords} currentTime={currentTime} songBpm={playableSongData.bpm} isPlaying={isPlaying} />
          </div>
        </div>
      </CardContent>
      <CardFooter className={cn("bg-background/50 backdrop-blur-sm border-t p-4 transition-opacity duration-300 flex-shrink-0", playbackControlsClasses)} data-name="jam-player-footer">
        <div className="w-full flex justify-between items-center gap-4" data-name="footer-main-flex-container">
          <div className="flex items-center gap-2 sm:gap-4" data-name="footer-playback-buttons">
            <Button variant="ghost" size="icon" onClick={handlePrevSong}>
              <SkipBack className="h-6 w-6" />
            </Button>
            <Button variant="default" size="icon" className="h-16 w-16 rounded-full shadow-lg" onClick={handlePlayPause}>
              {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextSong} disabled={currentSongIndex >= playlist.length - 1}>
              <SkipForward className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex-grow min-w-0 mx-4" data-name="footer-progress-bar-container">
             <SectionProgressBar sections={playableSongData.sections} currentSectionId={activeSection?.id || null} onSectionSelect={handleScrub} currentTime={currentTime} />
          </div>

          <div className="text-sm font-mono text-muted-foreground flex-shrink-0" data-name="footer-time-display">
            {formatTime(currentTime)} / {formatTime(playableSongData.totalDuration)}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
