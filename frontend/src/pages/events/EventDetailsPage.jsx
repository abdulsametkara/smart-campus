import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import eventService from '../../services/eventService';
import LoadingSpinner from '../../components/LoadingSpinner';
import Swal from 'sweetalert2';
import { useThemeMode } from '../../context/ThemeContext';
import './EventDetailsPage.css';

const EventDetailsPage = () => {
    const { t, isEnglish } = useThemeMode();
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);

    useEffect(() => {
        fetchEvent();
        checkRegistration();
    }, [id]);

    const fetchEvent = async () => {
        try {
            setLoading(true);
            const eventData = await eventService.getById(id);
            setEvent(eventData);
        } catch (error) {
            console.error('Error fetching event:', error);
            Swal.fire(t('error') || 'Hata', t('eventNotFound'), 'error').then(() => {
                navigate('/events');
            });
        } finally {
            setLoading(false);
        }
    };

    const checkRegistration = async () => {
        try {
            const registrations = await eventService.getMyRegistrations();
            const registered = registrations.some(reg => reg.event_id === parseInt(id));
            setIsRegistered(registered);
        } catch (error) {
            console.error('Error checking registration:', error);
        }
    };

    const handleRegister = async () => {
        try {
            setRegistering(true);
            const result = await eventService.register(id);

            if (result.isWaitlisted) {
                Swal.fire({
                    title: t('waitlistAddedTitle'),
                    text: t('waitlistAddedDesc'),
                    icon: 'info',
                    confirmButtonText: t('confirm') || 'Tamam'
                });
            } else {
                Swal.fire({
                    title: t('registrationSuccessTitle'),
                    text: t('registrationSuccessDesc'),
                    icon: 'success',
                    confirmButtonText: t('goToMyEvents')
                }).then((result) => {
                    if (result.isConfirmed) {
                        navigate('/my-events');
                    }
                });
            }
            setIsRegistered(true);
        } catch (error) {
            console.error('Error registering:', error);
            Swal.fire(t('error') || 'Hata', error.response?.data?.message || t('operationFailed') || 'Kayıt sırasında bir hata oluştu', 'error');
        } finally {
            setRegistering(false);
        }
    };

    const handleCancelRegistration = async () => {
        try {
            const registrations = await eventService.getMyRegistrations();
            const registration = registrations.find(reg => reg.event_id === parseInt(id));

            if (!registration) {
                Swal.fire(t('error') || 'Hata', t('registrationNotFound') || 'Kayıt bulunamadı', 'error');
                return;
            }
            const result = await Swal.fire({
                title: t('cancelRegistrationTitle'),
                text: t('cancelRegistrationConfirm'),
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: t('yesCancel'),
                cancelButtonText: t('noKeep') || 'Vazgeç'
            });
            if (result.isConfirmed) {
                await eventService.cancelRegistration(id, registration.id);
                Swal.fire(t('success') || 'Başarılı', t('cancellationSuccess'), 'success');
                setIsRegistered(false);
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

    const isRegistrationOpen = () => {
        if (!event || event.status !== 'published') return false;
        if (event.registration_deadline) {
            return new Date(event.registration_deadline) >= new Date();
        }
        return true;
    };

    const getAvailability = () => {
        if (!event) return { registered: 0, capacity: 0, available: 0, percentage: 0 };
        const registered = event.registered_count || 0;
        const capacity = event.capacity || 0;
        const available = capacity - registered;
        const percentage = capacity > 0 ? (registered / capacity) * 100 : 0;
        return { registered, capacity, available, percentage };
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!event) {
        return null;
    }

    const availability = getAvailability();

    return (
        <div className="event-details-page">
            <button onClick={() => navigate('/events')} className="back-button">
                {t('backToEvents')}
            </button>
            <div className="event-details-container">
                <div className="event-details-header">
                    <div className="event-status-badge">
                        <span className={`status-badge ${event.status === 'published' ? 'published' : ''}`}>
                            {t(event.status) || event.status}
                        </span>
                        {event.category && (
                            <span className="category-badge">{t(`cat${event.category}`) || event.category}</span>
                        )}
                    </div>
                    <h1>{event.title}</h1>
                </div>

                <div className="event-details-content">
                    <div className="event-main-info">
                        <div className="info-section">
                            <h2>{t('eventDetails')}</h2>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-icon">📅</span>
                                    <div>
                                        <strong>{t('dateLabel')}:</strong>
                                        <p>{formatDate(event.date)}</p>
                                    </div>
                                </div>
                                {event.start_time && (
                                    <div className="info-item">
                                        <span className="info-icon">🕐</span>
                                        <div>
                                            <strong>{t('timeLabel')}:</strong>
                                            <p>{formatTime(event.start_time)} {event.end_time && `- ${formatTime(event.end_time)}`}</p>
                                        </div>
                                    </div>
                                )}
                                {event.location && (
                                    <div className="info-item">
                                        <span className="info-icon">📍</span>
                                        <div>
                                            <strong>{t('locationLabel')}:</strong>
                                            <p>{event.location}</p>
                                        </div>
                                    </div>
                                )}
                                {event.capacity && (
                                    <div className="info-item">
                                        <span className="info-icon">👥</span>
                                        <div>
                                            <strong>{t('capacityLabel')}:</strong>
                                            <p>{t('registeredCount', { registered: availability.registered, capacity: availability.capacity })}</p>
                                            {availability.available > 0 ? (
                                                <span className="available-text">{t('spotsLeft', { count: availability.available })}</span>
                                            ) : (
                                                <span className="full-text">{t('full')}</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {event.registration_deadline && (
                                    <div className="info-item">
                                        <span className="info-icon">⏰</span>
                                        <div>
                                            <strong>{t('registrationDeadline')}:</strong>
                                            <p>{formatDate(event.registration_deadline)}</p>
                                        </div>
                                    </div>
                                )}
                                {event.is_paid && event.price > 0 && (
                                    <div className="info-item">
                                        <span className="info-icon">💰</span>
                                        <div>
                                            <strong>{t('priceLabel')}:</strong>
                                            <p className="price-text">{parseFloat(event.price).toFixed(2)} ₺</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {event.description && (
                            <div className="description-section">
                                <h2>{t('descriptionLabel')}</h2>
                                <p>{event.description}</p>
                            </div>
                        )}

                        {event.capacity && (
                            <div className="capacity-section">
                                <h2>{t('capacityStatus')}</h2>
                                <div className="capacity-bar-container">
                                    <div className="capacity-bar">
                                        <div
                                            className="capacity-fill"
                                            style={{ width: `${Math.min(availability.percentage, 100)}%` }}
                                        />
                                    </div>
                                    <div className="capacity-text">
                                        {t('peopleCount', { registered: availability.registered, capacity: availability.capacity })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="event-sidebar">
                        <div className="registration-card">
                            {isRegistered ? (
                                <>
                                    <h3>{t('registeredTitle')}</h3>
                                    <p>{t('registeredDesc')}</p>
                                    <button
                                        onClick={handleCancelRegistration}
                                        className="btn-cancel"
                                    >
                                        {t('cancelRegistration')}
                                    </button>
                                    <button
                                        onClick={() => navigate('/my-events')}
                                        className="btn-view"
                                    >
                                        {t('goToMyEvents')}
                                    </button>
                                </>
                            ) : isRegistrationOpen() ? (
                                <>
                                    <h3>{t('registerForEvent')}</h3>
                                    {event.is_paid && event.price > 0 && (
                                        <div className="price-info">
                                            <span className="price-label">{t('priceLabel')}:</span>
                                            <span className="price-value">{parseFloat(event.price).toFixed(2)} ₺</span>
                                        </div>
                                    )}
                                    {availability.available > 0 ? (
                                        <button
                                            onClick={handleRegister}
                                            disabled={registering}
                                            className="btn-register"
                                        >
                                            {registering ? t('registering') : t('registerButton')}
                                        </button>
                                    ) : (
                                        <div className="full-message">
                                            <p>{t('waitlistMessage')}</p>
                                            <button
                                                onClick={handleRegister}
                                                disabled={registering}
                                                className="btn-waitlist"
                                            >
                                                {registering ? t('addingToWaitlist') : t('addToWaitlist')}
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="closed-message">
                                    <h3>{t('registrationClosed')}</h3>
                                    <p>{t('registrationClosedDesc')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetailsPage;
