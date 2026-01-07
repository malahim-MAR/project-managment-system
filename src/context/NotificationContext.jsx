import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationContext = createContext();

export const useNotification = () => {
    return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [toasts, setToasts] = useState([]);
    const previousCountRef = useRef(0);

    // Add a toast notification
    const addToast = useCallback((notification) => {
        const id = Date.now() + Math.random();
        const toast = {
            id,
            ...notification,
            createdAt: new Date()
        };

        setToasts(prev => [toast, ...prev].slice(0, 5)); // Keep max 5 toasts

        // Auto remove after 8 seconds
        setTimeout(() => {
            removeToast(id);
        }, 8000);
    }, []);

    // Remove a toast
    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Listen for new notifications in real-time - Simple query without index
    useEffect(() => {
        if (!user?.id) return;

        const notificationsQuery = query(
            collection(db, 'notifications'),
            where('userId', '==', user.id)
        );

        const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
            const currentCount = snapshot.docs.length;

            // If count increased, we have a new notification
            if (currentCount > previousCountRef.current && previousCountRef.current > 0) {
                // Find the newest notification (sort by createdAt)
                const allNotifs = snapshot.docs.map(doc => ({
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate?.() || new Date()
                }));

                allNotifs.sort((a, b) => b.createdAt - a.createdAt);
                const newest = allNotifs[0];

                if (newest) {
                    // Show toast for new notification
                    addToast({
                        title: newest.title,
                        body: newest.body,
                        type: newest.type,
                        link: newest.link
                    });

                    // Also trigger browser notification if permission granted
                    triggerBrowserNotification(newest.title, newest.body);
                }
            }

            previousCountRef.current = currentCount;
        }, (error) => {
            console.error('Error listening for notifications:', error);
        });

        return () => unsubscribe();
    }, [user?.id, addToast]);

    // Trigger browser notification
    const triggerBrowserNotification = (title, body) => {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: '/logo192.png',
                badge: '/logo192.png',
                tag: 'project-manager-notification',
                renotify: true
            });
        }
    };

    // Get icon for notification type
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'project': return '📁';
            case 'video': return '🎬';
            case 'script': return '📝';
            case 'postproduction': return '🎞️';
            default: return '🔔';
        }
    };

    return (
        <NotificationContext.Provider value={{ addToast, removeToast }}>
            {children}

            {/* Toast Container */}
            <div className="toast-container">
                {toasts.map((toast, index) => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        index={index}
                        onClose={() => removeToast(toast.id)}
                        getIcon={getNotificationIcon}
                    />
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

// Separate Toast Item Component
const ToastItem = ({ toast, index, onClose, getIcon }) => {
    const navigate = useNavigate();
    const [isExiting, setIsExiting] = useState(false);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => onClose(), 300);
    };

    const handleClick = () => {
        if (toast.link) {
            navigate(toast.link);
            handleClose();
        }
    };

    return (
        <div
            className={`toast-item ${isExiting ? 'toast-exit' : 'toast-enter'}`}
            style={{ '--toast-index': index }}
        >
            <div className="toast-icon">
                {getIcon(toast.type)}
            </div>
            <div className="toast-content" onClick={handleClick}>
                <div className="toast-title">{toast.title}</div>
                <div className="toast-body">{toast.body}</div>
                {toast.link && (
                    <div className="toast-link">
                        <ExternalLink size={12} />
                        Click to view
                    </div>
                )}
            </div>
            <button className="toast-close" onClick={handleClose}>
                <X size={18} />
            </button>
            <div className="toast-progress"></div>
        </div>
    );
};

export default NotificationContext;
