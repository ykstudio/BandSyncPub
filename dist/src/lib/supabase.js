"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabaseClient = getSupabaseClient;
exports.getTypedSupabaseClient = getTypedSupabaseClient;
exports.generateSessionId = generateSessionId;
exports.extractJamIdFromSessionId = extractJamIdFromSessionId;
exports.convertFirebaseTimestamp = convertFirebaseTimestamp;
exports.testSupabaseConnection = testSupabaseConnection;
const supabase_js_1 = require("@supabase/supabase-js");
// Function to get the Supabase client instance
function getSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
    }
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        },
        realtime: {
            params: {
                eventsPerSecond: 10,
            },
        },
    });
}
// Function to get the typed Supabase client instance
function getTypedSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
    }
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        },
        realtime: {
            params: {
                eventsPerSecond: 10,
            },
        },
    });
}
// ==============================================================================
// HELPER FUNCTIONS FOR MIGRATION COMPATIBILITY
// ==============================================================================
/**
 * Generate session ID in the Firebase-compatible format
 * Format: 'global-bandsync-session-jam-{jamId}'
 */
function generateSessionId(jamId) {
    return `global-bandsync-session-jam-${jamId}`;
}
/**
 * Extract jam ID from session ID
 * Inverse of generateSessionId function
 */
function extractJamIdFromSessionId(sessionId) {
    const match = sessionId.match(/^global-bandsync-session-jam-(.+)$/);
    return match ? match[1] : null;
}
/**
 * Convert Firebase timestamp to PostgreSQL timestamp
 * Handles both Firestore Timestamp objects and ISO strings
 */
function convertFirebaseTimestamp(timestamp) {
    if (timestamp === null || timestamp === void 0 ? void 0 : timestamp.toDate) {
        // Firestore Timestamp object
        return timestamp.toDate().toISOString();
    }
    if (typeof timestamp === 'string') {
        // Already ISO string
        return timestamp;
    }
    if (timestamp instanceof Date) {
        return timestamp.toISOString();
    }
    // Fallback to current time
    return new Date().toISOString();
}
// ==============================================================================
// CONNECTION TEST (for development/debugging)
// ==============================================================================
/**
 * Test the Supabase connection
 * Returns true if connected successfully
 */
async function testSupabaseConnection() {
    try {
        const supabase = getSupabaseClient(); // Use the getter function
        const { data, error } = await supabase
            .from('jams')
            .select('count', { count: 'exact', head: true });
        if (error) {
            console.error('Supabase connection test failed:', error);
            return false;
        }
        console.log('Supabase connection successful');
        return true;
    }
    catch (error) {
        console.error('Supabase connection test error:', error);
        return false;
    }
}
