import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase.js';
import { deleteDoc, doc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
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
    Plus,
    Table2,
    Save,
    X,
    Check,
    RotateCcw,
    Eye
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

    // Bulk Edit State
    const [isBulkEditMode, setIsBulkEditMode] = useState(false);
    const [editedVideos, setEditedVideos] = useState({});
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

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

    // Track if there are changes
    useEffect(() => {
        setHasChanges(Object.keys(editedVideos).length > 0);
    }, [editedVideos]);

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

    // =============================================
    // BULK EDIT FUNCTIONS
    // =============================================

    const toggleBulkEditMode = () => {
        if (isBulkEditMode && hasChanges) {
            if (!window.confirm('You have unsaved changes. Are you sure you want to exit bulk edit mode?')) {
                return;
            }
        }
        setIsBulkEditMode(!isBulkEditMode);
        setEditedVideos({});
        setSelectedRows(new Set());
    };

    const handleCellChange = (videoId, field, value) => {
        setEditedVideos(prev => ({
            ...prev,
            [videoId]: {
                ...prev[videoId],
                [field]: value
            }
        }));
    };

    const getCellValue = (video, field) => {
        if (editedVideos[video.id]?.[field] !== undefined) {
            return editedVideos[video.id][field];
        }
        return video[field] || '';
    };

    const isRowEdited = (videoId) => {
        return editedVideos[videoId] && Object.keys(editedVideos[videoId]).length > 0;
    };

    const toggleRowSelection = (videoId) => {
        setSelectedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(videoId)) {
                newSet.delete(videoId);
            } else {
                newSet.add(videoId);
            }
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (selectedRows.size === filteredVideos.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(filteredVideos.map(v => v.id)));
        }
    };

    const discardChanges = () => {
        if (window.confirm('Are you sure you want to discard all changes?')) {
            setEditedVideos({});
        }
    };

    const saveAllChanges = async () => {
        if (Object.keys(editedVideos).length === 0) {
            alert('No changes to save.');
            return;
        }

        setIsSaving(true);
        try {
            const batch = writeBatch(db);

            Object.entries(editedVideos).forEach(([videoId, changes]) => {
                const videoRef = doc(db, 'videos', videoId);
                batch.update(videoRef, {
                    ...changes,
                    updatedAt: serverTimestamp()
                });
            });

            await batch.commit();

            // Update local cache
            updateVideosCache(prev => prev.map(video => {
                if (editedVideos[video.id]) {
                    return { ...video, ...editedVideos[video.id] };
                }
                return video;
            }));

            setEditedVideos({});
            alert(`Successfully saved ${Object.keys(editedVideos).length} video(s)!`);
        } catch (error) {
            console.error('Error saving changes:', error);
            alert('Failed to save changes. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const deleteSelectedVideos = async () => {
        if (selectedRows.size === 0) {
            alert('No videos selected.');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete ${selectedRows.size} video(s)? This cannot be undone.`)) {
            return;
        }

        setIsSaving(true);
        try {
            const batch = writeBatch(db);
            selectedRows.forEach(videoId => {
                batch.delete(doc(db, 'videos', videoId));
            });
            await batch.commit();

            updateVideosCache(prev => prev.filter(v => !selectedRows.has(v.id)));
            setSelectedRows(new Set());
            alert(`Successfully deleted ${selectedRows.size} video(s).`);
        } catch (error) {
            console.error('Error deleting videos:', error);
            alert('Failed to delete videos. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // Stats
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
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={toggleBulkEditMode}
                        className={`btn ${isBulkEditMode ? 'btn-warning' : 'btn-outline'}`}
                    >
                        {isBulkEditMode ? <X size={18} /> : <Table2 size={18} />}
                        {isBulkEditMode ? 'Exit Bulk Edit' : 'Bulk Edit'}
                    </button>
                    <Link to="/videos/new" className="btn btn-primary">
                        <Plus size={18} /> Add Video
                    </Link>
                </div>
            </div>

            {/* Bulk Edit Actions Bar */}
            {isBulkEditMode && (
                <div className="bulk-edit-bar animate-fade-in">
                    <div className="bulk-edit-info">
                        <Table2 size={20} />
                        <span><strong>Bulk Edit Mode</strong> - Click cells to edit. Changes are highlighted.</span>
                    </div>
                    <div className="bulk-edit-actions">
                        <span className="bulk-edit-count">
                            {Object.keys(editedVideos).length} modified
                            {selectedRows.size > 0 && ` | ${selectedRows.size} selected`}
                        </span>
                        {hasChanges && (
                            <button onClick={discardChanges} className="btn btn-outline" disabled={isSaving}>
                                <RotateCcw size={16} /> Discard
                            </button>
                        )}
                        {selectedRows.size > 0 && (
                            <button onClick={deleteSelectedVideos} className="btn btn-danger" disabled={isSaving}>
                                <Trash2 size={16} /> Delete ({selectedRows.size})
                            </button>
                        )}
                        <button onClick={saveAllChanges} className="btn btn-primary" disabled={!hasChanges || isSaving}>
                            {isSaving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                            Save All Changes
                        </button>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            {!isBulkEditMode && (
                <div className="stats-grid">
                    <div className="stat-card stat-card-blue">
                        <div className="stat-icon"><Film size={24} /></div>
                        <div className="stat-info">
                            <div className="stat-value">{totalVideos}</div>
                            <div className="stat-label">Total Videos</div>
                        </div>
                    </div>
                    <div className="stat-card stat-card-green">
                        <div className="stat-icon"><Video size={24} /></div>
                        <div className="stat-info">
                            <div className="stat-value">{completedVideos}</div>
                            <div className="stat-label">Completed</div>
                        </div>
                    </div>
                    <div className="stat-card stat-card-yellow">
                        <div className="stat-icon"><Calendar size={24} /></div>
                        <div className="stat-info">
                            <div className="stat-value">{pendingVideos}</div>
                            <div className="stat-label">Pending/Scheduled</div>
                        </div>
                    </div>
                    <div className="stat-card stat-card-purple">
                        <div className="stat-icon"><Loader2 size={24} /></div>
                        <div className="stat-info">
                            <div className="stat-value">{inProgressVideos}</div>
                            <div className="stat-label">In Progress</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters Bar */}
            <div className="filters-bar">
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
                        {shootStatusOptions.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                    <ChevronDown size={16} className="dropdown-icon" />
                </div>

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

            {/* Videos Table / Spreadsheet */}
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
            ) : isBulkEditMode ? (
                // =============================================
                // BULK EDIT SPREADSHEET VIEW
                // =============================================
                <div className="spreadsheet-container">
                    <table className="spreadsheet-table">
                        <thead>
                            <tr>
                                <th className="spreadsheet-checkbox-col">
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.size === filteredVideos.length && filteredVideos.length > 0}
                                        onChange={toggleSelectAll}
                                        title="Select All"
                                    />
                                </th>
                                <th className="spreadsheet-col-fixed">Video Name</th>
                                <th>Product</th>
                                <th>Video Type</th>
                                <th>Talent</th>
                                <th>Shoot Day</th>
                                <th>Status</th>
                                <th>Script Link</th>
                                <th>Storyboard Link</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVideos.map((video) => (
                                <tr
                                    key={video.id}
                                    className={`
                                        ${isRowEdited(video.id) ? 'spreadsheet-row-edited' : ''}
                                        ${selectedRows.has(video.id) ? 'spreadsheet-row-selected' : ''}
                                    `}
                                >
                                    <td className="spreadsheet-checkbox-col">
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.has(video.id)}
                                            onChange={() => toggleRowSelection(video.id)}
                                        />
                                    </td>
                                    <td className="spreadsheet-col-fixed">
                                        <input
                                            type="text"
                                            className="spreadsheet-input"
                                            value={getCellValue(video, 'videoName')}
                                            onChange={(e) => handleCellChange(video.id, 'videoName', e.target.value)}
                                            placeholder="Video name..."
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            className="spreadsheet-input"
                                            value={getCellValue(video, 'product')}
                                            onChange={(e) => handleCellChange(video.id, 'product', e.target.value)}
                                            placeholder="Product..."
                                        />
                                    </td>
                                    <td>
                                        <select
                                            className="spreadsheet-select"
                                            value={getCellValue(video, 'videoType')}
                                            onChange={(e) => handleCellChange(video.id, 'videoType', e.target.value)}
                                        >
                                            <option value="">Select type...</option>
                                            {videoTypeOptions.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            className="spreadsheet-input"
                                            value={getCellValue(video, 'videoTalent')}
                                            onChange={(e) => handleCellChange(video.id, 'videoTalent', e.target.value)}
                                            placeholder="Talent..."
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="date"
                                            className="spreadsheet-input"
                                            value={getCellValue(video, 'shootDay')}
                                            onChange={(e) => handleCellChange(video.id, 'shootDay', e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <select
                                            className="spreadsheet-select spreadsheet-status"
                                            value={getCellValue(video, 'shootStatus')}
                                            onChange={(e) => handleCellChange(video.id, 'shootStatus', e.target.value)}
                                            data-status={getCellValue(video, 'shootStatus')}
                                        >
                                            {shootStatusOptions.map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <input
                                            type="url"
                                            className="spreadsheet-input"
                                            value={getCellValue(video, 'scriptDocsLink')}
                                            onChange={(e) => handleCellChange(video.id, 'scriptDocsLink', e.target.value)}
                                            placeholder="https://..."
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="url"
                                            className="spreadsheet-input"
                                            value={getCellValue(video, 'storyboardLink')}
                                            onChange={(e) => handleCellChange(video.id, 'storyboardLink', e.target.value)}
                                            placeholder="https://..."
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            className="spreadsheet-input spreadsheet-notes"
                                            value={getCellValue(video, 'specialNotes')}
                                            onChange={(e) => handleCellChange(video.id, 'specialNotes', e.target.value)}
                                            placeholder="Notes..."
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                // =============================================
                // NORMAL TABLE VIEW
                // =============================================
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
                                    <td>
                                        <Link
                                            to={`/videos/${video.id}`}
                                            style={{ fontWeight: 500, color: 'var(--accent-color)' }}
                                        >
                                            {video.videoName || 'Untitled Video'}
                                        </Link>
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
                                                to={`/videos/${video.id}`}
                                                className="btn"
                                                style={{
                                                    padding: '0.4rem',
                                                    backgroundColor: 'var(--bg-card)',
                                                    border: '1px solid var(--border-color)',
                                                    color: 'var(--accent-color)'
                                                }}
                                                title="View Details"
                                            >
                                                <Eye size={14} />
                                            </Link>
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
        </div>
    );
};

export default AllVideos;
