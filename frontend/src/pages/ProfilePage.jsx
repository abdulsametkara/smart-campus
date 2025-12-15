import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

// Password Strength Meter Component (Reusable later)
const PasswordStrengthMeter = ({ password }) => {
  if (!password) return null;

  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  const colors = ['#e5e7eb', '#ef4444', '#f59e0b', '#10b981', '#059669'];
  const labels = ['Yok', 'Zayıf', 'Orta', 'Güçlü', 'Çok Güçlü'];
  const width = (strength / 4) * 100;

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ height: '4px', width: '100%', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${width}%`, background: colors[strength], transition: 'width 0.3s' }}></div>
      </div>
      <p style={{ fontSize: '0.75rem', color: colors[strength], marginTop: '0.25rem', textAlign: 'right' }}>
        {labels[strength]}
      </p>
    </div>
  );
};

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ full_name: '', phone_number: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(true);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [advisor, setAdvisor] = useState(null);

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await api.get('/users/me');
        setForm({
          full_name: res.data.full_name || '',
          phone_number: res.data.phone_number || '',
        });
        setUser(res.data);

        // Fetch advisor if student
        if (res.data.role === 'student') {
          try {
            const advisorRes = await api.get('/academic/my-advisor');
            setAdvisor(advisorRes.data?.advisor);
          } catch (e) {
            console.log('No advisor data');
          }
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Hata', text: 'Profil bilgileri yüklenemedi' });
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
    try {
      const res = await api.put('/users/me', form);
      setUser(res.data);

      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      Toast.fire({ icon: 'success', title: 'Profil güncellendi' });

    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Hata',
        text: err?.response?.data?.message || 'Güncelleme başarısız',
        confirmButtonText: 'Tamam',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);
    try {
      const res = await api.post('/users/me/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser((prev) => ({ ...prev, profile_picture_url: res.data.profile_picture_url }));

      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      Toast.fire({ icon: 'success', title: 'Fotoğraf güncellendi' });

    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Yükleme Başarısız',
        text: err?.response?.data?.message || 'Lütfen geçerli bir resim dosyası seçin.',
      });
    }
  };

  const onPasswordChange = (e) => {
    setPasswordForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      Swal.fire({ icon: 'error', title: 'Hata', text: 'Yeni şifreler eşleşmiyor' });
      return;
    }

    if (passwordForm.new_password.length < 8) {
      Swal.fire({ icon: 'warning', title: 'Zayıf Şifre', text: 'Şifre en az 8 karakter olmalı' });
      return;
    }

    try {
      await api.put('/users/me/password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });

      Swal.fire({
        icon: 'success',
        title: 'Şifre Değiştirildi',
        text: 'Şifreniz başarıyla güncellendi.',
        confirmButtonColor: '#10b981'
      });

      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setShowPasswordSection(false);

    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Hata',
        text: err?.response?.data?.message || 'Şifre güncellenemedi. Mevcut şifrenizi kontrol edin.',
      });
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
        {/* Sol Kart - Kişisel Bilgiler */}
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

          <button className="btn" onClick={onSave} style={{ marginTop: '1rem' }}>
            Değişiklikleri Kaydet
          </button>
        </div>

        {/* Sağ Sütun */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Şifre Kartı */}
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
                  <PasswordStrengthMeter password={passwordForm.new_password} />
                </div>
                <div className="form-field" style={{ marginTop: '1rem' }}>
                  <label>Yeni Şifre Tekrar</label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={passwordForm.confirm_password}
                    onChange={onPasswordChange}
                    placeholder="Yeni şifreyi tekrar girin"
                  />
                </div>

                <button className="btn" onClick={onChangePassword} style={{ marginTop: '1rem' }}>
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

          {/* 2FA Kartı */}
          <div className="card">
            <h2>İki Aşamalı Doğrulama (2FA)</h2>
            <p className="muted" style={{ marginBottom: '1rem' }}>
              Hesabınızın güvenliğini artırmak için Google Authenticator gibi bir uygulama kullanın.
            </p>

            {user?.is_2fa_enabled ? (
              <div className="status-box success">
                <span className="status-icon">✅</span>
                <div>
                  <strong>2FA Aktif</strong>
                  <p>Hesabınız iki aşamalı doğrulama ile korunuyor.</p>
                </div>
                <button className="btn outline danger btn-sm" onClick={async () => {
                  const result = await Swal.fire({
                    title: 'Emin misiniz?',
                    text: '2FA korumasını kaldırmak hesabınızı daha az güvenli hale getirir.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Evet, Kaldır',
                    cancelButtonText: 'İptal',
                    confirmButtonColor: '#ef4444'
                  });

                  if (result.isConfirmed) {
                    try {
                      await api.post('/auth/2fa/disable');
                      Swal.fire('Başarılı', '2FA devre dışı bırakıldı.', 'success');
                      // Refresh user data
                      const res = await api.get('/users/me');
                      setUser(res.data);
                    } catch (err) {
                      Swal.fire('Hata', 'İşlem başarısız oldu.', 'error');
                    }
                  }
                }}>Devre Dışı Bırak</button>
              </div>
            ) : (
              <div>
                <button className="btn" onClick={async () => {
                  try {
                    // 1. Get Secret & QR Code
                    const res = await api.get('/auth/2fa/setup');
                    const { qrCode, secret } = res.data;

                    // 2. Show QR Code in Modal
                    const result = await Swal.fire({
                      title: '2FA Kurulumu',
                      html: `
                        <p>1. Google Authenticator uygulamasını açın.</p>
                        <p>2. Aşağıdaki QR kodu taratın:</p>
                        <div style="display: flex; justify-content: center; margin: 1rem 0;">
                          <img src="${qrCode}" alt="QR Code" style="border: 1px solid #ddd; padding: 10px; border-radius: 8px;" />
                        </div>
                        <p style="font-size: 0.8rem; color: #666;">veya kodu manuel girin: <strong>${secret}</strong></p>
                        <p>3. Uygulamadaki 6 haneli kodu aşağıya girin:</p>
                        <input id="swal-2fa-input" class="swal2-input" placeholder="000 000" maxlength="6" style="text-align: center; letter-spacing: 5px; font-size: 1.5rem;">
                      `,
                      showCancelButton: true,
                      confirmButtonText: 'Doğrula ve Etkinleştir',
                      cancelButtonText: 'İptal',
                      preConfirm: () => {
                        const code = document.getElementById('swal-2fa-input').value;
                        if (!code) {
                          Swal.showValidationMessage('Lütfen kodu girin');
                        }
                        return code;
                      }
                    });

                    // 3. Verify Code
                    if (result.isConfirmed) {
                      const code = result.value;
                      try {
                        await api.post('/auth/2fa/verify', { code });

                        Swal.fire('Harika!', 'İki aşamalı doğrulama başarıyla etkinleştirildi.', 'success');

                        // Refresh user data
                        const userData = await api.get('/users/me');
                        setUser(userData.data);

                      } catch (err) {
                        Swal.fire('Hata', 'Girdiğiniz kod yanlış veya süresi dolmuş.', 'error');
                      }
                    }

                  } catch (err) {
                    console.error(err);
                    Swal.fire('Hata', 'Kurulum başlatılamadı. Lütfen tekrar deneyin.', 'error');
                  }
                }}>
                  🔒 2FA Etkinleştir
                </button>
              </div>
            )}
          </div>

          {/* Danışman Kartı - Sadece Öğrenciler için */}
          {user?.role === 'student' && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <h2>👨‍🏫 Danışmanım</h2>
              {advisor ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}>
                    {advisor.name?.[0] || '?'}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: '#1e293b' }}>{advisor.title} {advisor.name}</h3>
                    <p style={{ margin: '0.25rem 0', color: '#64748b', fontSize: '0.9rem' }}>{advisor.department}</p>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                      📧 {advisor.email}
                      {advisor.office && <span> | 🏢 {advisor.office}</span>}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="muted">Henüz bir danışman atanmamış.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
