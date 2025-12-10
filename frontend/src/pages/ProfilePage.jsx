import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ full_name: '', phone_number: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await api.get('/users/me');
        setForm({
          full_name: res.data.full_name || '',
          phone_number: res.data.phone_number || '',
        });
        setUser(res.data);
      } catch (err) {
        setError('Profil yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    loadMe();
  }, [setUser]);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSave = async () => {
    setMessage('');
    setError('');
    try {
      const res = await api.put('/users/me', form);
      setUser(res.data);
      setMessage('Profil güncellendi');
    } catch (err) {
      setError(err?.response?.data?.message || 'Güncelleme başarısız');
    }
  };

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage('');
    setError('');
    const formData = new FormData();
    formData.append('profilePicture', file);
    try {
      const res = await api.post('/users/me/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser((prev) => ({ ...prev, profile_picture_url: res.data.profile_picture_url }));
      setMessage('Fotoğraf yüklendi');
    } catch (err) {
      setError(err?.response?.data?.message || 'Yükleme başarısız');
    }
  };

  const onPasswordChange = (e) => {
    setPasswordForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onChangePassword = async () => {
    setPasswordMessage('');
    setPasswordError('');

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('Yeni şifreler eşleşmiyor');
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setPasswordError('Şifre en az 8 karakter olmalı');
      return;
    }

    try {
      await api.put('/users/me/password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordMessage('Şifre başarıyla güncellendi');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      console.error('Şifre değiştirme hatası:', err);
      setPasswordError(err?.response?.data?.message || 'Şifre güncellenemedi. Lütfen tekrar deneyin.');
    }
  };

  const getRoleLabel = (role) => {
    const labels = { student: 'Öğrenci', faculty: 'Akademisyen', admin: 'Yönetici' };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner spinner-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page profile-page">
      <div className="profile-hero-card">
        <div className="profile-hero-bg"></div>
        <div className="profile-hero-content">
          <div className="profile-avatar-large">
            <div className="avatar-frame-large">
              {user?.profile_picture_url ? (
                <img
                  src={
                    user.profile_picture_url.startsWith('http')
                      ? user.profile_picture_url
                      : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${user.profile_picture_url.startsWith('/') ? '' : '/'}${user.profile_picture_url}`.replace('/api/v1', '')
                  }
                  alt="avatar"
                  className="avatar-img"
                />
              ) : (
                <div className="avatar-placeholder-large">{user?.email?.[0]?.toUpperCase()}</div>
              )}
            </div>
            <label className="avatar-upload-btn" title="Fotoğraf Yükle">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
              <input type="file" accept="image/png,image/jpeg" onChange={onUpload} />
            </label>
          </div>
          <div className="profile-hero-info">
            <h1>{user?.full_name || 'Kullanıcı'}</h1>
            <p className="profile-email">{user?.email}</p>
            <span className={`badge ${user?.role}`}>{getRoleLabel(user?.role)}</span>
          </div>
        </div>
      </div>

      <div className="profile-cards-grid">
        <div className="card">
          <h2>Kişisel Bilgiler</h2>
          <div className="form-field">
            <label>Ad Soyad</label>
            <input name="full_name" value={form.full_name} onChange={onChange} placeholder="Adınız Soyadınız" />
          </div>
          <div className="form-field">
            <label>Telefon Numarası</label>
            <input name="phone_number" value={form.phone_number} onChange={onChange} placeholder="+90 5XX XXX XX XX" />
          </div>
          <div className="form-field">
            <label>Email</label>
            <input value={user?.email || ''} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} />
          </div>
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}
          <button className="btn" onClick={onSave}>
            Değişiklikleri Kaydet
          </button>
        </div>

        <div className="card">
          <div
            className="collapsible-header"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
          >
            <h2>Şifre Değiştir</h2>
            <span className={`collapse-icon ${showPasswordSection ? 'open' : ''}`}>▼</span>
          </div>

          {showPasswordSection && (
            <div className="collapsible-content">
              <p className="muted" style={{ marginBottom: 16 }}>
                Güvenliğiniz için güçlü bir şifre kullanın.
              </p>
              <div className="form-field">
                <label>Mevcut Şifre</label>
                <input
                  type="password"
                  name="current_password"
                  value={passwordForm.current_password}
                  onChange={onPasswordChange}
                  placeholder="Mevcut şifrenizi girin"
                />
              </div>
              <div className="form-field">
                <label>Yeni Şifre</label>
                <input
                  type="password"
                  name="new_password"
                  value={passwordForm.new_password}
                  onChange={onPasswordChange}
                  placeholder="En az 8 karakter, büyük harf ve rakam"
                />
              </div>
              <div className="form-field">
                <label>Yeni Şifre Tekrar</label>
                <input
                  type="password"
                  name="confirm_password"
                  value={passwordForm.confirm_password}
                  onChange={onPasswordChange}
                  placeholder="Yeni şifreyi tekrar girin"
                />
              </div>
              {passwordMessage && <div className="alert alert-success">{passwordMessage}</div>}
              {passwordError && <div className="alert alert-error">{passwordError}</div>}
              <button className="btn" onClick={onChangePassword}>
                Şifreyi Güncelle
              </button>
            </div>
          )}

          {!showPasswordSection && (
            <p className="muted" style={{ marginTop: 8 }}>
              Şifrenizi değiştirmek için tıklayın.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
