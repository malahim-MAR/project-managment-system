import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, USER_ROLES, ROLE_LABELS } from '../context/AuthContext';
import { db } from '../firebase.js';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import {
    Users,
    UserPlus,
    Mail,
    Lock,
    Shield,
    User,
    Save,
    Loader2,
    Trash2,
    ToggleLeft,
    ToggleRight,
    ArrowLeft,
    Eye,
    EyeOff,
    Search,
    CheckCircle,
    XCircle,
    Pencil,
    X
} from 'lucide-react';

const ManageUsers = () => {
    const navigate = useNavigate();
    const { isAdmin, user } = useAuth();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Edit mode state
    const [editingUser, setEditingUser] = useState(null);
    const [showEditPassword, setShowEditPassword] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user'
    });

    const [editFormData, setEditFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: ''
    });

    // Redirect non-admins
    useEffect(() => {
        if (!isAdmin()) {
            navigate('/projects', { replace: true });
        }
    }, [isAdmin, navigate]);

    // Fetch users
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const usersQuery = query(
                collection(db, 'users'),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(usersQuery);
            const usersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'
            }));
            setUsers(usersData);
        } catch (error) {
            console.error('Error fetching users:', error);
            setMessage({ type: 'error', text: 'Failed to load users' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        // Validation
        if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
            setMessage({ type: 'error', text: 'All fields are required' });
            return;
        }

        // Check if email already exists
        const emailExists = users.some(u => u.email.toLowerCase() === formData.email.toLowerCase().trim());
        if (emailExists) {
            setMessage({ type: 'error', text: 'A user with this email already exists' });
            return;
        }

        setSaving(true);

        try {
            const newUser = {
                name: formData.name.trim(),
                email: formData.email.toLowerCase().trim(),
                password: formData.password,
                role: formData.role,
                isActive: true,
                createdAt: serverTimestamp(),
                createdBy: user?.email || 'admin'
            };

            await addDoc(collection(db, 'users'), newUser);

            setFormData({ name: '', email: '', password: '', role: 'user' });
            setShowAddForm(false);
            setMessage({ type: 'success', text: 'User added successfully!' });
            fetchUsers();
        } catch (error) {
            console.error('Error adding user:', error);
            setMessage({ type: 'error', text: 'Failed to add user. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    // Open edit modal
    const handleEditUser = (userData) => {
        setEditingUser(userData);
        setEditFormData({
            name: userData.name || '',
            email: userData.email || '',
            password: '', // Don't pre-fill password for security
            role: userData.role || 'user'
        });
        setShowEditPassword(false);
    };

    // Save edit
    const handleSaveEdit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (!editFormData.name.trim()) {
            setMessage({ type: 'error', text: 'Name is required' });
            return;
        }

        // Check if email changed and already exists
        if (editFormData.email !== editingUser.email) {
            const emailExists = users.some(u =>
                u.id !== editingUser.id &&
                u.email.toLowerCase() === editFormData.email.toLowerCase().trim()
            );
            if (emailExists) {
                setMessage({ type: 'error', text: 'A user with this email already exists' });
                return;
            }
        }

        setSaving(true);

        try {
            const updateData = {
                name: editFormData.name.trim(),
                email: editFormData.email.toLowerCase().trim(),
                role: editFormData.role,
                updatedAt: serverTimestamp(),
                updatedBy: user?.email || 'admin'
            };

            // Only update password if a new one was provided
            if (editFormData.password.trim()) {
                updateData.password = editFormData.password;
            }

            await updateDoc(doc(db, 'users', editingUser.id), updateData);

            // Update local state
            setUsers(prev => prev.map(u =>
                u.id === editingUser.id
                    ? { ...u, ...updateData, password: editFormData.password.trim() || u.password }
                    : u
            ));

            setEditingUser(null);
            setMessage({ type: 'success', text: 'User updated successfully!' });
        } catch (error) {
            console.error('Error updating user:', error);
            setMessage({ type: 'error', text: 'Failed to update user. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                isActive: !currentStatus
            });

            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, isActive: !currentStatus } : u
            ));

            setMessage({
                type: 'success',
                text: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`
            });
        } catch (error) {
            console.error('Error updating user:', error);
            setMessage({ type: 'error', text: 'Failed to update user status' });
        }
    };

    const handleDeleteUser = async (userId, userEmail) => {
        // Prevent deleting yourself
        if (userEmail === user?.email) {
            setMessage({ type: 'error', text: 'You cannot delete your own account' });
            return;
        }

        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'users', userId));
            setUsers(prev => prev.filter(u => u.id !== userId));
            setMessage({ type: 'success', text: 'User deleted successfully' });
        } catch (error) {
            console.error('Error deleting user:', error);
            setMessage({ type: 'error', text: 'Failed to delete user' });
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get role badge color
    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'admin': return 'badge-purple';
            case 'editor': return 'badge-blue';
            case 'script_writer': return 'badge-green';
            case 'client': return 'badge-yellow';
            default: return 'badge-blue';
        }
    };

    // Clear message after 5 seconds
    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => setMessage({ type: '', text: '' }), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    return (
        <div className="page-container animate-fade-in">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => navigate('/projects')}
                        className="btn btn-outline"
                        style={{ padding: '0.5rem 0.75rem' }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={28} />
                            Manage Users
                        </h1>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                            Add, edit and manage system users
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="btn btn-primary"
                >
                    <UserPlus size={20} />
                    {showAddForm ? 'Cancel' : 'Add New User'}
                </button>
            </div>

            {/* Message */}
            {message.text && (
                <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                    {message.type === 'error' ? <XCircle size={20} /> : <CheckCircle size={20} />}
                    {message.text}
                </div>
            )}

            {/* Add User Form */}
            {showAddForm && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserPlus size={22} />
                        Add New User
                    </h3>
                    <form onSubmit={handleAddUser}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label>
                                    <User size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    <Mail size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter email address"
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    <Lock size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                                    Password
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Enter password"
                                        style={{ paddingRight: '3rem' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '0.75rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            padding: '0.25rem'
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>
                                    <Shield size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                                    Role
                                </label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                >
                                    {Object.entries(USER_ROLES).map(([key, value]) => (
                                        <option key={value} value={value}>
                                            {ROLE_LABELS[value]}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => {
                                    setShowAddForm(false);
                                    setFormData({ name: '', email: '', password: '', role: 'user' });
                                }}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 size={20} className="spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        Add User
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="modal-overlay" onClick={() => setEditingUser(null)}>
                    <div className="modal animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                <Pencil size={20} />
                                Edit User
                            </h3>
                            <button onClick={() => setEditingUser(null)} className="modal-close-btn">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveEdit}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div className="form-group">
                                    <label>
                                        <User size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={editFormData.name}
                                        onChange={handleEditChange}
                                        placeholder="Enter full name"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        <Mail size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={editFormData.email}
                                        onChange={handleEditChange}
                                        placeholder="Enter email address"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        <Lock size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                                        New Password <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal' }}>(leave blank to keep current)</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showEditPassword ? 'text' : 'password'}
                                            name="password"
                                            value={editFormData.password}
                                            onChange={handleEditChange}
                                            placeholder="Enter new password"
                                            style={{ paddingRight: '3rem' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowEditPassword(!showEditPassword)}
                                            style={{
                                                position: 'absolute',
                                                right: '0.75rem',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                padding: '0.25rem'
                                            }}
                                        >
                                            {showEditPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>
                                        <Shield size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                                        Role *
                                    </label>
                                    <select
                                        name="role"
                                        value={editFormData.role}
                                        onChange={handleEditChange}
                                        required
                                    >
                                        {Object.entries(USER_ROLES).map(([key, value]) => (
                                            <option key={value} value={value}>
                                                {ROLE_LABELS[value]}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setEditingUser(null)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? (
                                        <>
                                            <Loader2 size={18} className="spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="filters-bar">
                <div className="search-box">
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search users by name, email, or role..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            {/* Users Table */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <Loader2 size={40} className="spin" />
                    <p style={{ marginTop: '1rem' }}>Loading users...</p>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                                        {searchTerm ? 'No users found matching your search' : 'No users found. Add a new user to get started.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(u => (
                                    <tr key={u.id}>
                                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                            {u.name}
                                        </td>
                                        <td>{u.email}</td>
                                        <td>
                                            <span className={`badge ${getRoleBadgeClass(u.role)}`}>
                                                {ROLE_LABELS[u.role] || 'User'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${u.isActive !== false ? 'badge-green' : 'badge-red'}`}>
                                                {u.isActive !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>{u.createdAt}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleEditUser(u)}
                                                    className="btn btn-outline"
                                                    style={{ padding: '0.4rem 0.6rem', color: 'var(--accent-color)' }}
                                                    title="Edit User"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => toggleUserStatus(u.id, u.isActive !== false)}
                                                    className="btn btn-outline"
                                                    style={{ padding: '0.4rem 0.6rem' }}
                                                    title={u.isActive !== false ? 'Deactivate User' : 'Activate User'}
                                                >
                                                    {u.isActive !== false ? (
                                                        <ToggleRight size={18} style={{ color: 'var(--success)' }} />
                                                    ) : (
                                                        <ToggleLeft size={18} style={{ color: 'var(--danger)' }} />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(u.id, u.email)}
                                                    className="btn btn-outline"
                                                    style={{ padding: '0.4rem 0.6rem', color: 'var(--danger)' }}
                                                    title="Delete User"
                                                    disabled={u.email === user?.email}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ManageUsers;
