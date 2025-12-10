import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../services/api';

const schema = yup.object({
  email: yup.string().email('Geçersiz email').required('Email gerekli'),
});

const ForgotPasswordPage = () => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (values) => {
    setMessage('');
    setError('');
    try {
      const res = await api.post('/auth/forgot-password', values);
      // Backend ne dönerse dönsün, güvenlik ve UX için standart bir mesaj gösterelim.
      setMessage('Eğer bu e-posta adresi sistemimizde kayıtlıysa, şifre sıfırlama bağlantısı gönderilmiştir. (Lütfen spam/gereksiz kutusunu da kontrol ediniz.)');
    } catch (err) {
      setError(err?.response?.data?.message || 'İstek başarısız');
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="auth-header">
          <p className="eyebrow">Smart Campus</p>
          <h2>Şifremi Unuttum</h2>
          <p>E-posta adresine sıfırlama bağlantısı gönderilecek.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="ornek@email.com" {...register('email')} />
            {errors.email && <small>{errors.email.message}</small>}
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}
          <button className="btn" type="submit" disabled={isSubmitting} style={{ width: '100%' }}>
            {isSubmitting ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
          </button>
        </form>
        <div className="inline-links">
          <Link to="/login">Giriş sayfasına dön</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
