import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { useThemeMode } from '../context/ThemeContext';

const AdminUsersPage = () => {
  const { t } = useThemeMode();
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({ search: '', role: '' });
  const [loading, setLoading] = useState(false);

  const loadUsers = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: meta.limit };
      if (filters.search) params.search = filters.search;
      if (filters.role) params.role = filters.role;
      const res = await api.get('/users', { params });
      setUsers(res.data.data || []);
      setMeta(res.data.meta || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      Swal.fire(t('error') || 'Hata', 'Kullanıcı listesi alınamadı', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (e) => setFilters((prev) => ({ ...prev, search: e.target.value }));
  const onRole = (e) => setFilters((prev) => ({ ...prev, role: e.target.value }));
  const applyFilters = () => loadUsers(1);

  const handleDelete = (id) => {
    Swal.fire({
      title: t('areYouSure') || 'Emin misiniz?',
      text: t('confirmDeleteUser'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: t('yesDelete') || 'Evet, sil!',
      cancelButtonText: t('cancel') || 'İptal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/users/${id}`);
          Swal.fire(t('userDeletedTitle'), t('userDeletedDesc'), 'success');
          loadUsers(meta.page);
        } catch (err) {
          const msg = err?.response?.data?.message || t('deleteError') || 'Silme işlemi başarısız.';
          Swal.fire(t('error') || 'Hata', msg, 'error');
        }
      }
    });
  };

  const handleEdit = (user) => {
    // SweetAlert ile basit bir edit formu
    Swal.fire({
      title: t('editUser'),
      html: `
        <input id="swal-input1" class="swal2-input" placeholder="Ad Soyad" value="${user.full_name || ''}">
        <select id="swal-input2" class="swal2-input">
          <option value="student" ${user.role === 'student' ? 'selected' : ''}>${t('roleStudent') || 'Öğrenci'}</option>
          <option value="faculty" ${user.role === 'faculty' ? 'selected' : ''}>${t('roleFaculty') || 'Akademisyen'}</option>
          <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>${t('roleAdmin') || 'Yönetici'}</option>
        </select>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: t('save') || 'Kaydet',
      cancelButtonText: t('cancel') || 'İptal',
      preConfirm: () => {
        return {
          full_name: document.getElementById('swal-input1').value,
          role: document.getElementById('swal-input2').value
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.put(`/users/${user.id}`, result.value);
          Swal.fire(t('success') || 'Başarılı', t('userUpdated') || 'Kullanıcı güncellendi', 'success');
          loadUsers(meta.page);
        } catch (err) {
          Swal.fire(t('error') || 'Hata', err?.response?.data?.message || 'Güncelleme yapılamadı.', 'error');
        }
      }
    });
  };

  const getRoleLabel = (role) => {
    const labels = { student: t('roleStudent') || 'Öğrenci', faculty: t('roleFaculty') || 'Akademisyen', admin: t('roleAdmin') || 'Yönetici' };
    return labels[role] || role;
  };

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">Admin Panel</p>
        <h1>{t('userManagementTitle')}</h1>
        <p>{t('userManagementDesc')}</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="filter-bar">
          <input
            placeholder={t('searchUsersPlaceholder')}
            value={filters.search}
            onChange={onSearch}
            className="filter-input"
            style={{ flex: 1, minWidth: 200 }}
          />
          <select value={filters.role} onChange={onRole} className="filter-input">
            <option value="">{t('allRoles')}</option>
            <option value="student">{t('roleStudent') || 'Öğrenci'}</option>
            <option value="faculty">{t('roleFaculty') || 'Akademisyen'}</option>
            <option value="admin">{t('roleAdmin') || 'Yönetici'}</option>
          </select>
          <button className="btn" onClick={applyFilters}>
            {t('filterButton')}
          </button>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner"></div>
            <p className="muted" style={{ marginTop: 10 }}>{t('loading')}</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{t('user') || 'Kullanıcı'}</th>
                <th>{t('role') || 'Rol'}</th>
                <th>{t('status') || 'Durum'}</th>
                <th style={{ textAlign: 'right' }}>{t('actions') || 'İşlemler'}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar-placeholder-sm" style={{ width: 32, height: 32, fontSize: 12 }}>
                        {u.full_name ? u.full_name[0] : u.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.full_name || 'İsimsiz'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${u.role}`}>{getRoleLabel(u.role)}</span>
                  </td>
                  <td>
                    <span className="badge" style={{ background: '#dcfce7', color: '#166534' }}>{t('activeUser')}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="icon-btn"
                      title={t('edit') || "Düzenle"}
                      onClick={() => handleEdit(u)}
                      style={{ marginRight: 8, color: '#3b82f6' }}
                    >
                      ✏️
                    </button>
                    <button
                      className="icon-btn"
                      title={t('delete') || "Sil"}
                      onClick={() => handleDelete(u.id)}
                      style={{ color: '#ef4444' }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {!users.length && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    {t('noUsersFound')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="pagination" style={{ marginTop: 20, justifyContent: 'center' }}>
        <button disabled={meta.page <= 1} onClick={() => loadUsers(meta.page - 1)} className="btn sm outline">
          ← {t('prev') || 'Önceki'}
        </button>
        <span style={{ margin: '0 15px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {t('page') || 'Sayfa'} {meta.page} / {meta.totalPages || 1}
        </span>
        <button disabled={meta.page >= (meta.totalPages || 1)} onClick={() => loadUsers(meta.page + 1)} className="btn sm outline">
          {t('next') || 'Sonraki'} →
        </button>
      </div>
    </div>
  );
};

export default AdminUsersPage;
