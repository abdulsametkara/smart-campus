import React from 'react';
import { useNavigate } from 'react-router-dom';
import './EventCard.css';

const EventCard = ({ event }) => {
  const navigate = useNavigate();

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
    return timeString.substring(0, 5); // HH:MM format
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'status-published';
      case 'draft':
        return 'status-draft';
      case 'cancelled':
        return 'status-cancelled';
      case 'completed':
        return 'status-completed';
      default:
        return '';
    }
  };

  const isRegistrationOpen = () => {
    if (event.status !== 'published') return false;
    if (event.registration_deadline) {
      return new Date(event.registration_deadline) >= new Date();
    }
    return true;
  };

  const getAvailability = () => {
    const registered = event.registered_count || 0;
    const capacity = event.capacity || 0;
    const available = capacity - registered;
    const percentage = capacity > 0 ? (registered / capacity) * 100 : 0;
    
    return { registered, capacity, available, percentage };
  };

  const availability = getAvailability();

  return (
    <div className="event-card" onClick={() => navigate(`/events/${event.id}`)}>
      <div className="event-card-header">
        <span className={`event-status ${getStatusColor(event.status)}`}>
          {event.status === 'published' ? 'Yayında' : 
           event.status === 'draft' ? 'Taslak' :
           event.status === 'cancelled' ? 'İptal' : 'Tamamlandı'}
        </span>
        {event.category && (
          <span className="event-category">{event.category}</span>
        )}
      </div>

      <div className="event-card-body">
        <h3 className="event-title">{event.title}</h3>
        <p className="event-description">
          {event.description ? 
            (event.description.length > 100 
              ? event.description.substring(0, 100) + '...' 
              : event.description) 
            : 'Açıklama yok'}
        </p>

        <div className="event-details">
          <div className="event-detail-item">
            <span className="event-icon">📅</span>
            <span>{formatDate(event.date)}</span>
          </div>
          {event.start_time && (
            <div className="event-detail-item">
              <span className="event-icon">🕐</span>
              <span>{formatTime(event.start_time)} {event.end_time && `- ${formatTime(event.end_time)}`}</span>
            </div>
          )}
          {event.location && (
            <div className="event-detail-item">
              <span className="event-icon">📍</span>
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {event.capacity && (
          <div className="event-capacity">
            <div className="capacity-info">
              <span>Kapasite: {availability.registered}/{availability.capacity}</span>
              {availability.available > 0 ? (
                <span className="available-spots">{availability.available} yer kaldı</span>
              ) : (
                <span className="full-spots">Dolu</span>
              )}
            </div>
            <div className="capacity-bar">
              <div 
                className="capacity-fill" 
                style={{ width: `${Math.min(availability.percentage, 100)}%` }}
              />
            </div>
          </div>
        )}

        {event.is_paid && event.price > 0 && (
          <div className="event-price">
            <span className="price-label">Ücret:</span>
            <span className="price-amount">{parseFloat(event.price).toFixed(2)} ₺</span>
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
            Detaylar ve Kayıt
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

