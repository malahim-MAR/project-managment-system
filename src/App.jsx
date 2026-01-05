import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ProjectDetails from './pages/ProjectDetails';
import NewProject from './pages/NewProject';
import EditProject from './pages/EditProject';
import AllVideos from './pages/AllVideos';
import NewVideo from './pages/NewVideo';
import AllScripts from './pages/AllScripts';
import NewScript from './pages/NewScript';
import AllPostProductions from './pages/AllPostProductions';

function App() {
  return (
    <DataProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/projects" replace />} />
            <Route path="/projects" element={<Dashboard />} />
            <Route path="/projects/new" element={<NewProject />} />
            <Route path="/projects/edit/:id" element={<EditProject />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/videos" element={<AllVideos />} />
            <Route path="/videos/new" element={<NewVideo />} />
            <Route path="/videos/edit/:id" element={<NewVideo />} />
            <Route path="/scripts" element={<AllScripts />} />
            <Route path="/scripts/new" element={<NewScript />} />
            <Route path="/scripts/edit/:id" element={<NewScript />} />
            <Route path="/post-productions" element={<AllPostProductions />} />
          </Routes>
        </Layout>
      </Router>
    </DataProvider>
  );
}

export default App;
