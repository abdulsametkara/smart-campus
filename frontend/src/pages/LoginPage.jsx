import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const schema = yup.object({
  email: yup.string().email('Geçersiz email').required('Email gerekli'),
  password: yup.string().required('Şifre gerekli'),
});

const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  /* showResend vs. local states yerine direct Swal handle edeceğiz */

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) });

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleResendVerification = async (email) => {
    try {
      await api.post('/auth/resend-verification', { email });
      Swal.fire({
        icon: 'success',
        title: 'Gönderildi! 📧',
        text: 'Doğrulama maili tekrar gönderildi. Lütfen gelen kutunuzu kontrol edin.',
        confirmButtonColor: '#10b981'
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Hata',
        text: err?.response?.data?.message || 'Mail gönderilemedi',
      });
    }
  };

  const onSubmit = async (values) => {
    try {
      await login(values.email, values.password);
      // Başarılı girişte sessizce yönlendir veya Toast göster (genelde direkt yönlendirme iyidir)
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      Toast.fire({
        icon: 'success',
        title: 'Giriş başarılı'
      });
      window.location.href = '/dashboard';
    } catch (err) {
      const message = err?.response?.data?.message || 'Giriş başarısız';

      // Email doğrulanmamışsa özel popup
      if (message.toLowerCase().includes('not verified') || message.toLowerCase().includes('doğrulanmamış')) {
        Swal.fire({
          icon: 'warning',
          title: 'Email Doğrulanmadı',
          text: 'Giriş yapabilmek için email adresinizi doğrulamanız gerekiyor.',
          showCancelButton: true,
          confirmButtonText: 'Doğrulama Kodunu Tekrar Gönder',
          cancelButtonText: 'Kapat',
          confirmButtonColor: '#3b82f6',
        }).then((result) => {
          if (result.isConfirmed) {
            handleResendVerification(values.email);
          }
        });
      } else {
        // Diğer hatalar
        Swal.fire({
          icon: 'error',
          title: 'Hata',
          text: message,
          confirmButtonColor: '#ef4444'
        });
      }
    }
  };

  return (
    <div 
      className="auth-page"
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL || ''}/images/recep-tayyip-erdogan-universitesi.webp)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="card auth-card">
        <div className="auth-header">
          <h2 className="app-brand" style={{ display: 'inline-block', fontSize: '2.5rem', marginBottom: '1rem' }}>Campy</h2>
          <p>Hesabına giriş yap ve kampüs sistemine eriş.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <div className="input-with-icon">
              <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input id="email" type="email" placeholder="ornek@email.com" {...register('email')} />
            </div>
            {errors.email && <small>{errors.email.message}</small>}
          </div>
          <div className="form-field">
            <label htmlFor="password">Şifre</label>
            <div className="password-input-wrapper">
              <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                {...register('password')} 
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <small>{errors.password.message}</small>}
          </div>

          <div className="checkbox-wrapper">
            <label className="checkbox-label">
              <input type="checkbox" {...register('rememberMe')} />
              <span>Beni hatırla</span>
            </label>
          </div>

          <button className="btn" type="submit" disabled={isSubmitting} style={{ width: '100%' }}>
            {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
        <div className="inline-links">
          <Link to="/register">Hesap oluştur</Link>
          <Link to="/forgot-password">Şifremi unuttum</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
