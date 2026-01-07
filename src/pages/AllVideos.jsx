import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase.js';
import { deleteDoc, doc } from 'firebase/firestore';
import { useData } from '../context/DataContext';
import {
    Film,
    Loader2,
    Trash2,
    FileText,
    MapPin,
    Calendar,
    User,
    Filter,
    ChevronDown,
    FolderGit2,
    Search,
    Video,
    Pencil,
    Plus
} from 'lucide-react';

const videoTypeOptions = [
    'Outlet Video',
    'Seller Talkie',
    'Product Centric',
    'Podcast',
    'Review Video',
    'UGC',
    'DVC',
    'Interview',
    'Caption',
    'Creative',
    'Double Side Podcast',
    'Montage & Fashion Reel'
];

const shootStatusOptions = [
    'Pending',
    'Scheduled',
    'In Progress',
    'Completed',
    'Cancelled',
    'On Hold'
];

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const AllVideos = () => {
    const { videos, loadingVideos, fetchVideos, updateVideosCache } = useData();
    const [filteredVideos, setFilteredVideos] = useState([]);
    const [deletingVideo, setDeletingVideo] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [availableMonths, setAvailableMonths] = useState([]);

    // Fetch videos on mount (uses cache if available)
    useEffect(() => {
        fetchVideos();
    }, [fetchVideos]);

    // Extract available months when videos change
    useEffect(() => {
        if (videos) {
            extractAvailableMonths(videos);
        }
    }, [videos]);

    // Filter videos when filters or videos change
    useEffect(() => {
        filterVideos();
    }, [videos, selectedMonth, selectedStatus, searchQuery]);

    const extractAvailableMonths = (videosData) => {
        const months = new Set();
        videosData.forEach(video => {
            if (video.shootDay) {
                const date = new Date(video.shootDay);
                const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                months.add(monthYear);
            }
        });
        setAvailableMonths(Array.from(months).sort().reverse());
    };

    const filterVideos = () => {
        if (!videos) return;
        let filtered = [...videos];

        // Filter by month
        if (selectedMonth !== 'all') {
            filtered = filtered.filter(video => {
                if (!video.shootDay) return false;
                const date = new Date(video.shootDay);
                const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                return monthYear === selectedMonth;
            });
        }

        // Filter by status
        if (selectedStatus !== 'all') {
            filtered = filtered.filter(video => video.shootStatus === selectedStatus);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(video =>
                video.product?.toLowerCase().includes(q) ||
                video.clientName?.toLowerCase().includes(q) ||
                video.videoType?.toLowerCase().includes(q) ||
                video.videoTalent?.toLowerCase().includes(q) ||
                video.projectName?.toLowerCase().includes(q)
            );
        }

        setFilteredVideos(filtered);
    };

    const getMonthLabel = (monthYear) => {
        const [year, month] = monthYear.split('-');
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    };

    const handleDeleteVideo = async (videoId) => {
        if (!window.confirm('Are you sure you want to delete this video entry?')) {
            return;
        }

        setDeletingVideo(videoId);
        try {
            await deleteDoc(doc(db, 'videos', videoId));
            // Update cache directly instead of re-fetching
            updateVideosCache(prev => prev.filter(v => v.id !== videoId));
        } catch (error) {
            console.error('Error deleting video:', error);
            alert('Failed to delete video. Please try again.');
        } finally {
            setDeletingVideo(null);
        }
    };

    const getShootStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'badge-green';
            case 'In Progress': return 'badge-blue';
            case 'Scheduled': return 'badge-yellow';
            case 'Pending': return 'badge-yellow';
            case 'Cancelled': return 'badge-red';
            case 'On Hold': return 'badge-yellow';
            default: return 'badge-blue';
        }
    };

    const clearFilters = () => {
        setSelectedMonth('all');
        setSelectedStatus('all');
        setSearchQuery('');
    };

    const hasActiveFilters = selectedMonth !== 'all' || selectedStatus !== 'all' || searchQuery.trim() !== '';

    // Stats (handle null videos from cache)
    const videosList = videos || [];
    const totalVideos = videosList.length;
    const completedVideos = videosList.filter(v => v.shootStatus === 'Completed').length;
    const pendingVideos = videosList.filter(v => v.shootStatus === 'Pending' || v.shootStatus === 'Scheduled').length;
    const inProgressVideos = videosList.filter(v => v.shootStatus === 'In Progress').length;

    if (loadingVideos || videos === null) {
        return (
            <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Loader2 size={40} className="spin" style={{ color: 'var(--accent-color)' }} />
            </div>
        );
    }

    return (
        <div className="page-container animate-fade-in">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                        <Film size={32} color="var(--accent-color)" />
                        All Videos
                    </h1>
                    <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                        Manage and track all video productions across projects
                    </p>
                </div>
                <Link to="/videos/new" className="btn btn-primary">
                    <Plus size={18} /> Add Video
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card stat-card-blue">
                    <div className="stat-icon">
                        <Film size={24} />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{totalVideos}</div>
                        <div className="stat-label">Total Videos</div>
                    </div>
                </div>
                <div className="stat-card stat-card-green">
                    <div className="stat-icon">
                        <Video size={24} />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{completedVideos}</div>
                        <div className="stat-label">Completed</div>
                    </div>
                </div>
                <div className="stat-card stat-card-yellow">
                    <div className="stat-icon">
                        <Calendar size={24} />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{pendingVideos}</div>
                        <div className="stat-label">Pending/Scheduled</div>
                    </div>
                </div>
                <div className="stat-card stat-card-purple">
                    <div className="stat-icon">
                        <Loader2 size={24} />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{inProgressVideos}</div>
                        <div className="stat-label">In Progress</div>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="filters-bar">
                {/* Search */}
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search videos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>

                {/* Month Filter */}
                <div className="filter-dropdown">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                        <option value="all">All Months</option>
                        {availableMonths.map(month => (
                            <option key={month} value={month}>{getMonthLabel(month)}</option>
                        ))}
                    </select>
                    <ChevronDown size={16} className="dropdown-icon" />
                </div>

                {/* Status Filter */}
                <div className="filter-dropdown">
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="On Hold">On Hold</option>
                    </select>
                    <ChevronDown size={16} className="dropdown-icon" />
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <button onClick={clearFilters} className="btn btn-outline">
                        <Filter size={16} /> Clear Filters
                    </button>
                )}
            </div>

            {/* Results Count */}
            <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                Showing {filteredVideos.length} of {videos.length} videos
                {hasActiveFilters && ' (filtered)'}
            </div>

            {/* Videos Table */}
            {filteredVideos.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <Film size={64} style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }} />
                    <h2 style={{ marginBottom: '0.5rem' }}>
                        {hasActiveFilters ? 'No Videos Match Your Filters' : 'No Videos Yet'}
                    </h2>
                    <p style={{ marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                        {hasActiveFilters
                            ? 'Try adjusting your search criteria or clearing the filters.'
                            : 'Videos added from project details pages will appear here.'
                        }
                    </p>
                    {hasActiveFilters && (
                        <button onClick={clearFilters} className="btn btn-primary">
                            Clear All Filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Project</th>
                                <th>Client</th>
                                <th>Video Type</th>
                                <th>Video Name</th>
                                <th>Product</th>
                                <th>Talent</th>
                                <th>Shoot Day</th>
                                {/* <th>Time</th> */}
                                <th>Status</th>
                                <th>Script</th>
                                <th>Storyboard</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVideos.map((video) => (
                                <tr key={video.id}>
                                    <td>
                                        <Link
                                            to={`/projects/${video.projectId}`}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                color: 'var(--accent-color)',
                                                fontWeight: 500
                                            }}
                                        >
                                            <FolderGit2 size={14} />
                                            {video.projectName || 'Unknown Project'}
                                        </Link>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <User size={14} color="var(--text-secondary)" />
                                            {video.clientName || 'N/A'}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge badge-blue" style={{ fontSize: '0.8rem' }}>
                                            {video.videoType || 'N/A'}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 500, color: 'var(--accent-color)' }}>
                                        {video.videoName || 'N/A'}
                                    </td>
                                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                        {video.product || 'N/A'}
                                    </td>
                                    <td>{video.videoTalent || '-'}</td>
                                    <td>
                                        {video.shootDay ? new Date(video.shootDay).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        }) : '-'}
                                    </td>
                                    {/* <td>{video.time || '-'}</td> */}
                                    <td>
                                        <span className={`badge ${getShootStatusColor(video.shootStatus)}`} style={{ fontSize: '0.8rem' }}>
                                            {video.shootStatus || 'Pending'}
                                        </span>
                                    </td>
                                    <td>
                                        {(video.scriptLink || video.scriptDocsLink) ? (
                                            <a href={video.scriptLink || video.scriptDocsLink} target="_blank" rel="noopener noreferrer"
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.35rem',
                                                    color: video.scriptLink ? 'var(--success)' : 'var(--accent-color)',
                                                    fontSize: '0.85rem'
                                                }}>
                                                <FileText size={14} />
                                                {video.scriptLink ? 'View' : 'Docs'}
                                            </a>
                                        ) : (
                                            <span style={{ color: 'var(--text-secondary)' }}>-</span>
                                        )}
                                    </td>
                                    <td>
                                        {video.storyboardLink ? (
                                            <a href={video.storyboardLink} target="_blank" rel="noopener noreferrer"
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.35rem',
                                                    color: 'var(--warning)',
                                                    fontSize: '0.85rem'
                                                }}>
                                                <MapPin size={14} />
                                                View
                                            </a>
                                        ) : (
                                            <span style={{ color: 'var(--text-secondary)' }}>-</span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <Link
                                                to={`/videos/edit/${video.id}`}
                                                className="btn"
                                                style={{
                                                    padding: '0.4rem',
                                                    backgroundColor: 'var(--bg-card)',
                                                    border: '1px solid var(--border-color)',
                                                    color: 'var(--text-primary)'
                                                }}
                                                title="Edit Video"
                                            >
                                                <Pencil size={14} />
                                            </Link>
                                            <button
                                                onClick={() => handleDeleteVideo(video.id)}
                                                disabled={deletingVideo === video.id}
                                                className="btn"
                                                style={{
                                                    padding: '0.4rem',
                                                    backgroundColor: 'var(--danger)',
                                                    color: 'white'
                                                }}
                                                title="Delete Video"
                                            >
                                                {deletingVideo === video.id ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div >
    );
};

export default AllVideos;
