import React, { useState } from 'react';
import NotificationBell from '../Notifications/NotificationBell';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import './Sidebar.css';
import {
    Dashboard, School, Event, Restaurant,
    AccountBalanceWallet, AdminPanelSettings,
    ExpandLess, ExpandMore, CalendarMonth,
    Notifications, Class, Assessment, People,
    Brightness7, Brightness4, Language, ExitToApp, Person
} from '@mui/icons-material';
const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const { toggleTheme, toggleLanguage, isDark, isEnglish, t } = useThemeMode();
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
                label: t('schedule'),
                path: '/schedule'
            });
        }
        // Yemekhane & Cüzdan - All users
        items.push({
            id: 'yemek',
            label: t('cafeteria'),
            children: [
                { path: '/meals/menu', label: t('menu') },
                { path: '/meals/reservations', label: t('myReservations') },
                { path: '/wallet', label: t('myWallet') }
            ]
        });
        // Etkinlikler - All users
        items.push({
            id: 'etkinlikler',
            label: t('events'),
            children: [
                { path: '/events', label: t('allEvents') },
                { path: '/my-events', label: t('myEvents') },
                ...(user?.role === 'admin'
                    ? [{ path: '/events/manage', label: t('eventManagement') }]
                    : []),
                ...(user?.role === 'admin' || user?.role === 'faculty'
                    ? [{ path: '/events/checkin', label: t('eventCheckIn') }]
                    : [])
            ]
        });
        // Akademik - All users
        items.push({
            id: 'akademik',
            label: t('academic'),
            children: [
                { path: '/courses', label: t('courses') },
                user?.role === 'student'
                    ? { path: '/sections', label: t('courseEnroll') }
                    : { path: '/sections', label: t('sections') },
                { path: '/academic/calendar', label: t('academicCalendar') },
                { path: '/reservations', label: 'Sınıf Rezervasyonları' }
            ]
        });
        // Yoklama - Role based
        if (user?.role === 'student') {
            items.push({
                id: 'yoklama',
                label: t('attendance'),
                children: [
                    { path: '/attendance/student', label: t('joinAttendance') },
                    { path: '/attendance/my-stats', label: t('myAbsence') },
                    { path: '/attendance/history', label: t('history') },
                    { path: '/attendance/excuses/new', label: t('reportExcuse') }
                ]
            });
        }
        if (user?.role === 'faculty') {
            items.push({
                id: 'yoklama',
                label: t('attendance'),
                children: [
                    { path: '/attendance/instructor', label: t('takeAttendance') },
                    { path: '/attendance/report', label: t('semesterReport') },
                    { path: '/attendance/sessions', label: t('sessionHistory') },
                    { path: '/attendance/analytics', label: `📊 ${t('analytics')}` },
                    { path: '/attendance/excuses/manage', label: t('excuseManagement') }
                ]
            });
        }
        // Notlar
        if (user?.role === 'student') {
            items.push({
                id: 'notlar',
                label: t('grades'),
                path: '/grades/my'
            });
        }
        if (user?.role === 'faculty') {
            items.push({
                id: 'notlar',
                label: t('gradeEntry'),
                path: '/grades/manage'
            });
        }
        // Danışmanlık - Faculty only
        if (user?.role === 'faculty') {
            items.push({
                id: 'danismanlik',
                label: t('advising'),
                children: [
                    { path: '/advisor/approvals', label: t('courseApprovals') },
                    { path: '/advisor/students', label: t('myStudents') }
                ]
            });
        }
        // Duyurular - Faculty & Admin
        if (user?.role === 'faculty' || user?.role === 'admin') {
            items.push({
                id: 'duyurular',
                label: t('announcements'),
                path: '/announcements/manage'
            });
        }
        // Analitik - Admin only
        if (user?.role === 'admin') {
            items.push({
                id: 'analitik',
                label: t('analyticsCenter'),
                children: [
                    { path: '/admin/dashboard', label: t('overview') },
                    { path: '/admin/analytics/academic', label: t('academicSuccess') },
                    { path: '/admin/analytics/attendance', label: t('attendanceAnalysis') },
                    { path: '/admin/analytics/meal', label: t('cafeteriaAnalysis') },
                    { path: '/admin/analytics/events', label: t('eventAnalytics') },
                    { path: '/admin/iot', label: t('iotAnalysis') }
                ]
            });
        }
        // Yönetim - Admin only
        if (user?.role === 'admin') {
            items.push({
                id: 'yonetim',
                label: t('management'),
                children: [
                    { path: '/admin/users', label: t('users') },
                    { path: '/admin/logs', label: t('systemLogs') },
                    { path: '/admin/academic', label: t('academicManagement') },
                    { path: '/admin/reservations', label: 'Rezervasyon Yönetimi' }
                ]
            });
        }
        // Bildirimler & Profil - All users
        items.push({
            id: 'diger',
            label: 'Diğer',
            children: [
                { path: '/notifications', label: t('notifications') },
                { path: '/profile', label: t('profile') },
                { path: '/settings/notifications', label: t('notificationPreferences') }
            ]
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
                    <div style={{ marginLeft: 'auto', marginRight: '8px' }}>
                        <NotificationBell />
                    </div>
                    <button className="sidebar-close" onClick={onClose}>
                        ×
                    </button>
                </div>
                {/* User Info */}
                {user && (
                    <div className="sidebar-user">
                        <div className="user-avatar">
                            {user.profile_picture_url ? (
                                <img src={user.profile_picture_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                user.full_name?.charAt(0).toUpperCase() || 'U'
                            )}
                        </div>
                        <div className="user-info">
                            <div className="user-name">{user.full_name}</div>
                            <div className="user-role">
                                {user.role === 'student' ? t('student') :
                                    user.role === 'faculty' ? t('faculty') :
                                        user.role === 'admin' ? t('admin') : user.role}
                            </div>
                        </div>
                    </div>
                )}
                {/* Navigation */}
                <nav className="sidebar-nav">
                    {menuItems.filter(item => item.id !== 'diger').map(item => (
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

                {/* Footer: Settings, Profile, Logout */}
                <div className="sidebar-footer">
                    {/* Dark/Lang Toggles */}
                    <div className="sidebar-settings-toggles">
                        <div
                            className="toggle-btn"
                            onClick={toggleTheme}
                            title={isDark ? t('lightMode') : t('darkMode')}
                        >
                            {isDark ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
                        </div>
                        <div className="toggle-divider" />
                        <div
                            className="toggle-btn"
                            onClick={toggleLanguage}
                            title={isEnglish ? "Türkçe" : "English"}
                        >
                            <Language fontSize="small" sx={{ opacity: isEnglish ? 1 : 0.7 }} />
                            <span style={{ fontSize: '10px', marginLeft: 4, fontWeight: 700 }}>
                                {isEnglish ? 'EN' : 'TR'}
                            </span>
                        </div>
                    </div>

                    {/* Profile Link */}
                    <Link to="/profile" className="footer-profile-link" onClick={handleLinkClick}>
                        <div className="footer-avatar">
                            {user?.profile_picture_url ? (
                                <img src={user.profile_picture_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                user?.full_name?.charAt(0).toUpperCase() || 'U'
                            )}
                        </div>
                        <div className="footer-user-info">
                            <span className="footer-name">{user?.full_name}</span>
                            <span className="footer-role">{t('accountSettings')}</span>
                        </div>
                        <span className="footer-arrow">›</span>
                    </Link>

                    {/* Logout */}
                    <button className="logout-btn" onClick={logout}>
                        <ExitToApp fontSize="small" />
                        <span>{t('logout')}</span>
                    </button>
                </div>



            </aside>
        </>
    );
};
export default Sidebar;
