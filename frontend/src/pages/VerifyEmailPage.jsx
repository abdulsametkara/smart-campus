import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const effectRan = useRef(false);
  const [status, setStatus] = useState('loading'); // loading, success, error

  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;

    const run = async () => {
      try {
        await api.post('/auth/verify-email', { token });
        setStatus('success');

        Swal.fire({
          icon: 'success',
          title: 'Doğrulama Başarılı! 🚀',
          text: 'Hesabınız başarıyla aktive edildi. Şimdi giriş yapabilirsiniz.',
          confirmButtonText: 'Giriş Yap',
          confirmButtonColor: '#10b981',
          allowOutsideClick: false
        }).then((result) => {
          if (result.isConfirmed) {
            navigate('/login');
          }
        });

      } catch (err) {
        setStatus('error');
        const msg = err?.response?.data?.message || 'Doğrulama başarısız';

        Swal.fire({
          icon: 'error',
          title: 'Hata!',
          text: msg,
          confirmButtonText: 'Giriş Sayfasına Dön',
          confirmButtonColor: '#ef4444'
        }).then(() => {
          navigate('/login');
        });
      }
    };
    run();
  }, [token, navigate]);

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
      <div className="card auth-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '300px', justifyContent: 'center' }}>

        <div className="auth-header">
          <h2 className="app-brand" style={{ display: 'inline-block', fontSize: '2.5rem', marginBottom: '1rem' }}>Campy</h2>
        </div>

        {status === 'loading' && (
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 20px', width: '40px', height: '40px' }}></div>
            <p>Email adresiniz doğrulanıyor, lütfen bekleyin...</p>
          </div>
        )}

        {status === 'success' && (
          <p style={{ color: '#10b981', fontWeight: 'bold' }}>İşlem tamamlandı, yönlendiriliyorsunuz...</p>
        )}

        {status === 'error' && (
          <p style={{ color: '#ef4444', fontWeight: 'bold' }}>Doğrulama işlemi başarısız oldu.</p>
        )}

      </div>
    </div>
  );
};

export default VerifyEmailPage;
