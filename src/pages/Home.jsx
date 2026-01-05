import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { services } from '../data/mockData';

const Home = () => {
    const getIcon = (iconName) => {
        switch (iconName) {
            case 'LayoutDashboard': return <LayoutDashboard size={32} />;
            case 'Clock': return <Clock size={32} />;
            case 'DollarSign': return <DollarSign size={32} />;
            default: return <LayoutDashboard size={32} />;
        }
    };

    return (
        <div className="container animate-fade-in">
            <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', background: 'linear-gradient(to right, #60a5fa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Malahim Systems
                </h1>
                <p style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
                    Integrated enterprise solutions for project management, attendance, and payroll.
                </p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {services.map((service) => (
                    <div key={service.id} className="card" style={{ opacity: service.active ? 1 : 0.7 }}>
                        <div style={{ marginBottom: '1.5rem', color: 'var(--accent-color)' }}>
                            {getIcon(service.icon)}
                        </div>

                        <h3>{service.title}</h3>
                        <p style={{ minHeight: '3rem' }}>{service.description}</p>

                        <div style={{ marginTop: '1.5rem' }}>
                            {service.active ? (
                                <Link to="/projects" className="btn btn-primary" style={{ width: '100%' }}>
                                    Access Dashboard <ArrowRight size={18} />
                                </Link>
                            ) : (
                                <button className="btn" disabled style={{ width: '100%', backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: 'not-allowed' }}>
                                    Coming Soon
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Home;
