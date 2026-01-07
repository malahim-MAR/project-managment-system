import React, { createContext, useContext, useState, useCallback } from 'react';
import { db } from '../firebase.js';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

const DataContext = createContext();

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

export const DataProvider = ({ children }) => {
    // Cached data
    const [projects, setProjects] = useState(null);
    const [videos, setVideos] = useState(null);
    const [scripts, setScripts] = useState(null);
    const [clients, setClients] = useState(null);
    const [postProductions, setPostProductions] = useState(null);

    // Loading states
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [loadingVideos, setLoadingVideos] = useState(false);
    const [loadingScripts, setLoadingScripts] = useState(false);
    const [loadingClients, setLoadingClients] = useState(false);
    const [loadingPostProductions, setLoadingPostProductions] = useState(false);

    // Fetch Projects (only if not cached or force refresh)
    const fetchProjects = useCallback(async (forceRefresh = false) => {
        if (projects !== null && !forceRefresh) {
            return projects;
        }

        setLoadingProjects(true);
        try {
            const projectsQuery = query(
                collection(db, 'projects'),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(projectsQuery);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProjects(data);
            return data;
        } catch (error) {
            console.error('Error fetching projects:', error);
            return [];
        } finally {
            setLoadingProjects(false);
        }
    }, [projects]);

    // Fetch Videos (only if not cached or force refresh)
    const fetchVideos = useCallback(async (forceRefresh = false) => {
        if (videos !== null && !forceRefresh) {
            return videos;
        }

        setLoadingVideos(true);
        try {
            const videosQuery = query(
                collection(db, 'videos'),
                orderBy('shootDay', 'desc')
            );
            const snapshot = await getDocs(videosQuery);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'
            }));
            setVideos(data);
            return data;
        } catch (error) {
            console.error('Error fetching videos:', error);
            return [];
        } finally {
            setLoadingVideos(false);
        }
    }, [videos]);

    // Fetch Scripts (only if not cached or force refresh)
    const fetchScripts = useCallback(async (forceRefresh = false) => {
        if (scripts !== null && !forceRefresh) {
            return scripts;
        }

        setLoadingScripts(true);
        try {
            const scriptsQuery = query(
                collection(db, 'scripts'),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(scriptsQuery);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'
            }));
            setScripts(data);
            return data;
        } catch (error) {
            console.error('Error fetching scripts:', error);
            return [];
        } finally {
            setLoadingScripts(false);
        }
    }, [scripts]);

    // Fetch Clients (only if not cached or force refresh)
    const fetchClients = useCallback(async (forceRefresh = false) => {
        if (clients !== null && !forceRefresh) {
            return clients;
        }

        setLoadingClients(true);
        try {
            const snapshot = await getDocs(collection(db, 'clients'));
            const clientList = snapshot.docs.map(doc => doc.data().name).sort();
            const uniqueClients = [...new Set(clientList)];
            setClients(uniqueClients);
            return uniqueClients;
        } catch (error) {
            console.error('Error fetching clients:', error);
            return [];
        } finally {
            setLoadingClients(false);
        }
    }, [clients]);

    // Invalidate cache functions (call after mutations)
    const invalidateProjects = useCallback(() => {
        setProjects(null);
    }, []);

    const invalidateVideos = useCallback(() => {
        setVideos(null);
    }, []);

    const invalidateScripts = useCallback(() => {
        setScripts(null);
    }, []);

    const invalidateClients = useCallback(() => {
        setClients(null);
    }, []);

    const invalidateAll = useCallback(() => {
        setProjects(null);
        setVideos(null);
        setScripts(null);
        setClients(null);
        setPostProductions(null);
    }, []);

    // Fetch Post Productions (only if not cached or force refresh)
    const fetchPostProductions = useCallback(async (forceRefresh = false) => {
        if (postProductions !== null && !forceRefresh) {
            return postProductions;
        }

        setLoadingPostProductions(true);
        try {
            const postProductionsQuery = query(
                collection(db, 'postproductions'),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(postProductionsQuery);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'
            }));
            setPostProductions(data);
            return data;
        } catch (error) {
            console.error('Error fetching post productions:', error);
            return [];
        } finally {
            setLoadingPostProductions(false);
        }
    }, [postProductions]);

    const invalidatePostProductions = useCallback(() => {
        setPostProductions(null);
    }, []);

    const updatePostProductionsCache = useCallback((updater) => {
        setPostProductions(prev => typeof updater === 'function' ? updater(prev) : updater);
    }, []);

    // Update cache directly (for optimistic updates after mutations)
    const updateProjectsCache = useCallback((updater) => {
        setProjects(prev => typeof updater === 'function' ? updater(prev) : updater);
    }, []);

    const updateVideosCache = useCallback((updater) => {
        setVideos(prev => typeof updater === 'function' ? updater(prev) : updater);
    }, []);

    const updateScriptsCache = useCallback((updater) => {
        setScripts(prev => typeof updater === 'function' ? updater(prev) : updater);
    }, []);

    const value = {
        // Data
        projects,
        videos,
        scripts,
        clients,
        postProductions,

        // Loading states
        loadingProjects,
        loadingVideos,
        loadingScripts,
        loadingClients,
        loadingPostProductions,

        // Fetch functions
        fetchProjects,
        fetchVideos,
        fetchScripts,
        fetchClients,
        fetchPostProductions,

        // Invalidate functions
        invalidateProjects,
        invalidateVideos,
        invalidateScripts,
        invalidateClients,
        invalidatePostProductions,
        invalidateAll,

        // Direct cache update functions
        updateProjectsCache,
        updateVideosCache,
        updateScriptsCache,
        updatePostProductionsCache
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export default DataContext;
