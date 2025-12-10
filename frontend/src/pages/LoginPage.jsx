
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
  const { login, verify2FALogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
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
      const response = await login(values.email, values.password);

      // 2FA KONTROLÜ
      if (response && response.is2FARequired) {
        const { tempToken } = response;

        await Swal.fire({
          title: 'İki Aşamalı Doğrulama',
          input: 'text',
          inputLabel: 'Lütfen Authenticator uygulamasındaki 6 haneli kodu girin:',
          inputPlaceholder: '000 000',
          confirmButtonText: 'Doğrula',
          showCancelButton: true,
          cancelButtonText: 'İptal',
          inputValidator: (value) => {
            if (!value) {
              return 'Kodu girmelisiniz!';
            }
          },
          preConfirm: async (code) => {
            try {
              // Context içinden aldığımız verify2FALogin fonksiyonunu kullanacağız
              // Ancak burada hook'u onSubmit içinde kullanamayız, dışarıdan almalıyız.
              // useAuth() zaten login fonksiyonunu veriyor, verify2FALogin'i de almalıyız.
              // (Bu kod bloğu useAuth'dan gelen verify2FALogin'i kullanacak, aşağıda destructure edeceğim)
              await verify2FALogin(tempToken, code);
            } catch (error) {
              Swal.showValidationMessage(
                `Hata: ${error.response?.data?.message || 'Kod doğrulanamadı'}`
              );
            }
          }
        }).then((result) => {
          if (result.isConfirmed) {
            const Toast = Swal.mixin({
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true,
            });
            Toast.fire({ icon: 'success', title: 'Giriş başarılı' });
            window.location.href = '/dashboard';
          }
        });

        return; // 2FA akışına girdi, normal akışı bitir.
      }

      // Normal Giriş Başarılı
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
    <div className="auth-page">
      <div className="card auth-card">
        <div className="auth-header">
          <h2 className="app-brand" style={{ display: 'inline-block', fontSize: '2.5rem', marginBottom: '1rem' }}>Campy</h2>
          <p>Hesabına giriş yap ve kampüs sistemine eriş.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="ornek@email.com" {...register('email')} />
            {errors.email && <small>{errors.email.message}</small>}
          </div>
          <div className="form-field">
            <label htmlFor="password">Şifre</label>
            <input id="password" type="password" placeholder="••••••••" {...register('password')} />
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
