import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase.js';
import { deleteDoc, doc } from 'firebase/firestore';
import { useData } from '../context/DataContext';
import { FolderGit2, ExternalLink, Plus, Loader2, Pencil, Trash2, Link as LinkIcon, Calendar, Video, Search, ChevronDown, Filter } from 'lucide-react';

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const Dashboard = () => {
    const { projects, videos, loadingProjects, loadingVideos, fetchProjects, fetchVideos, updateProjectsCache } = useData();
    const [deleting, setDeleting] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [includePendingFromPreviousMonths, setIncludePendingFromPreviousMonths] = useState(true);

    useEffect(() => {
        fetchProjects();
        fetchVideos();
    }, [fetchProjects, fetchVideos]);

    // Extract available months from projects
    const availableMonths = useMemo(() => {
        if (!projects) return [];
        const months = new Set();
        projects.forEach(project => {
            if (project.startDate) {
                const date = new Date(project.startDate);
                const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                months.add(monthYear);
            }
        });
        return Array.from(months).sort().reverse();
    }, [projects]);

    // Get month label for display
    const getMonthLabel = (monthYear) => {
        const [year, month] = monthYear.split('-');
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    };

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

    // Filter projects based on selected month, status, search, and pending carryover
    const filteredProjects = useMemo(() => {
        if (!projects) return [];
        let filtered = [...projects];

        // Apply search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(project =>
                project.name?.toLowerCase().includes(q) ||
                project.clientName?.toLowerCase().includes(q)
            );
        }

        // Apply status filter
        if (selectedStatus !== 'all') {
            filtered = filtered.filter(project => project.status === selectedStatus);
        }

        // Apply month filter with pending carryover logic
        if (selectedMonth !== 'all') {
            const [selectedYear, selectedMonthNum] = selectedMonth.split('-').map(Number);
            const selectedMonthDate = new Date(selectedYear, selectedMonthNum - 1, 1);

            filtered = filtered.filter(project => {
                if (!project.startDate) return false;

                const projectDate = new Date(project.startDate);
                const projectMonthYear = `${projectDate.getFullYear()}-${String(projectDate.getMonth() + 1).padStart(2, '0')}`;

                // Include if project is from the selected month
                if (projectMonthYear === selectedMonth) {
                    return true;
                }

                // Include pending/in-progress projects from previous months if toggle is on
                if (includePendingFromPreviousMonths) {
                    const isPending = project.status !== 'complete';
                    const isFromPreviousMonth = projectDate < selectedMonthDate;
                    if (isPending && isFromPreviousMonth) {
                        return true;
                    }
                }

                return false;
            });
        }

        return filtered;
    }, [projects, selectedMonth, searchQuery, selectedStatus, includePendingFromPreviousMonths]);

    const handleDelete = async (projectId, projectName) => {
        if (!window.confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
            return;
        }

        setDeleting(projectId);
        try {
            await deleteDoc(doc(db, 'projects', projectId));
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

    const clearFilters = () => {
        setSelectedMonth('all');
        setSelectedStatus('all');
        setSearchQuery('');
    };

    const hasActiveFilters = selectedMonth !== 'all' || selectedStatus !== 'all' || searchQuery.trim() !== '';

    // Stats (based on ALL projects, not filtered)
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

            {/* Filters Bar */}
            <div className="filters-bar">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filter-dropdown">
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                        <option value="all">All Months</option>
                        {availableMonths.map(month => (
                            <option key={month} value={month}>{getMonthLabel(month)}</option>
                        ))}
                    </select>
                    <ChevronDown size={16} className="dropdown-icon" />
                </div>

                <div className="filter-dropdown">
                    <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                        <option value="all">All Statuses</option>
                        <option value="in-progress">In Progress</option>
                        <option value="complete">Complete</option>
                        <option value="on-hold">On Hold</option>
                    </select>
                    <ChevronDown size={16} className="dropdown-icon" />
                </div>

                {selectedMonth !== 'all' && (
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        fontSize: '0.9rem'
                    }}>
                        <input
                            type="checkbox"
                            checked={includePendingFromPreviousMonths}
                            onChange={(e) => setIncludePendingFromPreviousMonths(e.target.checked)}
                            style={{ cursor: 'pointer' }}
                        />
                        Include pending from previous months
                    </label>
                )}

                {hasActiveFilters && (
                    <button onClick={clearFilters} className="btn btn-outline">
                        <Filter size={16} /> Clear Filters
                    </button>
                )}
            </div>

            {/* Results Count */}
            <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                Showing {filteredProjects.length} of {projectsList.length} projects
                {hasActiveFilters && ' (filtered)'}
            </div>

            {loadingProjects || projects === null ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' }}>
                    <Loader2 size={40} className="spin" style={{ color: 'var(--accent-color)' }} />
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <FolderGit2 size={64} style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }} />
                    <h2 style={{ marginBottom: '0.5rem' }}>
                        {hasActiveFilters ? 'No Projects Match Your Filters' : 'No Projects Yet'}
                    </h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        {hasActiveFilters ? 'Try adjusting your search or filters.' : 'Create your first project to get started!'}
                    </p>
                    {hasActiveFilters ? (
                        <button onClick={clearFilters} className="btn btn-primary">
                            Clear All Filters
                        </button>
                    ) : (
                        <Link to="/projects/new" className="btn btn-primary">
                            <Plus size={18} /> Create Project
                        </Link>
                    )}
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
                            {filteredProjects.map((project) => (
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
