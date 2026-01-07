import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Video, FileText } from 'lucide-react';
import { db } from '../firebase.js';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { notifyVideoAssigned } from '../utils/notifications';

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

const NewVideo = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // For edit mode
    const isEditMode = Boolean(id);
    const { invalidateVideos } = useData();
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode);
    const [projects, setProjects] = useState([]);
    const [formData, setFormData] = useState({
        projectId: '',
        clientName: '',
        videoType: '',
        videoName: '',
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
        fetchProjects();
        if (isEditMode) {
            fetchVideoDetails();
        }
    }, [id]);

    const fetchProjects = async () => {
        try {
            const projectsQuery = query(collection(db, 'projects'), orderBy('name', 'asc'));
            const projectsSnapshot = await getDocs(projectsQuery);
            const projectsData = projectsSnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                clientName: doc.data().clientName
            }));
            setProjects(projectsData);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const fetchVideoDetails = async () => {
        try {
            const videoRef = doc(db, 'videos', id);
            const videoSnap = await getDoc(videoRef);
            if (videoSnap.exists()) {
                const data = videoSnap.data();
                setFormData({
                    projectId: data.projectId || '',
                    clientName: data.clientName || '',
                    videoType: data.videoType || '',
                    videoName: data.videoName || '',
                    product: data.product || '',
                    scriptDocsLink: data.scriptDocsLink || '',
                    storyboardLink: data.storyboardLink || '',
                    videoTalent: data.videoTalent || '',
                    shootDay: data.shootDay || '',
                    time: data.time || '',
                    specialNotes: data.specialNotes || '',
                    shootStatus: data.shootStatus || 'Pending'
                });
            } else {
                alert('Video not found');
                navigate('/videos');
            }
        } catch (error) {
            console.error('Error fetching video:', error);
            alert('Failed to load video details.');
            navigate('/videos');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleProjectChange = (e) => {
        const projectId = e.target.value;
        const project = projects.find(p => p.id === projectId);
        setFormData(prev => ({
            ...prev,
            projectId: projectId,
            clientName: project?.clientName || ''
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Find the selected project's name
            const selectedProject = projects.find(p => p.id === formData.projectId);
            const projectName = selectedProject?.name || '';
            const clientName = selectedProject?.clientName || formData.clientName || '';

            if (isEditMode) {
                // UPDATE existing video
                const videoRef = doc(db, 'videos', id);
                const updatedData = {
                    ...formData,
                    projectName: projectName,
                    clientName: clientName,
                    updatedAt: serverTimestamp()
                };

                await updateDoc(videoRef, updatedData);
            } else {
                // CREATE new video
                const videoData = {
                    ...formData,
                    projectName: projectName,
                    clientName: clientName,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };

                await addDoc(collection(db, 'videos'), videoData);

                // Send notification to all users (only for new videos)
                await notifyVideoAssigned(formData.videoName || formData.product, projectName);
            }

            // Invalidate cache so the list fetches fresh data
            invalidateVideos();
            navigate('/videos');
        } catch (error) {
            console.error('Error saving video:', error);
            alert('Failed to save video. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Loader2 size={40} className="spin" style={{ color: 'var(--accent-color)' }} />
            </div>
        );
    }

    return (
        <div className="page-container animate-fade-in">
            <Link to="/videos" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                <ArrowLeft size={16} /> Back to Videos
            </Link>

            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Video size={32} color="var(--accent-color)" />
                    {isEditMode ? 'Edit Video' : 'Add New Video'}
                </h1>
                <p style={{ marginBottom: '2rem' }}>
                    {isEditMode ? 'Update the video production details below.' : 'Fill in the details below to add a new video.'}
                </p>

                <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>

                        {/* Project Assignment */}
                        <div className="form-group">
                            <label>Assign to Project *</label>
                            <select
                                name="projectId"
                                value={formData.projectId}
                                onChange={handleProjectChange}
                                required
                            >
                                <option value="">Select a Project</option>
                                {projects.map(proj => (
                                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Client Name (read from project) */}
                        <div className="form-group">
                            <label>Client Name</label>
                            <input
                                type="text"
                                name="clientName"
                                value={formData.clientName}
                                disabled
                                style={{ opacity: 0.7, cursor: 'not-allowed' }}
                                placeholder="Select a project first"
                            />
                        </div>

                        {/* Video Type */}
                        <div className="form-group">
                            <label>Video Type *</label>
                            <select
                                name="videoType"
                                value={formData.videoType}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Video Type</option>
                                {videoTypeOptions.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        {/* Video Name */}
                        <div className="form-group">
                            <label>Video Name *</label>
                            <input
                                type="text"
                                name="videoName"
                                value={formData.videoName}
                                onChange={handleChange}
                                required
                                placeholder="Enter video name"
                            />
                        </div>

                        {/* Product */}
                        <div className="form-group">
                            <label>Product *</label>
                            <input
                                type="text"
                                name="product"
                                value={formData.product}
                                onChange={handleChange}
                                required
                                placeholder="Enter product name"
                            />
                        </div>

                        {/* Storyboard Drive Link */}
                        <div className="form-group">
                            <label>Storyboard Drive Link</label>
                            <input
                                type="url"
                                name="storyboardLink"
                                value={formData.storyboardLink}
                                onChange={handleChange}
                                placeholder="https://drive.google.com/..."
                            />
                        </div>

                        {/* Video Talent */}
                        <div className="form-group">
                            <label>Video Talent</label>
                            <input
                                type="text"
                                name="videoTalent"
                                value={formData.videoTalent}
                                onChange={handleChange}
                                placeholder="Enter talent name(s)"
                            />
                        </div>

                        {/* Shoot Day */}
                        <div className="form-group">
                            <label>Shoot Day</label>
                            <input
                                type="date"
                                name="shootDay"
                                value={formData.shootDay}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Time */}
                        <div className="form-group">
                            <label>Time</label>
                            <input
                                type="time"
                                name="time"
                                value={formData.time}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Shoot Status */}
                        <div className="form-group">
                            <label>Shoot Status</label>
                            <select
                                name="shootStatus"
                                value={formData.shootStatus}
                                onChange={handleChange}
                            >
                                {shootStatusOptions.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        {/* Script Docs Link (only for edit mode if no linked script) */}
                        <div className="form-group">
                            <label>Script Docs Link</label>
                            <input
                                type="url"
                                name="scriptDocsLink"
                                value={formData.scriptDocsLink}
                                onChange={handleChange}
                                placeholder="https://docs.google.com/..."
                            />
                        </div>

                        {/* Special Notes */}
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Special Notes</label>
                            <textarea
                                name="specialNotes"
                                value={formData.specialNotes}
                                onChange={handleChange}
                                placeholder="Add any special notes or instructions..."
                                rows={4}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                        <Link to="/videos" className="btn" style={{
                            backgroundColor: 'var(--bg-card)',
                            color: 'var(--text-secondary)'
                        }}>
                            Cancel
                        </Link>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="spin" /> {isEditMode ? 'Saving...' : 'Creating...'}
                                </>
                            ) : (
                                isEditMode ? 'Save Changes' : 'Add Video'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewVideo;
