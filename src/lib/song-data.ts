
import type { SongData, SongSection } from './types';

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
    // Verse 1 - Original lyrics (8-15.5s)
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
    // Verse 1 - Added lyrics (16-22s)
    [
      { text: "Every", startTime: 16, endTime: 16.5 },
      { text: "note", startTime: 16.5, endTime: 17.0 },
      { text: "is", startTime: 17.0, endTime: 17.3 },
      { text: "clear,", startTime: 17.3, endTime: 17.8 },
      { text: "no", startTime: 17.8, endTime: 18.1 },
      { text: "delay.", startTime: 18.1, endTime: 18.7 },
    ],
    [
      { text: "Share", startTime: 19.5, endTime: 20.0 },
      { text: "the", startTime: 20.0, endTime: 20.3 },
      { text: "sound,", startTime: 20.3, endTime: 20.8 },
      { text: "come", startTime: 20.8, endTime: 21.2 },
      { text: "what", startTime: 21.2, endTime: 21.5 },
      { text: "may.", startTime: 21.5, endTime: 22.0 },
    ],

    // Chorus 1 - Original lyrics (24-30s)
    [
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
    // Chorus 1 - Added lyrics (31-37.2s)
    [
      { text: "Hear", startTime: 31, endTime: 31.5 },
      { text: "the", startTime: 31.5, endTime: 31.8 },
      { text: "beat,", startTime: 31.8, endTime: 32.3 },
      { text: "feel", startTime: 32.3, endTime: 32.7 },
      { text: "the", startTime: 32.7, endTime: 33.0 },
      { text: "fire.", startTime: 33.0, endTime: 33.6 },
    ],
    [
      { text: "Lift", startTime: 34.5, endTime: 35.0 },
      { text: "us", startTime: 35.0, endTime: 35.3 },
      { text: "up,", startTime: 35.3, endTime: 35.8 },
      { text: "take", startTime: 35.8, endTime: 36.2 },
      { text: "us", startTime: 36.2, endTime: 36.5 },
      { text: "higher!", startTime: 36.5, endTime: 37.2 },
    ],

    // Verse 2 - New lyrics (40-54.5s)
    [
      { text: "From", startTime: 40, endTime: 40.5 },
      { text: "guitar", startTime: 40.5, endTime: 41.2 },
      { text: "licks", startTime: 41.2, endTime: 41.7 },
      { text: "to", startTime: 41.7, endTime: 42.0 },
      { text: "drummer's", startTime: 42.0, endTime: 42.8 },
      { text: "kick,", startTime: 42.8, endTime: 43.3 },
    ],
    [
      { text: "Every", startTime: 44, endTime: 44.5 },
      { text: "member", startTime: 44.5, endTime: 45.2 },
      { text: "does", startTime: 45.2, endTime: 45.6 },
      { text: "the", startTime: 45.6, endTime: 45.9 },
      { text: "trick.", startTime: 45.9, endTime: 46.5 },
    ],
    [
      { text: "Keyboards", startTime: 48, endTime: 48.8 },
      { text: "sing,", startTime: 48.8, endTime: 49.4 },
      { text: "bass", startTime: 49.4, endTime: 49.9 },
      { text: "lines", startTime: 49.9, endTime: 50.4 },
      { text: "walk,", startTime: 50.4, endTime: 50.9 },
    ],
    [
      { text: "As", startTime: 52, endTime: 52.4 },
      { text: "we", startTime: 52.4, endTime: 52.7 },
      { text: "all", startTime: 52.7, endTime: 53.1 },
      { text: "begin", startTime: 53.1, endTime: 53.6 },
      { text: "to", startTime: 53.6, endTime: 53.9 },
      { text: "talk.", startTime: 53.9, endTime: 54.5 },
    ],

    // Chorus 2 - New lyrics, similar to Chorus 1 (56-69s)
    [
      { text: "Yeah,", startTime: 56, endTime: 56.5 },
      { text: "BandSync,", startTime: 56.5, endTime: 57.5 },
      { text: "feel", startTime: 57.5, endTime: 58.0 },
      { text: "the", startTime: 58.0, endTime: 58.3 },
      { text: "sound!", startTime: 58.3, endTime: 59.0 },
    ],
    [
      { text: "All", startTime: 59.5, endTime: 59.9 },
      { text: "around,", startTime: 59.9, endTime: 60.5 },
      { text: "no", startTime: 60.5, endTime: 60.8 },
      { text: "one's", startTime: 60.8, endTime: 61.2 },
      { text: "bound!", startTime: 61.2, endTime: 62.0 },
    ],
    [
      { text: "Groove", startTime: 63, endTime: 63.5 },
      { text: "is", startTime: 63.5, endTime: 63.8 },
      { text: "strong,", startTime: 63.8, endTime: 64.4 },
      { text: "music's", startTime: 64.4, endTime: 65.0 },
      { text: "free,", startTime: 65.0, endTime: 65.5 },
    ],
    [
      { text: "Perfect", startTime: 66.5, endTime: 67.1 },
      { text: "time,", startTime: 67.1, endTime: 67.6 },
      { text: "for", startTime: 67.6, endTime: 67.9 },
      { text: "you", startTime: 67.9, endTime: 68.2 },
      { text: "and", startTime: 68.2, endTime: 68.5 },
      { text: "me!", startTime: 68.5, endTime: 69.0 },
    ],

    // Bridge - New lyrics (72-78.8s)
    [
      { text: "Through", startTime: 72, endTime: 72.5 },
      { text: "the", startTime: 72.5, endTime: 72.8 },
      { text: "wires,", startTime: 72.8, endTime: 73.5 },
      { text: "data", startTime: 73.5, endTime: 74.0 },
      { text: "streams,", startTime: 74.0, endTime: 74.6 },
    ],
    [
      { text: "Living", startTime: 76, endTime: 76.6 },
      { text: "out", startTime: 76.6, endTime: 77.0 },
      { text: "our", startTime: 77.0, endTime: 77.4 },
      { text: "musical", startTime: 77.4, endTime: 78.2 },
      { text: "dreams.", startTime: 78.2, endTime: 78.8 },
    ],

    // Solo - New lyrics/vocalizations (80-94s)
    [
      { text: "Ooh,", startTime: 80, endTime: 81.0 },
      { text: "yeah,", startTime: 81.0, endTime: 82.0 },
      { text: "BandSync!", startTime: 82.0, endTime: 83.0 },
    ],
    [
      { text: "Feel", startTime: 84, endTime: 84.8 },
      { text: "it", startTime: 84.8, endTime: 85.2 },
      { text: "now...", startTime: 85.2, endTime: 86.0 },
    ],
    [
      { text: "Alright!", startTime: 88, endTime: 89.5 },
    ],
    [
      { text: "Sync", startTime: 92, endTime: 92.8 },
      { text: "it", startTime: 92.8, endTime: 93.2 },
      { text: "up!", startTime: 93.2, endTime: 94.0 },
    ],

    // Chorus 3 - Reuse Chorus 1 lyrics (96-109.2s)
    [
      { text: "Oh,", startTime: 96, endTime: 96.5 },
      { text: "BandSync,", startTime: 96.5, endTime: 97.5 },
      { text: "play", startTime: 97.5, endTime: 98.0 },
      { text: "it", startTime: 98.0, endTime: 98.3 },
      { text: "loud!", startTime: 98.3, endTime: 99.0 },
    ],
    [
      { text: "Together", startTime: 99.5, endTime: 100.3 },
      { text: "now,", startTime: 100.3, endTime: 100.8 },
      { text: "in", startTime: 100.8, endTime: 101.0 },
      { text: "the", startTime: 101.0, endTime: 101.2 },
      { text: "cloud!", startTime: 101.2, endTime: 102.0 },
    ],
    [
      { text: "Hear", startTime: 103, endTime: 103.5 },
      { text: "the", startTime: 103.5, endTime: 103.8 },
      { text: "beat,", startTime: 103.8, endTime: 104.3 },
      { text: "feel", startTime: 104.3, endTime: 104.7 },
      { text: "the", startTime: 104.7, endTime: 105.0 },
      { text: "fire.", startTime: 105.0, endTime: 105.6 },
    ],
    [
      { text: "Lift", startTime: 106.5, endTime: 107.0 },
      { text: "us", startTime: 107.0, endTime: 107.3 },
      { text: "up,", startTime: 107.3, endTime: 107.8 },
      { text: "take", startTime: 107.8, endTime: 108.2 },
      { text: "us", startTime: 108.2, endTime: 108.5 },
      { text: "higher!", startTime: 108.5, endTime: 109.2 },
    ],

    // Outro - New lyrics (112-119.5s)
    [
      { text: "BandSync", startTime: 112, endTime: 113.0 },
      { text: "fades...", startTime: 113.0, endTime: 114.0 },
      { text: "yeah...", startTime: 114.0, endTime: 115.0 },
    ],
    [
      { text: "Until", startTime: 116, endTime: 116.8 },
      { text: "next", startTime: 116.8, endTime: 117.4 },
      { text: "time...", startTime: 117.4, endTime: 118.5 },
      { text: "sync", startTime: 118.5, endTime: 119.0 },
      { text: "out.", startTime: 119.0, endTime: 119.5 },
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
