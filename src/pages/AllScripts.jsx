import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase.js';
import { deleteDoc, doc } from 'firebase/firestore';
import { useData } from '../context/DataContext';
import {
    FileText,
    Loader2,
    Trash2,
    Pencil,
    Plus,
    Search,
    Filter,
    ChevronDown,
    ExternalLink,
    User,
    Video,
    Calendar,
    Link as LinkIcon,
    X
} from 'lucide-react';

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

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const AllScripts = () => {
    const { scripts, loadingScripts, fetchScripts, updateScriptsCache } = useData();

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedWriter, setSelectedWriter] = useState('all');
    const [selectedMonth, setSelectedMonth] = useState('all');

    // Delete state
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        // Fetch all needed data (uses cache if available)
        fetchScripts();
    }, [fetchScripts]);

    // Extract available months from scripts
    const availableMonths = React.useMemo(() => {
        if (!scripts) return [];
        const months = new Set();
        scripts.forEach(script => {
            if (script.startedDate) {
                const date = new Date(script.startedDate);
                if (!isNaN(date.getTime())) {
                    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    months.add(monthYear);
                }
            }
        });
        return Array.from(months).sort().reverse();
    }, [scripts]);

    const getMonthLabel = (monthYear) => {
        const [year, month] = monthYear.split('-');
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this script?")) return;
        setDeletingId(id);
        try {
            await deleteDoc(doc(db, 'scripts', id));
            // Update cache directly
            updateScriptsCache(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            console.error("Error deleting:", error);
            alert("Failed to delete script");
        } finally {
            setDeletingId(null);
        }
    };

    // Filter Logic (handle null scripts from cache)
    const scriptsList = scripts || [];
    const filteredScripts = scriptsList.filter(script => {
        const matchSearch = (script.clientName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (script.contentType?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (script.relatedVideoProject?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchStatus = selectedStatus === 'all' || script.status === selectedStatus;
        const matchWriter = selectedWriter === 'all' || script.writer === selectedWriter;

        // Month filter
        let matchMonth = true;
        if (selectedMonth !== 'all' && script.startedDate) {
            const date = new Date(script.startedDate);
            if (!isNaN(date.getTime())) {
                const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                matchMonth = monthYear === selectedMonth;
            } else {
                matchMonth = false;
            }
        }

        return matchSearch && matchStatus && matchWriter && matchMonth;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'badge-green';
            case 'In Progress': return 'badge-blue';
            case 'Pending': return 'badge-yellow';
            default: return 'badge-blue';
        }
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedStatus('all');
        setSelectedWriter('all');
        setSelectedMonth('all');
    };

    const hasActiveFilters = selectedStatus !== 'all' || selectedWriter !== 'all' || selectedMonth !== 'all' || searchQuery.trim() !== '';

    if (loadingScripts || scripts === null) {
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
                        <FileText size={32} color="var(--accent-color)" />
                        All Scripts
                    </h1>
                    <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                        Manage scripts, writers, and content production
                    </p>
                </div>
                <Link to="/scripts/new" className="btn btn-primary">
                    <Plus size={18} /> New Script
                </Link>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search scripts..."
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
                    <select value={selectedWriter} onChange={(e) => setSelectedWriter(e.target.value)}>
                        <option value="all">All Writers</option>
                        {writerOptions.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                    <ChevronDown size={16} className="dropdown-icon" />
                </div>

                <div className="filter-dropdown">
                    <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                        <option value="all">All Statuses</option>
                        {scriptStatusOptions.map(s => <option key={s} value={s}>{s}</option>)}
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
                Showing {filteredScripts.length} of {scriptsList.length} scripts
                {hasActiveFilters && ' (filtered)'}
            </div>

            {/* Table */}
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Client</th>
                            <th>Content Type</th>
                            <th>Related Video</th>
                            <th>Writer</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Links</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredScripts.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                                    No scripts found.
                                </td>
                            </tr>
                        ) : filteredScripts.map(script => (
                            <tr key={script.id}>
                                <td style={{ fontWeight: 500 }}>{script.clientName}</td>
                                <td>{script.contentType}</td>
                                <td>
                                    {script.relatedVideoProject ? (
                                        <div style={{ fontSize: '0.85rem' }}>
                                            <div style={{ fontWeight: 500 }}>{script.relatedVideoProject}</div>
                                            <div style={{ color: 'var(--text-secondary)' }}>{script.relatedVideoProduct}</div>
                                        </div>
                                    ) : '-'}
                                </td>
                                <td>
                                    {script.writer && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <User size={14} color="var(--text-secondary)" /> {script.writer}
                                        </div>
                                    )}
                                </td>
                                <td>{script.startedDate}</td>
                                <td>
                                    <span className={`badge ${getStatusColor(script.status)}`}>{script.status}</span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {script.clientBriefLink && (
                                            <a href={script.clientBriefLink} target="_blank" rel="noreferrer" title="Client Brief" style={{ color: 'var(--accent-color)' }}>
                                                <ExternalLink size={16} />
                                            </a>
                                        )}
                                        {script.finalScriptLink && (
                                            <a href={script.finalScriptLink} target="_blank" rel="noreferrer" title="Final Script" style={{ color: 'var(--success)' }}>
                                                <LinkIcon size={16} />
                                            </a>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Link to={`/scripts/edit/${script.id}`} className="btn" style={{ padding: '0.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Pencil size={14} />
                                        </Link>
                                        <button className="btn" onClick={() => handleDelete(script.id)} style={{ padding: '0.4rem', background: 'var(--danger)', color: 'white' }} disabled={deletingId === script.id}>
                                            {deletingId === script.id ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>



        </div>
    );
};

export default AllScripts;
