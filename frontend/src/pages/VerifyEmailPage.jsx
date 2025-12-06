import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const [message, setMessage] = useState('Doğrulanıyor...');

  useEffect(() => {
    const run = async () => {
      try {
        const res = await api.post('/auth/verify-email', { token });
        setMessage(res?.data?.message || 'Email doğrulandı.');
      } catch (err) {
        setMessage(err?.response?.data?.message || 'Doğrulama başarısız');
      }
    };
    run();
  }, [token]);

  const isSuccess = message.toLowerCase().includes('doğrulandı') || message.toLowerCase().includes('verified');

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="auth-header">
          <p className="eyebrow">Smart Campus</p>
          <h2>Email Doğrulama</h2>
          <p>Hesabını aktive etmek için doğrulama işlemi.</p>
        </div>
        <div className={`alert ${isSuccess ? 'alert-success' : 'alert-error'}`} style={{ textAlign: 'center' }}>
          {message}
        </div>
        <div className="inline-links">
          <Link to="/login">Giriş sayfasına git</Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
