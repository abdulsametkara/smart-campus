import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../services/api';

const schema = yup.object({
  password: yup
    .string()
    .min(8, 'En az 8 karakter')
    .matches(/[A-Z]/, 'Bir büyük harf içermeli')
    .matches(/[0-9]/, 'Bir rakam içermeli')
    .required('Şifre gerekli'),
});

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
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
      const res = await api.post('/auth/reset-password', { token, password: values.password });
      setMessage('Şifreniz başarıyla güncellendi! Giriş sayfasına yönlendiriliyorsunuz...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err?.response?.data?.message || 'İşlem başarısız');
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="auth-header">
          <p className="eyebrow">Smart Campus</p>
          <h2>Şifre Sıfırlama</h2>
          <p>Yeni şifreni belirle ve giriş yap.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-field">
            <label htmlFor="password">Yeni Şifre</label>
            <input id="password" type="password" placeholder="En az 8 karakter" {...register('password')} />
            {errors.password && <small>{errors.password.message}</small>}
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}
          <button className="btn" type="submit" disabled={isSubmitting} style={{ width: '100%' }}>
            {isSubmitting ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
          </button>
        </form>
        <div className="inline-links">
          <Link to="/login">Giriş sayfasına dön</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
