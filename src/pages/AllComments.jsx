import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import {
    MessageCircle,
    Loader2,
    Film,
    Calendar,
    User,
    Search,
    ChevronDown,
    Filter,
    ExternalLink,
    Clock,
    Video
} from 'lucide-react';

const AllComments = () => {
    const {
        videos, loadingVideos, fetchVideos,
        postProductions, loadingPostProductions, fetchPostProductions
    } = useData();
    const [allComments, setAllComments] = useState([]);
    const [filteredComments, setFilteredComments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSource, setSelectedSource] = useState('all');
    const [selectedItem, setSelectedItem] = useState('all');
    const [sortOrder, setSortOrder] = useState('newest');

    useEffect(() => {
        fetchVideos();
        fetchPostProductions();
    }, [fetchVideos, fetchPostProductions]);

    // Extract all comments from videos and post-productions
    useEffect(() => {
        const comments = [];

        // Video comments
        if (videos) {
            videos.forEach(video => {
                if (video.comments && Array.isArray(video.comments)) {
                    video.comments.forEach(comment => {
                        comments.push({
                            ...comment,
                            sourceType: 'video',
                            sourceId: video.id,
                            sourceName: video.videoName || video.product || 'Untitled Video',
                            projectName: video.projectName,
                            clientName: video.clientName
                        });
                    });
                }
            });
        }

        // Post-production comments
        if (postProductions) {
            postProductions.forEach(pp => {
                if (pp.comments && Array.isArray(pp.comments)) {
                    pp.comments.forEach(comment => {
                        comments.push({
                            ...comment,
                            sourceType: 'post-production',
                            sourceId: pp.id,
                            sourceName: pp.videoName || pp.videoProduct || 'Post-Production',
                            projectName: pp.videoProjectName,
                            clientName: pp.clientName,
                            editor: pp.editor
                        });
                    });
                }
            });
        }

        // Sort by date
        comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAllComments(comments);
    }, [videos, postProductions]);

    // Filter comments
    useEffect(() => {
        let filtered = [...allComments];

        // Filter by source type
        if (selectedSource !== 'all') {
            filtered = filtered.filter(c => c.sourceType === selectedSource);
        }

        // Filter by specific item
        if (selectedItem !== 'all') {
            filtered = filtered.filter(c => c.sourceId === selectedItem);
        }

        // Filter by search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(c =>
                c.text?.toLowerCase().includes(q) ||
                c.authorName?.toLowerCase().includes(q) ||
                c.sourceName?.toLowerCase().includes(q)
            );
        }

        // Sort
        if (sortOrder === 'newest') {
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else {
            filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }

        setFilteredComments(filtered);
    }, [allComments, selectedSource, selectedItem, searchQuery, sortOrder]);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    const formatRelativeTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Items with comments
    const videosWithComments = videos?.filter(v => v.comments?.length > 0) || [];
    const postProdsWithComments = postProductions?.filter(p => p.comments?.length > 0) || [];
    const totalComments = allComments.length;
    const videoComments = allComments.filter(c => c.sourceType === 'video').length;
    const postProdComments = allComments.filter(c => c.sourceType === 'post-production').length;

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedSource('all');
        setSelectedItem('all');
        setSortOrder('newest');
    };

    const hasActiveFilters = searchQuery.trim() !== '' || selectedSource !== 'all' || selectedItem !== 'all';

    const isLoading = loadingVideos || loadingPostProductions || videos === null || postProductions === null;

    if (isLoading) {
        return (
            <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Loader2 size={40} className="spin" style={{ color: 'var(--accent-color)' }} />
            </div>
        );
    }

    return (
        <div className="page-container animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                        <MessageCircle size={32} color="var(--accent-color)" />
                        All Comments
                    </h1>
                    <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                        View all comments across videos and post-productions
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                <div className="stat-card stat-card-purple">
                    <div className="stat-icon"><MessageCircle size={24} /></div>
                    <div className="stat-info">
                        <div className="stat-value">{totalComments}</div>
                        <div className="stat-label">Total Comments</div>
                    </div>
                </div>
                <div className="stat-card stat-card-blue">
                    <div className="stat-icon"><Film size={24} /></div>
                    <div className="stat-info">
                        <div className="stat-value">{videoComments}</div>
                        <div className="stat-label">Video Comments</div>
                    </div>
                </div>
                <div className="stat-card stat-card-green">
                    <div className="stat-icon"><Video size={24} /></div>
                    <div className="stat-info">
                        <div className="stat-value">{postProdComments}</div>
                        <div className="stat-label">Post-Prod Comments</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search comments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filter-dropdown">
                    <select value={selectedSource} onChange={(e) => { setSelectedSource(e.target.value); setSelectedItem('all'); }}>
                        <option value="all">All Sources</option>
                        <option value="video">Videos Only</option>
                        <option value="post-production">Post-Productions Only</option>
                    </select>
                    <ChevronDown size={16} className="dropdown-icon" />
                </div>

                <div className="filter-dropdown">
                    <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)}>
                        <option value="all">All Items</option>
                        {(selectedSource === 'all' || selectedSource === 'video') && videosWithComments.length > 0 && (
                            <optgroup label="Videos">
                                {videosWithComments.map(video => (
                                    <option key={video.id} value={video.id}>
                                        {video.videoName || video.product || 'Untitled'} ({video.comments?.length || 0})
                                    </option>
                                ))}
                            </optgroup>
                        )}
                        {(selectedSource === 'all' || selectedSource === 'post-production') && postProdsWithComments.length > 0 && (
                            <optgroup label="Post-Productions">
                                {postProdsWithComments.map(pp => (
                                    <option key={pp.id} value={pp.id}>
                                        {pp.videoName || pp.videoProduct || 'Post-Prod'} ({pp.comments?.length || 0})
                                    </option>
                                ))}
                            </optgroup>
                        )}
                    </select>
                    <ChevronDown size={16} className="dropdown-icon" />
                </div>

                <div className="filter-dropdown">
                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                    </select>
                    <ChevronDown size={16} className="dropdown-icon" />
                </div>

                {hasActiveFilters && (
                    <button onClick={clearFilters} className="btn btn-outline">
                        <Filter size={16} /> Clear
                    </button>
                )}
            </div>

            {/* Results Count */}
            <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                Showing {filteredComments.length} of {totalComments} comments
                {hasActiveFilters && ' (filtered)'}
            </div>

            {/* Comments Feed */}
            {filteredComments.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <MessageCircle size={64} style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }} />
                    <h2 style={{ marginBottom: '0.5rem' }}>
                        {hasActiveFilters ? 'No Comments Match Your Filters' : 'No Comments Yet'}
                    </h2>
                    <p style={{ marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                        {hasActiveFilters
                            ? 'Try adjusting your search criteria.'
                            : 'Comments added to videos or post-productions will appear here.'
                        }
                    </p>
                    {hasActiveFilters && (
                        <button onClick={clearFilters} className="btn btn-primary">
                            Clear Filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="comments-feed">
                    {filteredComments.map((comment) => (
                        <div key={`${comment.sourceType}-${comment.sourceId}-${comment.id}`} className="comment-feed-item">
                            {/* Source Context Header */}
                            <div className="comment-video-context">
                                {comment.sourceType === 'video' ? <Film size={14} /> : <Video size={14} />}
                                <Link
                                    to={comment.sourceType === 'video'
                                        ? `/videos/${comment.sourceId}`
                                        : `/post-productions/${comment.sourceId}`
                                    }
                                    className="comment-video-link"
                                >
                                    {comment.sourceName}
                                </Link>
                                <span className={`comment-source-badge ${comment.sourceType === 'video' ? 'video' : 'post-prod'}`}>
                                    {comment.sourceType === 'video' ? 'Video' : 'Post-Production'}
                                </span>
                                {comment.projectName && (
                                    <span className="comment-project-tag">
                                        {comment.projectName}
                                    </span>
                                )}
                            </div>

                            {/* Comment Content */}
                            <div className="comment-feed-content">
                                <div className="comment-avatar">
                                    {comment.authorName?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="comment-feed-body">
                                    <div className="comment-feed-header">
                                        <span className="comment-author">{comment.authorName || 'Anonymous'}</span>
                                        <span className="comment-time" title={formatDate(comment.createdAt)}>
                                            <Clock size={12} />
                                            {formatRelativeTime(comment.createdAt)}
                                        </span>
                                    </div>
                                    <p className="comment-text">{comment.text}</p>
                                    <div className="comment-feed-footer">
                                        <Link
                                            to={comment.sourceType === 'video'
                                                ? `/videos/${comment.sourceId}`
                                                : `/post-productions/${comment.sourceId}`
                                            }
                                            className="comment-view-link"
                                        >
                                            <ExternalLink size={12} />
                                            View in {comment.sourceType === 'video' ? 'Video' : 'Post-Production'}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AllComments;
