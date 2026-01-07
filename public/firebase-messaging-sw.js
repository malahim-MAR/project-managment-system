// Scripts for firebase messaging service worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyBcNAESoLTLmM0F86l459tzoVMyfG4x17c",
    authDomain: "aaa-project-managment.firebaseapp.com",
    projectId: "aaa-project-managment",
    storageBucket: "aaa-project-managment.firebasestorage.app",
    messagingSenderId: "64691849530",
    appId: "1:64691849530:web:6596a4447ce3e8f0fce803"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo192.png' // You might want to ensure this icon exists or use a default one
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
