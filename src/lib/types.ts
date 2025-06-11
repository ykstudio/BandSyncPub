
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
  id: string; // Unique ID for the song
  title: string;
  author: string;
  bpm: number;
  key?: string;
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

// New types for song catalog
export interface Artist {
  id: string;
  name: string;
}

export interface SongEntry {
  id: string;
  title: string;
  artistId: string;
  artistName: string; // Denormalized for easier display
  key?: string;
  bpm: number;
}

// Type for the information displayed about the currently selected song
export interface SongDisplayInfo {
  id: string;
  title: string;
  author: string;
  key?: string;
  bpm: number;
}
