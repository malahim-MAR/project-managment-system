import React from 'react';
import Sidebar from './Sidebar';
import ChatSidebar from './ChatSidebar';
import MobileNav from './MobileNav';

const Layout = ({ children }) => {
    return (
        <div className="app-layout">
            <Sidebar />
            <MobileNav />
            <main className="main-content">
                {children}
            </main>
            <ChatSidebar />
        </div>
    );
};

export default Layout;

