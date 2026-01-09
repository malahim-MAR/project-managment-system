import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Menu,
    X,
    Home,
    FolderGit2,
    Film,
    FileText,
    Video,
    Users,
    LogOut,
    User,
    MessageCircle,
    Clapperboard,
    Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const MobileNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, isAdmin } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Listen for unread notifications
    useEffect(() => {
        if (!user?.id) return;

        const notificationsQuery = query(
            collection(db, 'notifications'),
            where('userId', '==', user.id)
        );

        const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
            const unread = snapshot.docs.filter(doc => !doc.data().read).length;
            setUnreadCount(unread);
        });

        return () => unsubscribe();
    }, [user?.id]);

    // Close menu on route change
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const isActive = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const navLinks = [
        { path: '/', icon: Home, label: 'Dashboard' },
        { path: '/projects', icon: FolderGit2, label: 'All Projects' },
        { path: '/videos', icon: Film, label: 'All Videos' },
        { path: '/scripts', icon: FileText, label: 'All Scripts' },
        { path: '/post-productions', icon: Video, label: 'Post Productions' },
        { path: '/comments', icon: MessageCircle, label: 'All Comments' },
    ];

    return (
        <>
            {/* Mobile Header */}
            <header className="mobile-header">
                <div className="mobile-header-left">
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setIsOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu size={24} />
                    </button>
                    <div className="mobile-logo">
                        <div className="mobile-logo-icon">
                            <Clapperboard size={18} color="white" />
                        </div>
                        <span className="mobile-logo-text">AAA Studios</span>
                    </div>
                </div>
                <div className="mobile-header-right">
                    {unreadCount > 0 && (
                        <div className="mobile-notification-indicator">
                            <Bell size={20} />
                            <span className="mobile-notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                        </div>
                    )}
                    {user && (
                        <div className="mobile-user-avatar">
                            <User size={18} />
                        </div>
                    )}
                </div>
            </header>

            {/* Mobile Menu Drawer */}
            <div className={`mobile-drawer ${isOpen ? 'open' : ''}`}>
                {/* Drawer Header */}
                <div className="mobile-drawer-header">
                    <div className="mobile-drawer-logo">
                        <div className="mobile-logo-icon">
                            <Clapperboard size={20} color="white" />
                        </div>
                        <div className="mobile-drawer-logo-text">
                            <span className="mobile-logo-title">AAA Studios</span>
                            <span className="mobile-logo-subtitle">Project Manager</span>
                        </div>
                    </div>
                    <button
                        className="mobile-close-btn"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close menu"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* User Info */}
                {user && (
                    <div className="mobile-drawer-user">
                        <div className="mobile-drawer-avatar">
                            <User size={20} />
                        </div>
                        <div className="mobile-drawer-user-info">
                            <span className="mobile-drawer-user-name">{user.name}</span>
                            <span className="mobile-drawer-user-role">
                                {user.role === 'admin' ? 'Administrator' : 'User'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Navigation Links */}
                <nav className="mobile-drawer-nav">
                    <div className="mobile-nav-label">Main Menu</div>
                    {navLinks.map(link => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`mobile-nav-link ${isActive(link.path) ? 'active' : ''}`}
                        >
                            <link.icon size={20} />
                            <span>{link.label}</span>
                        </Link>
                    ))}

                    {/* Admin Section */}
                    {isAdmin() && (
                        <>
                            <div className="mobile-nav-label" style={{ marginTop: '1.5rem' }}>Admin</div>
                            <Link
                                to="/manage-users"
                                className={`mobile-nav-link ${isActive('/manage-users') ? 'active' : ''}`}
                            >
                                <Users size={20} />
                                <span>Manage Users</span>
                            </Link>
                        </>
                    )}
                </nav>

                {/* Logout Button */}
                <div className="mobile-drawer-footer">
                    <button className="mobile-logout-btn" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                    <div className="mobile-footer-text">© 2026 AAA Studios</div>
                </div>
            </div>

            {/* Overlay */}
            {isOpen && (
                <div className="mobile-overlay" onClick={() => setIsOpen(false)} />
            )}
        </>
    );
};

export default MobileNav;
