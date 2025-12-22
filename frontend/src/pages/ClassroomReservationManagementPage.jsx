import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import reservationService from '../services/reservationService';
import LoadingSpinner from '../components/LoadingSpinner';
import NotificationService from '../services/notificationService';
import './SchedulePage.css';

const ClassroomReservationManagementPage = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'pending', 'approved', 'rejected', 'all'
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      NotificationService.error('Yetki Hatası', 'Bu sayfaya sadece yöneticiler erişebilir.');
      return;
    }
    fetchReservations();
  }, [filter, user]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const params = filter === 'all' ? {} : { status: filter };
      const data = await reservationService.list(params);
      setReservations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Rezervasyonlar yüklenemedi:', err);
      NotificationService.error('Hata', 'Rezervasyonlar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      setProcessingId(id);
      await reservationService.updateStatus(id, newStatus);
      NotificationService.success('Başarılı', `Rezervasyon ${newStatus === 'approved' ? 'onaylandı' : 'reddedildi'}.`);
      await fetchReservations();
    } catch (err) {
      console.error('Durum güncellenemedi:', err);
      NotificationService.error('Hata', err.response?.data?.message || 'Durum güncellenemedi.');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Beklemede', class: 'badge-warning' },
      approved: { text: 'Onaylandı', class: 'badge-success' },
      rejected: { text: 'Reddedildi', class: 'badge-error' },
      cancelled: { text: 'İptal Edildi', class: 'badge-secondary' }
    };
    const badge = badges[status] || badges.pending;
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (user?.role !== 'admin') {
    return (
      <div className="page">
        <div className="alert alert-error">
          <strong>Yetki Hatası:</strong> Bu sayfaya sadece yöneticiler erişebilir.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page">
        <LoadingSpinner size="large" message="Rezervasyonlar yükleniyor..." />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Sınıf Rezervasyon Yönetimi</h1>
        <p className="page-subtitle">Rezervasyon taleplerini onaylayın veya reddedin</p>
      </div>

      {/* Filter Tabs */}
      <div className="schedule-view-toggle" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          className={`btn btn-sm ${filter === 'pending' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setFilter('pending')}
        >
          Beklemede ({reservations.filter(r => r.status === 'pending').length})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${filter === 'approved' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setFilter('approved')}
        >
          Onaylandı ({reservations.filter(r => r.status === 'approved').length})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${filter === 'rejected' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setFilter('rejected')}
        >
          Reddedildi ({reservations.filter(r => r.status === 'rejected').length})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setFilter('all')}
        >
          Tümü
        </button>
      </div>

      {/* Reservations List */}
      {reservations.length === 0 ? (
        <div className="empty-state-card">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h3>Rezervasyon bulunamadı</h3>
          <p>
            {filter === 'pending' ? 'Bekleyen rezervasyon talebi bulunmuyor.' :
              filter === 'approved' ? 'Onaylanmış rezervasyon bulunmuyor.' :
                filter === 'rejected' ? 'Reddedilmiş rezervasyon bulunmuyor.' :
                  'Henüz rezervasyon bulunmuyor.'}
          </p>
        </div>
      ) : (
        <div className="reservation-list">
          {reservations.map((reservation) => (
            <div key={reservation.id} className="card" style={{ marginBottom: '1rem' }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>
                    {reservation.classroom?.name || `Sınıf #${reservation.classroom_id}`}
                  </h3>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#666' }}>
                    {reservation.classroom?.building && reservation.classroom?.room_number
                      ? `${reservation.classroom.building} - ${reservation.classroom.room_number}`
                      : 'Konum bilgisi yok'}
                  </p>
                </div>
                {getStatusBadge(reservation.status)}
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <strong>📅 Tarih:</strong>
                    <div>{formatDate(reservation.date)}</div>
                  </div>
                  <div>
                    <strong>⏰ Saat:</strong>
                    <div>{reservation.start_time?.substring(0, 5)} - {reservation.end_time?.substring(0, 5)}</div>
                  </div>
                  <div>
                    <strong>👤 Talep Eden:</strong>
                    <div>{reservation.user?.full_name || 'Bilinmiyor'}</div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>{reservation.user?.email}</div>
                  </div>
                  <div>
                    <strong>📝 Amaç:</strong>
                    <div>{reservation.purpose || '-'}</div>
                  </div>
                </div>

                {reservation.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                      className="btn btn-success"
                      onClick={() => handleStatusUpdate(reservation.id, 'approved')}
                      disabled={processingId === reservation.id}
                    >
                      {processingId === reservation.id ? 'İşleniyor...' : '✅ Onayla'}
                    </button>
                    <button
                      className="btn btn-error"
                      onClick={() => handleStatusUpdate(reservation.id, 'rejected')}
                      disabled={processingId === reservation.id}
                    >
                      {processingId === reservation.id ? 'İşleniyor...' : '❌ Reddet'}
                    </button>
                  </div>
                )}

                {reservation.status === 'approved' && reservation.approved_by && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f0f9ff', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                    ✅ Bu rezervasyon onaylanmış.
                  </div>
                )}

                {reservation.status === 'rejected' && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                    ❌ Bu rezervasyon reddedilmiş.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassroomReservationManagementPage;

