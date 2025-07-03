import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
// Explicitly load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
console.log(`Attempting to load .env.local from: ${envPath}`);
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
    console.log('Successfully loaded .env.local');
}
else {
    console.warn('Warning: .env.local file not found at expected path.');
}
// Debugging: Log the Supabase environment variables after loading
console.log(`DEBUG: NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '***** (set)' : 'NOT SET'}`);
console.log(`DEBUG: NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***** (set)' : 'NOT SET'}`);
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from '../firebase-service-account.json' assert { type: "json" };
// Import only types and helper functions from Supabase lib
import { getTypedSupabaseClient, extractJamIdFromSessionId } from '../src/lib/supabase.js';
// No longer import createClient or SupabaseClient directly
// Initialize Firebase Admin SDK
initializeApp({
    credential: cert(serviceAccount)
});
const db = getFirestore();
async function fetchAllData(collectionName) {
    console.log(`Fetching all documents from ${collectionName}...`);
    const snapshot = await db.collection(collectionName).get();
    if (snapshot.empty) {
        console.log(`No documents found in ${collectionName}.`);
        return [];
    }
    const data = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
    console.log(`Fetched ${data.length} documents from ${collectionName}.`);
    return data;
}
// Helper to convert Firebase Timestamps to ISO strings
function convertFirebaseTimestamp(timestamp) {
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toISOString();
    }
    return new Date().toISOString(); // Default to current time if conversion fails
}
// Transform Firebase Jam data to Supabase JamRecord
function transformJam(firebaseJam) {
    return {
        id: firebaseJam.id, // Firebase ID often matches what we need for Supabase UUID (if it's a valid UUID format)
        name: firebaseJam.name || 'Untitled Jam',
        song_ids: firebaseJam.songIds || [], // Assuming songIds is already an array of strings
        created_at: convertFirebaseTimestamp(firebaseJam.createdAt),
        updated_at: convertFirebaseTimestamp(firebaseJam.updatedAt || firebaseJam.createdAt) // Use createdAt if updatedAt not present
    };
}
// Transform Firebase Session data to Supabase SessionRecord
function transformSession(firebaseSession) {
    const extractedJamId = extractJamIdFromSessionId(firebaseSession.id);
    if (!extractedJamId) {
        console.warn(`Session ID ${firebaseSession.id} does not contain a valid jamId. Skipping transformation.`);
        throw new Error(`Session ID ${firebaseSession.id} does not contain a valid jamId`);
    }
    // Ensure the extractedJamId is a valid UUID if your Supabase schema strictly requires it.
    // If not, you might need to generate a new UUID or handle invalid ones differently.
    return {
        id: firebaseSession.id, // Keep the original Firebase session ID for compatibility
        jam_id: extractedJamId, // Use the extracted jamId
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
        const transformedJams = [];
        for (const jam of jams) {
            try {
                transformedJams.push(transformJam(jam));
            }
            catch (error) {
                console.error(`Error transforming jam ${jam.id}:`, error);
            }
        }
        const transformedSessions = [];
        for (const session of sessions) {
            try {
                transformedSessions.push(transformSession(session));
            }
            catch (error) {
                console.error(`Error transforming session ${session.id}:`, error);
            }
        }
        console.log(`Transformed ${transformedJams.length} jams.`);
        console.log(`Transformed ${transformedSessions.length} sessions.`);
        // Initialize Supabase client AFTER environment variables are loaded
        const supabase = getTypedSupabaseClient(); // Use the getter function from src/lib/supabase.js
        console.log('Supabase client initialized successfully within migration script.');
        // We will add import logic here
        console.log('--- Firebase Data Summary (before transformation) ---');
        console.log(`Jams: ${jams.length}`);
        console.log(`Sessions: ${sessions.length}`);
        console.log('---------------------------------------------------');
    }
    catch (error) {
        console.error('Error during Firebase data fetching or transformation:', error);
        process.exit(1);
    }
    console.log('Firebase data fetching and transformation complete.');
}
main().catch(error => {
    console.error('Unhandled error in migration script:', error);
    process.exit(1);
});
