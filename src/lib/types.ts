export interface SongSection {
  id: string;
  name: string;
  duration: number; // in seconds
  startTime: number; // in seconds, relative to song start
  endTime: number; // in seconds, relative to song start
}

export interface LyricWord {
  text: string;
  startTime: number; // in seconds, relative to song start
  endTime: number; // in seconds, relative to song start
}

export type LyricLine = LyricWord[];

export interface ChordChange {
  chord: string;
  startTime: number; // in seconds, relative to song start
  endTime: number; // in seconds, relative to song start
}

export interface SongData {
  title: string;
  author: string;
  bpm: number;
  sections: SongSection[];
  lyrics: LyricLine[];
  chords: ChordChange[];
  totalDuration: number; // in seconds
}

export interface SessionState {
  isPlaying: boolean;
  currentTime: number;
  lastUpdated: any; // Firestore Timestamp (or ServerTimestamp sentinel)
  // songId?: string; // Future: if multiple songs are supported
}
