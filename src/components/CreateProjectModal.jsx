import React, { useState } from 'react';
import { X } from 'lucide-react';

const teamOptions = [
    { id: 1, name: 'Alice Johnson' },
    { id: 2, name: 'Bob Smith' },
    { id: 3, name: 'Charlie Brown' },
    { id: 4, name: 'David Wilson' },
    { id: 5, name: 'Eve Davis' }
];

const CreateProjectModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        projectName: '',
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

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        setFormData({
            projectName: '',
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
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
        }}>
            <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '700px',
                maxHeight: '90vh',
                overflow: 'auto',
                border: '1px solid var(--border-color)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.5rem',
                    borderBottom: '1px solid var(--border-color)',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: 'var(--bg-secondary)',
                    zIndex: 10
                }}>
                    <h2 style={{ margin: 0 }}>Create New Project</h2>
                    <button onClick={onClose} style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        padding: '0.5rem'
                    }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
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
                                {teamOptions.map(member => (
                                    <label key={`pre-${member.id}`} className="chip-label" style={{
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
                                {teamOptions.map(member => (
                                    <label key={`post-${member.id}`} className="chip-label" style={{
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
                        <button type="button" onClick={onClose} className="btn" style={{
                            backgroundColor: 'var(--bg-card)',
                            color: 'var(--text-secondary)'
                        }}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Create Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectModal;
