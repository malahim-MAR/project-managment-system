import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase.js';
import { doc, getDoc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
    ArrowLeft,
    Film,
    Loader2,
    Calendar,
    User,
    MapPin,
    FileText,
    Video,
    FolderGit2,
    Pencil,
    Clock,
    Send,
    MessageCircle,
    Trash2,
    MoreVertical,
    ExternalLink
} from 'lucide-react';

const VideoDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { updateVideosCache } = useData();

    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [deletingCommentId, setDeletingCommentId] = useState(null);

    useEffect(() => {
        fetchVideoDetails();
    }, [id]);

    const fetchVideoDetails = async () => {
        try {
            const videoDoc = await getDoc(doc(db, 'videos', id));
            if (videoDoc.exists()) {
                setVideo({ id: videoDoc.id, ...videoDoc.data() });
            } else {
                navigate('/videos', { replace: true });
            }
        } catch (error) {
            console.error('Error fetching video:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmittingComment(true);
        try {
            const comment = {
                id: Date.now().toString(),
                text: newComment.trim(),
                authorId: user?.id || 'anonymous',
                authorName: user?.name || 'Anonymous',
                createdAt: new Date().toISOString()
            };

            // Add comment to Firestore
            await updateDoc(doc(db, 'videos', id), {
                comments: arrayUnion(comment),
                updatedAt: serverTimestamp()
            });

            // Update local state
            setVideo(prev => ({
                ...prev,
                comments: [...(prev.comments || []), comment]
            }));

            // Update cache
            updateVideosCache(prev => prev?.map(v =>
                v.id === id ? { ...v, comments: [...(v.comments || []), comment] } : v
            ));

            setNewComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to add comment. Please try again.');
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return;

        setDeletingCommentId(commentId);
        try {
            const updatedComments = (video.comments || []).filter(c => c.id !== commentId);

            await updateDoc(doc(db, 'videos', id), {
                comments: updatedComments,
                updatedAt: serverTimestamp()
            });

            setVideo(prev => ({ ...prev, comments: updatedComments }));

            updateVideosCache(prev => prev?.map(v =>
                v.id === id ? { ...v, comments: updatedComments } : v
            ));
        } catch (error) {
            console.error('Error deleting comment:', error);
            alert('Failed to delete comment. Please try again.');
        } finally {
            setDeletingCommentId(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCommentDate = (dateString) => {
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
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getStatusColor = (status) => {
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

    if (!video) {
        return (
            <div className="page-container">
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <Film size={64} style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }} />
                    <h2>Video Not Found</h2>
                    <p>The video you're looking for doesn't exist or has been deleted.</p>
                    <Link to="/videos" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                        Back to All Videos
                    </Link>
                </div>
            </div>
        );
    }

    const comments = video.comments || [];

    return (
        <div className="page-container animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <Link to="/videos" className="btn btn-outline" style={{ marginBottom: '1rem' }}>
                    <ArrowLeft size={18} /> Back to Videos
                </Link>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                            <Film size={32} color="var(--accent-color)" />
                            {video.videoName || video.product || 'Untitled Video'}
                        </h1>
                        <p style={{ marginTop: '0.5rem', marginBottom: 0, color: 'var(--text-secondary)' }}>
                            {video.videoType} • {video.projectName || 'Unknown Project'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <Link to={`/videos/edit/${id}`} className="btn btn-primary">
                            <Pencil size={18} /> Edit Video
                        </Link>
                    </div>
                </div>
            </div>

            <div className="video-details-grid">
                {/* Main Info Card */}
                <div className="card video-details-main">
                    <div className="card-header">
                        <h3><Video size={20} /> Video Information</h3>
                    </div>
                    <div className="video-details-content">
                        <div className="detail-row">
                            <span className="detail-label">Status</span>
                            <span className={`badge ${getStatusColor(video.shootStatus)}`}>
                                {video.shootStatus || 'Pending'}
                            </span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Video Type</span>
                            <span className="detail-value">{video.videoType || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Video Name</span>
                            <span className="detail-value">{video.videoName || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Product</span>
                            <span className="detail-value">{video.product || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Talent</span>
                            <span className="detail-value">
                                <User size={14} style={{ marginRight: '0.35rem' }} />
                                {video.videoTalent || 'N/A'}
                            </span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Shoot Day</span>
                            <span className="detail-value">
                                <Calendar size={14} style={{ marginRight: '0.35rem' }} />
                                {formatDate(video.shootDay)}
                            </span>
                        </div>
                        {video.time && (
                            <div className="detail-row">
                                <span className="detail-label">Time</span>
                                <span className="detail-value">
                                    <Clock size={14} style={{ marginRight: '0.35rem' }} />
                                    {video.time}
                                </span>
                            </div>
                        )}
                        {video.specialNotes && (
                            <div className="detail-row detail-row-full">
                                <span className="detail-label">Special Notes</span>
                                <span className="detail-value detail-notes">{video.specialNotes}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Project & Links Card */}
                <div className="card video-details-sidebar">
                    <div className="card-header">
                        <h3><FolderGit2 size={20} /> Project & Links</h3>
                    </div>
                    <div className="video-details-content">
                        <div className="detail-row">
                            <span className="detail-label">Project</span>
                            <Link to={`/projects/${video.projectId}`} className="detail-link">
                                <FolderGit2 size={14} />
                                {video.projectName || 'Unknown'}
                            </Link>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Client</span>
                            <span className="detail-value">{video.clientName || 'N/A'}</span>
                        </div>

                        <div className="links-section">
                            <h4>Resources</h4>
                            {video.scriptDocsLink ? (
                                <a href={video.scriptDocsLink} target="_blank" rel="noopener noreferrer" className="resource-link">
                                    <FileText size={16} />
                                    <span>Script Document</span>
                                    <ExternalLink size={14} />
                                </a>
                            ) : (
                                <div className="resource-link disabled">
                                    <FileText size={16} />
                                    <span>No Script Link</span>
                                </div>
                            )}
                            {video.storyboardLink ? (
                                <a href={video.storyboardLink} target="_blank" rel="noopener noreferrer" className="resource-link">
                                    <MapPin size={16} />
                                    <span>Storyboard</span>
                                    <ExternalLink size={14} />
                                </a>
                            ) : (
                                <div className="resource-link disabled">
                                    <MapPin size={16} />
                                    <span>No Storyboard Link</span>
                                </div>
                            )}
                            {video.scriptLink && (
                                <a href={video.scriptLink} target="_blank" rel="noopener noreferrer" className="resource-link success">
                                    <FileText size={16} />
                                    <span>Final Script</span>
                                    <ExternalLink size={14} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="card video-comments-section">
                    <div className="card-header">
                        <h3>
                            <MessageCircle size={20} />
                            Comments
                            {comments.length > 0 && <span className="comment-count">{comments.length}</span>}
                        </h3>
                    </div>

                    {/* Add Comment Form */}
                    <form onSubmit={handleAddComment} className="comment-form">
                        <div className="comment-input-wrapper">
                            <div className="comment-avatar">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="comment-input"
                                disabled={submittingComment}
                            />
                            <button
                                type="submit"
                                className="btn btn-primary comment-submit"
                                disabled={!newComment.trim() || submittingComment}
                            >
                                {submittingComment ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
                            </button>
                        </div>
                    </form>

                    {/* Comments List */}
                    <div className="comments-list">
                        {comments.length === 0 ? (
                            <div className="no-comments">
                                <MessageCircle size={40} />
                                <p>No comments yet</p>
                                <span>Be the first to add a comment!</span>
                            </div>
                        ) : (
                            comments.slice().reverse().map((comment) => (
                                <div key={comment.id} className="comment-item">
                                    <div className="comment-avatar">
                                        {comment.authorName?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className="comment-content">
                                        <div className="comment-header">
                                            <span className="comment-author">{comment.authorName}</span>
                                            <span className="comment-time">{formatCommentDate(comment.createdAt)}</span>
                                        </div>
                                        <p className="comment-text">{comment.text}</p>
                                    </div>
                                    {(user?.id === comment.authorId || user?.role === 'admin') && (
                                        <button
                                            onClick={() => handleDeleteComment(comment.id)}
                                            className="comment-delete-btn"
                                            disabled={deletingCommentId === comment.id}
                                            title="Delete comment"
                                        >
                                            {deletingCommentId === comment.id ? (
                                                <Loader2 size={14} className="spin" />
                                            ) : (
                                                <Trash2 size={14} />
                                            )}
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoDetails;
