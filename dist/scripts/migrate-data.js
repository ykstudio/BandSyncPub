"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const firebase_service_account_json_1 = __importDefault(require("../firebase-service-account.json"));
// Initialize Firebase Admin SDK
(0, app_1.initializeApp)({
    credential: (0, app_1.cert)(firebase_service_account_json_1.default)
});
const db = (0, firestore_1.getFirestore)();
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
async function main() {
    console.log('Starting data migration from Firebase...');
    try {
        const jams = await fetchAllData('jams');
        const sessions = await fetchAllData('sessions');
        // We will add transformation and import logic here
        console.log('--- Firebase Data Summary ---');
        console.log(`Jams: ${jams.length}`);
        console.log(`Sessions: ${sessions.length}`);
        console.log('-----------------------------');
    }
    catch (error) {
        console.error('Error during Firebase data fetching:', error);
        process.exit(1);
    }
    console.log('Firebase data fetching complete.');
}
main().catch(error => {
    console.error('Unhandled error in migration script:', error);
    process.exit(1);
});
