import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clapperboard, Mail, Lock, LogIn, Loader2, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.email.trim() || !formData.password.trim()) {
            setError('Please enter both email and password');
            return;
        }

        setLoading(true);

        const result = await login(formData.email, formData.password);

        setLoading(false);

        if (result.success) {
            navigate('/projects', { replace: true });
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="login-page">
            {/* Animated Background */}
            <div className="login-bg">
                <div className="login-bg-gradient"></div>
                <div className="login-bg-shapes">
                    <div className="shape shape-1"></div>
                    <div className="shape shape-2"></div>
                    <div className="shape shape-3"></div>
                </div>
            </div>

            {/* Login Card */}
            <div className="login-card">
                {/* Logo */}
                <div className="login-logo">
                    <div className="login-logo-icon">
                        <Clapperboard size={32} color="white" />
                    </div>
                    <h1 className="login-title">AAA Studios</h1>
                    <p className="login-subtitle">Project Management System</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="login-error">
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="login-input-group">
                        <Mail size={20} className="login-input-icon" />
                        <input
                            type="text"
                            name="email"
                            placeholder="Email or Username"
                            value={formData.email}
                            onChange={handleChange}
                            autoComplete="username"
                            className="login-input"
                        />
                    </div>

                    <div className="login-input-group">
                        <Lock size={20} className="login-input-icon" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            autoComplete="current-password"
                            className="login-input"
                        />
                        <button
                            type="button"
                            className="login-password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="login-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={20} className="spin" />
                                <span>Signing In...</span>
                            </>
                        ) : (
                            <>
                                <LogIn size={20} />
                                <span>Sign In</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="login-footer">
                    <p>Contact admin for access credentials</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
