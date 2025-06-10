import type { SongData } from './types';

const preProcessSongData = (data: Omit<SongData, 'totalDuration' | 'sections'> & { sections: Omit<SongSection, 'startTime' | 'endTime'>[] }): SongData => {
  let cumulativeTime = 0;
  const processedSections = data.sections.map(section => {
    const startTime = cumulativeTime;
    cumulativeTime += section.duration;
    const endTime = cumulativeTime;
    return { ...section, startTime, endTime };
  });

  const totalDuration = cumulativeTime;

  return {
    ...data,
    sections: processedSections,
    totalDuration,
  };
};


export const sampleSong: SongData = preProcessSongData({
  title: "BandSync Jam",
  author: "The Devs",
  bpm: 120,
  sections: [
    { id: "intro", name: "Intro", duration: 8 },
    { id: "verse1", name: "Verse 1", duration: 16 },
    { id: "chorus1", name: "Chorus", duration: 16 },
    { id: "verse2", name: "Verse 2", duration: 16 },
    { id: "chorus2", name: "Chorus", duration: 16 },
    { id: "bridge", name: "Bridge", duration: 8 },
    { id: "solo", name: "Solo", duration: 16 },
    { id: "chorus3", name: "Chorus", duration: 16 },
    { id: "outro", name: "Outro", duration: 8 },
  ],
  lyrics: [
    [
      { text: "Welcome", startTime: 8, endTime: 8.8 },
      { text: "to", startTime: 8.8, endTime: 9.1 },
      { text: "the", startTime: 9.1, endTime: 9.3 },
      { text: "jam,", startTime: 9.3, endTime: 9.8 },
      { text: "let's", startTime: 9.8, endTime: 10.2 },
      { text: "all", startTime: 10.2, endTime: 10.5 },
      { text: "sync", startTime: 10.5, endTime: 11.0 },
      { text: "up.", startTime: 11.0, endTime: 11.5 },
    ],
    [
      { text: "Music's", startTime: 12, endTime: 12.8 },
      { text: "loud,", startTime: 12.8, endTime: 13.3 },
      { text: "feel", startTime: 13.3, endTime: 13.7 },
      { text: "the", startTime: 13.7, endTime: 14.0 },
      { text: "groove,", startTime: 14.0, endTime: 14.5 },
      { text: "don't", startTime: 14.5, endTime: 14.9 },
      { text: "stop.", startTime: 14.9, endTime: 15.5 },
    ],
     // Chorus lyrics (repeated)
    [ // Starts at 24s (Intro 8s + Verse1 16s)
      { text: "Oh,", startTime: 24, endTime: 24.5 },
      { text: "BandSync,", startTime: 24.5, endTime: 25.5 },
      { text: "play", startTime: 25.5, endTime: 26.0 },
      { text: "it", startTime: 26.0, endTime: 26.3 },
      { text: "loud!", startTime: 26.3, endTime: 27.0 },
    ],
    [
      { text: "Together", startTime: 27.5, endTime: 28.3 },
      { text: "now,", startTime: 28.3, endTime: 28.8 },
      { text: "in", startTime: 28.8, endTime: 29.0 },
      { text: "the", startTime: 29.0, endTime: 29.2 },
      { text: "cloud!", startTime: 29.2, endTime: 30.0 },
    ],
  ],
  chords: [
    // Intro
    { chord: "Am", startTime: 0, endTime: 4 },
    { chord: "G", startTime: 4, endTime: 8 },
    // Verse 1
    { chord: "C", startTime: 8, endTime: 12 },
    { chord: "F", startTime: 12, endTime: 16 },
    { chord: "Am", startTime: 16, endTime: 20 },
    { chord: "G", startTime: 20, endTime: 24 },
    // Chorus 1
    { chord: "F", startTime: 24, endTime: 28 },
    { chord: "C", startTime: 28, endTime: 32 },
    { chord: "G", startTime: 32, endTime: 36 },
    { chord: "Am", startTime: 36, endTime: 40 },
    // Verse 2 (similar to Verse 1)
    { chord: "C", startTime: 40, endTime: 44 },
    { chord: "F", startTime: 44, endTime: 48 },
    { chord: "Am", startTime: 48, endTime: 52 },
    { chord: "G", startTime: 52, endTime: 56 },
    // Chorus 2 (similar to Chorus 1)
    { chord: "F", startTime: 56, endTime: 60 },
    { chord: "C", startTime: 60, endTime: 64 },
    { chord: "G", startTime: 64, endTime: 68 },
    { chord: "Am", startTime: 68, endTime: 72 },
    // Bridge
    { chord: "Dm", startTime: 72, endTime: 76 },
    { chord: "G", startTime: 76, endTime: 80 },
    // Solo (let's use verse chords)
    { chord: "C", startTime: 80, endTime: 84 },
    { chord: "F", startTime: 84, endTime: 88 },
    { chord: "Am", startTime: 88, endTime: 92 },
    { chord: "G", startTime: 92, endTime: 96 },
    // Chorus 3
    { chord: "F", startTime: 96, endTime: 100 },
    { chord: "C", startTime: 100, endTime: 104 },
    { chord: "G", startTime: 104, endTime: 108 },
    { chord: "Am", startTime: 108, endTime: 112 },
    // Outro
    { chord: "C", startTime: 112, endTime: 120 },
  ],
});
