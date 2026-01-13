import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase.js';
import { collection, getDocs, query, where } from 'firebase/firestore';

const AuthContext = createContext();

// Available roles in the system
export const USER_ROLES = {
    ADMIN: 'admin',
    EDITOR: 'editor',
    SCRIPT_WRITER: 'script_writer',
    CLIENT: 'client',
    USER: 'user'
};

// Role display names
export const ROLE_LABELS = {
    admin: 'Administrator',
    editor: 'Editor',
    script_writer: 'Script Writer',
    client: 'Client',
    user: 'User'
};

// Define which tabs each role can access
export const ROLE_PERMISSIONS = {
    admin: ['dashboard', 'projects', 'videos', 'scripts', 'post-productions', 'comments', 'reports', 'manage-users'],
    editor: ['dashboard', 'videos', 'post-productions', 'comments'],
    script_writer: ['dashboard', 'scripts', 'videos', 'comments'],
    client: ['dashboard', 'projects', 'videos', 'comments'],
    user: ['dashboard', 'projects', 'videos', 'scripts', 'post-productions', 'comments', 'reports']
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('authUser');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                localStorage.removeItem('authUser');
            }
        }
        setLoading(false);
    }, []);

    // Login function - checks against users collection in Firebase
    const login = async (email, password) => {
        try {
            const usersQuery = query(
                collection(db, 'users'),
                where('email', '==', email.toLowerCase().trim())
            );
            const snapshot = await getDocs(usersQuery);

            if (snapshot.empty) {
                return { success: false, error: 'Invalid email or password' };
            }

            const userDoc = snapshot.docs[0];
            const userData = userDoc.data();

            // Check password
            if (userData.password !== password) {
                return { success: false, error: 'Invalid email or password' };
            }

            // Check if user is active
            if (userData.isActive === false) {
                return { success: false, error: 'Your account has been deactivated. Contact admin.' };
            }

            const loggedInUser = {
                id: userDoc.id,
                email: userData.email,
                name: userData.name,
                role: userData.role || 'user',
                isAdmin: userData.role === 'admin'
            };

            setUser(loggedInUser);
            localStorage.setItem('authUser', JSON.stringify(loggedInUser));

            return { success: true, user: loggedInUser };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'An error occurred during login. Please try again.' };
        }
    };

    // Logout function
    const logout = () => {
        setUser(null);
        localStorage.removeItem('authUser');
    };

    // Check if user is admin
    const isAdmin = () => {
        return user?.role === 'admin' || user?.isAdmin === true;
    };

    // Check if user has permission to access a specific tab
    const hasPermission = (tabName) => {
        if (!user) return false;
        const role = user.role || 'user';
        const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user;
        return permissions.includes(tabName);
    };

    // Update user in state (used after admin edits user's profile)
    const updateUser = (updatedUserData) => {
        if (user && updatedUserData.id === user.id) {
            const newUser = { ...user, ...updatedUserData };
            setUser(newUser);
            localStorage.setItem('authUser', JSON.stringify(newUser));
        }
    };

    const value = {
        user,
        loading,
        login,
        logout,
        isAdmin,
        hasPermission,
        updateUser,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
