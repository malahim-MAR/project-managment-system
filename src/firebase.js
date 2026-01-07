// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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
