
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
  currentSongIdInJam?: string; // To track which song in a jam is playing
  currentSongIndexInJam?: number; // To track index for jams
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

// Type for the information displayed about the currently selected song OR current song in a Jam
export interface SongDisplayInfo {
  id: string;
  title: string;
  author: string;
  key?: string;
  bpm: number;
}

export interface JamSession {
  id: string; // Firestore document ID
  name: string;
  songIds: string[];
  createdAt: any; // Firestore Timestamp
}

export interface JamPlaylistEntry extends SongEntry {
  // May add more specific playlist-related fields later if needed
}
