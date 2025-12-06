import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const schema = yup.object({
  email: yup.string().email('Geçersiz email').required('Email gerekli'),
  password: yup.string().required('Şifre gerekli'),
});

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (values) => {
    setError('');
    setShowResend(false);
    setResendMessage('');
    try {
      await login(values.email, values.password);
      navigate('/dashboard');
    } catch (err) {
      const message = err?.response?.data?.message || 'Giriş başarısız';
      setError(message);
      // Email doğrulanmamışsa resend butonu göster
      if (message.toLowerCase().includes('not verified') || message.toLowerCase().includes('doğrulanmamış')) {
        setShowResend(true);
        setResendEmail(values.email);
      }
    }
  };

  const handleResendVerification = async () => {
    try {
      await api.post('/auth/resend-verification', { email: resendEmail });
      setResendMessage('Doğrulama maili gönderildi! Lütfen email kutunuzu kontrol edin.');
      setShowResend(false);
    } catch (err) {
      setResendMessage(err?.response?.data?.message || 'Mail gönderilemedi');
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="auth-header">
          <p className="eyebrow">Campy</p>
          <h2>Giriş Yap</h2>
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
          
          <div className="form-field checkbox-field" style={{ marginBottom: 16 }}>
            <label className="checkbox-label">
              <input type="checkbox" {...register('rememberMe')} />
              <span>Beni hatırla</span>
            </label>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
              {showResend && (
                <button 
                  type="button" 
                  onClick={handleResendVerification}
                  className="resend-btn"
                >
                  Doğrulama maili tekrar gönder
                </button>
              )}
            </div>
          )}
          {resendMessage && <div className="alert alert-success">{resendMessage}</div>}
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
