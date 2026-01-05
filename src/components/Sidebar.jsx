import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Film, Clapperboard, FileText, Video } from 'lucide-react';

const Sidebar = () => {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    return (
        <aside className="global-sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">
                    <Clapperboard size={24} color="white" />
                </div>
                <div className="sidebar-logo-text">
                    <span className="sidebar-logo-title">AAA Studios</span>
                    <span className="sidebar-logo-subtitle">Project Manager</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <div className="sidebar-nav-label">Main Menu</div>

                <Link
                    to="/projects"
                    className={`sidebar-nav-link ${isActive('/projects') ? 'active' : ''}`}
                >
                    <LayoutDashboard size={20} />
                    <span>Projects Dashboard</span>
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
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <div className="sidebar-footer-text">
                    © 2026 AAA Studios
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
