import React, { useEffect, useState } from 'react';
import eventService from '../../services/eventService';
import EventCard from '../../components/events/EventCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import Swal from 'sweetalert2';
import { useThemeMode } from '../../context/ThemeContext';
import './EventsPage.css';

const EventsPage = () => {
    const { t } = useThemeMode();
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
            Swal.fire(t('error') || 'Hata', t('fetchError') || 'Etkinlikler yüklenemedi', 'error');
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

    const getCategoryLabel = (cat) => {
        const key = `cat${cat}`;
        return t(key) || cat;
    };

    return (
        <div className="events-page">
            <div className="events-header">
                <h1>{t('eventsTitle')}</h1>
                <p>{t('eventsSubtitle')}</p>
            </div>

            <div className="events-filters">
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        placeholder={t('searchEventsPlaceholder')}
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="search-input"
                    />
                    <button type="submit" className="search-button">
                        {t('searchButton')}
                    </button>
                </form>

                <div className="filter-group">
                    <select
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className="filter-select"
                    >
                        <option value="">{t('allCategories')}</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                        ))}
                    </select>

                    <input
                        type="date"
                        value={filters.date}
                        onChange={(e) => handleFilterChange('date', e.target.value)}
                        className="filter-date filter-select"
                    />

                    <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="filter-select"
                    >
                        <option value="">{t('allStatuses')}</option>
                        <option value="published">{t('published')}</option>
                        <option value="draft">{t('draft')}</option>
                        <option value="completed">{t('completed')}</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <LoadingSpinner />
            ) : events.length === 0 ? (
                <div className="no-events">
                    <p>{t('noEventsFound')}</p>
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
                                {t('previousPage')}
                            </button>
                            <span className="pagination-info">
                                {t('pageInfo', { page: pagination.page, totalPages: pagination.totalPages, total: pagination.total })}
                            </span>
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages}
                                className="pagination-btn"
                            >
                                {t('nextPage')}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default EventsPage;
