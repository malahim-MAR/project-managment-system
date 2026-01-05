import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, FileText, Save, Pencil } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs, orderBy, query, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useData } from '../context/DataContext';

const contentTypeOptions = [
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

const scriptStatusOptions = [
    'Pending',
    'In Progress',
    'Review',
    'Changes Requested',
    'Completed',
    'On Hold'
];

const writerOptions = [
    'Daoud Tahoor',
    'Chatgpt'
];

const NewScript = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { invalidateScripts, invalidateVideos } = useData();
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [videos, setVideos] = useState([]);

    const [formData, setFormData] = useState({
        clientName: '',
        startedDate: new Date().toISOString().split('T')[0],
        contentType: '',
        relatedVideoId: '',
        clientBriefLink: '',
        status: 'Pending',
        finalScriptLink: '',
        specialNotes: '',
        writer: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Clients
                const clientsSnap = await getDocs(collection(db, 'clients'));
                const clientList = clientsSnap.docs.map(doc => doc.data().name).filter(Boolean).sort();
                setClients([...new Set(clientList)]);

                // Fetch Videos for dropdown
                const videosQuery = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
                const videosSnap = await getDocs(videosQuery);
                const videosData = videosSnap.docs.map(doc => ({
                    id: doc.id,
                    projectName: doc.data().projectName,
                    product: doc.data().product,
                    clientName: doc.data().clientName
                }));
                setVideos(videosData);

                // Fetch Script if Editing
                if (id) {
                    const scriptDoc = await getDoc(doc(db, 'scripts', id));
                    if (scriptDoc.exists()) {
                        setFormData({ ...scriptDoc.data() });
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, [id]);

    // Filter videos by selected client
    const availableVideos = formData.clientName
        ? videos.filter(v => v.clientName === formData.clientName)
        : videos;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Handle Client (Add if new)
            const trimmedClient = formData.clientName.trim();
            if (trimmedClient) {
                const clientExists = clients.some(c => c.toLowerCase() === trimmedClient.toLowerCase());
                if (!clientExists) {
                    await addDoc(collection(db, 'clients'), {
                        name: trimmedClient,
                        createdAt: serverTimestamp()
                    });
                }
            }

            // 2. Prepare Data
            const dataToSave = {
                clientName: trimmedClient,
                startedDate: formData.startedDate,
                contentType: formData.contentType,
                relatedVideoId: formData.relatedVideoId,
                clientBriefLink: formData.clientBriefLink,
                status: formData.status,
                finalScriptLink: formData.finalScriptLink,
                specialNotes: formData.specialNotes,
                writer: formData.writer,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            // Add related video details if selected
            if (formData.relatedVideoId) {
                const vid = videos.find(v => v.id === formData.relatedVideoId);
                if (vid) {
                    dataToSave.relatedVideoProject = vid.projectName;
                    dataToSave.relatedVideoProduct = vid.product;
                }
            }

            // 3. Save Script (Add or Update)
            let scriptId = id;
            if (id) {
                await updateDoc(doc(db, 'scripts', id), dataToSave);
            } else {
                const docRef = await addDoc(collection(db, 'scripts'), dataToSave);
                scriptId = docRef.id;
            }

            // 4. Update Related Video (if selected)
            if (formData.relatedVideoId) {
                const videoRef = doc(db, 'videos', formData.relatedVideoId);
                await updateDoc(videoRef, {
                    scriptId: scriptId,
                    scriptLink: formData.finalScriptLink || '',
                    scriptStatus: formData.status || 'Pending'
                });
            }

            // Invalidate caches so lists fetch fresh data
            invalidateScripts();
            if (formData.relatedVideoId) {
                invalidateVideos(); // Also invalidate videos if script was linked
            }
            navigate('/scripts');

        } catch (error) {
            console.error('Error saving script:', error);
            alert('Failed to save script. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container animate-fade-in">
            <Link to="/scripts" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                <ArrowLeft size={16} /> Back to Scripts
            </Link>

            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {id ? <Pencil size={32} color="var(--accent-color)" /> : <FileText size={32} color="var(--accent-color)" />}
                    {id ? 'Edit Script' : 'New Script'}
                </h1>
                <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                    {id ? 'Update script details.' : 'Create a new script production task.'}
                </p>

                <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>

                        {/* Client Name (Input + Datalist) */}
                        <div className="form-group">
                            <label>Client Name *</label>
                            <input
                                list="client-options"
                                type="text"
                                name="clientName"
                                value={formData.clientName}
                                onChange={handleChange}
                                required
                                placeholder="Select or enter client name"
                                autoComplete="off"
                            />
                            <datalist id="client-options">
                                {clients.map((client, index) => (
                                    <option key={index} value={client} />
                                ))}
                            </datalist>
                        </div>

                        {/* Started Date */}
                        <div className="form-group">
                            <label>Started Date</label>
                            <input
                                type="date"
                                name="startedDate"
                                value={formData.startedDate}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Content Type (Dropdown) */}
                        <div className="form-group">
                            <label>Content Type</label>
                            <select
                                name="contentType"
                                value={formData.contentType}
                                onChange={handleChange}
                            >
                                <option value="">Select Content Type</option>
                                {contentTypeOptions.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        {/* Writer */}
                        <div className="form-group">
                            <label>Writer</label>
                            <select
                                name="writer"
                                value={formData.writer}
                                onChange={handleChange}
                            >
                                <option value="">Select Writer</option>
                                {writerOptions.map(w => (
                                    <option key={w} value={w}>{w}</option>
                                ))}
                            </select>
                        </div>

                        {/* For Video */}
                        <div className="form-group">
                            <label>For Video (Optional)</label>
                            <select
                                name="relatedVideoId"
                                value={formData.relatedVideoId}
                                onChange={handleChange}
                            >
                                <option value="">Select Video (Filtered by Client)</option>
                                {availableVideos.length === 0 && <option disabled>No videos found for this client</option>}
                                {availableVideos.map(v => (
                                    <option key={v.id} value={v.id}>
                                        {v.projectName} - {v.product}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status */}
                        <div className="form-group">
                            <label>Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                {scriptStatusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        {/* Links */}
                        <div className="form-group">
                            <label>Client Brief Link</label>
                            <input
                                type="url"
                                name="clientBriefLink"
                                value={formData.clientBriefLink}
                                onChange={handleChange}
                                placeholder="https://..."
                            />
                        </div>

                        <div className="form-group">
                            <label>Final Script Link</label>
                            <input
                                type="url"
                                name="finalScriptLink"
                                value={formData.finalScriptLink}
                                onChange={handleChange}
                                placeholder="https://..."
                            />
                        </div>

                        {/* Special Notes */}
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Special Notes</label>
                            <textarea
                                name="specialNotes"
                                value={formData.specialNotes}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Add any special notes..."
                            />
                        </div>

                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                        <Link to="/scripts" className="btn btn-outline">
                            Cancel
                        </Link>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="spin" size={18} /> Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={18} /> {id ? 'Update Script' : 'Save Script'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewScript;
