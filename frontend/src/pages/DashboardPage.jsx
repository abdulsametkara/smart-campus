import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();

  const getRoleLabel = (role) => {
    const labels = { student: 'Öğrenci', faculty: 'Akademisyen', admin: 'Yönetici' };
    return labels[role] || role;
  };

  return (
    <div className="page dashboard-page">
      <div className="page-header">
        <p className="eyebrow">Dashboard</p>
        <h1>Hoş geldin, {user?.full_name || user?.email}</h1>
        <p>Kampüs yönetim paneline hoş geldin.</p>
      </div>

      <section className="hero">
        <div className="hero-content">
          <h1>Hızlı Erişim</h1>
          <p className="muted">Profilini düzenle veya sistem ayarlarına eriş.</p>
          <div className="hero-actions">
            <Link className="btn" to="/profile" style={{ textDecoration: 'none' }}>Profili Düzenle</Link>
            {user?.role === 'admin' && (
              <Link className="btn secondary" to="/admin/users" style={{ textDecoration: 'none' }}>Kullanıcı Yönetimi</Link>
            )}
          </div>
        </div>
        <div className="stat-cards">
          <div className="stat-card">
            <div className="label">Rol</div>
            <div className="value">{getRoleLabel(user?.role)}</div>
          </div>
          <div className="stat-card">
            <div className="label">Durum</div>
            <div className="value">Aktif</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
