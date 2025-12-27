import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';

const DashboardPage = () => {
  const { user } = useAuth();
  const { t, isEnglish } = useThemeMode();
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { default: announcementService } = await import('../services/announcementService');
        const response = await announcementService.getAll();
        setAnnouncements(response.data || response || []);
      } catch (error) {
        console.error('Duyurular yüklenemedi', error);
      }
    };
    fetchAnnouncements();
  }, []);

  const getRoleLabel = (role) => {
    return t(role) || role;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return t('greetingMorning');
    } else if (hour >= 12 && hour < 18) {
      return t('greetingAfternoon');
    } else {
      return t('greetingEvening');
    }
  };

  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return '☀️';
    } else if (hour >= 12 && hour < 18) {
      return '🌤️';
    } else {
      return '🌙';
    }
  };

  return (
    <div className="page dashboard-page">
      <div className="page-header">
        <h1>
          <span className="greeting-icon">{getGreetingIcon()}</span>
          {getGreeting()}, {user?.full_name || user?.email}
        </h1>
      </div>

      <section className="hero">
        <div className="hero-content">
          <div className="hero-icon-wrapper">
            <svg className="hero-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <h1>{t('quickAccess')}</h1>
          <p className="muted">{t('quickAccessDesc')}</p>
          <div className="hero-actions">
            <Link className="btn" to="/profile" style={{ textDecoration: 'none' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              {t('editProfile')}
            </Link>
            {user?.role === 'admin' && (
              <Link className="btn secondary" to="/admin/users" style={{ textDecoration: 'none' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                {t('userManagement')}
              </Link>
            )}
          </div>
        </div>
        <div className="stat-cards">
          <div className="stat-card stat-card-role">
            <div className="stat-card-header">
              <div className="stat-card-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div className="stat-card-info">
                <div className="label">{t('roleLabel')}</div>
                <div className="value">{getRoleLabel(user?.role)}</div>
              </div>
            </div>
          </div>
          <div className="stat-card stat-card-status">
            <div className="stat-card-header">
              <div className="stat-card-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div className="stat-card-info">
                <div className="label">{t('statusLabel')}</div>
                <div className="value">{t('active')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DUYURU PANOSU WIDGET */}
      <section className="announcements-widget">
        <div className="widget-header">
          <h2>📢 {t('announcements')}</h2>
          {(user?.role === 'admin' || user?.role === 'faculty') && (
            <Link to="/announcements/manage" className="widget-action-link">
              {t('manage')} →
            </Link>
          )}
        </div>

        <div className="announcements-feed">
          {Array.isArray(announcements) && announcements.length > 0 ? (
            announcements.slice(0, 5).map(ann => (
              <div key={ann.id} className={`announcement-item ${ann.priority === 'HIGH' ? 'priority-high' : ''}`}>
                <div className="announcement-icon">
                  {ann.priority === 'HIGH' ? '🔴' : ann.priority === 'LOW' ? '🟢' : '🔵'}
                </div>
                <div className="announcement-body">
                  <div className="announcement-top">
                    <h4>{ann.title}</h4>
                    <span className="announcement-date">
                      {ann.created_at ? new Date(ann.created_at).toLocaleDateString(isEnglish ? 'en-US' : 'tr-TR', {
                        day: 'numeric',
                        month: 'short'
                      }) : ''}
                    </span>
                  </div>
                  <p className="announcement-text">{ann.content}</p>
                  <div className="announcement-meta">
                    <span className="announcement-source">
                      {ann.course ? `📚 ${ann.course.code}` : `📌 ${t('generalAnnouncement')}`}
                    </span>
                    <span className="announcement-author">
                      👤 {ann.author?.full_name || t('admin')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-announcements">
              <span className="empty-icon">📭</span>
              <p>{t('noAnnouncements')}</p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
};

export default DashboardPage;