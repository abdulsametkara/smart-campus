import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [expandedCategories, setExpandedCategories] = useState({});

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const isActive = (path) => location.pathname === path;
    const isInCategory = (paths) => paths.some(p => location.pathname.startsWith(p));

    // Menu structure based on role
    const getMenuItems = () => {
        const items = [];

        // Ders Programı - first for visibility
        if (user?.role !== 'admin') {
            items.push({
                id: 'program',
                label: 'Ders Programı',
                path: '/schedule'
            });
        }

        // Akademik - All users
        items.push({
            id: 'akademik',
            label: 'Akademik',
            children: [
                { path: '/courses', label: 'Dersler' },
                user?.role === 'student'
                    ? { path: '/sections', label: 'Derse Kayıt' }
                    : { path: '/sections', label: 'Sections' }
            ]
        });

        // Yoklama - Role based
        if (user?.role === 'student') {
            items.push({
                id: 'yoklama',
                label: 'Yoklama',
                children: [
                    { path: '/attendance/student', label: 'Yoklama Katıl' },
                    { path: '/attendance/my-stats', label: 'Devamsızlığım' },
                    { path: '/attendance/history', label: 'Geçmiş' },
                    { path: '/attendance/excuses/new', label: 'Mazeret Bildir' }
                ]
            });
        }

        if (user?.role === 'faculty') {
            items.push({
                id: 'yoklama',
                label: 'Yoklama',
                children: [
                    { path: '/attendance/instructor', label: 'Yoklama Al' },
                    { path: '/attendance/report', label: 'Dönemlik Rapor' },
                    { path: '/attendance/sessions', label: 'Oturum Geçmişi' },
                    { path: '/attendance/excuses/manage', label: 'Mazeret Yönetimi' }
                ]
            });
        }

        // Notlar
        if (user?.role === 'student') {
            items.push({
                id: 'notlar',
                label: 'Notlarım',
                path: '/grades/my'
            });
        }

        if (user?.role === 'faculty') {
            items.push({
                id: 'notlar',
                label: 'Not Girişi',
                path: '/grades/manage'
            });
        }

        // Danışmanlık - Faculty only
        if (user?.role === 'faculty') {
            items.push({
                id: 'danismanlik',
                label: 'Danışmanlık',
                children: [
                    { path: '/advisor/approvals', label: 'Ders Onayları' },
                    { path: '/advisor/students', label: 'Öğrencilerim' }
                ]
            });
        }

        // Duyurular - Faculty & Admin
        if (user?.role === 'faculty' || user?.role === 'admin') {
            items.push({
                id: 'duyurular',
                label: 'Duyurular',
                path: '/announcements/manage'
            });
        }

        // Yönetim - Admin only
        if (user?.role === 'admin') {
            items.push({
                id: 'yonetim',
                label: 'Yönetim',
                children: [
                    { path: '/admin/users', label: 'Kullanıcılar' },
                    { path: '/admin/logs', label: 'Sistem Logları' },
                    { path: '/admin/academic', label: 'Akademik Yönetim' }
                ]
            });
        }

        // Profil - All users
        items.push({
            id: 'profil',
            label: 'Profil',
            path: '/profile'
        });

        return items;
    };

    const menuItems = getMenuItems();

    const handleLinkClick = () => {
        // Only close sidebar on mobile (< 768px)
        if (window.innerWidth < 768) {
            onClose();
        }
    };

    return (
        <>
            {/* Overlay for mobile */}
            <div
                className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                {/* Logo */}
                <div className="sidebar-header">
                    <Link to="/dashboard" className="sidebar-brand" onClick={handleLinkClick}>
                        <span className="brand-text">Campy</span>
                    </Link>
                    <button className="sidebar-close" onClick={onClose}>
                        ×
                    </button>
                </div>

                {/* User Info */}
                {user && (
                    <div className="sidebar-user">
                        <div className="user-avatar">
                            {user.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="user-info">
                            <div className="user-name">{user.full_name}</div>
                            <div className="user-role">
                                {user.role === 'student' ? 'Öğrenci' :
                                    user.role === 'faculty' ? 'Öğretim Üyesi' :
                                        user.role === 'admin' ? 'Yönetici' : user.role}
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {menuItems.map(item => (
                        <div key={item.id} className="nav-category">
                            {item.children ? (
                                <>
                                    <button
                                        className={`nav-category-header ${expandedCategories[item.id] ? 'expanded' : ''} ${isInCategory(item.children.map(c => c.path)) ? 'active-category' : ''}`}
                                        onClick={() => toggleCategory(item.id)}
                                    >
                                        <span className="nav-label">{item.label}</span>
                                        <span className="nav-arrow">›</span>
                                    </button>
                                    <div className={`nav-category-items ${expandedCategories[item.id] ? 'expanded' : ''}`}>
                                        {item.children.map(child => (
                                            <Link
                                                key={child.path}
                                                to={child.path}
                                                className={`nav-item ${isActive(child.path) ? 'active' : ''}`}
                                                onClick={handleLinkClick}
                                            >
                                                <span className="nav-label">{child.label}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <Link
                                    to={item.path}
                                    className={`nav-category-header single ${isActive(item.path) ? 'active' : ''}`}
                                    onClick={handleLinkClick}
                                >
                                    <span className="nav-label">{item.label}</span>
                                </Link>
                            )}
                        </div>
                    ))}
                </nav>

                {/* Logout */}
                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={logout}>
                        Çıkış Yap
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;

