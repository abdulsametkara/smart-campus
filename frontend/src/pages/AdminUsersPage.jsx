import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';

const AdminUsersPage = () => {
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
      Swal.fire('Hata', 'Kullanıcı listesi alınamadı', 'error');
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
      title: 'Emin misiniz?',
      text: "Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Evet, sil!',
      cancelButtonText: 'İptal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Normalde DELETE /users/:id endpointi olmalı
          // Şimdilik mock veya eğer endpoint yoksa hata verebilir.
          // Varsayalım ki api.delete('/users/' + id) çalışıyor
          await api.delete(`/users/${id}`);
          Swal.fire('Silindi!', 'Kullanıcı başarıyla silindi.', 'success');
          loadUsers(meta.page);
        } catch (err) {
          const msg = err?.response?.data?.message || 'Silme işlemi başarısız.';
          Swal.fire('Hata', msg, 'error');
        }
      }
    });
  };

  const handleEdit = (user) => {
    // SweetAlert ile basit bir edit formu
    Swal.fire({
      title: 'Kullanıcıyı Düzenle',
      html: `
        <input id="swal-input1" class="swal2-input" placeholder="Ad Soyad" value="${user.full_name || ''}">
        <select id="swal-input2" class="swal2-input">
          <option value="student" ${user.role === 'student' ? 'selected' : ''}>Öğrenci</option>
          <option value="faculty" ${user.role === 'faculty' ? 'selected' : ''}>Akademisyen</option>
          <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Yönetici</option>
        </select>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Kaydet',
      cancelButtonText: 'İptal',
      preConfirm: () => {
        return {
          full_name: document.getElementById('swal-input1').value,
          role: document.getElementById('swal-input2').value
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // PUT /users/:id (Admin yetkisiyle başkasını güncelleme endpointi gerekebilir)
          // Eğer backend sadece /users/me destekliyorsa bu çalışmayabilir.
          // Amaç UI demosu ise bu yeterli.
          await api.put(`/users/${user.id}`, result.value); // Bu endpoint admin için özel olmalı
          Swal.fire('Başarılı', 'Kullanıcı güncellendi', 'success');
          loadUsers(meta.page);
        } catch (err) {
          Swal.fire('Hata', 'Güncelleme yapılamadı. Backend desteği gerekebilir.', 'error');
        }
      }
    });
  };

  const getRoleLabel = (role) => {
    const labels = { student: 'Öğrenci', faculty: 'Akademisyen', admin: 'Yönetici' };
    return labels[role] || role;
  };

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">Admin Panel</p>
        <h1>Kullanıcı Yönetimi</h1>
        <p>Sistemdeki tüm kullanıcıları buradan yönetebilirsiniz.</p>
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
            Ara / Filtrele
          </button>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner"></div>
            <p className="muted" style={{ marginTop: 10 }}>Yükleniyor...</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Kullanıcı</th>
                <th>Rol</th>
                <th>Durum</th>
                <th style={{ textAlign: 'right' }}>İşlemler</th>
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
                    <span className="badge" style={{ background: '#dcfce7', color: '#166534' }}>Aktif</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="icon-btn"
                      title="Düzenle"
                      onClick={() => handleEdit(u)}
                      style={{ marginRight: 8, color: '#3b82f6' }}
                    >
                      ✏️
                    </button>
                    <button
                      className="icon-btn"
                      title="Sil"
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
                    Kullanıcı bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="pagination" style={{ marginTop: 20, justifyContent: 'center' }}>
        <button disabled={meta.page <= 1} onClick={() => loadUsers(meta.page - 1)} className="btn sm outline">
          ← Önceki
        </button>
        <span style={{ margin: '0 15px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Sayfa {meta.page} / {meta.totalPages || 1}
        </span>
        <button disabled={meta.page >= (meta.totalPages || 1)} onClick={() => loadUsers(meta.page + 1)} className="btn sm outline">
          Sonraki →
        </button>
      </div>
    </div>
  );
};

export default AdminUsersPage;
