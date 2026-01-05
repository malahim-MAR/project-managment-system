import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, addDoc, getDocs, deleteDoc, serverTimestamp, query, where, orderBy, updateDoc } from 'firebase/firestore';
import {
    ArrowLeft,
    Calendar,
    User,
    Video,
    Plus,
    Loader2,
    FolderGit2,
    Link as LinkIcon,
    FileText,
    X,
    Trash2,
    Users,
    Film,
    MapPin,
    StickyNote,
    ChevronDown,
    Filter,
    Pencil,
    Search
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

const ProjectDetails = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [videos, setVideos] = useState([]);
    const [filteredVideos, setFilteredVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showVideoForm, setShowVideoForm] = useState(false);
    const [savingVideo, setSavingVideo] = useState(false);
    const [deletingVideo, setDeletingVideo] = useState(null);
    const [editingVideo, setEditingVideo] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [availableMonths, setAvailableMonths] = useState([]);

    const [videoFormData, setVideoFormData] = useState({
        clientName: '',
        videoType: '',
        product: '',
        scriptDocsLink: '',
        storyboardLink: '',
        videoTalent: '',
        shootDay: '',
        time: '',
        specialNotes: '',
        shootStatus: 'Pending'
    });

    useEffect(() => {
        fetchProjectDetails();
    }, [id]);

    useEffect(() => {
        filterVideos();
    }, [videos, selectedMonth, selectedStatus, searchQuery]);

    const fetchProjectDetails = async () => {
        try {
            const projectDoc = await getDoc(doc(db, 'projects', id));
            if (projectDoc.exists()) {
                const projectData = {
                    id: projectDoc.id,
                    ...projectDoc.data(),
                    createdAt: projectDoc.data().createdAt?.toDate?.()?.toLocaleDateString() || 'N/A',
                    updatedAt: projectDoc.data().updatedAt?.toDate?.()?.toLocaleDateString() || 'N/A'
                };
                setProject(projectData);

                setVideoFormData(prev => ({
                    ...prev,
                    clientName: projectData.clientName || ''
                }));

                // Simple query without multiple orderBy
                const videosQuery = query(
                    collection(db, 'videos'),
                    where('projectId', '==', id)
                );

                const videosSnapshot = await getDocs(videosQuery);
                let videosData = videosSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'
                }));

                // Sort client-side
                videosData.sort((a, b) => {
                    // First sort by clientName
                    const nameCompare = (a.clientName || '').localeCompare(b.clientName || '');
                    if (nameCompare !== 0) return nameCompare;

                    // Then sort by shootDay (descending)
                    const dateA = a.shootDay ? new Date(a.shootDay) : new Date(0);
                    const dateB = b.shootDay ? new Date(b.shootDay) : new Date(0);
                    return dateB - dateA;
                });

                setVideos(videosData);
                extractAvailableMonths(videosData);
            }
        } catch (error) {
            console.error('Error fetching project:', error);
        } finally {
            setLoading(false);
        }
    };

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
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(video =>
                video.product?.toLowerCase().includes(query) ||
                video.videoType?.toLowerCase().includes(query) ||
                video.videoTalent?.toLowerCase().includes(query) ||
                video.specialNotes?.toLowerCase().includes(query)
            );
        }

        setFilteredVideos(filtered);
    };

    const clearFilters = () => {
        setSelectedMonth('all');
        setSelectedStatus('all');
        setSearchQuery('');
    };

    const hasActiveFilters = selectedMonth !== 'all' || selectedStatus !== 'all' || searchQuery.trim() !== '';

    // Stats calculations
    const totalVideos = videos.length;
    const completedVideos = videos.filter(v => v.shootStatus === 'Completed').length;
    const pendingVideos = videos.filter(v => v.shootStatus === 'Pending' || v.shootStatus === 'Scheduled').length;
    const inProgressVideos = videos.filter(v => v.shootStatus === 'In Progress').length;

    const getMonthLabel = (monthYear) => {
        const [year, month] = monthYear.split('-');
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    };

    const handleVideoFormChange = (e) => {
        const { name, value } = e.target;
        setVideoFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleVideoSubmit = async (e) => {
        e.preventDefault();
        setSavingVideo(true);

        try {
            if (editingVideo) {
                // UPDATE Existing Video
                const videoRef = doc(db, 'videos', editingVideo.id);
                const updatedData = {
                    ...videoFormData,
                    updatedAt: serverTimestamp()
                };

                await updateDoc(videoRef, updatedData);

                // Update local state
                const updatedVideos = videos.map(v =>
                    v.id === editingVideo.id ? { ...v, ...updatedData } : v
                );

                // Sort client-side again to maintain order
                updatedVideos.sort((a, b) => {
                    const nameCompare = (a.clientName || '').localeCompare(b.clientName || '');
                    if (nameCompare !== 0) return nameCompare;
                    const dateA = a.shootDay ? new Date(a.shootDay) : new Date(0);
                    const dateB = b.shootDay ? new Date(b.shootDay) : new Date(0);
                    return dateB - dateA;
                });

                setVideos(updatedVideos);
                extractAvailableMonths(updatedVideos);
            } else {
                // CREATE New Video
                const videoData = {
                    ...videoFormData,
                    projectId: id,
                    projectName: project?.name || '',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };

                const docRef = await addDoc(collection(db, 'videos'), videoData);

                const newVideo = {
                    id: docRef.id,
                    ...videoFormData,
                    projectId: id,
                    projectName: project?.name || '',
                    createdAt: new Date().toLocaleDateString()
                };

                const updatedVideos = [newVideo, ...videos];
                // Sort again
                updatedVideos.sort((a, b) => {
                    const nameCompare = (a.clientName || '').localeCompare(b.clientName || '');
                    if (nameCompare !== 0) return nameCompare;
                    const dateA = a.shootDay ? new Date(a.shootDay) : new Date(0);
                    const dateB = b.shootDay ? new Date(b.shootDay) : new Date(0);
                    return dateB - dateA;
                });

                setVideos(updatedVideos);
                extractAvailableMonths(updatedVideos);
            }

            // Reset form and close modal
            handleCloseModal();
        } catch (error) {
            console.error('Error saving video:', error);
            alert('Failed to save video. Please try again.');
        } finally {
            setSavingVideo(false);
        }
    };

    const handleEditClick = (video) => {
        setEditingVideo(video);
        setVideoFormData({
            clientName: video.clientName || project?.clientName || '',
            videoType: video.videoType || '',
            product: video.product || '',
            scriptDocsLink: video.scriptDocsLink || '',
            storyboardLink: video.storyboardLink || '',
            videoTalent: video.videoTalent || '',
            shootDay: video.shootDay || '',
            time: video.time || '',
            specialNotes: video.specialNotes || '',
            shootStatus: video.shootStatus || 'Pending'
        });
        setShowVideoForm(true);
    };

    const handleCloseModal = () => {
        setVideoFormData({
            clientName: project?.clientName || '',
            videoType: '',
            product: '',
            scriptDocsLink: '',
            storyboardLink: '',
            videoTalent: '',
            shootDay: '',
            time: '',
            specialNotes: '',
            shootStatus: 'Pending'
        });
        setEditingVideo(null);
        setShowVideoForm(false);
    };

    const handleDeleteVideo = async (videoId) => {
        if (!window.confirm('Are you sure you want to delete this video entry?')) {
            return;
        }

        setDeletingVideo(videoId);
        try {
            await deleteDoc(doc(db, 'videos', videoId));
            const updatedVideos = videos.filter(v => v.id !== videoId);
            setVideos(updatedVideos);
            extractAvailableMonths(updatedVideos);
        } catch (error) {
            console.error('Error deleting video:', error);
            alert('Failed to delete video. Please try again.');
        } finally {
            setDeletingVideo(null);
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

    if (loading) {
        return (
            <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Loader2 size={40} className="spin" style={{ color: 'var(--accent-color)' }} />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="page-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                <h2>Project not found</h2>
                <Link to="/projects" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="page-container animate-fade-in">
            {/* Breadcrumb / Back */}
            <Link
                to="/projects"
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '1.5rem',
                    fontSize: '0.9rem',
                    transition: 'color 0.2s'
                }}
                className="back-link"
            >
                <ArrowLeft size={16} /> Back to Projects
            </Link>

            {/* Compact Project Header & Details */}
            <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
                {/* Row 1: Main Identity & Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        {/* Title */}
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, fontSize: '1.5rem', lineHeight: 1 }}>
                            <FolderGit2 size={28} color="var(--accent-color)" />
                            {project.name}
                        </h1>

                        {/* Status Badge */}
                        <span className={`badge ${getStatusColor(project.status)}`} style={{ fontSize: '0.9rem' }}>
                            {getStatusLabel(project.status)}
                        </span>

                        {/* Divider */}
                        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 0.5rem' }}></div>

                        {/* Client */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                            <User size={16} />
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{project.clientName || 'No client'}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div>
                        <Link to={`/projects/edit/${id}`} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
                            <Pencil size={16} /> <span style={{ marginLeft: '0.5rem' }}>Edit Project</span>
                        </Link>
                    </div>
                </div>

                {/* Row 2: Stats, Team, Resources (Table-like Grid) */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1.5rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '0.9rem'
                }}>

                    {/* Column 1: Stats & Timeline */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1rem' }}>
                            <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Calendar size={14} /> Started:
                            </div>
                            <div style={{ fontWeight: 500 }}>{project.startDate || 'N/A'}</div>

                            <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Calendar size={14} /> Due:
                            </div>
                            <div style={{ fontWeight: 500 }}>{project.dateOfDelivery || 'N/A'}</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                            <span className="badge badge-purple" title="Total Videos"><Film size={12} style={{ marginRight: '4px' }} /> Total: {videos.length}</span>
                            <span className="badge badge-blue" title="Videos Assigned"><Video size={12} style={{ marginRight: '4px' }} /> Assigned: {project.noOfVideoAssign || 0}</span>
                            <span className="badge badge-green" title="Videos Delivered"><Film size={12} style={{ marginRight: '4px' }} /> Delivered: {project.noOfVideosDeliver || 0}</span>
                        </div>
                    </div>

                    {/* Column 2: Team */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                            <Users size={14} style={{ marginTop: '3px', color: 'var(--text-secondary)' }} />
                            <div style={{ flex: 1 }}>
                                <span style={{ color: 'var(--text-secondary)', marginRight: '0.5rem', display: 'block', fontSize: '0.8rem', textTransform: 'uppercase' }}>Pre-Production</span>
                                {project.preProductionTeam?.length > 0
                                    ? <span style={{ fontWeight: 500 }}>{project.preProductionTeam.join(', ')}</span>
                                    : <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>None</span>}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                            <div style={{ width: '14px' }}></div>
                            <div style={{ flex: 1 }}>
                                <span style={{ color: 'var(--text-secondary)', marginRight: '0.5rem', display: 'block', fontSize: '0.8rem', textTransform: 'uppercase' }}>Post-Production</span>
                                {project.postProductionTeam?.length > 0
                                    ? <span style={{ fontWeight: 500 }}>{project.postProductionTeam.join(', ')}</span>
                                    : <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>None</span>}
                            </div>
                        </div>
                    </div>

                    {/* Column 3: Resources & Notes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {/* Drive Link */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <LinkIcon size={14} color="var(--accent-color)" />
                            {project.projectDriveLink ? (
                                <a href={project.projectDriveLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', textDecoration: 'underline' }}>
                                    Open Project Drive
                                </a>
                            ) : <span style={{ color: 'var(--text-secondary)' }}>No Drive Link</span>}
                        </div>

                        {project.reEditsRevisionDate && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Calendar size={14} color="var(--warning)" />
                                <span style={{ color: 'var(--text-secondary)' }}>Re-Edits: <b style={{ color: 'var(--text-primary)' }}>{project.reEditsRevisionDate}</b></span>
                            </div>
                        )}

                        {/* Notes */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <StickyNote size={14} style={{ marginTop: '3px', color: 'var(--purple)' }} />
                            {project.specialNotes ? (
                                <span title={project.specialNotes} style={{
                                    color: 'var(--text-primary)',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    fontStyle: 'italic',
                                    fontSize: '0.85rem'
                                }}>
                                    "{project.specialNotes}"
                                </span>
                            ) : <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No special notes</span>}
                        </div>
                    </div>

                </div>
            </div>

            {/* Videos Section */}
            <div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.5rem',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                        <Film color="var(--accent-color)" size={24} />
                        Videos
                    </h2>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            setEditingVideo(null);
                            setVideoFormData({
                                clientName: project?.clientName || '',
                                videoType: '',
                                product: '',
                                scriptDocsLink: '',
                                storyboardLink: '',
                                videoTalent: '',
                                shootDay: '',
                                time: '',
                                specialNotes: '',
                                shootStatus: 'Pending'
                            });
                            setShowVideoForm(true);
                        }}
                    >
                        <Plus size={18} /> Add Video
                    </button>
                </div>

                {/* Video Stats Cards */}
                <div className="stats-grid" style={{ marginBottom: '2rem' }}>
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
                                : 'Add your first video to get started tracking production details.'
                            }
                        </p>
                        {hasActiveFilters ? (
                            <button onClick={clearFilters} className="btn btn-primary">
                                Clear All Filters
                            </button>
                        ) : (
                            <button className="btn btn-primary" onClick={() => setShowVideoForm(true)}>
                                <Plus size={18} /> Add Video
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Video Type</th>
                                    <th>Product</th>
                                    <th>Talent</th>
                                    <th>Shoot Day</th>
                                    <th>Time</th>
                                    <th>Status</th>
                                    <th>Links</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredVideos.map((video) => (
                                    <tr key={video.id}>
                                        <td>
                                            <span className="badge badge-blue" style={{ fontSize: '0.8rem' }}>
                                                {video.videoType || 'N/A'}
                                            </span>
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
                                        <td>{video.time || '-'}</td>
                                        <td>
                                            <span className={`badge ${getShootStatusColor(video.shootStatus)}`} style={{ fontSize: '0.8rem' }}>
                                                {video.shootStatus || 'Pending'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {(video.scriptLink || video.scriptDocsLink) && (
                                                    <a href={video.scriptLink || video.scriptDocsLink} target="_blank" rel="noopener noreferrer"
                                                        title={video.scriptLink ? "Linked Script" : "Script Docs"}
                                                        style={{ color: video.scriptLink ? 'var(--success)' : 'var(--accent-color)' }}>
                                                        <FileText size={16} />
                                                    </a>
                                                )}
                                                {video.storyboardLink && (
                                                    <a href={video.storyboardLink} target="_blank" rel="noopener noreferrer"
                                                        title="Storyboard"
                                                        style={{ color: 'var(--warning)' }}>
                                                        <MapPin size={16} />
                                                    </a>
                                                )}
                                                {!video.scriptLink && !video.scriptDocsLink && !video.storyboardLink && '-'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleEditClick(video)}
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
                                                </button>
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

            {/* Video Form Modal */}
            {showVideoForm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem',
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="card animate-fade-in" style={{
                        maxWidth: '700px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        padding: '2rem',
                        position: 'relative'
                    }}>
                        {/* Close Button */}
                        <button
                            onClick={handleCloseModal}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'var(--bg-card)',
                                border: 'none',
                                borderRadius: '50%',
                                padding: '0.5rem',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <X size={20} />
                        </button>

                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            {editingVideo ? (
                                <Pencil size={24} color="var(--accent-color)" />
                            ) : (
                                <Video size={24} color="var(--accent-color)" />
                            )}
                            {editingVideo ? 'Edit Video Details' : 'Add New Video'}
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                            Fill in the video production details below.
                        </p>

                        <form onSubmit={handleVideoSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>

                                {/* Client Name - Prefilled */}
                                <div className="form-group">
                                    <label>Client Name</label>
                                    <input
                                        type="text"
                                        name="clientName"
                                        value={videoFormData.clientName}
                                        onChange={handleVideoFormChange}
                                        disabled
                                        style={{ opacity: 0.7, cursor: 'not-allowed' }}
                                    />
                                </div>

                                {/* Video Type */}
                                <div className="form-group">
                                    <label>Video Type *</label>
                                    <select
                                        name="videoType"
                                        value={videoFormData.videoType}
                                        onChange={handleVideoFormChange}
                                        required
                                    >
                                        <option value="">Select Video Type</option>
                                        {videoTypeOptions.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Product */}
                                <div className="form-group">
                                    <label>Product *</label>
                                    <input
                                        type="text"
                                        name="product"
                                        value={videoFormData.product}
                                        onChange={handleVideoFormChange}
                                        required
                                        placeholder="Enter product name"
                                    />
                                </div>

                                {/* Linked Script Display */}
                                {editingVideo?.scriptId ? (
                                    <div className="form-group">
                                        <label>Assigned Script</label>
                                        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <FileText size={16} color="var(--accent-color)" />
                                                <span style={{ fontSize: '0.9rem' }}>Linked Script ({editingVideo.scriptStatus || 'Pending'})</span>
                                            </div>
                                            {editingVideo.scriptLink ? (
                                                <a href={editingVideo.scriptLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', fontSize: '0.9rem' }}>
                                                    View Script
                                                </a>
                                            ) : (
                                                <Link to={`/scripts/edit/${editingVideo.scriptId}`} style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                                    Edit Script
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ) : null}

                                {/* Storyboard Drive Link */}
                                <div className="form-group">
                                    <label>Storyboard Drive Link</label>
                                    <input
                                        type="url"
                                        name="storyboardLink"
                                        value={videoFormData.storyboardLink}
                                        onChange={handleVideoFormChange}
                                        placeholder="https://drive.google.com/..."
                                    />
                                </div>

                                {/* Video Talent */}
                                <div className="form-group">
                                    <label>Video Talent</label>
                                    <input
                                        type="text"
                                        name="videoTalent"
                                        value={videoFormData.videoTalent}
                                        onChange={handleVideoFormChange}
                                        placeholder="Enter talent name(s)"
                                    />
                                </div>

                                {/* Shoot Day */}
                                <div className="form-group">
                                    <label>Shoot Day</label>
                                    <input
                                        type="date"
                                        name="shootDay"
                                        value={videoFormData.shootDay}
                                        onChange={handleVideoFormChange}
                                    />
                                </div>

                                {/* Time */}
                                <div className="form-group">
                                    <label>Time</label>
                                    <input
                                        type="time"
                                        name="time"
                                        value={videoFormData.time}
                                        onChange={handleVideoFormChange}
                                    />
                                </div>

                                {/* Shoot Status */}
                                <div className="form-group">
                                    <label>Shoot Status</label>
                                    <select
                                        name="shootStatus"
                                        value={videoFormData.shootStatus}
                                        onChange={handleVideoFormChange}
                                    >
                                        {shootStatusOptions.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Special Notes */}
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>Special Notes</label>
                                    <textarea
                                        name="specialNotes"
                                        value={videoFormData.specialNotes}
                                        onChange={handleVideoFormChange}
                                        placeholder="Add any special notes or instructions..."
                                        rows={3}
                                    />
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setShowVideoForm(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={savingVideo}>
                                    {savingVideo ? (
                                        <>
                                            <Loader2 size={18} className="spin" /> Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={18} /> Add Video
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetails;
