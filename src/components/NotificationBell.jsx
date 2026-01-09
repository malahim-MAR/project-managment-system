import React, { useState, useEffect } from 'react';
import { Bell, X, Check, ExternalLink, Trash2, Eye } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, writeBatch, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Listen for notifications in real-time - NO INDEX REQUIRED
    // We filter by userId only and sort on client side
    useEffect(() => {
        if (!user?.id) return;

        // Simple query that doesn't require composite index
        const notificationsQuery = query(
            collection(db, 'notifications'),
            where('userId', '==', user.id)
        );

        const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date()
            }));

            // Sort on client side - newest first
            notifs.sort((a, b) => b.createdAt - a.createdAt);

            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);
        }, (error) => {
            console.error('Error listening to notifications:', error);
        });

        return () => unsubscribe();
    }, [user?.id]);

    // Close modal on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') setShowModal(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    // Mark single notification as read (does NOT delete it)
    const markAsRead = async (notificationId) => {
        try {
            await updateDoc(doc(db, 'notifications', notificationId), {
                read: true
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Mark all as read (does NOT delete them)
    const markAllAsRead = async () => {
        try {
            const batch = writeBatch(db);
            notifications.filter(n => !n.read).forEach(n => {
                batch.update(doc(db, 'notifications', n.id), { read: true });
            });
            await batch.commit();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // Delete single notification - ONLY way to remove it
    const deleteNotification = async (e, notificationId) => {
        e.stopPropagation();
        try {
            await deleteDoc(doc(db, 'notifications', notificationId));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    // Clear all notifications
    const clearAllNotifications = async () => {
        if (!window.confirm('Are you sure you want to delete all notifications? This cannot be undone.')) return;
        try {
            const batch = writeBatch(db);
            notifications.forEach(n => {
                batch.delete(doc(db, 'notifications', n.id));
            });
            await batch.commit();
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    };

    // Clicking notification body just marks as read - does NOT navigate or delete
    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
    };

    // Separate "View" button to navigate - notification stays until deleted
    const handleViewClick = (e, notification) => {
        e.stopPropagation();
        if (!notification.read) {
            markAsRead(notification.id);
        }
        if (notification.link) {
            setShowModal(false);
            navigate(notification.link);
        }
    };

    const formatTime = (date) => {
        if (!date) return '';
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'project': return '📁';
            case 'video': return '🎬';
            case 'script': return '📝';
            case 'postproduction': return '🎞️';
            case 'chat': return '💬';
            default: return '🔔';
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'project': return '#3b82f6';
            case 'video': return '#8b5cf6';
            case 'script': return '#10b981';
            case 'postproduction': return '#f59e0b';
            case 'chat': return '#ec4899';
            default: return '#6b7280';
        }
    };

    return (
        <>
            {/* Bell Button */}
            <button
                className="notification-bell-btn"
                onClick={() => setShowModal(true)}
                title="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {/* Full Modal */}
            {showModal && (
                <div className="notification-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="notification-modal animate-fade-in" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="notification-modal-header">
                            <div className="notification-modal-title">
                                <Bell size={24} />
                                <h2>Notifications</h2>
                                {notifications.length > 0 && (
                                    <span className="notification-count-badge">
                                        {unreadCount > 0 ? `${unreadCount} new` : `${notifications.length} total`}
                                    </span>
                                )}
                            </div>
                            <div className="notification-modal-actions">
                                {unreadCount > 0 && (
                                    <button onClick={markAllAsRead} className="notification-action-btn">
                                        <Check size={16} />
                                        Mark all read
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button onClick={clearAllNotifications} className="notification-action-btn danger">
                                        <Trash2 size={16} />
                                        Clear all
                                    </button>
                                )}
                                <button onClick={() => setShowModal(false)} className="notification-close-btn">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Info Banner */}
                        <div className="notification-info-banner">
                            <span>💡 Notifications stay until you delete them with the ✕ button</span>
                        </div>

                        {/* Modal Body */}
                        <div className="notification-modal-body">
                            {notifications.length === 0 ? (
                                <div className="notification-empty-state">
                                    <div className="notification-empty-icon">
                                        <Bell size={64} />
                                    </div>
                                    <h3>No notifications yet</h3>
                                    <p>When you receive notifications, they'll appear here</p>
                                </div>
                            ) : (
                                <div className="notification-list-modal">
                                    {notifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            className={`notification-card ${!notif.read ? 'unread' : ''}`}
                                            onClick={() => handleNotificationClick(notif)}
                                            style={{ '--notif-color': getNotificationColor(notif.type) }}
                                        >
                                            <div className="notification-card-icon" style={{ background: `${getNotificationColor(notif.type)}20` }}>
                                                {getNotificationIcon(notif.type)}
                                            </div>
                                            <div className="notification-card-content">
                                                <div className="notification-card-header">
                                                    <span className="notification-card-title">{notif.title}</span>
                                                    <span className="notification-card-time">{formatTime(notif.createdAt)}</span>
                                                </div>
                                                <p className="notification-card-body">{notif.body}</p>

                                                {/* Action buttons */}
                                                <div className="notification-card-actions">
                                                    {notif.link && (
                                                        <button
                                                            className="notification-view-btn"
                                                            onClick={(e) => handleViewClick(e, notif)}
                                                        >
                                                            <Eye size={14} />
                                                            View
                                                        </button>
                                                    )}
                                                    {!notif.read && (
                                                        <span className="notification-unread-badge">New</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Delete button - ONLY way to remove notification */}
                                            <button
                                                className="notification-delete-btn"
                                                onClick={(e) => deleteNotification(e, notif.id)}
                                                title="Delete this notification"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default NotificationBell;
