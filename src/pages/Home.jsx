import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    FolderGit2,
    Film,
    FileText,
    Video,
    Users,
    MessageCircle,
    TrendingUp,
    Clock,
    CheckCircle2,
    Calendar,
    ArrowRight,
    Loader2,
    Activity,
    BarChart3,
    Zap
} from 'lucide-react';

const Home = () => {
    const { user } = useAuth();
    const {
        projects,
        videos,
        scripts,
        postProductions,
        loadingProjects,
        loadingVideos,
        loadingScripts,
        loadingPostProductions,
        fetchProjects,
        fetchVideos,
        fetchScripts,
        fetchPostProductions
    } = useData();

    useEffect(() => {
        fetchProjects();
        fetchVideos();
        fetchScripts();
        fetchPostProductions();
    }, [fetchProjects, fetchVideos, fetchScripts, fetchPostProductions]);

    // Calculate statistics
    const stats = useMemo(() => {
        const projectsList = projects || [];
        const videosList = videos || [];
        const scriptsList = scripts || [];
        const postProductionsList = postProductions || [];

        return {
            projects: {
                total: projectsList.length,
                inProgress: projectsList.filter(p => p.status === 'in-progress').length,
                completed: projectsList.filter(p => p.status === 'complete').length,
                onHold: projectsList.filter(p => p.status === 'on-hold').length
            },
            videos: {
                total: videosList.length,
                completed: videosList.filter(v => v.shootStatus === 'Completed').length,
                scheduled: videosList.filter(v => v.shootStatus === 'Scheduled').length,
                pending: videosList.filter(v => v.shootStatus === 'Pending').length
            },
            scripts: {
                total: scriptsList.length,
                approved: scriptsList.filter(s => s.status === 'Approved').length,
                inReview: scriptsList.filter(s => s.status === 'In Review').length,
                draft: scriptsList.filter(s => s.status === 'Draft').length
            },
            postProductions: {
                total: postProductionsList.length,
                completed: postProductionsList.filter(pp => pp.status === 'Completed').length,
                inProgress: postProductionsList.filter(pp => pp.status === 'In Progress').length
            }
        };
    }, [projects, videos, scripts, postProductions]);

    // Recent activity - combine all recent items
    const recentActivity = useMemo(() => {
        const activities = [];

        // Add recent projects
        (projects || []).slice(0, 3).forEach(p => {
            activities.push({
                id: p.id,
                type: 'project',
                name: p.name,
                status: p.status,
                date: p.createdAt || p.startDate,
                icon: FolderGit2,
                color: '#3b82f6',
                link: `/projects/${p.id}`
            });
        });

        // Add recent videos
        (videos || []).slice(0, 3).forEach(v => {
            activities.push({
                id: v.id,
                type: 'video',
                name: v.name || v.videoName || 'Untitled Video',
                status: v.shootStatus,
                date: v.createdAt || v.shootDate,
                icon: Film,
                color: '#8b5cf6',
                link: `/videos/${v.id}`
            });
        });

        return activities.slice(0, 6);
    }, [projects, videos]);

    // Quick stats cards data
    const quickStats = [
        {
            title: 'Total Projects',
            value: stats.projects.total,
            subtitle: `${stats.projects.inProgress} in progress`,
            icon: FolderGit2,
            color: '#3b82f6',
            gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            link: '/projects'
        },
        {
            title: 'Total Videos',
            value: stats.videos.total,
            subtitle: `${stats.videos.completed} completed`,
            icon: Film,
            color: '#8b5cf6',
            gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
            link: '/videos'
        },
        {
            title: 'Scripts',
            value: stats.scripts.total,
            subtitle: `${stats.scripts.approved} approved`,
            icon: FileText,
            color: '#10b981',
            gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            link: '/scripts'
        },
        {
            title: 'Post Productions',
            value: stats.postProductions.total,
            subtitle: `${stats.postProductions.inProgress} in progress`,
            icon: Video,
            color: '#f59e0b',
            gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            link: '/post-productions'
        }
    ];

    // Calculate completion rates
    const completionRates = useMemo(() => {
        const projectRate = stats.projects.total > 0
            ? Math.round((stats.projects.completed / stats.projects.total) * 100)
            : 0;
        const videoRate = stats.videos.total > 0
            ? Math.round((stats.videos.completed / stats.videos.total) * 100)
            : 0;
        const scriptRate = stats.scripts.total > 0
            ? Math.round((stats.scripts.approved / stats.scripts.total) * 100)
            : 0;
        const ppRate = stats.postProductions.total > 0
            ? Math.round((stats.postProductions.completed / stats.postProductions.total) * 100)
            : 0;

        return { projectRate, videoRate, scriptRate, ppRate };
    }, [stats]);

    const isLoading = loadingProjects || loadingVideos || loadingScripts || loadingPostProductions;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'complete':
            case 'completed':
            case 'approved':
                return '#10b981';
            case 'in-progress':
            case 'in progress':
            case 'in review':
            case 'scheduled':
                return '#3b82f6';
            case 'on-hold':
            case 'pending':
            case 'draft':
                return '#f59e0b';
            default:
                return '#6b7280';
        }
    };

    return (
        <div className="page-container animate-fade-in">
            {/* Welcome Header */}
            <div className="home-header">
                <div className="home-header-content">
                    <div className="home-greeting">
                        <h1>
                            <LayoutDashboard size={32} color="var(--accent-color)" />
                            {getGreeting()}, {user?.name || 'User'}! 👋
                        </h1>
                        <p>Here's an overview of your video production workflow</p>
                    </div>
                    <div className="home-date">
                        <Calendar size={18} />
                        <span>{new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}</span>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="home-loading">
                    <Loader2 size={48} className="spin" />
                    <p>Loading dashboard...</p>
                </div>
            ) : (
                <>
                    {/* Quick Stats Grid */}
                    <div className="home-stats-grid">
                        {quickStats.map((stat, index) => (
                            <Link to={stat.link} key={index} className="home-stat-card">
                                <div className="home-stat-icon" style={{ background: stat.gradient }}>
                                    <stat.icon size={24} color="white" />
                                </div>
                                <div className="home-stat-content">
                                    <div className="home-stat-value">{stat.value}</div>
                                    <div className="home-stat-title">{stat.title}</div>
                                    <div className="home-stat-subtitle">{stat.subtitle}</div>
                                </div>
                                <ArrowRight size={18} className="home-stat-arrow" />
                            </Link>
                        ))}
                    </div>

                    {/* Analytics Section */}
                    <div className="home-analytics-grid">
                        {/* Progress Overview */}
                        <div className="home-card">
                            <div className="home-card-header">
                                <h3><BarChart3 size={20} /> Progress Overview</h3>
                            </div>
                            <div className="home-progress-list">
                                <div className="home-progress-item">
                                    <div className="home-progress-info">
                                        <span className="home-progress-label">Projects Completed</span>
                                        <span className="home-progress-value">{completionRates.projectRate}%</span>
                                    </div>
                                    <div className="home-progress-bar">
                                        <div
                                            className="home-progress-fill"
                                            style={{
                                                width: `${completionRates.projectRate}%`,
                                                background: 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="home-progress-item">
                                    <div className="home-progress-info">
                                        <span className="home-progress-label">Videos Completed</span>
                                        <span className="home-progress-value">{completionRates.videoRate}%</span>
                                    </div>
                                    <div className="home-progress-bar">
                                        <div
                                            className="home-progress-fill"
                                            style={{
                                                width: `${completionRates.videoRate}%`,
                                                background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="home-progress-item">
                                    <div className="home-progress-info">
                                        <span className="home-progress-label">Scripts Approved</span>
                                        <span className="home-progress-value">{completionRates.scriptRate}%</span>
                                    </div>
                                    <div className="home-progress-bar">
                                        <div
                                            className="home-progress-fill"
                                            style={{
                                                width: `${completionRates.scriptRate}%`,
                                                background: 'linear-gradient(90deg, #10b981, #34d399)'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="home-progress-item">
                                    <div className="home-progress-info">
                                        <span className="home-progress-label">Post-Production Done</span>
                                        <span className="home-progress-value">{completionRates.ppRate}%</span>
                                    </div>
                                    <div className="home-progress-bar">
                                        <div
                                            className="home-progress-fill"
                                            style={{
                                                width: `${completionRates.ppRate}%`,
                                                background: 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Status Summary */}
                        <div className="home-card">
                            <div className="home-card-header">
                                <h3><Activity size={20} /> Status Summary</h3>
                            </div>
                            <div className="home-status-grid">
                                <div className="home-status-item">
                                    <div className="home-status-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                                        <Clock size={20} />
                                    </div>
                                    <div className="home-status-info">
                                        <span className="home-status-value">{stats.projects.inProgress}</span>
                                        <span className="home-status-label">Projects In Progress</span>
                                    </div>
                                </div>
                                <div className="home-status-item">
                                    <div className="home-status-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                                        <Calendar size={20} />
                                    </div>
                                    <div className="home-status-info">
                                        <span className="home-status-value">{stats.videos.scheduled}</span>
                                        <span className="home-status-label">Videos Scheduled</span>
                                    </div>
                                </div>
                                <div className="home-status-item">
                                    <div className="home-status-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                                        <FileText size={20} />
                                    </div>
                                    <div className="home-status-info">
                                        <span className="home-status-value">{stats.scripts.inReview}</span>
                                        <span className="home-status-label">Scripts In Review</span>
                                    </div>
                                </div>
                                <div className="home-status-item">
                                    <div className="home-status-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <div className="home-status-info">
                                        <span className="home-status-value">{stats.videos.completed}</span>
                                        <span className="home-status-label">Videos Completed</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity & Quick Actions */}
                    <div className="home-bottom-grid">
                        {/* Recent Activity */}
                        <div className="home-card">
                            <div className="home-card-header">
                                <h3><Zap size={20} /> Recent Activity</h3>
                                <Link to="/projects" className="home-view-all">View All</Link>
                            </div>
                            <div className="home-activity-list">
                                {recentActivity.length > 0 ? (
                                    recentActivity.map((activity, index) => (
                                        <Link to={activity.link} key={index} className="home-activity-item">
                                            <div className="home-activity-icon" style={{ background: `${activity.color}20`, color: activity.color }}>
                                                <activity.icon size={18} />
                                            </div>
                                            <div className="home-activity-content">
                                                <span className="home-activity-name">{activity.name}</span>
                                                <span className="home-activity-type">
                                                    {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                                                </span>
                                            </div>
                                            <div
                                                className="home-activity-status"
                                                style={{ color: getStatusColor(activity.status) }}
                                            >
                                                {activity.status || 'N/A'}
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="home-empty">
                                        <MessageCircle size={32} />
                                        <p>No recent activity</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="home-card">
                            <div className="home-card-header">
                                <h3><TrendingUp size={20} /> Quick Actions</h3>
                            </div>
                            <div className="home-actions-list">
                                <Link to="/projects/new" className="home-action-btn home-action-blue">
                                    <FolderGit2 size={20} />
                                    <span>New Project</span>
                                </Link>
                                <Link to="/videos/new" className="home-action-btn home-action-purple">
                                    <Film size={20} />
                                    <span>Add Video</span>
                                </Link>
                                <Link to="/scripts/new" className="home-action-btn home-action-green">
                                    <FileText size={20} />
                                    <span>Create Script</span>
                                </Link>
                                <Link to="/post-productions" className="home-action-btn home-action-orange">
                                    <Video size={20} />
                                    <span>Post Production</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Home;
