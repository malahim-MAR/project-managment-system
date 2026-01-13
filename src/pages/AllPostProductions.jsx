import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase.js';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { notifyPostProductionAssigned } from '../utils/notifications';
import {
    Film,
    Loader2,
    Trash2,
    Pencil,
    Plus,
    Search,
    ChevronDown,
    User,
    Calendar,
    Video,
    X,
    Save,
    Eye,
    Filter
} from 'lucide-react';

const editorOptions = ['Muzammil Ali', 'Yasir Ghani', 'Zaviar Zarhan'];

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const AllPostProductions = () => {
    const {
        postProductions, loadingPostProductions, fetchPostProductions, updatePostProductionsCache,
        videos, loadingVideos, fetchVideos
    } = useData();
    const { user } = useAuth();

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEditor, setSelectedEditor] = useState('all');
    const [selectedMonth, setSelectedMonth] = useState('all');

    // Modal & Form State
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        videoId: '',
        clientName: '',
        videoType: '',
        videoProduct: '',
        videoProjectName: '',
        videoName: '',
        editor: '',
        assignDate: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        revisionDate: ''
    });

    // Delete state
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchPostProductions();
        fetchVideos(); // Ensure we have videos for the dropdown
    }, [fetchPostProductions, fetchVideos]);

    // --- Form Handlers ---

    const resetForm = () => {
        setFormData({
            videoId: '',
            clientName: '',
            videoType: '',
            videoProduct: '',
            videoProjectName: '',
            editor: '',
            assignDate: new Date().toISOString().split('T')[0],
            deliveryDate: '',
            revisionDate: ''
        });
        setIsEditMode(false);
        setEditingId(null);
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setIsEditMode(true);
            setEditingId(item.id);
            setFormData({
                videoId: item.videoId || '',
                clientName: item.clientName || '',
                videoType: item.videoType || '',
                videoProduct: item.videoProduct || '',
                videoProjectName: item.videoProjectName || '',
                editor: item.editor || '',
                assignDate: item.assignDate || '',
                deliveryDate: item.deliveryDate || '',
                revisionDate: item.revisionDate || ''
            });
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        resetForm();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleVideoChange = (e) => {
        const videoId = e.target.value;
        const selectedVideo = videos?.find(v => v.id === videoId);

        setFormData(prev => ({
            ...prev,
            videoId: videoId,
            clientName: selectedVideo?.clientName || '',
            videoType: selectedVideo?.videoType || '',
            videoProduct: selectedVideo?.product || '',
            videoProjectName: selectedVideo?.projectName || '',
            videoName: selectedVideo?.videoName || selectedVideo?.product || ''
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const dataToSave = {
                ...formData,
                updatedAt: serverTimestamp()
            };

            if (isEditMode) {
                await updateDoc(doc(db, 'postproductions', editingId), dataToSave);
                updatePostProductionsCache(prev => prev.map(item =>
                    item.id === editingId ? { ...item, ...dataToSave, id: editingId } : item
                ));
            } else {
                dataToSave.createdAt = serverTimestamp();
                const docRef = await addDoc(collection(db, 'postproductions'), dataToSave);
                updatePostProductionsCache(prev => ([{ ...dataToSave, id: docRef.id }, ...(prev || [])]));

                // Send notification to all users (only for new assignments)
                await notifyPostProductionAssigned(formData.videoName || formData.videoProduct, formData.editor);
            }
            handleCloseModal();
        } catch (error) {
            console.error("Error saving:", error);
            alert("Failed to save entry");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this post-production entry?")) return;
        setDeletingId(id);
        try {
            await deleteDoc(doc(db, 'postproductions', id));
            updatePostProductionsCache(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error("Error deleting:", error);
            alert("Failed to delete entry");
        } finally {
            setDeletingId(null);
        }
    };

    // Extract available months
    const availableMonths = React.useMemo(() => {
        if (!postProductions) return [];
        const months = new Set();
        postProductions.forEach(item => {
            if (item.assignDate) {
                const date = new Date(item.assignDate);
                if (!isNaN(date.getTime())) {
                    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    months.add(monthYear);
                }
            }
        });
        return Array.from(months).sort().reverse();
    }, [postProductions]);

    const getMonthLabel = (monthYear) => {
        const [year, month] = monthYear.split('-');
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    };

    // --- Filter Logic ---
    const postProductionsList = postProductions || [];
    const filteredItems = postProductionsList.filter(item => {
        const matchSearch =
            (item.clientName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (item.videoType?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (item.videoProduct?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchEditor = selectedEditor === 'all' || item.editor === selectedEditor;

        // Month filter
        let matchMonth = true;
        if (selectedMonth !== 'all' && item.assignDate) {
            const date = new Date(item.assignDate);
            if (!isNaN(date.getTime())) {
                const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                matchMonth = monthYear === selectedMonth;
            } else {
                matchMonth = false;
            }
        }

        return matchSearch && matchEditor && matchMonth;
    });

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedEditor('all');
        setSelectedMonth('all');
    };

    const hasActiveFilters = selectedEditor !== 'all' || selectedMonth !== 'all' || searchQuery.trim() !== '';

    // Stats
    const totalItems = postProductionsList.length;
    const pendingItems = postProductionsList.filter(p => !p.deliveryDate || new Date(p.deliveryDate) > new Date()).length;
    const completedItems = postProductionsList.filter(p => p.deliveryDate && new Date(p.deliveryDate) <= new Date()).length;

    // Loading State
    if (loadingPostProductions && postProductions === null) {
        return (
            <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Loader2 size={40} className="spin" style={{ color: 'var(--accent-color)' }} />
            </div>
        );
    }

    return (
        <div className="page-container animate-fade-in" style={{ position: 'relative' }}>
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                        <Film size={32} color="var(--accent-color)" />
                        Post Productions
                    </h1>
                    <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                        Track and manage video editing and post-production tasks
                    </p>
                </div>
                {!showModal && (
                    <button onClick={() => setShowModal(true)} className="btn btn-primary">
                        <Plus size={18} /> New Assignment
                    </button>
                )}
            </div>

            {/* Form Section (Now directly on page when active) */}
            {showModal && (
                <div className="card animate-fade-in" style={{ marginBottom: '2rem', border: '1px solid var(--accent-color)' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
                            {isEditMode ? 'Edit Assignment' : 'New Assignment'}
                        </h2>
                        <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            {/* Video Selection */}
                            <div className="form-group">
                                <label>Select Video *</label>
                                <select
                                    name="videoId"
                                    value={formData.videoId}
                                    onChange={handleVideoChange}
                                    required
                                    disabled={loadingVideos}
                                >
                                    <option value="">Choose a video...</option>
                                    {(videos || []).map(v => (
                                        <option key={v.id} value={v.id}>
                                            {v.videoName || v.product || 'Unnamed Video'} ({v.clientName})
                                        </option>
                                    ))}
                                </select>
                                {loadingVideos && <small style={{ color: 'var(--text-secondary)' }}>Loading videos...</small>}
                            </div>

                            {/* Who in Edit */}
                            <div className="form-group">
                                <label>Who in Edit *</label>
                                <select
                                    name="editor"
                                    value={formData.editor}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Editor</option>
                                    {editorOptions.map(e => (
                                        <option key={e} value={e}>{e}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Assign Date */}
                            <div className="form-group">
                                <label>Assign Date *</label>
                                <input
                                    type="date"
                                    name="assignDate"
                                    value={formData.assignDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Delivery Date */}
                            <div className="form-group">
                                <label>Delivery Date *</label>
                                <input
                                    type="date"
                                    name="deliveryDate"
                                    value={formData.deliveryDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Revision Date */}
                            <div className="form-group">
                                <label>Revision Date</label>
                                <input
                                    type="date"
                                    name="revisionDate"
                                    value={formData.revisionDate}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Read-only info */}
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                    <div><span style={{ color: 'var(--text-secondary)' }}>Client:</span> {formData.clientName || '-'}</div>
                                    <div><span style={{ color: 'var(--text-secondary)' }}>Type:</span> {formData.videoType || '-'}</div>
                                    <div><span style={{ color: 'var(--text-secondary)' }}>Project:</span> {formData.videoProjectName || '-'}</div>
                                    <div><span style={{ color: 'var(--text-secondary)' }}>Product:</span> {formData.videoProduct || '-'}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button type="button" onClick={handleCloseModal} className="btn btn-outline" style={{ border: 'none' }}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                                {saving ? ' Saving...' : (isEditMode ? ' Update' : ' Save')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card stat-card-blue">
                    <div className="stat-icon">
                        <Film size={24} />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{totalItems}</div>
                        <div className="stat-label">Total</div>
                    </div>
                </div>
                <div className="stat-card stat-card-yellow">
                    <div className="stat-icon">
                        <Calendar size={24} />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{pendingItems}</div>
                        <div className="stat-label">In Progress</div>
                    </div>
                </div>
                <div className="stat-card stat-card-green">
                    <div className="stat-icon">
                        <Video size={24} />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{completedItems}</div>
                        <div className="stat-label">Delivered</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by client, video type..."
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
                    <select value={selectedEditor} onChange={(e) => setSelectedEditor(e.target.value)}>
                        <option value="all">All Editors</option>
                        {editorOptions.map(e => <option key={e} value={e}>{e}</option>)}
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
                Showing {filteredItems.length} of {postProductionsList.length} entries
            </div>

            {/* Table */}
            {filteredItems.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <Film size={64} style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }} />
                    <h2 style={{ marginBottom: '0.5rem' }}>No Post Productions Yet</h2>
                    <p style={{ marginBottom: '1.5rem' }}>Start tracking your video editing tasks.</p>
                    <button onClick={() => setShowModal(true)} className="btn btn-primary">
                        <Plus size={18} /> Add First Entry
                    </button>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Video</th>
                                <th>Client</th>
                                <th>Video Type</th>
                                <th>Editor</th>
                                <th>Assign Date</th>
                                <th>Delivery Date</th>
                                <th>Revision Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>
                                            {item.videoName || item.videoProduct || 'N/A'}
                                            {item.videoProjectName && (
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    {item.videoProjectName}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <User size={14} color="var(--text-secondary)" />
                                            {item.clientName || 'N/A'}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge badge-blue" style={{ fontSize: '0.8rem' }}>
                                            {item.videoType || 'N/A'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <User size={14} color="var(--accent-color)" />
                                            {item.editor || 'N/A'}
                                        </div>
                                    </td>
                                    <td>{item.assignDate || '-'}</td>
                                    <td>{item.deliveryDate || '-'}</td>
                                    <td>{item.revisionDate || '-'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <Link
                                                to={`/post-productions/${item.id}`}
                                                className="btn"
                                                style={{
                                                    padding: '0.4rem',
                                                    background: 'var(--bg-card)',
                                                    border: '1px solid var(--border-color)',
                                                    color: 'var(--accent-color)'
                                                }}
                                                title="View Details"
                                            >
                                                <Eye size={14} />
                                            </Link>
                                            <button
                                                onClick={() => handleOpenModal(item)}
                                                className="btn"
                                                style={{
                                                    padding: '0.4rem',
                                                    background: 'var(--bg-card)',
                                                    border: '1px solid var(--border-color)',
                                                    color: 'var(--text-primary)'
                                                }}
                                                title="Edit"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                className="btn"
                                                onClick={() => handleDelete(item.id)}
                                                style={{ padding: '0.4rem', background: 'var(--danger)', color: 'white' }}
                                                disabled={deletingId === item.id}
                                                title="Delete"
                                            >
                                                {deletingId === item.id ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
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

export default AllPostProductions;
