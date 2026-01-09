import React from 'react';
import Sidebar from './Sidebar';
import ChatSidebar from './ChatSidebar';

const Layout = ({ children }) => {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
            <ChatSidebar />
        </div>
    );
};

export default Layout;
