// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBcNAESoLTLmM0F86l459tzoVMyfG4x17c",
    authDomain: "aaa-project-managment.firebaseapp.com",
    projectId: "aaa-project-managment",
    storageBucket: "aaa-project-managment.firebasestorage.app",
    messagingSenderId: "64691849530",
    appId: "1:64691849530:web:6596a4447ce3e8f0fce803"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Messaging
export const messaging = getMessaging(app);

export const VAPID_KEY = "BPXO8LjjNboMaXnteV7mdGUY6K3TnvHw2_ZC7-_q3j4kM224rpuOAiWoi52s_0PfODhfNXYqy_dS46JWLJ5ZksY";

export const requestForToken = async () => {
    try {
        const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (currentToken) {
            return currentToken;
        } else {
            console.log('No registration token available. Request permission to generate one.');
            return null;
        }
    } catch (err) {
        console.log('An error occurred while retrieving token. ', err);
        return null;
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });
