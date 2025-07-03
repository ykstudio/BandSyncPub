import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Explicitly load .env.local for robust environment variable handling
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
  console.log('Successfully loaded variables from .env.local');
} else {
  console.warn('Warning: .env.local file not found. Please ensure it exists in the project root.');
}

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from '../firebase-service-account.json';
import { JamRecord, SessionRecord, extractJamIdFromSessionId, getTypedSupabaseClient } from '../src/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Type definitions for raw Firebase data
interface FirebaseJam {
    id: string;
    name: string;
    songIds: string[];
    createdAt: any; // Firebase Timestamp
    updatedAt: any; // Firebase Timestamp
    [key: string]: any;
}

interface FirebaseSession {
    id: string;
    isPlaying: boolean;
    currentTime: number;
    currentSongIndexInJam: number;
    lastUpdated: any; // Firebase Timestamp
    [key: string]: any;
}

// Initialize Firebase Admin SDK
initializeApp({
  credential: cert(serviceAccount as any)
});

const db = getFirestore();

async function fetchAllData(collectionName: string) {
  console.log(`Fetching all documents from ${collectionName}...`);
  const snapshot = await db.collection(collectionName).get();
  if (snapshot.empty) {
    console.log(`No documents found in ${collectionName}.`);
    return [];
  }
  
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log(`Fetched ${data.length} documents from ${collectionName}.`);
  return data;
}

// Helper to convert Firebase Timestamps to ISO strings
function convertFirebaseTimestamp(timestamp: any): string {
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toISOString();
    }
    return new Date().toISOString(); // Default to current time if conversion fails
}

// Transform Firebase Jam data to Supabase JamRecord
function transformJam(firebaseJam: any): JamRecord {
    return {
        id: firebaseJam.id,
        name: firebaseJam.name || 'Untitled Jam',
        song_ids: firebaseJam.songIds || [],
        created_at: convertFirebaseTimestamp(firebaseJam.createdAt),
        updated_at: convertFirebaseTimestamp(firebaseJam.updatedAt || firebaseJam.createdAt)
    };
}

// Transform Firebase Session data to Supabase SessionRecord
function transformSession(firebaseSession: any): SessionRecord {
    const extractedJamId = extractJamIdFromSessionId(firebaseSession.id);
    if (!extractedJamId) {
        // This will be caught by the try-catch block in main()
        throw new Error(`Session ID format is invalid and does not contain a jamId.`);
    }
    
    return {
        id: firebaseSession.id,
        jam_id: extractedJamId,
        is_playing: firebaseSession.isPlaying || false,
        playback_time: firebaseSession.currentTime || 0,
        current_song_index_in_jam: firebaseSession.currentSongIndexInJam || 0,
        last_updated: convertFirebaseTimestamp(firebaseSession.lastUpdated)
    };
}

async function main() {
  console.log('Starting data migration from Firebase...');
  
  try {
    const jams = await fetchAllData('jams');
    const sessions = await fetchAllData('sessions');
    
    console.log('--- Transforming Data ---');

    const jamIdMap = new Map<string, string>();

    const transformedJams: JamRecord[] = (jams as FirebaseJam[]).map(jam => {
        const newId = uuidv4();
        jamIdMap.set(jam.id, newId);
        return {
            id: newId,
            name: jam.name || 'Untitled Jam',
            song_ids: jam.songIds || [],
            created_at: convertFirebaseTimestamp(jam.createdAt),
            updated_at: convertFirebaseTimestamp(jam.updatedAt || jam.createdAt)
        };
    });
    
    const transformedSessions = (sessions as FirebaseSession[]).map(session => {
        try {
            const firebaseJamId = extractJamIdFromSessionId(session.id);
            if (!firebaseJamId) {
                throw new Error(`Session ID format is invalid and does not contain a jamId.`);
            }

            const supabaseJamId = jamIdMap.get(firebaseJamId);
            if (!supabaseJamId) {
                throw new Error(`Could not find a corresponding Supabase Jam ID for Firebase Jam ID: ${firebaseJamId}`);
            }

            return {
                id: session.id,
                jam_id: supabaseJamId,
                is_playing: session.isPlaying || false,
                playback_time: session.currentTime || 0,
                current_song_index_in_jam: session.currentSongIndexInJam || 0,
                last_updated: convertFirebaseTimestamp(session.lastUpdated)
            };
        } catch (error) {
            console.error(`Error transforming session ${session.id}:`, (error as Error).message);
            return null; // Return null for filtering
        }
    }).filter((s): s is SessionRecord => s !== null);

    console.log(`Transformed ${transformedJams.length} jams.`);
    console.log(`Transformed ${transformedSessions.length} sessions (after filtering out errors).`);

    console.log('--- Importing Data into Supabase ---');
    const supabase = getTypedSupabaseClient();

    if (transformedJams.length > 0) {
      const { error: jamsError } = await supabase.from('jams').upsert(transformedJams);
      if (jamsError) console.error('Error importing jams:', jamsError);
      else console.log('Successfully imported jams.');
    }

    if (transformedSessions.length > 0) {
      const { error: sessionsError } = await supabase.from('sessions').upsert(transformedSessions);
      if (sessionsError) console.error('Error importing sessions:', sessionsError);
      else console.log('Successfully imported sessions.');
    }
    
    console.log('--- Firebase Data Summary ---');
    console.log(`Jams fetched: ${jams.length}`);
    console.log(`Sessions fetched: ${sessions.length}`);
    console.log('-----------------------------');
    
  } catch (error) {
    console.error('Error during data migration:', error);
    process.exit(1);
  }
  
  console.log('Data migration script finished.');
}

main().catch(error => {
  console.error('Unhandled top-level error in migration script:', error);
  process.exit(1);
});