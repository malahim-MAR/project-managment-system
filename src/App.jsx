import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ProjectDetails from './pages/ProjectDetails';
import NewProject from './pages/NewProject';
import EditProject from './pages/EditProject';
import AllVideos from './pages/AllVideos';
import NewVideo from './pages/NewVideo';
import VideoDetails from './pages/VideoDetails';
import AllScripts from './pages/AllScripts';
import NewScript from './pages/NewScript';
import AllPostProductions from './pages/AllPostProductions';
import PostProductionDetails from './pages/PostProductionDetails';
import AllComments from './pages/AllComments';
import ManageUsers from './pages/ManageUsers';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-secondary)'
      }}>
        <div className="spin" style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--accent-color)',
          borderRadius: '50%'
        }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-secondary)'
      }}>
        <div className="spin" style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--accent-color)',
          borderRadius: '50%'
        }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin()) {
    return <Navigate to="/projects" replace />;
  }

  return children;
};

// Public Route (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-secondary)'
      }}>
        <div className="spin" style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--accent-color)',
          borderRadius: '50%'
        }}></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/projects" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Route - Login */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />

      {/* Protected Routes */}
      {/* Home Dashboard */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout><Home /></Layout>
        </ProtectedRoute>
      } />

      {/* Projects List */}
      <Route path="/projects" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/projects/new" element={
        <ProtectedRoute>
          <Layout><NewProject /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/projects/edit/:id" element={
        <ProtectedRoute>
          <Layout><EditProject /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/projects/:id" element={
        <ProtectedRoute>
          <Layout><ProjectDetails /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/videos" element={
        <ProtectedRoute>
          <Layout><AllVideos /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/videos/new" element={
        <ProtectedRoute>
          <Layout><NewVideo /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/videos/edit/:id" element={
        <ProtectedRoute>
          <Layout><NewVideo /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/videos/:id" element={
        <ProtectedRoute>
          <Layout><VideoDetails /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/scripts" element={
        <ProtectedRoute>
          <Layout><AllScripts /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/scripts/new" element={
        <ProtectedRoute>
          <Layout><NewScript /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/scripts/edit/:id" element={
        <ProtectedRoute>
          <Layout><NewScript /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/post-productions" element={
        <ProtectedRoute>
          <Layout><AllPostProductions /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/post-productions/:id" element={
        <ProtectedRoute>
          <Layout><PostProductionDetails /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/comments" element={
        <ProtectedRoute>
          <Layout><AllComments /></Layout>
        </ProtectedRoute>
      } />

      {/* Admin Only Route */}
      <Route path="/manage-users" element={
        <AdminRoute>
          <Layout><ManageUsers /></Layout>
        </AdminRoute>
      } />
    </Routes>
  );
}

import { NotificationProvider } from './context/NotificationContext';
import { ChatProvider } from './context/ChatContext';

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <NotificationProvider>
            <ChatProvider>
              <AppRoutes />
            </ChatProvider>
          </NotificationProvider>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;

