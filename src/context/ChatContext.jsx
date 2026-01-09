import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../firebase.js';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    getDocs,
    where,
    limit
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { sendNotificationToUser } from '../utils/notifications';

const ChatContext = createContext();

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [videos, setVideos] = useState([]);
    const [scripts, setScripts] = useState([]);
    const [postProductions, setPostProductions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [lastReadTimestamp, setLastReadTimestamp] = useState(null);

    // Load last read timestamp from localStorage
    useEffect(() => {
        if (user?.id) {
            const saved = localStorage.getItem(`chat_lastRead_${user.id}`);
            if (saved) {
                setLastReadTimestamp(new Date(saved));
            }
        }
    }, [user?.id]);

    // Update unread count when messages change
    useEffect(() => {
        if (!user?.id || !lastReadTimestamp) {
            // If no last read, count messages not from current user in last 24h
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const unread = messages.filter(m =>
                m.senderId !== user?.id &&
                m.createdAt > oneDayAgo
            ).length;
            setUnreadCount(unread);
        } else {
            const unread = messages.filter(m =>
                m.senderId !== user?.id &&
                m.createdAt > lastReadTimestamp
            ).length;
            setUnreadCount(unread);
        }
    }, [messages, lastReadTimestamp, user?.id]);

    // Mark as read when chat is opened
    useEffect(() => {
        if (isOpen && user?.id) {
            const now = new Date();
            setLastReadTimestamp(now);
            localStorage.setItem(`chat_lastRead_${user.id}`, now.toISOString());
            setUnreadCount(0);
        }
    }, [isOpen, user?.id]);

    // Fetch all users for @mentions
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'users'));
                const usersList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name,
                    email: doc.data().email
                }));
                setUsers(usersList);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };
        fetchUsers();
    }, []);

    // Fetch projects for references
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const snapshot = await getDocs(query(collection(db, 'projects'), limit(100)));
                const projectsList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name || doc.data().projectName
                }));
                setProjects(projectsList);
            } catch (error) {
                console.error('Error fetching projects:', error);
            }
        };
        fetchProjects();
    }, []);

    // Fetch videos for references
    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const snapshot = await getDocs(query(collection(db, 'videos'), limit(100)));
                const videosList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().videoName || doc.data().product || 'Untitled Video'
                }));
                setVideos(videosList);
            } catch (error) {
                console.error('Error fetching videos:', error);
            }
        };
        fetchVideos();
    }, []);

    // Fetch scripts for references
    useEffect(() => {
        const fetchScripts = async () => {
            try {
                const snapshot = await getDocs(query(collection(db, 'scripts'), limit(100)));
                const scriptsList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().clientName || 'Untitled Script'
                }));
                setScripts(scriptsList);
            } catch (error) {
                console.error('Error fetching scripts:', error);
            }
        };
        fetchScripts();
    }, []);

    // Fetch post productions for references
    useEffect(() => {
        const fetchPostProductions = async () => {
            try {
                const snapshot = await getDocs(query(collection(db, 'postproductions'), limit(100)));
                const postProdList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().videoName || 'Untitled'
                }));
                setPostProductions(postProdList);
            } catch (error) {
                console.error('Error fetching post productions:', error);
            }
        };
        fetchPostProductions();
    }, []);

    // Real-time listener for chat messages
    useEffect(() => {
        const messagesQuery = query(
            collection(db, 'chatMessages'),
            orderBy('createdAt', 'desc'),
            limit(100)
        );

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date()
            })).reverse(); // Reverse to show oldest first

            setMessages(msgs);
            setLoading(false);
        }, (error) => {
            console.error('Error listening to chat messages:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Send a message
    const sendMessage = useCallback(async (content, mentions = [], references = []) => {
        if (!user || !content.trim()) return false;

        try {
            const messageData = {
                content: content.trim(),
                senderId: user.id,
                senderName: user.name,
                mentions, // Array of {userId, userName}
                references, // Array of {type, id, name} - type: project/video/script/postproduction
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, 'chatMessages'), messageData);

            // Send notifications to mentioned users
            for (const mention of mentions) {
                if (mention.userId !== user.id) {
                    await sendNotificationToUser({
                        userId: mention.userId,
                        title: '💬 You were mentioned in chat',
                        body: `${user.name} mentioned you: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
                        type: 'chat',
                        link: null // Chat opens in sidebar
                    });
                }
            }

            return true;
        } catch (error) {
            console.error('Error sending message:', error);
            return false;
        }
    }, [user]);

    // Toggle chat sidebar
    const toggleChat = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    const openChat = useCallback(() => {
        setIsOpen(true);
    }, []);

    const closeChat = useCallback(() => {
        setIsOpen(false);
    }, []);

    const value = {
        messages,
        users,
        projects,
        videos,
        scripts,
        postProductions,
        isOpen,
        loading,
        unreadCount,
        sendMessage,
        toggleChat,
        openChat,
        closeChat
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};

export default ChatContext;
