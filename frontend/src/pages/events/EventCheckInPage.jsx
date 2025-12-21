import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import eventService from '../../services/eventService';
import QRScanner from '../../components/events/QRScanner';
import LoadingSpinner from '../../components/LoadingSpinner';
import Swal from 'sweetalert2';
import './EventCheckInPage.css';

const EventCheckInPage = () => {
  const navigate = useNavigate();
  const { eventId, regId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    } else {
      setScanning(true);
      setLoading(false);
    }
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const eventData = await eventService.getById(eventId);
      setEvent(eventData);
    } catch (error) {
      console.error('Error fetching event:', error);
      Swal.fire('Hata', 'Etkinlik bulunamadı', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = async (decodedText, decodedResult) => {
    if (checkingIn) return; // Prevent multiple scans

    try {
      setCheckingIn(true);

      // Parse QR code data
      let qrData;
      try {
        qrData = JSON.parse(decodedText);
      } catch (error) {
        // If not JSON, try to extract from string
        throw new Error('Geçersiz QR kod formatı');
      }

      // Validate QR code type
      if (qrData.type !== 'event') {
        throw new Error('Bu bir etkinlik QR kodu değil');
      }

      // If eventId is provided, validate it matches
      if (eventId && qrData.eventId !== parseInt(eventId)) {
        throw new Error('Bu QR kodu bu etkinlik için geçerli değil');
      }

      // If regId is provided, use it; otherwise find registration
      let registrationId = regId;
      if (!registrationId && eventId) {
        // Find registration by eventId and userId from QR
        const registrations = await eventService.getRegistrations(eventId);
        const registration = registrations.find(
          reg => reg.user_id === qrData.userId && reg.event_id === qrData.eventId
        );
        if (!registration) {
          throw new Error('Kayıt bulunamadı');
        }
        registrationId = registration.id;
      }

      if (!registrationId) {
        throw new Error('Kayıt ID bulunamadı');
      }

      // Perform check-in
      const result = await eventService.checkIn(
        qrData.eventId || eventId,
        registrationId,
        qrData
      );

      Swal.fire({
        title: 'Check-in Başarılı!',
        html: `
          <p><strong>${result.user.full_name}</strong></p>
          <p>${result.user.email}</p>
          ${result.user.student_number ? `<p>Öğrenci No: ${result.user.student_number}</p>` : ''}
        `,
        icon: 'success',
        confirmButtonText: 'Tamam'
      });

      // Reset scanner after successful check-in
      setTimeout(() => {
        setCheckingIn(false);
        if (eventId) {
          fetchEvent(); // Refresh event data
        }
      }, 2000);
    } catch (error) {
      console.error('Check-in error:', error);
      Swal.fire({
        title: 'Check-in Başarısız',
        text: error.response?.data?.message || error.message || 'Check-in sırasında bir hata oluştu',
        icon: 'error',
        confirmButtonText: 'Tamam'
      });
      setCheckingIn(false);
    }
  };

  const handleScanError = (errorMessage) => {
    // Ignore common scanning errors
    if (errorMessage.includes('No QR code found')) {
      return;
    }
    // Only log unexpected errors
    console.log('Scan error:', errorMessage);
  };

  const handleManualCheckIn = async () => {
    if (!eventId || !regId) {
      Swal.fire('Hata', 'Etkinlik ID ve Kayıt ID gerekli', 'error');
      return;
    }

    try {
      setCheckingIn(true);
      const result = await Swal.fire({
        title: 'Manuel Check-in',
        html: `
          <p>Bu kaydı manuel olarak check-in yapmak istediğinize emin misiniz?</p>
          <input id="qr-code-input" class="swal2-input" placeholder="QR Kod Verisi (JSON)">
        `,
        showCancelButton: true,
        confirmButtonText: 'Check-in Yap',
        cancelButtonText: 'İptal',
        preConfirm: () => {
          const qrInput = document.getElementById('qr-code-input').value;
          if (!qrInput) {
            Swal.showValidationMessage('QR kod verisi gerekli');
            return false;
          }
          try {
            return JSON.parse(qrInput);
          } catch (error) {
            Swal.showValidationMessage('Geçersiz JSON formatı');
            return false;
          }
        }
      });

      if (result.isConfirmed) {
        const checkInResult = await eventService.checkIn(eventId, regId, result.value);
        Swal.fire({
          title: 'Check-in Başarılı!',
          html: `
            <p><strong>${checkInResult.user.full_name}</strong></p>
            <p>${checkInResult.user.email}</p>
          `,
          icon: 'success'
        });
        fetchEvent();
      }
    } catch (error) {
      console.error('Manual check-in error:', error);
      Swal.fire('Hata', error.response?.data?.message || 'Check-in başarısız', 'error');
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="check-in-page">
      <div className="check-in-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Geri
        </button>
        <h1>Event Check-in</h1>
        {event && (
          <div className="event-info">
            <h2>{event.title}</h2>
            <p>{event.date} {event.start_time && `- ${event.start_time}`}</p>
          </div>
        )}
      </div>

      <div className="check-in-content">
        <div className="scanner-section">
          <h2>QR Kod Tarayıcı</h2>
          <p className="scanner-hint">
            Kullanıcının QR kodunu kameraya gösterin
          </p>
          {scanning && (
            <QRScanner
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
            />
          )}
          {!scanning && (
            <button
              onClick={() => setScanning(true)}
              className="btn-start-scan"
            >
              Taramayı Başlat
            </button>
          )}
        </div>

        {eventId && regId && (
          <div className="manual-section">
            <h2>Manuel Check-in</h2>
            <p>QR kod tarayıcı çalışmıyorsa manuel check-in yapabilirsiniz.</p>
            <button
              onClick={handleManualCheckIn}
              disabled={checkingIn}
              className="btn-manual"
            >
              {checkingIn ? 'İşleniyor...' : 'Manuel Check-in'}
            </button>
          </div>
        )}

        {event && (
          <div className="registrations-section">
            <h2>Kayıtlı Kullanıcılar</h2>
            <div className="registrations-list">
              {event.registrations && event.registrations.length > 0 ? (
                event.registrations.map((reg) => (
                  <div
                    key={reg.id}
                    className={`registration-item ${reg.checked_in ? 'checked-in' : ''}`}
                  >
                    <div className="reg-info">
                      <strong>{reg.user?.full_name || 'Bilinmeyen'}</strong>
                      <span>{reg.user?.email || ''}</span>
                      {reg.user?.student_number && (
                        <span>Öğrenci No: {reg.user.student_number}</span>
                      )}
                    </div>
                    <div className="reg-status">
                      {reg.checked_in ? (
                        <span className="status-badge checked">✓ Giriş Yapıldı</span>
                      ) : (
                        <span className="status-badge pending">Bekliyor</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p>Henüz kayıt yok</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCheckInPage;

