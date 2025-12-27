import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import eventService from '../../services/eventService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { QRCodeSVG } from 'qrcode.react';
import Swal from 'sweetalert2';
import { useThemeMode } from '../../context/ThemeContext';
import './MyEventsPage.css';

const MyEventsPage = () => {
    const { t, isEnglish } = useThemeMode();
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
            Swal.fire(t('error') || 'Hata', t('fetchError') || 'Kayıtlarınız yüklenemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelRegistration = async (eventId, registrationId) => {
        try {
            const result = await Swal.fire({
                title: t('cancelRegistrationTitle'),
                text: t('cancelRegistrationConfirm'),
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: t('yesCancel'),
                cancelButtonText: t('noKeep')
            });
            if (result.isConfirmed) {
                await eventService.cancelRegistration(eventId, registrationId);
                Swal.fire(t('success') || 'Başarılı', t('cancellationSuccess'), 'success');
                fetchRegistrations();
            }
        } catch (error) {
            console.error('Error cancelling registration:', error);
            Swal.fire(t('error') || 'Hata', error.response?.data?.message || t('operationFailed'), 'error');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'TBA';
        const date = new Date(dateString);
        return date.toLocaleDateString(isEnglish ? 'en-US' : 'tr-TR', {
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

    const formatDateTime = (dateString) => {
        if (!dateString) return 'TBA';
        return new Date(dateString).toLocaleString(isEnglish ? 'en-US' : 'tr-TR');
    };

    const getQRData = (registration) => {
        try {
            if (registration.qr_code) {
                return registration.qr_code;
            }
            // Fallback: construct QR data from registration info
            return JSON.stringify({
                type: 'event',
                eventId: registration.event_id,
                userId: registration.user_id,
                registrationId: registration.id
            });
        } catch (error) {
            return JSON.stringify({
                type: 'event',
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
                <h1>{t('myEventsTitle')}</h1>
                <p>{t('myEventsSubtitle')}</p>
            </div>

            {registrations.length === 0 ? (
                <div className="no-registrations">
                    <p>{t('noRegistrations')}</p>
                    <button
                        onClick={() => navigate('/events')}
                        className="btn-browse"
                    >
                        {t('browseEvents')}
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
                                            <span className="status-badge checked-in">{t('statusCheckedIn')}</span>
                                        ) : isPast ? (
                                            <span className="status-badge past">{t('statusPast')}</span>
                                        ) : (
                                            <span className="status-badge upcoming">{t('statusUpcoming')}</span>
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
                                        <span>{t('registrationDate')}: {formatDate(registration.registration_date)}</span>
                                    </div>
                                </div>

                                {!isCheckedIn && !isPast && (
                                    <div className="qr-section">
                                        <h4>{t('checkInQRCode')}</h4>
                                        <div className="qr-container">
                                            <QRCodeSVG
                                                value={qrData}
                                                size={200}
                                                level="H"
                                                includeMargin={true}
                                            />
                                        </div>
                                        <p className="qr-hint">{t('showAtEntrance')}</p>
                                        <button
                                            onClick={() => setSelectedRegistration(registration)}
                                            className="btn-view-qr"
                                        >
                                            {t('enlargeQRCode')}
                                        </button>
                                    </div>
                                )}

                                {isCheckedIn && (
                                    <div className="checked-in-message">
                                        <span className="check-icon">✓</span>
                                        <p>{t('youCheckedIn')}</p>
                                        <p className="check-time">
                                            {t('checkInTime')}: {registration.checked_in_at
                                                ? formatDateTime(registration.checked_in_at)
                                                : t('unknown') || 'Bilinmiyor'}
                                        </p>
                                    </div>
                                )}

                                <div className="registration-actions">
                                    <button
                                        onClick={() => navigate(`/events/${event.id}`)}
                                        className="btn-details"
                                    >
                                        {t('eventDetails')}
                                    </button>
                                    {!isCheckedIn && !isPast && (
                                        <button
                                            onClick={() => handleCancelRegistration(event.id, registration.id)}
                                            className="btn-cancel"
                                        >
                                            {t('cancelRegistration')}
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
                        <p className="qr-modal-hint">{t('showAtEntrance')}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyEventsPage;
