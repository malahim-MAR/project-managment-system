import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Film, Clapperboard, FileText, Video, Users, LogOut, User, MessageCircle, Home, FolderGit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, isAdmin } = useAuth();

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

    return (
        <aside className="global-sidebar">
            {/* Logo & Notification */}
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <Clapperboard size={24} color="white" />
                    </div>
                    <div className="sidebar-logo-text">
                        <span className="sidebar-logo-title">AAA Studios</span>
                        <span className="sidebar-logo-subtitle">Project Manager</span>
                    </div>
                </div>
                <NotificationBell />
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <div className="sidebar-nav-label">Main Menu</div>

                <Link
                    to="/"
                    className={`sidebar-nav-link ${isActive('/') ? 'active' : ''}`}
                >
                    <Home size={20} />
                    <span>Dashboard</span>
                </Link>

                <Link
                    to="/projects"
                    className={`sidebar-nav-link ${isActive('/projects') ? 'active' : ''}`}
                >
                    <FolderGit2 size={20} />
                    <span>All Projects</span>
                </Link>

                <Link
                    to="/videos"
                    className={`sidebar-nav-link ${isActive('/videos') ? 'active' : ''}`}
                >
                    <Film size={20} />
                    <span>All Videos</span>
                </Link>

                <Link
                    to="/scripts"
                    className={`sidebar-nav-link ${isActive('/scripts') ? 'active' : ''}`}
                >
                    <FileText size={20} />
                    <span>All Scripts</span>
                </Link>
                <Link
                    to="/post-productions"
                    className={`sidebar-nav-link ${isActive('/post-productions') ? 'active' : ''}`}
                >
                    <Video size={20} />
                    <span>Post Productions</span>
                </Link>
                <Link
                    to="/comments"
                    className={`sidebar-nav-link ${isActive('/comments') ? 'active' : ''}`}
                >
                    <MessageCircle size={20} />
                    <span>All Comments</span>
                </Link>

                {/* Admin Section */}
                {isAdmin() && (
                    <>
                        <div className="sidebar-nav-label" style={{ marginTop: '1.5rem' }}>Admin</div>
                        <Link
                            to="/manage-users"
                            className={`sidebar-nav-link ${isActive('/manage-users') ? 'active' : ''}`}
                        >
                            <Users size={20} />
                            <span>Manage Users</span>
                        </Link>
                    </>
                )}
            </nav>

            {/* User Section & Footer */}
            <div className="sidebar-footer">
                {/* Current User */}
                {user && (
                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar">
                            <User size={18} />
                        </div>
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-name">{user.name}</span>
                            <span className="sidebar-user-role">
                                {user.role === 'admin' ? 'Administrator' : 'User'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Logout Button */}
                <button className="sidebar-logout-btn" onClick={handleLogout}>
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </button>

                <div className="sidebar-footer-text">
                    © 2026 AAA Studios
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
