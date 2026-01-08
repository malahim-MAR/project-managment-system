import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase.js';
import { doc, getDoc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { uploadImage, getThumbnailUrl } from '../utils/cloudinary';
import '../utils/cloudinaryTest'; // Auto-runs config test
import {
    ArrowLeft,
    Video,
    Loader2,
    Calendar,
    User,
    Pencil,
    Clock,
    Send,
    MessageCircle,
    Trash2,
    FolderGit2,
    Film,
    Image as ImageIcon,
    Upload,
    X
} from 'lucide-react';

const PostProductionDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { updatePostProductionsCache } = useData();

    const [postProd, setPostProd] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [deletingCommentId, setDeletingCommentId] = useState(null);

    // Image upload states
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);
    const commentInputRef = useRef(null);

    useEffect(() => {
        fetchPostProductionDetails();
    }, [id]);


    const fetchPostProductionDetails = async () => {
        try {
            const docRef = await getDoc(doc(db, 'postproductions', id));
            if (docRef.exists()) {
                setPostProd({ id: docRef.id, ...docRef.data() });
            } else {
                navigate('/post-productions', { replace: true });
            }
        } catch (error) {
            console.error('Error fetching post-production:', error);
        } finally {
            setLoading(false);
        }
    };

    // Image handling functions
    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelection(file);
        }
    };

    const handleFileSelection = (file) => {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File too large. Maximum size is 5MB.');
            return;
        }

        setSelectedImage(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                e.preventDefault();
                const file = items[i].getAsFile();
                if (file) {
                    handleFileSelection(file);
                }
                break;
            }
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() && !selectedImage) return;

        setSubmittingComment(true);
        try {
            let imageUrl = null;

            // Upload image if selected
            if (selectedImage) {
                setUploadingImage(true);
                try {
                    const result = await uploadImage(selectedImage, {
                        folder: 'post-production-comments',
                        onProgress: setUploadProgress
                    });
                    imageUrl = result.url;
                } catch (uploadError) {
                    console.error('Image upload error:', uploadError);
                    alert('Failed to upload image. The comment will be posted without the image.');
                } finally {
                    setUploadingImage(false);
                }
            }

            const comment = {
                id: Date.now().toString(),
                text: newComment.trim(),
                imageUrl: imageUrl || null,
                authorId: user?.id || 'anonymous',
                authorName: user?.name || 'Anonymous',
                createdAt: new Date().toISOString()
            };

            await updateDoc(doc(db, 'postproductions', id), {
                comments: arrayUnion(comment),
                updatedAt: serverTimestamp()
            });

            setPostProd(prev => ({
                ...prev,
                comments: [...(prev.comments || []), comment]
            }));

            updatePostProductionsCache(prev => prev?.map(p =>
                p.id === id ? { ...p, comments: [...(p.comments || []), comment] } : p
            ));

            setNewComment('');
            removeImage();
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
            const updatedComments = (postProd.comments || []).filter(c => c.id !== commentId);

            await updateDoc(doc(db, 'postproductions', id), {
                comments: updatedComments,
                updatedAt: serverTimestamp()
            });

            setPostProd(prev => ({ ...prev, comments: updatedComments }));

            updatePostProductionsCache(prev => prev?.map(p =>
                p.id === id ? { ...p, comments: updatedComments } : p
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

    if (loading) {
        return (
            <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Loader2 size={40} className="spin" style={{ color: 'var(--accent-color)' }} />
            </div>
        );
    }

    if (!postProd) {
        return (
            <div className="page-container">
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <Video size={64} style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }} />
                    <h2>Post-Production Not Found</h2>
                    <p>The post-production entry you're looking for doesn't exist or has been deleted.</p>
                    <Link to="/post-productions" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                        Back to Post Productions
                    </Link>
                </div>
            </div>
        );
    }

    const comments = postProd.comments || [];

    return (
        <div className="page-container animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <Link to="/post-productions" className="btn btn-outline" style={{ marginBottom: '1rem' }}>
                    <ArrowLeft size={18} /> Back to Post Productions
                </Link>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                            <Video size={32} color="var(--accent-color)" />
                            {postProd.videoName || postProd.videoProduct || 'Post-Production Entry'}
                        </h1>
                        <p style={{ marginTop: '0.5rem', marginBottom: 0, color: 'var(--text-secondary)' }}>
                            {postProd.videoType} • Editor: {postProd.editor || 'Unassigned'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="video-details-grid">
                {/* Main Info Card */}
                <div className="card video-details-main">
                    <div className="card-header">
                        <h3><Video size={20} /> Post-Production Information</h3>
                    </div>
                    <div className="video-details-content">
                        <div className="detail-row">
                            <span className="detail-label">Video Name</span>
                            <span className="detail-value">{postProd.videoName || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Product</span>
                            <span className="detail-value">{postProd.videoProduct || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Video Type</span>
                            <span className="detail-value">{postProd.videoType || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Editor</span>
                            <span className="detail-value">
                                <User size={14} style={{ marginRight: '0.35rem' }} />
                                {postProd.editor || 'Unassigned'}
                            </span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Assign Date</span>
                            <span className="detail-value">
                                <Calendar size={14} style={{ marginRight: '0.35rem' }} />
                                {formatDate(postProd.assignDate)}
                            </span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Delivery Date</span>
                            <span className="detail-value">
                                <Calendar size={14} style={{ marginRight: '0.35rem' }} />
                                {postProd.deliveryDate ? formatDate(postProd.deliveryDate) : 'Not set'}
                            </span>
                        </div>
                        {postProd.revisionDate && (
                            <div className="detail-row">
                                <span className="detail-label">Revision Date</span>
                                <span className="detail-value">
                                    <Clock size={14} style={{ marginRight: '0.35rem' }} />
                                    {formatDate(postProd.revisionDate)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Project Info Card */}
                <div className="card video-details-sidebar">
                    <div className="card-header">
                        <h3><FolderGit2 size={20} /> Project Details</h3>
                    </div>
                    <div className="video-details-content">
                        <div className="detail-row">
                            <span className="detail-label">Project</span>
                            <span className="detail-value">{postProd.videoProjectName || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Client</span>
                            <span className="detail-value">{postProd.clientName || 'N/A'}</span>
                        </div>
                        {postProd.videoId && (
                            <div className="links-section">
                                <h4>Related</h4>
                                <Link to={`/videos/${postProd.videoId}`} className="resource-link">
                                    <Film size={16} />
                                    <span>View Original Video</span>
                                </Link>
                            </div>
                        )}
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
                            <div style={{ flex: 1 }}>
                                <textarea
                                    ref={commentInputRef}
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onPaste={handlePaste}
                                    placeholder="Add a comment... (or paste an image)"
                                    className="comment-input"
                                    disabled={submittingComment}
                                    style={{
                                        width: '100%',
                                        minHeight: '60px',
                                        resize: 'vertical',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-card)',
                                        color: 'var(--text-primary)',
                                        fontFamily: 'inherit',
                                        fontSize: '0.9rem'
                                    }}
                                />

                                {/* Image Preview */}
                                {imagePreview && (
                                    <div style={{
                                        marginTop: '0.75rem',
                                        position: 'relative',
                                        display: 'inline-block'
                                    }}>
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            style={{
                                                maxWidth: '200px',
                                                maxHeight: '200px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-color)'
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            style={{
                                                position: 'absolute',
                                                top: '4px',
                                                right: '4px',
                                                background: 'var(--danger)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '24px',
                                                height: '24px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer'
                                            }}
                                            title="Remove image"
                                        >
                                            <X size={14} />
                                        </button>
                                        {uploadingImage && (
                                            <div style={{
                                                marginTop: '0.5rem',
                                                fontSize: '0.85rem',
                                                color: 'var(--accent-color)'
                                            }}>
                                                Uploading... {uploadProgress}%
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div style={{
                                    display: 'flex',
                                    gap: '0.5rem',
                                    marginTop: '0.75rem'
                                }}>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        style={{ display: 'none' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="btn btn-outline"
                                        disabled={submittingComment}
                                        style={{ padding: '0.5rem 1rem' }}
                                    >
                                        <ImageIcon size={16} /> Upload Image
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary comment-submit"
                                        disabled={(!newComment.trim() && !selectedImage) || submittingComment}
                                        style={{ padding: '0.5rem 1rem' }}
                                    >
                                        {submittingComment ? <Loader2 size={18} className="spin" /> : <><Send size={16} /> Post</>}
                                    </button>
                                </div>
                            </div>
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
                                        {comment.text && <p className="comment-text">{comment.text}</p>}
                                        {comment.imageUrl && (
                                            <a
                                                href={comment.imageUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: 'block',
                                                    marginTop: '0.75rem'
                                                }}
                                            >
                                                <img
                                                    src={getThumbnailUrl(comment.imageUrl, 400)}
                                                    alt="Comment attachment"
                                                    style={{
                                                        maxWidth: '400px',
                                                        maxHeight: '300px',
                                                        borderRadius: '8px',
                                                        border: '1px solid var(--border-color)',
                                                        cursor: 'pointer'
                                                    }}
                                                />
                                            </a>
                                        )}
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

export default PostProductionDetails;
