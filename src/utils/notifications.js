import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';

/**
 * Send a notification to all users
 * Saves to Firestore and triggers browser notification if user is online
 */
export const sendNotificationToAll = async ({ title, body, type, link = null }) => {
    try {
        // Fetch all active users
        const usersQuery = query(collection(db, 'users'), where('isActive', '!=', false));
        const usersSnapshot = await getDocs(usersQuery);

        const notifications = [];

        usersSnapshot.docs.forEach(doc => {
            const userId = doc.id;
            // Send to ALL users including the creator
            notifications.push({
                userId,
                title,
                body,
                type, // 'project', 'video', 'script', 'postproduction'
                link, // Optional link to navigate to
                read: false,
                createdAt: serverTimestamp()
            });
        });

        // Save all notifications to Firestore
        const promises = notifications.map(n => addDoc(collection(db, 'notifications'), n));
        await Promise.all(promises);

        // Trigger browser notification (for current user - immediate feedback)
        triggerBrowserNotification(title, body);

        return true;
    } catch (error) {
        console.error('Error sending notifications:', error);
        return false;
    }
};

/**
 * Send a notification to a specific user by their ID
 */
export const sendNotificationToUser = async ({ userId, title, body, type, link = null }) => {
    try {
        await addDoc(collection(db, 'notifications'), {
            userId,
            title,
            body,
            type,
            link,
            read: false,
            createdAt: serverTimestamp()
        });

        // Note: Browser notification only works for the currently logged-in user
        // For the target user to receive it, they need to be online and listening
        triggerBrowserNotification(title, body);

        return true;
    } catch (error) {
        console.error('Error sending notification to user:', error);
        return false;
    }
};

/**
 * Trigger browser's native Notification API
 * This shows a notification popup if user has granted permission
 */
export const triggerBrowserNotification = (title, body) => {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return;
    }

    if (Notification.permission === 'granted') {
        new Notification(title, {
            body,
            icon: '/logo192.png', // You can change this to your app's icon
            badge: '/logo192.png',
            tag: 'project-manager-notification',
            renotify: true
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(title, {
                    body,
                    icon: '/logo192.png'
                });
            }
        });
    }
};

/**
 * Pre-built notification senders for common events
 */
export const notifyNewProject = async (projectName) => {
    return sendNotificationToAll({
        title: '📁 New Project Created',
        body: `Project "${projectName}" has been created.`,
        type: 'project',
        link: '/projects'
    });
};

export const notifyVideoAssigned = async (videoName, projectName) => {
    return sendNotificationToAll({
        title: '🎬 New Video Assigned',
        body: `Video "${videoName}" added to project "${projectName}".`,
        type: 'video',
        link: '/videos'
    });
};

export const notifyScriptAssigned = async (clientName, contentType) => {
    return sendNotificationToAll({
        title: '📝 New Script Assigned',
        body: `New ${contentType || 'script'} for ${clientName} has been created.`,
        type: 'script',
        link: '/scripts'
    });
};

export const notifyPostProductionAssigned = async (videoName, editor) => {
    return sendNotificationToAll({
        title: '🎞️ Post-Production Assigned',
        body: `"${videoName}" assigned to ${editor} for editing.`,
        type: 'postproduction',
        link: '/post-productions'
    });
};
