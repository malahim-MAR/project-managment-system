import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { db } from '../firebase.js';
import { doc, getDoc, updateDoc, serverTimestamp, collection, getDocs, addDoc } from 'firebase/firestore';
import { useData } from '../context/DataContext';

const preProductionTeamOptions = [
    { id: 1, name: 'Zaviar Zarhan' },
    { id: 2, name: 'Khawaja Wasay' },
    { id: 3, name: 'Daoud Tahoor' },
    { id: 4, name: 'Shuja Baig' }
];

const postProductionTeamOptions = [
    { id: 1, name: 'Muzammil Ali' },
    { id: 2, name: 'Yasir Ghani' },
    { id: 3, name: 'Zaviar Zarhan' }
];

const EditProject = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { invalidateProjects } = useData();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [clients, setClients] = useState([]);
    const [formData, setFormData] = useState({
        projectName: '',
        clientName: '',
        startDate: '',
        noOfVideoAssign: '',
        noOfVideosDeliver: '',
        preProductionTeam: [],
        postProductionTeam: [],
        dateOfDelivery: '',
        reEditsRevisionDate: '',
        status: 'in-progress',
        specialNotes: '',
        projectDriveLink: ''
    });

    useEffect(() => {
        fetchProject();
        fetchClients();
    }, [id]);

    const fetchClients = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'clients'));
            const clientList = querySnapshot.docs.map(doc => doc.data().name).sort();
            setClients([...new Set(clientList)]);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const fetchProject = async () => {
        try {
            const docRef = doc(db, 'projects', id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                // Convert team names back to IDs
                const preTeamIds = (data.preProductionTeam || []).map(name =>
                    preProductionTeamOptions.find(t => t.name === name)?.id
                ).filter(Boolean);
                const postTeamIds = (data.postProductionTeam || []).map(name =>
                    postProductionTeamOptions.find(t => t.name === name)?.id
                ).filter(Boolean);

                setFormData({
                    projectName: data.name || '',
                    clientName: data.clientName || '',
                    startDate: data.startDate || '',
                    noOfVideoAssign: data.noOfVideoAssign?.toString() || '',
                    noOfVideosDeliver: data.noOfVideosDeliver?.toString() || '',
                    preProductionTeam: preTeamIds,
                    postProductionTeam: postTeamIds,
                    dateOfDelivery: data.dateOfDelivery || '',
                    reEditsRevisionDate: data.reEditsRevisionDate || '',
                    status: data.status || 'in-progress',
                    specialNotes: data.specialNotes || '',
                    projectDriveLink: data.projectDriveLink || ''
                });
            } else {
                alert('Project not found');
                navigate('/projects');
            }
        } catch (error) {
            console.error('Error fetching project:', error);
            alert('Failed to load project');
            navigate('/projects');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTeamChange = (teamType, memberId) => {
        setFormData(prev => {
            const currentTeam = prev[teamType];
            if (currentTeam.includes(memberId)) {
                return { ...prev, [teamType]: currentTeam.filter(id => id !== memberId) };
            } else {
                return { ...prev, [teamType]: [...currentTeam, memberId] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            // 1. Handle Client Management
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

            const preTeamNames = formData.preProductionTeam.map(id =>
                preProductionTeamOptions.find(t => t.id === id)?.name
            ).filter(Boolean);

            const postTeamNames = formData.postProductionTeam.map(id =>
                postProductionTeamOptions.find(t => t.id === id)?.name
            ).filter(Boolean);

            const projectData = {
                name: formData.projectName,
                clientName: trimmedClient,
                startDate: formData.startDate,
                noOfVideoAssign: parseInt(formData.noOfVideoAssign) || 0,
                noOfVideosDeliver: parseInt(formData.noOfVideosDeliver) || 0,
                preProductionTeam: preTeamNames,
                postProductionTeam: postTeamNames,
                dateOfDelivery: formData.dateOfDelivery,
                reEditsRevisionDate: formData.reEditsRevisionDate,
                status: formData.status,
                specialNotes: formData.specialNotes,
                projectDriveLink: formData.projectDriveLink,
                updatedAt: serverTimestamp()
            };

            await updateDoc(doc(db, 'projects', id), projectData);
            // Invalidate cache so the list fetches fresh data
            invalidateProjects();
            navigate('/projects');
        } catch (error) {
            console.error('Error updating project:', error);
            alert('Failed to update project. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Loader2 size={40} className="spin" style={{ color: 'var(--accent-color)' }} />
            </div>
        );
    }

    return (
        <div className="page-container animate-fade-in">
            <Link to="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                <ArrowLeft size={16} /> Back to Projects
            </Link>

            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ marginBottom: '0.5rem' }}>Edit Project</h1>
                <p style={{ marginBottom: '2rem' }}>Update the project details below.</p>

                <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>

                        {/* Project Name */}
                        <div className="form-group">
                            <label>Project Name *</label>
                            <input
                                type="text"
                                name="projectName"
                                value={formData.projectName}
                                onChange={handleChange}
                                required
                                placeholder="Enter project name"
                            />
                        </div>

                        {/* Client Name with Datalist */}
                        <div className="form-group">
                            <label>Client Name *</label>
                            <input
                                list="client-options"
                                type="text"
                                name="clientName"
                                value={formData.clientName}
                                onChange={handleChange}
                                required
                                placeholder="Select or type new client"
                                autoComplete="off"
                            />
                            <datalist id="client-options">
                                {clients.map((client, index) => (
                                    <option key={index} value={client} />
                                ))}
                            </datalist>
                        </div>

                        {/* Start Date */}
                        <div className="form-group">
                            <label>Start Date *</label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* No of Video Assign */}
                        <div className="form-group">
                            <label>No. of Videos Assigned</label>
                            <input
                                type="number"
                                name="noOfVideoAssign"
                                value={formData.noOfVideoAssign}
                                onChange={handleChange}
                                placeholder="0"
                                min="0"
                            />
                        </div>

                        {/* No of Videos Deliver */}
                        <div className="form-group">
                            <label>No. of Videos Delivered</label>
                            <input
                                type="number"
                                name="noOfVideosDeliver"
                                value={formData.noOfVideosDeliver}
                                onChange={handleChange}
                                placeholder="0"
                                min="0"
                            />
                        </div>

                        {/* Pre-Production Team */}
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Pre-Production Team</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                {preProductionTeamOptions.map(member => (
                                    <label key={`pre-${member.id}`} style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '20px',
                                        cursor: 'pointer',
                                        backgroundColor: formData.preProductionTeam.includes(member.id) ? 'var(--accent-color)' : 'var(--bg-card)',
                                        color: formData.preProductionTeam.includes(member.id) ? 'white' : 'var(--text-secondary)',
                                        border: '1px solid var(--border-color)',
                                        transition: 'all 0.2s'
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.preProductionTeam.includes(member.id)}
                                            onChange={() => handleTeamChange('preProductionTeam', member.id)}
                                            style={{ display: 'none' }}
                                        />
                                        {member.name}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Post-Production Team */}
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Post-Production Team</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                {postProductionTeamOptions.map(member => (
                                    <label key={`post-${member.id}`} style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '20px',
                                        cursor: 'pointer',
                                        backgroundColor: formData.postProductionTeam.includes(member.id) ? 'var(--accent-color)' : 'var(--bg-card)',
                                        color: formData.postProductionTeam.includes(member.id) ? 'white' : 'var(--text-secondary)',
                                        border: '1px solid var(--border-color)',
                                        transition: 'all 0.2s'
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.postProductionTeam.includes(member.id)}
                                            onChange={() => handleTeamChange('postProductionTeam', member.id)}
                                            style={{ display: 'none' }}
                                        />
                                        {member.name}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Date of Delivery */}
                        <div className="form-group">
                            <label>Date of Delivery</label>
                            <input
                                type="date"
                                name="dateOfDelivery"
                                value={formData.dateOfDelivery}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Re-Edits & Revision Date */}
                        <div className="form-group">
                            <label>Re-Edits & Revisions Date</label>
                            <input
                                type="date"
                                name="reEditsRevisionDate"
                                value={formData.reEditsRevisionDate}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Status */}
                        <div className="form-group">
                            <label>Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="on-hold">On Hold</option>
                                <option value="in-progress">In Progress</option>
                                <option value="complete">Complete</option>
                            </select>
                        </div>

                        {/* Project Drive Link */}
                        <div className="form-group">
                            <label>Project Drive Link *</label>
                            <input
                                type="url"
                                name="projectDriveLink"
                                value={formData.projectDriveLink}
                                onChange={handleChange}
                                required
                                placeholder="https://drive.google.com/..."
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
                        <Link to="/projects" className="btn" style={{
                            backgroundColor: 'var(--bg-card)',
                            color: 'var(--text-secondary)'
                        }}>
                            Cancel
                        </Link>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 size={18} className="spin" /> Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProject;
