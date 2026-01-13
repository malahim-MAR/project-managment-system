/**
 * Firebase Data Cleanup Script
 * 
 * This script deletes ALL data from the Firebase Firestore database.
 * Used for testing purposes.
 * 
 * Run with: node scripts/clearFirebase.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';

// Firebase configuration (same as in src/firebase.js)
const firebaseConfig = {
    apiKey: "AIzaSyBcNAESoLTLmM0F86l459tzoVMyfG4x17c",
    authDomain: "aaa-project-managment.firebaseapp.com",
    projectId: "aaa-project-managment",
    storageBucket: "aaa-project-managment.firebasestorage.app",
    messagingSenderId: "64691849530",
    appId: "1:64691849530:web:6596a4447ce3e8f0fce803"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collections to clear
const COLLECTIONS = [
    'projects',
    'videos',
    'scripts',
    'clients',
    'postproductions',
    'notifications',
    'users',
    'chatMessages'
];

async function deleteCollection(collectionName) {
    console.log(`\n🗑️  Deleting collection: ${collectionName}`);

    try {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);

        if (snapshot.empty) {
            console.log(`   ✓ Collection "${collectionName}" is already empty`);
            return 0;
        }

        const batchSize = 500; // Firestore batch limit
        let deleted = 0;

        // Process in batches
        const docs = snapshot.docs;
        for (let i = 0; i < docs.length; i += batchSize) {
            const batch = writeBatch(db);
            const batchDocs = docs.slice(i, i + batchSize);

            batchDocs.forEach(docSnapshot => {
                batch.delete(doc(db, collectionName, docSnapshot.id));
            });

            await batch.commit();
            deleted += batchDocs.length;
            console.log(`   Deleted ${deleted}/${docs.length} documents...`);
        }

        console.log(`   ✅ Deleted ${deleted} documents from "${collectionName}"`);
        return deleted;

    } catch (error) {
        console.error(`   ❌ Error deleting "${collectionName}":`, error.message);
        return 0;
    }
}

async function clearAllData() {
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║     FIREBASE DATA CLEANUP SCRIPT                ║');
    console.log('║     Project: AAA Project Management             ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log('\n⚠️  WARNING: This will DELETE ALL DATA from Firebase!');
    console.log('   Collections to be cleared:', COLLECTIONS.join(', '));
    console.log('\n🚀 Starting cleanup...\n');

    let totalDeleted = 0;

    for (const collectionName of COLLECTIONS) {
        const count = await deleteCollection(collectionName);
        totalDeleted += count;
    }

    console.log('\n╔════════════════════════════════════════════════╗');
    console.log(`║  ✅ CLEANUP COMPLETE                            ║`);
    console.log(`║  Total documents deleted: ${totalDeleted.toString().padEnd(20)} ║`);
    console.log('╚════════════════════════════════════════════════╝');

    process.exit(0);
}

// Run the cleanup
clearAllData().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
