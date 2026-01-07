import React, { useState, useEffect } from 'react';
import { Bell, X, Check, ExternalLink, Trash2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot, updateDoc, doc, writeBatch, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Listen for notifications in real-time
    useEffect(() => {
        if (!user?.id) return;

        const notificationsQuery = query(
            collection(db, 'notifications'),
            where('userId', '==', user.id),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date()
            }));
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

    const markAsRead = async (notificationId) => {
        try {
            await updateDoc(doc(db, 'notifications', notificationId), {
                read: true
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

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

    const deleteNotification = async (e, notificationId) => {
        e.stopPropagation();
        try {
            await deleteDoc(doc(db, 'notifications', notificationId));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const clearAllNotifications = async () => {
        if (!window.confirm('Are you sure you want to delete all notifications?')) return;
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

    const handleNotificationClick = (notification) => {
        markAsRead(notification.id);
        if (notification.link) {
            navigate(notification.link);
            setShowModal(false);
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
            default: return '🔔';
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
                                {unreadCount > 0 && (
                                    <span className="notification-count-badge">{unreadCount} new</span>
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
                                        >
                                            <div className="notification-card-icon">
                                                {getNotificationIcon(notif.type)}
                                            </div>
                                            <div className="notification-card-content">
                                                <div className="notification-card-header">
                                                    <span className="notification-card-title">{notif.title}</span>
                                                    <span className="notification-card-time">{formatTime(notif.createdAt)}</span>
                                                </div>
                                                <p className="notification-card-body">{notif.body}</p>
                                                {notif.link && (
                                                    <span className="notification-card-link">
                                                        <ExternalLink size={12} />
                                                        Click to view
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                className="notification-delete-btn"
                                                onClick={(e) => deleteNotification(e, notif.id)}
                                                title="Delete notification"
                                            >
                                                <X size={16} />
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
