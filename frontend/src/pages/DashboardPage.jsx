import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();

  const getRoleLabel = (role) => {
    const labels = { student: 'Öğrenci', faculty: 'Akademisyen', admin: 'Yönetici' };
    return labels[role] || role;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'Günaydın';
    } else if (hour >= 12 && hour < 18) {
      return 'İyi günler';
    } else {
      return 'İyi akşamlar';
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
          <h1>Hızlı Erişim</h1>
          <p className="muted">Profilini düzenle veya sistem ayarlarına eriş.</p>
          <div className="hero-actions">
            <Link className="btn" to="/profile" style={{ textDecoration: 'none' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Profili Düzenle
            </Link>
            {user?.role === 'admin' && (
              <Link className="btn secondary" to="/admin/users" style={{ textDecoration: 'none' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                Kullanıcı Yönetimi
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
                <div className="label">Rol</div>
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
                <div className="label">Durum</div>
                <div className="value">Aktif</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
