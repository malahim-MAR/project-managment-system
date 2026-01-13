import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';

/**
 * Send a notification to specific users by role
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body
 * @param {string} options.type - Notification type (project, video, script, postproduction, chat)
 * @param {string} options.link - Optional navigation link
 * @param {string[]} options.targetRoles - Array of roles to notify (e.g., ['admin', 'editor'])
 * @param {string[]} options.targetUserIds - Array of specific user IDs to notify
 * @param {string} options.excludeUserId - User ID to exclude from notifications (e.g., the creator)
 */
export const sendNotificationToTargeted = async ({
    title,
    body,
    type,
    link = null,
    targetRoles = [],
    targetUserIds = [],
    excludeUserId = null
}) => {
    try {
        // Fetch all active users
        const usersQuery = query(collection(db, 'users'), where('isActive', '!=', false));
        const usersSnapshot = await getDocs(usersQuery);

        const notifications = [];

        usersSnapshot.docs.forEach(docSnapshot => {
            const userId = docSnapshot.id;
            const userData = docSnapshot.data();

            // Skip excluded user (typically the creator)
            if (excludeUserId && userId === excludeUserId) {
                return;
            }

            // Check if user should receive notification
            let shouldNotify = false;

            // If specific user IDs are provided, check if this user is in the list
            if (targetUserIds.length > 0 && targetUserIds.includes(userId)) {
                shouldNotify = true;
            }

            // If target roles are provided, check if user's role matches
            if (targetRoles.length > 0 && targetRoles.includes(userData.role)) {
                shouldNotify = true;
            }

            // If no targeting is specified, don't send (call sendNotificationToAll instead)
            if (targetRoles.length === 0 && targetUserIds.length === 0) {
                shouldNotify = false;
            }

            if (shouldNotify) {
                notifications.push({
                    userId,
                    title,
                    body,
                    type,
                    link,
                    read: false,
                    createdAt: serverTimestamp()
                });
            }
        });

        // Save all notifications to Firestore
        if (notifications.length > 0) {
            const promises = notifications.map(n => addDoc(collection(db, 'notifications'), n));
            await Promise.all(promises);
        }

        return true;
    } catch (error) {
        console.error('Error sending targeted notifications:', error);
        return false;
    }
};

/**
 * Send a notification to all users (legacy - for backwards compatibility)
 * Saves to Firestore and triggers browser notification if user is online
 */
export const sendNotificationToAll = async ({ title, body, type, link = null, excludeUserId = null }) => {
    try {
        // Fetch all active users
        const usersQuery = query(collection(db, 'users'), where('isActive', '!=', false));
        const usersSnapshot = await getDocs(usersQuery);

        const notifications = [];

        usersSnapshot.docs.forEach(doc => {
            const userId = doc.id;

            // Optionally exclude a user (e.g., the creator)
            if (excludeUserId && userId === excludeUserId) {
                return;
            }

            notifications.push({
                userId,
                title,
                body,
                type,
                link,
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

        return true;
    } catch (error) {
        console.error('Error sending notification to user:', error);
        return false;
    }
};

/**
 * Send notification to a user by their name (finds the user first)
 */
export const sendNotificationToUserByName = async ({ userName, title, body, type, link = null }) => {
    try {
        // Find user by name
        const usersQuery = query(collection(db, 'users'), where('name', '==', userName));
        const usersSnapshot = await getDocs(usersQuery);

        if (usersSnapshot.empty) {
            console.warn(`User "${userName}" not found for notification`);
            return false;
        }

        const userId = usersSnapshot.docs[0].id;
        return sendNotificationToUser({ userId, title, body, type, link });
    } catch (error) {
        console.error('Error sending notification to user by name:', error);
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
            icon: '/logo192.png',
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
 * These now send to ALL users but exclude the creator
 */
export const notifyNewProject = async (projectName, creatorUserId = null) => {
    return sendNotificationToAll({
        title: '📁 New Project Created',
        body: `Project "${projectName}" has been created.`,
        type: 'project',
        link: '/projects',
        excludeUserId: creatorUserId
    });
};

export const notifyVideoAssigned = async (videoName, projectName, creatorUserId = null) => {
    return sendNotificationToAll({
        title: '🎬 New Video Assigned',
        body: `Video "${videoName}" added to project "${projectName}".`,
        type: 'video',
        link: '/videos',
        excludeUserId: creatorUserId
    });
};

export const notifyScriptAssigned = async (clientName, contentType, creatorUserId = null) => {
    return sendNotificationToAll({
        title: '📝 New Script Assigned',
        body: `New ${contentType || 'script'} for ${clientName} has been created.`,
        type: 'script',
        link: '/scripts',
        excludeUserId: creatorUserId
    });
};

/**
 * Notify only the assigned editor about post-production assignment
 */
export const notifyPostProductionAssigned = async (videoName, editorName, creatorUserId = null) => {
    // First, try to find the editor by name and notify only them
    const editorNotified = await sendNotificationToUserByName({
        userName: editorName,
        title: '🎞️ Post-Production Assigned to You',
        body: `"${videoName}" has been assigned to you for editing.`,
        type: 'postproduction',
        link: '/post-productions'
    });

    // Also notify admins about the assignment
    await sendNotificationToTargeted({
        title: '🎞️ Post-Production Assigned',
        body: `"${videoName}" assigned to ${editorName} for editing.`,
        type: 'postproduction',
        link: '/post-productions',
        targetRoles: ['admin'],
        excludeUserId: creatorUserId
    });

    return editorNotified;
};

/**
 * Send notification to specific roles only
 */
export const notifyRoles = async ({ roles, title, body, type, link = null, excludeUserId = null }) => {
    return sendNotificationToTargeted({
        title,
        body,
        type,
        link,
        targetRoles: roles,
        excludeUserId
    });
};

/**
 * Notify only admins
 */
export const notifyAdmins = async ({ title, body, type, link = null, excludeUserId = null }) => {
    return notifyRoles({
        roles: ['admin'],
        title,
        body,
        type,
        link,
        excludeUserId
    });
};
