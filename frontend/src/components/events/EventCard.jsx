import React from 'react';
import { useNavigate } from 'react-router-dom';
import './EventCard.css';

const EventCard = ({ event, index = 0 }) => {
    const navigate = useNavigate();

    const formatDate = (dateString) => {
        if (!dateString) return 'TBA';
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        return timeString.substring(0, 5);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'published': return 'status-published';
            case 'draft': return 'status-draft';
            case 'cancelled': return 'status-cancelled';
            case 'completed': return 'status-completed';
            default: return '';
        }
    };

    const isRegistrationOpen = () => {
        if (event.status !== 'published') return false;
        if (event.registration_deadline) {
            return new Date(event.registration_deadline) >= new Date();
        }
        return true;
    };

    const availability = (() => {
        const registered = event.registered_count || 0;
        const capacity = event.capacity || 0;
        const available = capacity - registered;
        // Ensure percentage doesn't exceed 100 for visuals
        const percentage = capacity > 0 ? Math.min((registered / capacity) * 100, 100) : 0;
        return { registered, capacity, available, percentage };
    })();

    return (
        <div
            className="event-card"
            onClick={() => navigate(`/events/${event.id}`)}
            style={{ animationDelay: `${index * 0.1}s` }} // Staggered animation
        >
            {event.is_paid && event.price > 0 && (
                <div className="event-price">
                    {parseFloat(event.price).toFixed(0)} ₺
                </div>
            )}

            <div className="event-card-header">
                <span className={`event-status ${getStatusColor(event.status)}`}>
                    {event.status === 'published' ? 'Yayında' :
                        event.status === 'draft' ? 'Taslak' :
                            event.status === 'cancelled' ? 'İptal' : 'Tamamlandı'}
                </span>
                <span className="event-category">{event.category || 'Genel'}</span>
            </div>

            <div className="event-card-body">
                <h3 className="event-title">{event.title}</h3>

                <div className="event-details">
                    <div className="event-detail-item">
                        <span className="event-icon">📅</span>
                        <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="event-detail-item">
                        <span className="event-icon">🕐</span>
                        <span>{event.start_time ? formatTime(event.start_time) : '--:--'}</span>
                    </div>
                    {event.location && (
                        <div className="event-detail-item" style={{ gridColumn: 'span 2' }}>
                            <span className="event-icon">📍</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {event.location}
                            </span>
                        </div>
                    )}
                </div>

                <p className="event-description">
                    {event.description || 'Etkinlik açıklaması bulunmuyor.'}
                </p>

                {event.capacity && (
                    <div className="event-capacity">
                        <div className="capacity-info">
                            <span>Doluluk</span>
                            {availability.available > 0 ? (
                                <span className="available-spots">{availability.available} yer kaldı</span>
                            ) : (
                                <span className="full-spots">Kontenjan Dolu</span>
                            )}
                        </div>
                        <div className="capacity-bar">
                            <div
                                className="capacity-fill"
                                style={{ width: `${availability.percentage}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="event-card-footer">
                {isRegistrationOpen() ? (
                    <button
                        className="btn-register"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/events/${event.id}`);
                        }}
                    >
                        <span>Detaylar & Kayıt</span>
                        <span>→</span>
                    </button>
                ) : (
                    <button className="btn-disabled" disabled>
                        Kayıt Kapalı
                    </button>
                )}
            </div>
        </div>
    );
};

export default EventCard;
