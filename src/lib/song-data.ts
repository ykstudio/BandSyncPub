
import type { SongData, SongSection, Artist, SongEntry } from './types';

const preProcessSongData = (data: Omit<SongData, 'totalDuration' | 'sections'> & { sections: Omit<SongSection, 'startTime' | 'endTime'>[] }): SongData => {
  let cumulativeTime = 0;
  const processedSections = data.sections.map(section => {
    const startTime = cumulativeTime;
    cumulativeTime += section.duration;
    const endTime = cumulativeTime;
    return { ...section, startTime, endTime };
  });

  const totalDuration = cumulativeTime;

  const processedChords = data.chords.map(chord => ({
    ...chord,
    startTime: Math.min(chord.startTime, totalDuration),
    endTime: Math.min(chord.endTime, totalDuration),
  })).filter(chord => chord.startTime < totalDuration);


  return {
    ...data,
    sections: processedSections,
    chords: processedChords,
    totalDuration,
  };
};

// --- Fully Detailed Song Data (Sample 1) ---
export const whileMyGuitarGentlyWeepsData: SongData = preProcessSongData({
  id: "beatles-wmgw",
  title: "While My Guitar Gently Weeps",
  author: "The Beatles",
  bpm: 116,
  key: "Am / A",
  sections: [
    { id: "intro", name: "Intro", duration: 8 },
    { id: "verse1", name: "Verse 1", duration: 16 },
    { id: "chorus1", name: "Chorus", duration: 16 },
    { id: "verse2", name: "Verse 2", duration: 16 },
    { id: "chorus2", name: "Chorus", duration: 16 },
    { id: "solo1", name: "Guitar Solo", duration: 16 },
    { id: "verse3", name: "Verse 3", duration: 16 },
    { id: "chorus3", name: "Chorus", duration: 16 },
    { id: "outro", name: "Outro Solo", duration: 24 },
  ],
  lyrics: [
    // Verse 1 (Global time: 8s - 24s)
    [
      { text: "I", startTime: 8.0, endTime: 8.2 }, { text: "look", startTime: 8.3, endTime: 8.6 }, { text: "at", startTime: 8.6, endTime: 8.8 }, { text: "you", startTime: 8.9, endTime: 9.2 }, { text: "all,", startTime: 9.3, endTime: 9.8 },
      { text: "see", startTime: 10.0, endTime: 10.3 }, { text: "the", startTime: 10.3, endTime: 10.5 }, { text: "love", startTime: 10.6, endTime: 11.0 }, { text: "there", startTime: 11.0, endTime: 11.3 }, { text: "that's", startTime: 11.3, endTime: 11.6 }, { text: "sleeping", startTime: 11.6, endTime: 12.3 }
    ],
    [
      { text: "While", startTime: 12.5, endTime: 13.0 }, { text: "my", startTime: 13.0, endTime: 13.2 }, { text: "guitar", startTime: 13.3, endTime: 14.0 }, { text: "gently", startTime: 14.2, endTime: 14.8 }, { text: "weeps", startTime: 15.0, endTime: 15.8 }
    ],
    [
      { text: "I", startTime: 16.0, endTime: 16.2 }, { text: "look", startTime: 16.3, endTime: 16.6 }, { text: "at", startTime: 16.6, endTime: 16.8 }, { text: "the", startTime: 16.8, endTime: 17.0 }, { text: "floor", startTime: 17.1, endTime: 17.6 },
      { text: "and", startTime: 17.7, endTime: 18.0 }, { text: "I", startTime: 18.0, endTime: 18.2 }, { text: "see", startTime: 18.3, endTime: 18.6 }, { text: "it", startTime: 18.6, endTime: 18.8 }, { text: "needs", startTime: 18.9, endTime: 19.3 }, { text: "sweeping", startTime: 19.3, endTime: 20.0 }
    ],
    [
      { text: "Still", startTime: 20.2, endTime: 20.8 }, { text: "my", startTime: 20.8, endTime: 21.0 }, { text: "guitar", startTime: 21.1, endTime: 21.8 }, { text: "gently", startTime: 22.0, endTime: 22.6 }, { text: "weeps", startTime: 22.8, endTime: 23.6 }
    ],
    // Chorus 1 (Global time: 24s - 40s)
    [
      { text: "I", startTime: 24.0, endTime: 24.2 }, { text: "don't", startTime: 24.3, endTime: 24.7 }, { text: "know", startTime: 24.7, endTime: 25.0 }, { text: "why", startTime: 25.2, endTime: 25.8 },
      { text: "nobody", startTime: 26.2, endTime: 26.9 }, { text: "told", startTime: 27.0, endTime: 27.4 }, { text: "you", startTime: 27.4, endTime: 27.8 }
    ],
    [
      { text: "How", startTime: 28.0, endTime: 28.4 }, { text: "to", startTime: 28.4, endTime: 28.6 }, { text: "unfold", startTime: 29.0, endTime: 29.8 }, { text: "your", startTime: 30.2, endTime: 30.6 }, { text: "love", startTime: 30.8, endTime: 31.5 }
    ],
    [
      { text: "I", startTime: 32.0, endTime: 32.2 }, { text: "don't", startTime: 32.3, endTime: 32.7 }, { text: "know", startTime: 32.7, endTime: 33.0 }, { text: "how", startTime: 33.2, endTime: 33.8 },
      { text: "someone", startTime: 34.2, endTime: 34.9 }, { text: "controlled", startTime: 35.0, endTime: 35.6 }, { text: "you", startTime: 35.6, endTime: 35.9 }
    ],
    [
      { text: "They", startTime: 36.0, endTime: 36.4 }, { text: "bought", startTime: 36.6, endTime: 37.2 }, { text: "and", startTime: 37.4, endTime: 37.8 }, { text: "sold", startTime: 38.2, endTime: 38.8 }, { text: "you", startTime: 38.8, endTime: 39.2 }
    ],
    // Verse 2 (Global time: 40s - 56s)
    [
      { text: "I", startTime: 40.0, endTime: 40.2 }, { text: "look", startTime: 40.3, endTime: 40.6 }, { text: "at", startTime: 40.6, endTime: 40.8 }, { text: "the", startTime: 40.8, endTime: 41.0 }, { text: "world", startTime: 41.1, endTime: 41.6 },
      { text: "and", startTime: 41.7, endTime: 42.0 }, { text: "I", startTime: 42.0, endTime: 42.2 }, { text: "notice", startTime: 42.4, endTime: 43.0 }, { text: "it's", startTime: 43.0, endTime: 43.2 }, { text: "turning", startTime: 43.2, endTime: 43.9 }
    ],
    [
      { text: "While", startTime: 44.0, endTime: 44.5 }, { text: "my", startTime: 44.5, endTime: 44.7 }, { text: "guitar", startTime: 44.8, endTime: 45.5 }, { text: "gently", startTime: 45.7, endTime: 46.3 }, { text: "weeps", startTime: 46.5, endTime: 47.3 }
    ],
    [
      { text: "With", startTime: 48.0, endTime: 48.4 }, { text: "every", startTime: 48.5, endTime: 49.0 }, { text: "mistake", startTime: 49.2, endTime: 49.9 }, { text: "we", startTime: 50.0, endTime: 50.2 },
      { text: "must", startTime: 50.3, endTime: 50.7 }, { text: "surely", startTime: 50.8, endTime: 51.3 }, { text: "be", startTime: 51.3, endTime: 51.5 }, { text: "learning", startTime: 51.5, endTime: 52.2 }
    ],
    [
      { text: "Still", startTime: 52.4, endTime: 53.0 }, { text: "my", startTime: 53.0, endTime: 53.2 }, { text: "guitar", startTime: 53.3, endTime: 54.0 }, { text: "gently", startTime: 54.2, endTime: 54.8 }, { text: "weeps", startTime: 55.0, endTime: 55.8 }
    ],
    // Chorus 2 (Global time: 56s - 72s)
    [
      { text: "I", startTime: 56.0, endTime: 56.2 }, { text: "don't", startTime: 56.3, endTime: 56.7 }, { text: "know", startTime: 56.7, endTime: 57.0 }, { text: "why", startTime: 57.2, endTime: 57.8 },
      { text: "nobody", startTime: 58.2, endTime: 58.9 }, { text: "told", startTime: 59.0, endTime: 59.4 }, { text: "you", startTime: 59.4, endTime: 59.8 }
    ],
    [
      { text: "How", startTime: 60.0, endTime: 60.4 }, { text: "to", startTime: 60.4, endTime: 60.6 }, { text: "unfold", startTime: 61.0, endTime: 61.8 }, { text: "your", startTime: 62.2, endTime: 62.6 }, { text: "love", startTime: 62.8, endTime: 63.5 }
    ],
    [
      { text: "I", startTime: 64.0, endTime: 64.2 }, { text: "don't", startTime: 64.3, endTime: 64.7 }, { text: "know", startTime: 64.7, endTime: 65.0 }, { text: "how", startTime: 65.2, endTime: 65.8 },
      { text: "someone", startTime: 66.2, endTime: 66.9 }, { text: "controlled", startTime: 67.0, endTime: 67.6 }, { text: "you", startTime: 67.6, endTime: 67.9 }
    ],
    [
      { text: "They", startTime: 68.0, endTime: 68.4 }, { text: "bought", startTime: 68.6, endTime: 69.2 }, { text: "and", startTime: 69.4, endTime: 69.8 }, { text: "sold", startTime: 70.2, endTime: 70.8 }, { text: "you", startTime: 70.8, endTime: 71.2 }
    ],
    // Verse 3 (Global time: 88s - 104s), after solo (72s-88s)
    [
      { text: "I", startTime: 88.0, endTime: 88.2 }, { text: "look", startTime: 88.3, endTime: 88.6 }, { text: "at", startTime: 88.6, endTime: 88.8 }, { text: "you", startTime: 88.9, endTime: 89.2 }, { text: "all,", startTime: 89.3, endTime: 89.8 },
      { text: "see", startTime: 90.0, endTime: 90.3 }, { text: "the", startTime: 90.3, endTime: 90.5 }, { text: "love", startTime: 90.6, endTime: 91.0 }, { text: "there", startTime: 91.0, endTime: 91.3 }, { text: "that's", startTime: 91.3, endTime: 91.6 }, { text: "sleeping", startTime: 91.6, endTime: 92.3 }
    ],
    [
      { text: "While", startTime: 92.5, endTime: 93.0 }, { text: "my", startTime: 93.0, endTime: 93.2 }, { text: "guitar", startTime: 93.3, endTime: 94.0 }, { text: "gently", startTime: 94.2, endTime: 94.8 }, { text: "weeps", startTime: 95.0, endTime: 95.8 }
    ],
    [
      { text: "Look", startTime: 96.0, endTime: 96.5 }, { text: "at", startTime: 96.5, endTime: 96.7 }, { text: "you", startTime: 96.8, endTime: 97.2 }, { text: "all...", startTime: 97.3, endTime: 98.0 }
    ],
    [
      { text: "Still", startTime: 100.2, endTime: 100.8 }, { text: "my", startTime: 100.8, endTime: 101.0 }, { text: "guitar", startTime: 101.1, endTime: 101.8 }, { text: "gently", startTime: 102.0, endTime: 102.6 }, { text: "weeps", startTime: 102.8, endTime: 103.6 }
    ],
    // Chorus 3 (Global time: 104s - 120s)
    [
      { text: "I", startTime: 104.0, endTime: 104.2 }, { text: "don't", startTime: 104.3, endTime: 104.7 }, { text: "know", startTime: 104.7, endTime: 105.0 }, { text: "why", startTime: 105.2, endTime: 105.8 },
      { text: "nobody", startTime: 106.2, endTime: 106.9 }, { text: "told", startTime: 107.0, endTime: 107.4 }, { text: "you", startTime: 107.4, endTime: 107.8 }
    ],
    [
      { text: "How", startTime: 108.0, endTime: 108.4 }, { text: "to", startTime: 108.4, endTime: 108.6 }, { text: "unfold", startTime: 109.0, endTime: 109.8 }, { text: "your", startTime: 110.2, endTime: 110.6 }, { text: "love", startTime: 110.8, endTime: 111.5 }
    ],
    [
      { text: "I", startTime: 112.0, endTime: 112.2 }, { text: "don't", startTime: 112.3, endTime: 112.7 }, { text: "know", startTime: 112.7, endTime: 113.0 }, { text: "how", startTime: 113.2, endTime: 113.8 },
      { text: "someone", startTime: 114.2, endTime: 114.9 }, { text: "controlled", startTime: 115.0, endTime: 115.6 }, { text: "you", startTime: 115.6, endTime: 115.9 }
    ],
    [
      { text: "They", startTime: 116.0, endTime: 116.4 }, { text: "bought", startTime: 116.6, endTime: 117.2 }, { text: "and", startTime: 117.4, endTime: 117.8 }, { text: "sold", startTime: 118.2, endTime: 118.8 }, { text: "you", startTime: 118.8, endTime: 119.2 }
    ],
  ],
  chords: [
    { chord: "Am", startTime: 0, endTime: 2 }, { chord: "G", startTime: 2, endTime: 4 }, { chord: "D/F#", startTime: 4, endTime: 6 }, { chord: "Fmaj7", startTime: 6, endTime: 8 },
    { chord: "Am", startTime: 8, endTime: 10 }, { chord: "G", startTime: 10, endTime: 12 }, { chord: "D/F#", startTime: 12, endTime: 14 }, { chord: "Fmaj7", startTime: 14, endTime: 16 },
    { chord: "Am", startTime: 16, endTime: 18 }, { chord: "G", startTime: 18, endTime: 20 }, { chord: "C", startTime: 20, endTime: 22 }, { chord: "E", startTime: 22, endTime: 24 },
    { chord: "A", startTime: 24, endTime: 26 }, { chord: "C#m", startTime: 26, endTime: 28 }, { chord: "F#m", startTime: 28, endTime: 30 }, { chord: "C#m", startTime: 30, endTime: 32 },
    { chord: "Bm", startTime: 32, endTime: 34 }, { chord: "E7", startTime: 34, endTime: 36 }, { chord: "A", startTime: 36, endTime: 38 }, { chord: "E", startTime: 38, endTime: 40 },
    { chord: "Am", startTime: 40, endTime: 42 }, { chord: "G", startTime: 42, endTime: 44 }, { chord: "D/F#", startTime: 44, endTime: 46 }, { chord: "Fmaj7", startTime: 46, endTime: 48 },
    { chord: "Am", startTime: 48, endTime: 50 }, { chord: "G", startTime: 50, endTime: 52 }, { chord: "C", startTime: 52, endTime: 54 }, { chord: "E", startTime: 54, endTime: 56 },
    { chord: "A", startTime: 56, endTime: 58 }, { chord: "C#m", startTime: 58, endTime: 60 }, { chord: "F#m", startTime: 60, endTime: 62 }, { chord: "C#m", startTime: 62, endTime: 64 },
    { chord: "Bm", startTime: 64, endTime: 66 }, { chord: "E7", startTime: 66, endTime: 68 }, { chord: "A", startTime: 68, endTime: 70 }, { chord: "E", startTime: 70, endTime: 72 },
    { chord: "Am", startTime: 72, endTime: 74 }, { chord: "G", startTime: 74, endTime: 76 }, { chord: "D/F#", startTime: 76, endTime: 78 }, { chord: "Fmaj7", startTime: 78, endTime: 80 },
    { chord: "Am", startTime: 80, endTime: 82 }, { chord: "G", startTime: 82, endTime: 84 }, { chord: "C", startTime: 84, endTime: 86 }, { chord: "E", startTime: 86, endTime: 88 },
    { chord: "Am", startTime: 88, endTime: 90 }, { chord: "G", startTime: 90, endTime: 92 }, { chord: "D/F#", startTime: 92, endTime: 94 }, { chord: "Fmaj7", startTime: 94, endTime: 96 },
    { chord: "Am", startTime: 96, endTime: 98 }, { chord: "G", startTime: 98, endTime: 100 }, { chord: "C", startTime: 100, endTime: 102 }, { chord: "E", startTime: 102, endTime: 104 },
    { chord: "A", startTime: 104, endTime: 106 }, { chord: "C#m", startTime: 106, endTime: 108 }, { chord: "F#m", startTime: 108, endTime: 110 }, { chord: "C#m", startTime: 110, endTime: 112 },
    { chord: "Bm", startTime: 112, endTime: 114 }, { chord: "E7", startTime: 114, endTime: 116 }, { chord: "A", startTime: 116, endTime: 118 }, { chord: "E", startTime: 118, endTime: 120 },
    { chord: "Am", startTime: 120, endTime: 122 }, { chord: "G", startTime: 122, endTime: 124 }, { chord: "D/F#", startTime: 124, endTime: 126 }, { chord: "Fmaj7", startTime: 126, endTime: 128 },
    { chord: "Am", startTime: 128, endTime: 130 }, { chord: "G", startTime: 130, endTime: 132 }, { chord: "D/F#", startTime: 132, endTime: 134 }, { chord: "Fmaj7", startTime: 134, endTime: 136 },
    { chord: "Am", startTime: 136, endTime: 138 }, { chord: "G", startTime: 138, endTime: 140 }, { chord: "D/F#", startTime: 140, endTime: 142 }, { chord: "Fmaj7", startTime: 142, endTime: 144 },
  ],
});

// --- Fully Detailed Song Data (Sample 2) ---
export const sultansOfSwingData: SongData = preProcessSongData({
  id: "ds-sultans",
  title: "Sultans of Swing",
  author: "Dire Straits",
  bpm: 148,
  key: "Dm",
  sections: [
    { id: "intro", name: "Intro Solo", duration: 16 }, // ~16.2s
    { id: "verse1", name: "Verse 1", duration: 16 }, // ~16.2s
    { id: "verse2", name: "Verse 2", duration: 16 },
    { id: "chorus1", name: "Chorus", duration: 8 }, // ~8.1s
    { id: "verse3", name: "Verse 3", duration: 16 },
    { id: "chorus2", name: "Chorus", duration: 8 },
    { id: "solo1", name: "Guitar Solo 1", duration: 32 }, // ~32.4s
    { id: "verse4", name: "Verse 4", duration: 16 },
    { id: "chorus3", name: "Chorus", duration: 8 },
    { id: "solo2", name: "Outro Solo", duration: 48 }, // ~48.6s, fades out
  ],
  lyrics: [
    // Verse 1 (Starts after 16s intro, duration 16s, ends 32s)
    [
      { text: "You", startTime: 16.0, endTime: 16.3 }, { text: "get", startTime: 16.3, endTime: 16.6 }, { text: "a", startTime: 16.6, endTime: 16.7 }, { text: "shiver", startTime: 16.8, endTime: 17.4 }, { text: "in", startTime: 17.4, endTime: 17.6 }, { text: "the", startTime: 17.6, endTime: 17.8 }, { text: "dark", startTime: 17.9, endTime: 18.4 },
    ],
    [
      { text: "It's", startTime: 18.6, endTime: 18.9 }, { text: "raining", startTime: 19.0, endTime: 19.5 }, { text: "in", startTime: 19.5, endTime: 19.7 }, { text: "the", startTime: 19.7, endTime: 19.9 }, { text: "park", startTime: 20.0, endTime: 20.5 }, { text: "but", startTime: 20.5, endTime: 20.8 }, { text: "meantime", startTime: 20.9, endTime: 21.8 },
    ],
    [
      { text: "South", startTime: 22.4, endTime: 22.9 }, { text: "of", startTime: 22.9, endTime: 23.1 }, { text: "the", startTime: 23.1, endTime: 23.3 }, { text: "river", startTime: 23.4, endTime: 24.0 }, { text: "you", startTime: 24.1, endTime: 24.4 }, { text: "stop", startTime: 24.4, endTime: 24.7 }, { text: "and", startTime: 24.7, endTime: 24.9 }, { text: "you", startTime: 24.9, endTime: 25.1 }, { text: "hold", startTime: 25.2, endTime: 25.6 }, { text: "everything", startTime: 25.7, endTime: 26.4 }
    ],
    [
      { text: "A", startTime: 27.0, endTime: 27.2 }, { text: "band", startTime: 27.2, endTime: 27.6 }, { text: "is", startTime: 27.6, endTime: 27.8 }, { text: "blowing", startTime: 27.9, endTime: 28.5 }, { text: "Dixie", startTime: 28.7, endTime: 29.3 }, { text: "double", startTime: 29.4, endTime: 29.9 }, { text: "four", startTime: 29.9, endTime: 30.2 }, { text: "time", startTime: 30.3, endTime: 30.8 }
    ],
    [
      { text: "You", startTime: 31.0, endTime: 31.2 }, { text: "feel", startTime: 31.2, endTime: 31.5 }, { text: "alright", startTime: 31.6, endTime: 32.0 }, { text: "when", startTime: 32.0, endTime: 32.2 }, { text: "you", startTime: 32.2, endTime: 32.4 }, { text: "hear", startTime: 32.5, endTime: 32.8 }, { text: "the", startTime: 32.8, endTime: 33.0 }, { text: "music", startTime: 33.1, endTime: 33.6 }, { text: "ring", startTime: 33.7, endTime: 34.1 }
    ],
    // Verse 2 (Starts 32s, duration 16s, ends 48s)
    [
      { text: "Well", startTime: 34.4, endTime: 34.7 }, { text: "now", startTime: 34.7, endTime: 34.9 }, { text: "you", startTime: 34.9, endTime: 35.1 }, { text: "step", startTime: 35.2, endTime: 35.6 }, { text: "inside", startTime: 35.7, endTime: 36.3 }, { text: "but", startTime: 36.3, endTime: 36.5 }, { text: "you", startTime: 36.5, endTime: 36.7 }, { text: "don't", startTime: 36.7, endTime: 37.0 }, { text: "see", startTime: 37.0, endTime: 37.2 }, { text: "too", startTime: 37.2, endTime: 37.4 }, { text: "many", startTime: 37.5, endTime: 37.9 }, { text: "faces", startTime: 38.0, endTime: 38.6 }
    ],
    [
      { text: "Coming", startTime: 39.0, endTime: 39.5 }, { text: "in", startTime: 39.5, endTime: 39.7 }, { text: "out", startTime: 39.7, endTime: 40.0 }, { text: "of", startTime: 40.0, endTime: 40.2 }, { text: "the", startTime: 40.2, endTime: 40.4 }, { text: "rain", startTime: 40.5, endTime: 40.9 }, { text: "to", startTime: 40.9, endTime: 41.1 }, { text: "hear", startTime: 41.2, endTime: 41.5 }, { text: "the", startTime: 41.5, endTime: 41.7 }, { text: "jazz", startTime: 41.8, endTime: 42.3 }, { text: "go", startTime: 42.3, endTime: 42.5 }, { text: "down", startTime: 42.6, endTime: 43.0 }
    ],
    [
      { text: "Competition", startTime: 43.8, endTime: 44.8 }, { text: "in", startTime: 44.8, endTime: 45.0 }, { text: "other", startTime: 45.1, endTime: 45.5 }, { text: "places", startTime: 45.6, endTime: 46.3 }
    ],
    [
      { text: "Oh", startTime: 46.5, endTime: 46.8 }, { text: "but", startTime: 46.8, endTime: 47.0 }, { text: "the", startTime: 47.0, endTime: 47.2 }, { text: "horns", startTime: 47.3, endTime: 47.7 }, { text: "they", startTime: 47.7, endTime: 47.9 }, { text: "blowin'", startTime: 48.0, endTime: 48.4 }, { text: "that", startTime: 48.4, endTime: 48.6 }, { text: "sound", startTime: 48.7, endTime: 49.2 }
    ],
    // Chorus 1 (Starts 48s, duration 8s, ends 56s) - existing, checked
    [
      { text: "Way", startTime: 49.8, endTime: 50.2 }, { text: "on", startTime: 50.2, endTime: 50.4 }, { text: "down", startTime: 50.4, endTime: 50.7 }, { text: "south,", startTime: 50.8, endTime: 51.3 }, { text: "way", startTime: 51.4, endTime: 51.7 }, { text: "on", startTime: 51.7, endTime: 51.9 }, { text: "down", startTime: 51.9, endTime: 52.2 }, { text: "south", startTime: 52.3, endTime: 52.8 }, { text: "London", startTime: 52.9, endTime: 53.4 }, { text: "town", startTime: 53.5, endTime: 54.0 }
    ],
    // Verse 3 (Starts 56s, duration 16s, ends 72s)
    [
      { text: "Check", startTime: 56.0, endTime: 56.4 }, { text: "out", startTime: 56.4, endTime: 56.7 }, { text: "Guitar", startTime: 56.8, endTime: 57.4 }, { text: "George,", startTime: 57.5, endTime: 58.1 }, { text: "he", startTime: 58.1, endTime: 58.3 }, { text: "knows", startTime: 58.4, endTime: 58.7 }, { text: "all", startTime: 58.7, endTime: 58.9 }, { text: "the", startTime: 58.9, endTime: 59.1 }, { text: "chords", startTime: 59.2, endTime: 59.8 }
    ],
    [
      { text: "Mind", startTime: 60.0, endTime: 60.3 }, { text: "he's", startTime: 60.3, endTime: 60.5 }, { text: "strictly", startTime: 60.6, endTime: 61.2 }, { text: "rhythm,", startTime: 61.3, endTime: 61.9 }, { text: "he", startTime: 61.9, endTime: 62.1 }, { text: "doesn't", startTime: 62.2, endTime: 62.6 }, { text: "want", startTime: 62.6, endTime: 62.8 }, { text: "to", startTime: 62.8, endTime: 63.0 }, { text: "make", startTime: 63.1, endTime: 63.4 }, { text: "it", startTime: 63.4, endTime: 63.6 }, { text: "cry", startTime: 63.7, endTime: 64.0 }, { text: "or", startTime: 64.0, endTime: 64.2 }, { text: "sing", startTime: 64.3, endTime: 64.7 }
    ],
    [
      { text: "Yes", startTime: 65.0, endTime: 65.3 }, { text: "and", startTime: 65.3, endTime: 65.5 }, { text: "an", startTime: 65.5, endTime: 65.7 }, { text: "old", startTime: 65.8, endTime: 66.1 }, { text: "guitar", startTime: 66.2, endTime: 66.8 }, { text: "is", startTime: 66.8, endTime: 67.0 }, { text: "all", startTime: 67.0, endTime: 67.2 }, { text: "he", startTime: 67.2, endTime: 67.4 }, { text: "can", startTime: 67.4, endTime: 67.6 }, { text: "afford", startTime: 67.7, endTime: 68.4 }
    ],
    [
      { text: "When", startTime: 68.8, endTime: 69.1 }, { text: "he", startTime: 69.1, endTime: 69.3 }, { text: "gets", startTime: 69.4, endTime: 69.7 }, { text: "up", startTime: 69.7, endTime: 69.9 }, { text: "under", startTime: 70.0, endTime: 70.4 }, { text: "the", startTime: 70.4, endTime: 70.6 }, { text: "lights", startTime: 70.7, endTime: 71.2 }, { text: "to", startTime: 71.2, endTime: 71.4 }, { text: "play", startTime: 71.5, endTime: 71.9 }, { text: "his", startTime: 71.9, endTime: 72.1 }, { text: "thing", startTime: 72.2, endTime: 72.6 }
    ],
     // Chorus 2 (Starts 72s, duration 8s, ends 80s)
    [
      { text: "And", startTime: 72.8, endTime: 73.1 }, { text: "Harry's", startTime: 73.2, endTime: 73.7 }, { text: "dalmation", startTime: 73.8, endTime: 74.5 }, { text: "plantation,", startTime: 74.6, endTime: 75.3 }, { text: "he", startTime: 75.3, endTime: 75.5 }, { text: "don't", startTime: 75.5, endTime: 75.8 }, { text: "envy", startTime: 75.9, endTime: 76.3 }, { text: "him", startTime: 76.3, endTime: 76.5 }
    ],
    [
      { text: "Way", startTime: 77.8, endTime: 78.2 }, { text: "on", startTime: 78.2, endTime: 78.4 }, { text: "down", startTime: 78.4, endTime: 78.7 }, { text: "south,", startTime: 78.8, endTime: 79.3 }, { text: "way", startTime: 79.4, endTime: 79.7 }, { text: "on", startTime: 79.7, endTime: 79.9 }, { text: "down", startTime: 79.9, endTime: 80.2 }, { text: "south", startTime: 80.3, endTime: 80.8 }, { text: "London", startTime: 80.9, endTime: 81.4 }, { text: "town", startTime: 81.5, endTime: 82.0 }
    ],
    // Solo 1 is from 80s to 112s (32s duration)
    // Verse 4 (Starts 112s, duration 16s, ends 128s)
    [
      { text: "And", startTime: 112.0, endTime: 112.3 }, { text: "a", startTime: 112.3, endTime: 112.4 }, { text: "crowd", startTime: 112.5, endTime: 113.0 }, { text: "of", startTime: 113.0, endTime: 113.2 }, { text: "young", startTime: 113.3, endTime: 113.7 }, { text: "boys,", startTime: 113.8, endTime: 114.3 }, { text: "they're", startTime: 114.3, endTime: 114.5 }, { text: "fooling", startTime: 114.6, endTime: 115.1 }, { text: "around", startTime: 115.2, endTime: 115.7 }, { text: "in", startTime: 115.7, endTime: 115.9 }, { text: "the", startTime: 115.9, endTime: 116.1 }, { text: "corner", startTime: 116.2, endTime: 116.8 }
    ],
    [
      { text: "Drunk", startTime: 117.0, endTime: 117.4 }, { text: "and", startTime: 117.4, endTime: 117.6 }, { text: "dressed", startTime: 117.7, endTime: 118.3 }, { text: "in", startTime: 118.3, endTime: 118.5 }, { text: "their", startTime: 118.5, endTime: 118.7 }, { text: "best", startTime: 118.8, endTime: 119.2 }, { text: "brown", startTime: 119.3, endTime: 119.7 }, { text: "baggies", startTime: 119.8, endTime: 120.4 }, { text: "and", startTime: 120.4, endTime: 120.6 }, { text: "their", startTime: 120.6, endTime: 120.8 }, { text: "platform", startTime: 120.9, endTime: 121.5 }, { text: "soles", startTime: 121.6, endTime: 122.2 }
    ],
    [
      { text: "They", startTime: 122.8, endTime: 123.1 }, { text: "don't", startTime: 123.2, endTime: 123.5 }, { text: "give", startTime: 123.5, endTime: 123.7 }, { text: "a", startTime: 123.7, endTime: 123.8 }, { text: "damn", startTime: 123.9, endTime: 124.4 }, { text: "about", startTime: 124.5, endTime: 124.9 }, { text: "any", startTime: 125.0, endTime: 125.4 }, { text: "trumpet", startTime: 125.5, endTime: 126.1 }, { text: "playing", startTime: 126.2, endTime: 126.7 }, { text: "band", startTime: 126.8, endTime: 127.3 }
    ],
    [
      { text: "It", startTime: 127.5, endTime: 127.7 }, { text: "ain't", startTime: 127.8, endTime: 128.1 }, { text: "what", startTime: 128.1, endTime: 128.3 }, { text: "they", startTime: 128.3, endTime: 128.5 }, { text: "call", startTime: 128.6, endTime: 129.0 }, { text: "Rock", startTime: 129.1, endTime: 129.5 }, { text: "and", startTime: 129.5, endTime: 129.7 }, { text: "Roll", startTime: 129.8, endTime: 130.3 }
    ],
    // Chorus 3 (Starts 128s, duration 8s, ends 136s) - this overlaps with previous line end, adjust timings or assume fast vocal.
    [
      { text: "And", startTime: 130.4, endTime: 130.7 }, { text: "the", startTime: 130.7, endTime: 130.9 }, { text: "Sultans,", startTime: 131.0, endTime: 131.7 }, { text: "yeah", startTime: 131.7, endTime: 131.9 }, { text: "the", startTime: 131.9, endTime: 132.1 }, { text: "Sultans,", startTime: 132.2, endTime: 132.9 }, { text: "they", startTime: 132.9, endTime: 133.1 }, { text: "play", startTime: 133.2, endTime: 133.6 }, { text: "Creole", startTime: 133.7, endTime: 134.4 }
    ],
    [
      { text: "Way", startTime: 134.6, endTime: 135.0 }, { text: "on", startTime: 135.0, endTime: 135.2 }, { text: "down", startTime: 135.2, endTime: 135.5 }, { text: "south,", startTime: 135.6, endTime: 136.1 }, { text: "way", startTime: 136.2, endTime: 136.5 }, { text: "on", startTime: 136.5, endTime: 136.7 }, { text: "down", startTime: 136.7, endTime: 137.0 }, { text: "south", startTime: 137.1, endTime: 137.6 }, { text: "London", startTime: 137.7, endTime: 138.2 }, { text: "town", startTime: 138.3, endTime: 138.8 }
    ],
  ],
  chords: [
    // Intro / Solo
    { chord: "Dm", startTime: 0, endTime: 4 }, { chord: "C", startTime: 4, endTime: 6 }, { chord: "Bb", startTime: 6, endTime: 8 }, { chord: "A", startTime: 8, endTime: 12 }, { chord: "Dm", startTime: 12, endTime: 16 },
    // Verse 1
    { chord: "Dm", startTime: 16, endTime: 20 }, { chord: "C", startTime: 20, endTime: 22 }, { chord: "Bb", startTime: 22, endTime: 24 }, { chord: "A", startTime: 24, endTime: 28 }, { chord: "Dm", startTime: 28, endTime: 32 },
    // Verse 2
    { chord: "Dm", startTime: 32, endTime: 36 }, { chord: "C", startTime: 36, endTime: 38 }, { chord: "Bb", startTime: 38, endTime: 40 }, { chord: "A", startTime: 40, endTime: 44 }, { chord: "Dm", startTime: 44, endTime: 48 },
    // Chorus 1
    { chord: "F", startTime: 48, endTime: 50 }, { chord: "C", startTime: 50, endTime: 52 }, { chord: "Bb", startTime: 52, endTime: 54 }, { chord: "Dm", startTime: 54, endTime: 56 },
    // Verse 3
    { chord: "Dm", startTime: 56, endTime: 60 }, { chord: "C", startTime: 60, endTime: 62 }, { chord: "Bb", startTime: 62, endTime: 64 }, { chord: "A", startTime: 64, endTime: 68 }, { chord: "Dm", startTime: 68, endTime: 72 },
    // Chorus 2
    { chord: "F", startTime: 72, endTime: 74 }, { chord: "C", startTime: 74, endTime: 76 }, { chord: "Bb", startTime: 76, endTime: 78 }, { chord: "Dm", startTime: 78, endTime: 80 },
    // Solo 1
    { chord: "Dm", startTime: 80, endTime: 84 }, { chord: "C", startTime: 84, endTime: 88 }, { chord: "Bb", startTime: 88, endTime: 92 }, { chord: "A", startTime: 92, endTime: 96 },
    { chord: "Dm", startTime: 96, endTime: 100 }, { chord: "Gm", startTime: 100, endTime: 104 }, { chord: "A", startTime: 104, endTime: 108 }, { chord: "Dm", startTime: 108, endTime: 112 },
     // Verse 4
    { chord: "Dm", startTime: 112, endTime: 116 }, { chord: "C", startTime: 116, endTime: 118 }, { chord: "Bb", startTime: 118, endTime: 120 }, { chord: "A", startTime: 120, endTime: 124 }, { chord: "Dm", startTime: 124, endTime: 128 },
    // Chorus 3
    { chord: "F", startTime: 128, endTime: 130 }, { chord: "C", startTime: 130, endTime: 132 }, { chord: "Bb", startTime: 132, endTime: 134 }, { chord: "Dm", startTime: 134, endTime: 136 },
    // Outro Solo
    { chord: "Dm", startTime: 136, endTime: 140 }, { chord: "C", startTime: 140, endTime: 144 }, { chord: "Bb", startTime: 144, endTime: 148 }, { chord: "A", startTime: 148, endTime: 152 },
    { chord: "Dm", startTime: 152, endTime: 184 }, // Extended for fade
  ]
});

// --- Fully Detailed Song Data (Sample 3) ---
export const stairwayToHeavenData: SongData = preProcessSongData({
  id: "lz-stairway",
  title: "Stairway to Heaven",
  author: "Led Zeppelin",
  bpm: 82, // Average, varies throughout
  key: "Am",
  sections: [
    { id: "intro", name: "Intro (Acoustic)", duration: 32 }, // ~31.7s
    { id: "verse1", name: "Verse 1 (Flute)", duration: 32 },
    { id: "verse2", name: "Verse 2", duration: 32 },
    { id: "bridge", name: "Bridge", duration: 16 }, // ~15.8s
    { id: "soloBuild", name: "Solo Build-up", duration: 16 }, // Starts at 112s, ends at 128s
    { id: "solo", name: "Guitar Solo", duration: 48 }, // ~47.3s
    { id: "verse3", name: "Verse 3 (Faster)", duration: 32 },
    { id: "outro", name: "Outro", duration: 24 }, // ~23.6s
  ],
  lyrics: [
    // Verse 1 (Starts after 32s intro)
    [
      { text: "There's", startTime: 32.0, endTime: 32.5 }, { text: "a", startTime: 32.5, endTime: 32.6 }, { text: "lady", startTime: 32.7, endTime: 33.3 }, { text: "who's", startTime: 33.3, endTime: 33.6 }, { text: "sure", startTime: 33.7, endTime: 34.2 },
    ],
    [
      { text: "All", startTime: 34.5, endTime: 34.8 }, { text: "that", startTime: 34.8, endTime: 35.1 }, { text: "glitters", startTime: 35.3, endTime: 36.0 }, { text: "is", startTime: 36.0, endTime: 36.2 }, { text: "gold", startTime: 36.3, endTime: 37.0 },
    ],
    [
      { text: "And", startTime: 37.5, endTime: 37.8 }, { text: "she's", startTime: 37.8, endTime: 38.1 }, { text: "buying", startTime: 38.3, endTime: 39.0 }, { text: "a", startTime: 39.0, endTime: 39.1 }, { text: "stairway", startTime: 39.3, endTime: 40.3 }, { text: "to", startTime: 40.3, endTime: 40.5 }, { text: "heaven", startTime: 40.6, endTime: 41.5 },
    ],
    // Verse 2 (Starts at 64s)
    [
        { text: "When", startTime: 64.0, endTime: 64.4 }, { text: "she", startTime: 64.4, endTime: 64.6 }, { text: "gets", startTime: 64.7, endTime: 65.2 }, { text: "there", startTime: 65.2, endTime: 65.6 }, { text: "she", startTime: 65.6, endTime: 65.8 }, { text: "knows", startTime: 65.9, endTime: 66.4 }
    ],
    [
        { text: "If", startTime: 66.8, endTime: 67.1 }, { text: "the", startTime: 67.1, endTime: 67.3 }, { text: "stores", startTime: 67.4, endTime: 68.0 }, { text: "are", startTime: 68.0, endTime: 68.2 }, { text: "all", startTime: 68.2, endTime: 68.4 }, { text: "closed", startTime: 68.5, endTime: 69.2 }
    ],
    [
        { text: "With", startTime: 69.6, endTime: 70.0 }, { text: "a", startTime: 70.0, endTime: 70.1 }, { text: "word", startTime: 70.2, endTime: 70.6 }, { text: "she", startTime: 70.6, endTime: 70.8 }, { text: "can", startTime: 70.9, endTime: 71.2 }, { text: "get", startTime: 71.3, endTime: 71.6 }, { text: "what", startTime: 71.6, endTime: 71.8 }, { text: "she", startTime: 71.8, endTime: 72.0 }, { text: "came", startTime: 72.1, endTime: 72.5 }, { text: "for", startTime: 72.6, endTime: 73.0 }
    ],
    // Bridge (Global time: 96s - 112s)
    [ 
      { text: "Ooh,", startTime: 96.0, endTime: 97.0 }, { text: "it", startTime: 97.2, endTime: 97.5 }, 
      { text: "makes", startTime: 97.6, endTime: 98.2 }, { text: "me", startTime: 98.2, endTime: 98.5 }, 
      { text: "wonder", startTime: 98.8, endTime: 99.8 } 
    ],
    [ { text: "", startTime: 100.0, endTime: 100.1 } ], // Anchor for Am chord
    [ { text: "", startTime: 102.0, endTime: 102.1 } ], // Anchor for F chord
    [ { text: "", startTime: 104.0, endTime: 104.1 } ], // Anchor for C chord
    [ { text: "", startTime: 106.0, endTime: 106.1 } ], // Anchor for G/B chord
    [ { text: "", startTime: 108.0, endTime: 108.1 } ], // Anchor for F chord
    // Solo Build-up (Global time: 112s - 128s)
    [ { text: "", startTime: 112.0, endTime: 112.1 } ], // Anchor for Am chord
    [ { text: "", startTime: 116.0, endTime: 116.1 } ], // Anchor for G chord
    [ { text: "", startTime: 120.0, endTime: 120.1 } ], // Anchor for F chord
    [ { text: "", startTime: 124.0, endTime: 124.1 } ], // Anchor for G chord
    // Verse 3 (Faster) (Starts 176s)
    [
        { text: "And", startTime: 176.0, endTime: 176.4 }, { text: "as", startTime: 176.4, endTime: 176.6 }, { text: "we", startTime: 176.7, endTime: 177.0 }, { text: "wind", startTime: 177.1, endTime: 177.5 }, { text: "on", startTime: 177.5, endTime: 177.7 }, { text: "down", startTime: 177.8, endTime: 178.2 }, { text: "the", startTime: 178.2, endTime: 178.4 }, { text: "road", startTime: 178.5, endTime: 179.2 }
    ],
    [
        { text: "Our", startTime: 180.0, endTime: 180.4 }, { text: "shadows", startTime: 180.5, endTime: 181.2 }, { text: "taller", startTime: 181.3, endTime: 181.8 }, { text: "than", startTime: 181.8, endTime: 182.0 }, { text: "our", startTime: 182.1, endTime: 182.4 }, { text: "soul", startTime: 182.5, endTime: 183.2 }
    ],
  ],
  chords: [
    // Intro
    { chord: "Am", startTime: 0, endTime: 2 }, { chord: "G#+", startTime: 2, endTime: 4 }, { chord: "C/G", startTime: 4, endTime: 6 }, { chord: "D/F#", startTime: 6, endTime: 8 },
    { chord: "Fmaj7", startTime: 8, endTime: 12 }, { chord: "G/B", startTime: 12, endTime: 14 }, { chord: "Am", startTime: 14, endTime: 16 },
    { chord: "Am", startTime: 16, endTime: 18 }, { chord: "G#+", startTime: 18, endTime: 20 }, { chord: "C/G", startTime: 20, endTime: 22 }, { chord: "D/F#", startTime: 22, endTime: 24 },
    { chord: "Fmaj7", startTime: 24, endTime: 28 }, { chord: "G/B", startTime: 28, endTime: 30 }, { chord: "Am", startTime: 30, endTime: 32 },
    // Verse 1 & 2 (similar) - These chords align fairly well with the example lyrics provided
    { chord: "Am", startTime: 32, endTime: 36 }, { chord: "G", startTime: 36, endTime: 40 }, { chord: "Fmaj7", startTime: 40, endTime: 44 }, { chord: "G", startTime: 44, endTime: 48 },
    { chord: "Am", startTime: 48, endTime: 52 }, { chord: "G", startTime: 52, endTime: 56 }, { chord: "Fmaj7", startTime: 56, endTime: 60 }, { chord: "G", startTime: 60, endTime: 64 },
    //Verse 2
    { chord: "Am", startTime: 64, endTime: 68 }, { chord: "G", startTime: 68, endTime: 72 }, { chord: "Fmaj7", startTime: 72, endTime: 76 }, { chord: "G", startTime: 76, endTime: 80 },
    { chord: "Am", startTime: 80, endTime: 84 }, { chord: "G", startTime: 84, endTime: 88 }, { chord: "Fmaj7", startTime: 88, endTime: 92 }, { chord: "G", startTime: 92, endTime: 96 },
    // Bridge Chords (96s - 112s)
    { chord: "C", startTime: 96, endTime: 98 }, 
    { chord: "G/B", startTime: 98, endTime: 100 }, 
    { chord: "Am", startTime: 100, endTime: 102 }, 
    { chord: "F", startTime: 102, endTime: 104 },
    { chord: "C", startTime: 104, endTime: 106 }, 
    { chord: "G/B", startTime: 106, endTime: 108 }, 
    { chord: "F", startTime: 108, endTime: 112 }, 
    // Solo Build-up Chords (112s - 128s)
    { chord: "Am", startTime: 112, endTime: 116 },
    { chord: "G", startTime: 116, endTime: 120 },
    { chord: "F", startTime: 120, endTime: 124 },
    { chord: "G", startTime: 124, endTime: 128 },
    // Solo (Am, G, F typically)
    { chord: "Am", startTime: 128, endTime: 136 }, { chord: "G", startTime: 136, endTime: 144 }, { chord: "F", startTime: 144, endTime: 152 },
    { chord: "Am", startTime: 152, endTime: 160 }, { chord: "G", startTime: 160, endTime: 168 }, { chord: "F", startTime: 168, endTime: 176 },
    // Verse 3 (Faster)
    { chord: "Am", startTime: 176, endTime: 180 }, { chord: "G", startTime: 180, endTime: 184 }, { chord: "C", startTime: 184, endTime: 188 }, { chord: "F", startTime: 188, endTime: 192 },
    { chord: "Am", startTime: 192, endTime: 196 }, { chord: "G", startTime: 196, endTime: 200 }, { chord: "F", startTime: 200, endTime: 208 },
    // Outro
    { chord: "Am", startTime: 208, endTime: 232 }, // Fades
  ]
});


// This is the generic placeholder for songs without detailed data.
export const placeholderPlayableSongData: SongData = preProcessSongData({
  id: "placeholder-song",
  title: "Placeholder Song",
  author: "Placeholder Artist",
  bpm: 120,
  key: "C",
  sections: [
    { id: "verse1", name: "Verse 1", duration: 8 },
    { id: "chorus1", name: "Chorus 1", duration: 8 },
    { id: "verse2", name: "Verse 2", duration: 8 },
    { id: "chorus2", name: "Chorus 2", duration: 8 },
  ],
  lyrics: [], // Empty lyrics
  chords: [ // Generic 4-chord progression repeated
    { chord: "C", startTime: 0, endTime: 2 }, { chord: "G", startTime: 2, endTime: 4 }, { chord: "Am", startTime: 4, endTime: 6 }, { chord: "F", startTime: 6, endTime: 8 },
    { chord: "C", startTime: 8, endTime: 10 }, { chord: "G", startTime: 10, endTime: 12 }, { chord: "Am", startTime: 12, endTime: 14 }, { chord: "F", startTime: 14, endTime: 16 },
    { chord: "C", startTime: 16, endTime: 18 }, { chord: "G", startTime: 18, endTime: 20 }, { chord: "Am", startTime: 20, endTime: 22 }, { chord: "F", startTime: 22, endTime: 24 },
    { chord: "C", startTime: 24, endTime: 26 }, { chord: "G", startTime: 26, endTime: 28 }, { chord: "Am", startTime: 28, endTime: 30 }, { chord: "F", startTime: 30, endTime: 32 },
  ],
});


// --- Song Catalog Metadata (used for selection lists) ---
export const ARTISTS: Artist[] = [
  { id: "beatles", name: "The Beatles" },
  { id: "direstraits", name: "Dire Straits" },
  { id: "ledzeppelin", name: "Led Zeppelin" },
  { id: "aerosmith", name: "Aerosmith" },
  { id: "gunsnroses", name: "Guns N' Roses" },
  { id: "radiohead", name: "Radiohead" },
  { id: "coldplay", name: "Coldplay" },
];

export const SONGS: SongEntry[] = [
  // The Beatles
  { id: "beatles-wmgw", title: "While My Guitar Gently Weeps", artistId: "beatles", artistName: "The Beatles", key: "Am / A", bpm: 116 },
  { id: "beatles-heyjude", title: "Hey Jude", artistId: "beatles", artistName: "The Beatles", key: "F", bpm: 74 },
  { id: "beatles-letitbe", title: "Let It Be", artistId: "beatles", artistName: "The Beatles", key: "C", bpm: 70 },
  { id: "beatles-yesterday", title: "Yesterday", artistId: "beatles", artistName: "The Beatles", key: "F", bpm: 96 },
  { id: "beatles-cometogether", title: "Come Together", artistId: "beatles", artistName: "The Beatles", key: "Dm", bpm: 82 },
  { id: "beatles-twistandshout", title: "Twist and Shout", artistId: "beatles", artistName: "The Beatles", key: "D", bpm: 124 },
  { id: "beatles-herecomesthesun", title: "Here Comes the Sun", artistId: "beatles", artistName: "The Beatles", key: "D", bpm: 129 },
  { id: "beatles-blackbird", title: "Blackbird", artistId: "beatles", artistName: "The Beatles", key: "G", bpm: 94 },
  { id: "beatles-inmylife", title: "In My Life", artistId: "beatles", artistName: "The Beatles", key: "A", bpm: 102 },
  { id: "beatles-strawberryfields", title: "Strawberry Fields Forever", artistId: "beatles", artistName: "The Beatles", key: "A", bpm: 98 },

  // Dire Straits
  { id: "ds-sultans", title: "Sultans of Swing", artistId: "direstraits", artistName: "Dire Straits", key: "Dm", bpm: 148 },
  { id: "ds-money", title: "Money for Nothing", artistId: "direstraits", artistName: "Dire Straits", key: "Gm", bpm: 134 },
  { id: "ds-romeo", title: "Romeo and Juliet", artistId: "direstraits", artistName: "Dire Straits", key: "F", bpm: 120 },
  { id: "ds-walk", title: "Walk of Life", artistId: "direstraits", artistName: "Dire Straits", key: "E", bpm: 172 },
  { id: "ds-brothers", title: "Brothers in Arms", artistId: "direstraits", artistName: "Dire Straits", key: "G#m", bpm: 80 },
  { id: "ds-private", title: "Private Investigations", artistId: "direstraits", artistName: "Dire Straits", key: "Am", bpm: 60 },
  { id: "ds-tunnel", title: "Tunnel of Love", artistId: "direstraits", artistName: "Dire Straits", key: "F", bpm: 140 },
  { id: "ds-telegraph", title: "Telegraph Road", artistId: "direstraits", artistName: "Dire Straits", key: "Am", bpm: 120 },
  { id: "ds-sofar", title: "So Far Away", artistId: "direstraits", artistName: "Dire Straits", key: "A", bpm: 100 },
  { id: "ds-latesttrick", title: "Your Latest Trick", artistId: "direstraits", artistName: "Dire Straits", key: "F#m", bpm: 120 },

  // Led Zeppelin
  { id: "lz-stairway", title: "Stairway to Heaven", artistId: "ledzeppelin", artistName: "Led Zeppelin", key: "Am", bpm: 82 },
  { id: "lz-wholelotta", title: "Whole Lotta Love", artistId: "ledzeppelin", artistName: "Led Zeppelin", key: "E", bpm: 90 },
  { id: "lz-kashmir", title: "Kashmir", artistId: "ledzeppelin", artistName: "Led Zeppelin", key: "D", bpm: 80 },
  { id: "lz-blackdog", title: "Black Dog", artistId: "ledzeppelin", artistName: "Led Zeppelin", key: "A", bpm: 82 },
  { id: "lz-immigrant", title: "Immigrant Song", artistId: "ledzeppelin", artistName: "Led Zeppelin", key: "F#m", bpm: 112 },
  { id: "lz-rocknroll", title: "Rock and Roll", artistId: "ledzeppelin", artistName: "Led Zeppelin", key: "A", bpm: 170 },
  { id: "lz-rambleon", title: "Ramble On", artistId: "ledzeppelin", artistName: "Led Zeppelin", key: "G", bpm: 100 },
  { id: "lz-dazed", title: "Dazed and Confused", artistId: "ledzeppelin", artistName: "Led Zeppelin", key: "E", bpm: 60 },
  { id: "lz-heartbreaker", title: "Heartbreaker", artistId: "ledzeppelin", artistName: "Led Zeppelin", key: "A", bpm: 98 },
  { id: "lz-sinceive", title: "Since I've Been Loving You", artistId: "ledzeppelin", artistName: "Led Zeppelin", key: "Cm", bpm: 50 },

  // Aerosmith
  { id: "as-dreamon", title: "Dream On", artistId: "aerosmith", artistName: "Aerosmith", key: "Fm", bpm: 80 },
  { id: "as-sweetemotion", title: "Sweet Emotion", artistId: "aerosmith", artistName: "Aerosmith", key: "A", bpm: 96 },
  { id: "as-walkthisway", title: "Walk This Way", artistId: "aerosmith", artistName: "Aerosmith", key: "C", bpm: 108 },
  { id: "as-idontwant", title: "I Don't Want to Miss a Thing", artistId: "aerosmith", artistName: "Aerosmith", key: "D", bpm: 121 },
  { id: "as-crazy", title: "Crazy", artistId: "aerosmith", artistName: "Aerosmith", key: "A", bpm: 140 },
  { id: "as-janiesgotagun", title: "Janie's Got a Gun", artistId: "aerosmith", artistName: "Aerosmith", key: "D", bpm: 94 },
  { id: "as-cryin", title: "Cryin'", artistId: "aerosmith", artistName: "Aerosmith", key: "A", bpm: 134 },
  { id: "as-livinontheedge", title: "Livin' on the Edge", artistId: "aerosmith", artistName: "Aerosmith", key: "D", bpm: 98 },
  { id: "as-dude", title: "Dude (Looks Like a Lady)", artistId: "aerosmith", artistName: "Aerosmith", key: "F", bpm: 120 },
  { id: "as-loveinanelevator", title: "Love in an Elevator", artistId: "aerosmith", artistName: "Aerosmith", key: "C", bpm: 120 },

  // Guns N' Roses
  { id: "gnr-sweetchild", title: "Sweet Child o' Mine", artistId: "gunsnroses", artistName: "Guns N' Roses", key: "Db", bpm: 125 },
  { id: "gnr-welcome", title: "Welcome to the Jungle", artistId: "gunsnroses", artistName: "Guns N' Roses", key: "B", bpm: 122 },
  { id: "gnr-november", title: "November Rain", artistId: "gunsnroses", artistName: "Guns N' Roses", key: "C", bpm: 72 },
  { id: "gnr-paradise", title: "Paradise City", artistId: "gunsnroses", artistName: "Guns N' Roses", key: "G", bpm: 100 },
  { id: "gnr-dontcry", title: "Don't Cry", artistId: "gunsnroses", artistName: "Guns N' Roses", key: "Am", bpm: 65 },
  { id: "gnr-patience", title: "Patience", artistId: "gunsnroses", artistName: "Guns N' Roses", key: "G", bpm: 120 },
  { id: "gnr-civilwar", title: "Civil War", artistId: "gunsnroses", artistName: "Guns N' Roses", key: "Am", bpm: 75 },
  { id: "gnr-knockin", title: "Knockin' on Heaven's Door", artistId: "gunsnroses", artistName: "Guns N' Roses", key: "G", bpm: 68 },
  { id: "gnr-youcouldbemine", title: "You Could Be Mine", artistId: "gunsnroses", artistName: "Guns N' Roses", key: "F#m", bpm: 130 },
  { id: "gnr-estranged", title: "Estranged", artistId: "gunsnroses", artistName: "Guns N' Roses", key: "F", bpm: 70 },

  // Radiohead
  { id: "rh-creep", title: "Creep", artistId: "radiohead", artistName: "Radiohead", key: "G", bpm: 92 },
  { id: "rh-karma", title: "Karma Police", artistId: "radiohead", artistName: "Radiohead", key: "Am", bpm: 76 },
  { id: "rh-paranoid", title: "Paranoid Android", artistId: "radiohead", artistName: "Radiohead", key: "Gm", bpm: 82 },
  { id: "rh-nosurprises", title: "No Surprises", artistId: "radiohead", artistName: "Radiohead", key: "F", bpm: 77 },
  { id: "rh-highndry", title: "High and Dry", artistId: "radiohead", artistName: "Radiohead", key: "E", bpm: 86 },
  { id: "rh-fakeplastic", title: "Fake Plastic Trees", artistId: "radiohead", artistName: "Radiohead", key: "A", bpm: 70 },
  { id: "rh-streetspirit", title: "Street Spirit (Fade Out)", artistId: "radiohead", artistName: "Radiohead", key: "Am", bpm: 76 },
  { id: "rh-idioteque", title: "Idioteque", artistId: "radiohead", artistName: "Radiohead", key: "C", bpm: 150 },
  { id: "rh-pyramid", title: "Pyramid Song", artistId: "radiohead", artistName: "Radiohead", key: "F#", bpm: 80 },
  { id: "rh-weirdfishes", title: "Weird Fishes/Arpeggi", artistId: "radiohead", artistName: "Radiohead", key: "Em", bpm: 152 },

  // Coldplay
  { id: "cp-yellow", title: "Yellow", artistId: "coldplay", artistName: "Coldplay", key: "B", bpm: 87 },
  { id: "cp-scientist", title: "The Scientist", artistId: "coldplay", artistName: "Coldplay", key: "F", bpm: 146 },
  { id: "cp-clocks", title: "Clocks", artistId: "coldplay", artistName: "Coldplay", key: "Eb Mixolydian", bpm: 131 },
  { id: "cp-fixyou", title: "Fix You", artistId: "coldplay", artistName: "Coldplay", key: "Eb", bpm: 138 },
  { id: "cp-viva", title: "Viva La Vida", artistId: "coldplay", artistName: "Coldplay", key: "Ab", bpm: 138 },
  { id: "cp-paradise", title: "Paradise", artistId: "coldplay", artistName: "Coldplay", key: "Fm", bpm: 140 },
  { id: "cp-adventure", title: "Adventure of a Lifetime", artistId: "coldplay", artistName: "Coldplay", key: "Am", bpm: 112 },
  { id: "cp-skyfull", title: "A Sky Full of Stars", artistId: "coldplay", artistName: "Coldplay", key: "Fm", bpm: 125 },
  { id: "cp-sparks", title: "Sparks", artistId: "coldplay", artistName: "Coldplay", key: "D", bpm: 70 },
  { id: "cp-trouble", title: "Trouble", artistId: "coldplay", artistName: "Coldplay", key: "Gm", bpm: 70 },
];

// --- Full Song Data Map ---
// This map holds the complete SongData for every song.
export const FULL_SONG_DATA: Record<string, SongData> = {};

SONGS.forEach(songEntry => {
  if (songEntry.id === whileMyGuitarGentlyWeepsData.id) {
    FULL_SONG_DATA[songEntry.id] = whileMyGuitarGentlyWeepsData;
  } else if (songEntry.id === sultansOfSwingData.id) {
    FULL_SONG_DATA[songEntry.id] = sultansOfSwingData;
  } else if (songEntry.id === stairwayToHeavenData.id) {
    FULL_SONG_DATA[songEntry.id] = stairwayToHeavenData;
  } else {
    // Create placeholder SongData for other songs by copying and modifying placeholderPlayableSongData
    const specificPlaceholder: SongData = {
        ...placeholderPlayableSongData, // Spread the generic placeholder
        id: songEntry.id, // Override with specific ID
        title: songEntry.title, // Override with specific title
        author: songEntry.artistName, // Override with specific author
        bpm: songEntry.bpm, // Override with specific BPM
        key: songEntry.key, // Override with specific key
    };
    FULL_SONG_DATA[songEntry.id] = specificPlaceholder;
  }
});

// sampleSong is used in forms for the info message.
export const sampleSong = whileMyGuitarGentlyWeepsData; 
export const detailedSongExamples = [whileMyGuitarGentlyWeepsData.title, sultansOfSwingData.title, stairwayToHeavenData.title];


