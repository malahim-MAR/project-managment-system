import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase.js';
import { deleteDoc, doc } from 'firebase/firestore';
import { useData } from '../context/DataContext';
import { FolderGit2, ExternalLink, Plus, Loader2, Pencil, Trash2, Link as LinkIcon, Calendar, Video } from 'lucide-react';

const Dashboard = () => {
    const { projects, videos, loadingProjects, loadingVideos, fetchProjects, fetchVideos, updateProjectsCache } = useData();
    const [deleting, setDeleting] = useState(null);

    useEffect(() => {
        fetchProjects();
        fetchVideos();
    }, [fetchProjects, fetchVideos]);

    // Calculate completed videos count per project
    const getDeliveredCount = useMemo(() => {
        if (!videos) return () => 0;
        const countMap = {};
        videos.forEach(video => {
            if (video.projectId && video.shootStatus === 'Completed') {
                countMap[video.projectId] = (countMap[video.projectId] || 0) + 1;
            }
        });
        return (projectId) => countMap[projectId] || 0;
    }, [videos]);

    const handleDelete = async (projectId, projectName) => {
        if (!window.confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
            return;
        }

        setDeleting(projectId);
        try {
            await deleteDoc(doc(db, 'projects', projectId));
            // Update cache directly instead of re-fetching
            updateProjectsCache(prev => prev.filter(p => p.id !== projectId));
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('Failed to delete project. Please try again.');
        } finally {
            setDeleting(null);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'complete': return 'badge-green';
            case 'in-progress': return 'badge-blue';
            case 'on-hold': return 'badge-yellow';
            default: return 'badge-blue';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'complete': return 'Complete';
            case 'in-progress': return 'In Progress';
            case 'on-hold': return 'On Hold';
            default: return status;
        }
    };

    // Stats (handle null projects from cache)
    const projectsList = projects || [];
    const totalProjects = projectsList.length;
    const inProgressProjects = projectsList.filter(p => p.status === 'in-progress').length;
    const completedProjects = projectsList.filter(p => p.status === 'complete').length;
    const onHoldProjects = projectsList.filter(p => p.status === 'on-hold').length;

    return (
        <div className="page-container animate-fade-in">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                        <FolderGit2 size={32} color="var(--accent-color)" />
                        Projects Dashboard
                    </h1>
                    <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                        Manage all your video production projects
                    </p>
                </div>
                <Link to="/projects/new" className="btn btn-primary">
                    <Plus size={18} /> Create Project
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card stat-card-blue">
                    <div className="stat-icon">
                        <FolderGit2 size={24} />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{totalProjects}</div>
                        <div className="stat-label">Total Projects</div>
                    </div>
                </div>
                <div className="stat-card stat-card-purple">
                    <div className="stat-icon">
                        <Video size={24} />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{inProgressProjects}</div>
                        <div className="stat-label">In Progress</div>
                    </div>
                </div>
                <div className="stat-card stat-card-green">
                    <div className="stat-icon">
                        <FolderGit2 size={24} />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{completedProjects}</div>
                        <div className="stat-label">Completed</div>
                    </div>
                </div>
                <div className="stat-card stat-card-yellow">
                    <div className="stat-icon">
                        <Calendar size={24} />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{onHoldProjects}</div>
                        <div className="stat-label">On Hold</div>
                    </div>
                </div>
            </div>

            {loadingProjects || projects === null ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' }}>
                    <Loader2 size={40} className="spin" style={{ color: 'var(--accent-color)' }} />
                </div>
            ) : projectsList.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <FolderGit2 size={64} style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }} />
                    <h2 style={{ marginBottom: '0.5rem' }}>No Projects Yet</h2>
                    <p style={{ marginBottom: '1.5rem' }}>Create your first project to get started!</p>
                    <Link to="/projects/new" className="btn btn-primary">
                        <Plus size={18} /> Create Project
                    </Link>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Project Name</th>
                                <th>Client Name</th>
                                <th>Start Date</th>
                                <th>No. of Videos</th>
                                <th>Status</th>
                                <th>Links</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projectsList.map((project) => (
                                <tr key={project.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <FolderGit2 size={18} color="var(--accent-color)" />
                                            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{project.name}</span>
                                        </div>
                                    </td>
                                    <td>{project.clientName || 'N/A'}</td>
                                    <td>{project.startDate || 'N/A'}</td>
                                    <td>
                                        <span style={{ color: 'var(--text-primary)' }}>{project.noOfVideoAssign || 0}</span>
                                        <span style={{ color: 'var(--text-secondary)' }}> / </span>
                                        <span style={{ color: 'var(--success)' }}>{getDeliveredCount(project.id)}</span>
                                    </td>
                                    <td>
                                        <span className={`badge ${getStatusColor(project.status)}`}>
                                            {getStatusLabel(project.status)}
                                        </span>
                                    </td>
                                    <td>
                                        {project.projectDriveLink ? (
                                            <a
                                                href={project.projectDriveLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: 'var(--accent-color)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <LinkIcon size={14} /> Drive
                                            </a>
                                        ) : (
                                            <span style={{ color: 'var(--text-secondary)' }}>-</span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <Link
                                                to={`/projects/${project.id}`}
                                                className="btn"
                                                style={{ padding: '0.5rem', backgroundColor: 'var(--bg-card)' }}
                                                title="View Details"
                                            >
                                                <ExternalLink size={16} />
                                            </Link>
                                            <Link
                                                to={`/projects/edit/${project.id}`}
                                                className="btn"
                                                style={{ padding: '0.5rem', backgroundColor: 'var(--accent-color)', color: 'white' }}
                                                title="Edit Project"
                                            >
                                                <Pencil size={16} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(project.id, project.name)}
                                                className="btn"
                                                style={{ padding: '0.5rem', backgroundColor: 'var(--danger)', color: 'white' }}
                                                title="Delete Project"
                                                disabled={deleting === project.id}
                                            >
                                                {deleting === project.id ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
