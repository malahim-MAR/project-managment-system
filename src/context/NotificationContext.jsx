import React, { createContext, useContext, useEffect, useState } from 'react';
import { requestForToken, onMessageListener, db } from '../firebase';
import { useAuth } from './AuthContext';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Bell } from 'lucide-react';

const NotificationContext = createContext();

export const useNotification = () => {
    return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notification, setNotification] = useState({ title: '', body: '' });
    const [showNotification, setShowNotification] = useState(false);

    // Request permission and save token to user profile
    useEffect(() => {
        if (user?.id) {
            const setupNotifications = async () => {
                const token = await requestForToken();
                if (token) {
                    console.log('FCM Token:', token);
                    // Save token to user document if it's new
                    // We use arrayUnion to add it to a list of tokens (for multiple devices)
                    try {
                        const userRef = doc(db, 'users', user.id);
                        await updateDoc(userRef, {
                            fcmTokens: arrayUnion(token)
                        });
                    } catch (error) {
                        console.error("Error saving FCM token:", error);
                    }
                }
            };

            setupNotifications();
        }
    }, [user]);

    // Handle foreground messages
    useEffect(() => {
        onMessageListener()
            .then((payload) => {
                console.log('Message Received:', payload);
                setNotification({
                    title: payload.notification?.title,
                    body: payload.notification?.body,
                });
                setShowNotification(true);

                // Auto hide after 5 seconds
                setTimeout(() => setShowNotification(false), 5000);
            })
            .catch((err) => console.log('failed: ', err));
    });

    return (
        <NotificationContext.Provider value={{ notification }}>
            {children}
            {/* Custom Toast Notification Component */}
            {showNotification && (
                <div
                    className="notification-toast animate-fade-in"
                    style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderLeft: '4px solid var(--accent-color)',
                        borderRadius: '12px',
                        padding: '1rem',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                        zIndex: 9999,
                        display: 'flex',
                        gap: '1rem',
                        maxWidth: '350px',
                        marginRight: '10px' // Mobile safe area
                    }}
                >
                    <div style={{
                        background: 'rgba(59, 130, 246, 0.1)',
                        padding: '0.75rem',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 'fit-content'
                    }}>
                        <Bell size={20} color="var(--accent-color)" />
                    </div>
                    <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem' }}>{notification.title}</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {notification.body}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowNotification(false)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            height: 'fit-content'
                        }}
                    >
                        ×
                    </button>
                </div>
            )}
        </NotificationContext.Provider>
    );
};
