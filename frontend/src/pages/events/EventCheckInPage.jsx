import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import eventService from '../../services/eventService';
import QRScanner from '../../components/events/QRScanner';
import LoadingSpinner from '../../components/LoadingSpinner';
import Swal from 'sweetalert2';
import { useThemeMode } from '../../context/ThemeContext';
import './EventCheckInPage.css';

const EventCheckInPage = () => {
    const { t } = useThemeMode();
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
            Swal.fire(t('error') || 'Hata', t('eventNotFound'), 'error');
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
                throw new Error(t('invalidQR') || 'Geçersiz QR kod formatı');
            }

            // Validate QR code type
            if (qrData.type !== 'event') {
                throw new Error(t('notEventQR') || 'Bu bir etkinlik QR kodu değil');
            }

            // If eventId is provided, validate it matches
            if (eventId && qrData.eventId !== parseInt(eventId)) {
                throw new Error(t('invalidEventQR') || 'Bu QR kodu bu etkinlik için geçerli değil');
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
                    throw new Error(t('registrationNotFound') || 'Kayıt bulunamadı');
                }
                registrationId = registration.id;
            }

            if (!registrationId) {
                throw new Error(t('registrationNotFound') || 'Kayıt ID bulunamadı');
            }

            // Perform check-in
            const result = await eventService.checkIn(
                qrData.eventId || eventId,
                registrationId,
                qrData
            );

            Swal.fire({
                title: t('checkInSuccess'),
                html: `
          <p><strong>${result.user.full_name}</strong></p>
          <p>${result.user.email}</p>
          ${result.user.student_number ? `<p>${t('studentNo')}: ${result.user.student_number}</p>` : ''}
        `,
                icon: 'success',
                confirmButtonText: t('confirm') || 'Tamam'
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
                title: t('checkInFailed'),
                text: error.response?.data?.message || error.message || t('operationFailed'),
                icon: 'error',
                confirmButtonText: t('confirm') || 'Tamam'
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
        // console.log('Scan error:', errorMessage);
    };

    const handleManualCheckIn = async () => {
        if (!eventId || !regId) {
            Swal.fire(t('error') || 'Hata', 'ID required', 'error');
            return;
        }

        try {
            setCheckingIn(true);
            const result = await Swal.fire({
                title: t('manualCheckInConfirmTitle'),
                html: `
          <p>${t('manualCheckInConfirmDesc')}</p>
          <input id="qr-code-input" class="swal2-input" placeholder="${t('enterQRData')}">
        `,
                showCancelButton: true,
                confirmButtonText: t('checkInAction'),
                cancelButtonText: t('noKeep') || 'İptal',
                preConfirm: () => {
                    const qrInput = document.getElementById('qr-code-input').value;
                    if (!qrInput) {
                        Swal.showValidationMessage(t('qrDataRequired'));
                        return false;
                    }
                    try {
                        return JSON.parse(qrInput);
                    } catch (error) {
                        Swal.showValidationMessage(t('invalidQR'));
                        return false;
                    }
                }
            });

            if (result.isConfirmed) {
                const checkInResult = await eventService.checkIn(eventId, regId, result.value);
                Swal.fire({
                    title: t('checkInSuccess'),
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
            Swal.fire(t('error') || 'Hata', error.response?.data?.message || t('checkInFailed'), 'error');
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
                    {t('back')}
                </button>
                <h1>{t('eventCheckInTitle')}</h1>
                {event && (
                    <div className="event-info">
                        <h2>{event.title}</h2>
                        <p>{event.date} {event.start_time && `- ${event.start_time}`}</p>
                    </div>
                )}
            </div>

            <div className="check-in-content">
                <div className="scanner-section">
                    <h2>{t('scannerTitle')}</h2>
                    <p className="scanner-hint">
                        {t('scannerHint')}
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
                            {t('startScan')}
                        </button>
                    )}
                </div>

                {eventId && regId && (
                    <div className="manual-section">
                        <h2>{t('manualCheckInSection')}</h2>
                        <p>{t('manualCheckInDesc')}</p>
                        <button
                            onClick={handleManualCheckIn}
                            disabled={checkingIn}
                            className="btn-manual"
                        >
                            {checkingIn ? t('processing') : t('processManualCheckIn')}
                        </button>
                    </div>
                )}

                {event && (
                    <div className="registrations-section">
                        <h2>{t('registeredUsers')}</h2>
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
                                                <span>{t('studentNo')}: {reg.user.student_number}</span>
                                            )}
                                        </div>
                                        <div className="reg-status">
                                            {reg.checked_in ? (
                                                <span className="status-badge checked">{t('statusCheckedIn')}</span>
                                            ) : (
                                                <span className="status-badge pending">{t('statusPending')}</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>{t('noRegistrationsYet')}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventCheckInPage;
