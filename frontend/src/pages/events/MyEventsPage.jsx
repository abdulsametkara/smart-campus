import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import eventService from '../../services/eventService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { QRCodeSVG } from 'qrcode.react';
import NotificationService from '../../services/notificationService';
import QrCodeService from '../../services/qrCodeService';
import './MyEventsPage.css';

const MyEventsPage = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const data = await eventService.getMyRegistrations();
      setRegistrations(data);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      NotificationService.error('Hata', 'Kayıtlarınız yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRegistration = async (eventId, registrationId) => {
    try {
      const result = await NotificationService.confirm(
        'Kaydı İptal Et?',
        'Etkinlik kaydınızı iptal etmek istediğinize emin misiniz?',
        {
          confirmButtonText: 'Evet, İptal Et',
          cancelButtonText: 'Vazgeç'
        }
      );

      if (result.isConfirmed) {
        await eventService.cancelRegistration(eventId, registrationId);
        NotificationService.success('Başarılı', 'Kayıt iptal edildi');
        fetchRegistrations();
      }
    } catch (error) {
      console.error('Error cancelling registration:', error);
      NotificationService.error('Hata', error.response?.data?.message || 'İptal sırasında bir hata oluştu');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  const getQRData = (registration) => {
    try {
      if (registration.qr_code) {
        return registration.qr_code;
      }
      // Fallback: construct QR data from registration info
      return QrCodeService.buildEventPayload({
        eventId: registration.event_id,
        userId: registration.user_id,
        registrationId: registration.id
      });
    } catch (error) {
      return QrCodeService.buildEventPayload({
        eventId: registration.event_id,
        registrationId: registration.id
      });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="my-events-page">
      <div className="my-events-header">
        <h1>Etkinliklerim</h1>
        <p>Kayıt olduğunuz etkinlikler ve QR kodlarınız</p>
      </div>

      {registrations.length === 0 ? (
        <div className="no-registrations">
          <p>Henüz hiçbir etkinliğe kayıt olmadınız.</p>
          <button 
            onClick={() => navigate('/events')}
            className="btn-browse"
          >
            Etkinliklere Göz At
          </button>
        </div>
      ) : (
        <div className="registrations-grid">
          {registrations.map((registration) => {
            const event = registration.event;
            const qrData = getQRData(registration);
            const isPast = event.date && new Date(event.date) < new Date();
            const isCheckedIn = registration.checked_in;

            return (
              <div key={registration.id} className="registration-card">
                <div className="registration-header">
                  <h3>{event.title}</h3>
                  <div className="registration-status">
                    {isCheckedIn ? (
                      <span className="status-badge checked-in">✓ Giriş Yapıldı</span>
                    ) : isPast ? (
                      <span className="status-badge past">Geçmiş</span>
                    ) : (
                      <span className="status-badge upcoming">Yaklaşan</span>
                    )}
                  </div>
                </div>

                <div className="registration-details">
                  <div className="detail-item">
                    <span className="detail-icon">📅</span>
                    <span>{formatDate(event.date)}</span>
                  </div>
                  {event.start_time && (
                    <div className="detail-item">
                      <span className="detail-icon">🕐</span>
                      <span>{formatTime(event.start_time)} {event.end_time && `- ${formatTime(event.end_time)}`}</span>
                    </div>
                  )}
                  {event.location && (
                    <div className="detail-item">
                      <span className="detail-icon">📍</span>
                      <span>{event.location}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-icon">📝</span>
                    <span>Kayıt Tarihi: {formatDate(registration.registration_date)}</span>
                  </div>
                </div>

                {!isCheckedIn && !isPast && (
                  <div className="qr-section">
                    <h4>Check-in QR Kodu</h4>
                    <div className="qr-container">
                      <QRCodeSVG
                        value={qrData}
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <p className="qr-hint">Etkinlik girişinde bu QR kodu gösterin</p>
                    <button
                      onClick={() => setSelectedRegistration(registration)}
                      className="btn-view-qr"
                    >
                      QR Kodu Büyüt
                    </button>
                  </div>
                )}

                {isCheckedIn && (
                  <div className="checked-in-message">
                    <span className="check-icon">✓</span>
                    <p>Bu etkinliğe giriş yaptınız</p>
                    <p className="check-time">
                      Giriş: {registration.checked_in_at 
                        ? new Date(registration.checked_in_at).toLocaleString('tr-TR')
                        : 'Bilinmiyor'}
                    </p>
                  </div>
                )}

                <div className="registration-actions">
                  <button
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="btn-details"
                  >
                    Etkinlik Detayları
                  </button>
                  {!isCheckedIn && !isPast && (
                    <button
                      onClick={() => handleCancelRegistration(event.id, registration.id)}
                      className="btn-cancel"
                    >
                      Kaydı İptal Et
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedRegistration && (
        <div className="qr-modal" onClick={() => setSelectedRegistration(null)}>
          <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="qr-modal-close"
              onClick={() => setSelectedRegistration(null)}
            >
              ×
            </button>
            <h2>{selectedRegistration.event.title}</h2>
            <div className="qr-modal-qr">
              <QRCodeSVG
                value={getQRData(selectedRegistration)}
                size={300}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="qr-modal-hint">Etkinlik girişinde bu QR kodu gösterin</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyEventsPage;

