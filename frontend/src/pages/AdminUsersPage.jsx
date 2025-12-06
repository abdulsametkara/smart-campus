import React, { useEffect, useState } from 'react';
import api from '../services/api';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({ search: '', role: '' });
  const [error, setError] = useState('');

  const loadUsers = async (page = 1) => {
    try {
      const params = { page, limit: meta.limit };
      if (filters.search) params.search = filters.search;
      if (filters.role) params.role = filters.role;
      const res = await api.get('/users', { params });
      setUsers(res.data.data || []);
      setMeta(res.data.meta || { page: 1, limit: 10, total: 0, totalPages: 1 });
      setError('');
    } catch (err) {
      setError('Liste alınamadı');
    }
  };

  useEffect(() => {
    loadUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (e) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  const onRole = (e) => {
    setFilters((prev) => ({ ...prev, role: e.target.value }));
  };

  const applyFilters = () => loadUsers(1);

  const getRoleLabel = (role) => {
    const labels = { student: 'Öğrenci', faculty: 'Akademisyen', admin: 'Yönetici' };
    return labels[role] || role;
  };

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">Admin</p>
        <h1>Kullanıcı Yönetimi</h1>
        <p>Sistemdeki kullanıcıları görüntüle ve yönet.</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="filter-bar">
          <input
            placeholder="İsim veya email ara..."
            value={filters.search}
            onChange={onSearch}
            className="filter-input"
            style={{ flex: 1, minWidth: 200 }}
          />
          <select value={filters.role} onChange={onRole} className="filter-input">
            <option value="">Tüm Roller</option>
            <option value="student">Öğrenci</option>
            <option value="faculty">Akademisyen</option>
            <option value="admin">Yönetici</option>
          </select>
          <button className="btn" onClick={applyFilters}>
            Filtrele
          </button>
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Toplam {meta.total || 0} kullanıcı bulundu
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="user-grid">
        {users.map((u) => (
          <div key={u.id} className="user-card">
            <div className="user-card-header">
              <div>
                <div className="user-email">{u.email}</div>
                <div className="user-name">{u.full_name || '—'}</div>
              </div>
              <span className={`badge ${u.role}`}>{getRoleLabel(u.role)}</span>
            </div>
            <div className="user-meta">
              <span>ID: {u.id}</span>
              {(u.student?.department_id || u.faculty?.department_id) && (
                <span>Bölüm: {u.student?.department_id || u.faculty?.department_id}</span>
              )}
            </div>
          </div>
        ))}
        {!users.length && (
          <div style={{ color: 'var(--text-muted)', padding: 20 }}>Kayıt bulunamadı.</div>
        )}
      </div>

      <div className="pagination">
        <button disabled={meta.page <= 1} onClick={() => loadUsers(meta.page - 1)}>
          ← Önceki
        </button>
        <span>Sayfa {meta.page} / {meta.totalPages || 1}</span>
        <button disabled={meta.page >= (meta.totalPages || 1)} onClick={() => loadUsers(meta.page + 1)}>
          Sonraki →
        </button>
      </div>
    </div>
  );
};

export default AdminUsersPage;
