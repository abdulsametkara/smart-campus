import React, { useEffect, useState } from 'react';
import eventService from '../../services/eventService';
import EventCard from '../../components/events/EventCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import Swal from 'sweetalert2';
import './EventsPage.css';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    date: '',
    status: 'published',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchEvents();
  }, [filters, pagination.page]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventService.getAll({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      setEvents(response.events || []);
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 0
      }));
    } catch (error) {
      console.error('Error fetching events:', error);
      Swal.fire('Hata', 'Etkinlikler yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categories = ['Workshop', 'Seminar', 'Conference', 'Social', 'Sports', 'Cultural', 'Other'];

  return (
    <div className="events-page">
      <div className="events-header">
        <h1>Etkinlikler</h1>
        <p>Kampüsteki tüm etkinlikleri keşfedin ve kayıt olun</p>
      </div>

      <div className="events-filters">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Etkinlik ara..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">
            🔍 Ara
          </button>
        </form>

        <div className="filter-group">
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="filter-select"
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <input
            type="date"
            value={filters.date}
            onChange={(e) => handleFilterChange('date', e.target.value)}
            className="filter-date"
          />

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">Tüm Durumlar</option>
            <option value="published">Yayında</option>
            <option value="draft">Taslak</option>
            <option value="completed">Tamamlandı</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : events.length === 0 ? (
        <div className="no-events">
          <p>Henüz etkinlik bulunmamaktadır.</p>
        </div>
      ) : (
        <>
          <div className="events-grid">
            {events.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="pagination-btn"
              >
                Önceki
              </button>
              <span className="pagination-info">
                Sayfa {pagination.page} / {pagination.totalPages} (Toplam {pagination.total} etkinlik)
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="pagination-btn"
              >
                Sonraki
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EventsPage;

