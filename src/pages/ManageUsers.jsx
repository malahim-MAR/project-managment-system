import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
    XCircle
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

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user'
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
                            Add and manage system users
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
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
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
                                            <span className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>
                                                {u.role === 'admin' ? 'Admin' : 'User'}
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
