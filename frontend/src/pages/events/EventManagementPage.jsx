import React, { useEffect, useState } from 'react';
import eventService from '../../services/eventService';
import LoadingSpinner from '../../components/LoadingSpinner';
import Swal from 'sweetalert2';
import { useThemeMode } from '../../context/ThemeContext';
import './EventManagementPage.css';

const EventManagementPage = () => {
    const { t } = useThemeMode();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        start_time: '',
        end_time: '',
        location: '',
        capacity: 100,
        registration_deadline: '',
        category: 'Other',
        status: 'draft',
        is_paid: false,
        price: 0
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await eventService.getAll({ page: 1, limit: 100 }); // Fetch all for management
            setEvents(response.events || []);
        } catch (error) {
            console.error('Error fetching events:', error);
            Swal.fire(t('error') || 'Hata', t('fetchError') || 'Etkinlikler yüklenemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingEvent) {
                await eventService.update(editingEvent.id, formData);
                Swal.fire(t('success') || 'Başarılı', t('eventUpdated') || 'Etkinlik güncellendi', 'success');
            } else {
                await eventService.create(formData);
                Swal.fire(t('success') || 'Başarılı', t('eventCreated') || 'Etkinlik oluşturuldu', 'success');
            }
            setShowForm(false);
            setEditingEvent(null);
            fetchEvents();
            resetForm();
        } catch (error) {
            console.error('Error saving event:', error);
            Swal.fire(t('error') || 'Hata', t('eventSavedError') || 'Etkinlik kaydedilemedi', 'error');
        }
    };

    const handleDelete = async (id) => {
        try {
            const result = await Swal.fire({
                title: t('confirmDeleteTitle') || 'Emin misiniz?',
                text: t('confirmDeleteDesc') || "Bu etkinliği silmek üzeresiniz!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: t('yesDelete') || 'Evet, Sil',
                cancelButtonText: t('cancel') || 'İptal'
            });

            if (result.isConfirmed) {
                await eventService.delete(id);
                Swal.fire(t('deletedTitle') || 'Silindi!', t('deletedDesc') || 'Etkinlik silindi.', 'success');
                fetchEvents();
            }
        } catch (error) {
            Swal.fire(t('error') || 'Hata', t('deleteError') || 'Silme işlemi başarısız', 'error');
        }
    };

    const handleEdit = (event) => {
        setEditingEvent(event);
        setFormData({
            title: event.title,
            description: event.description || '',
            date: event.date,
            start_time: event.start_time || '',
            end_time: event.end_time || '',
            location: event.location || '',
            capacity: event.capacity || 100,
            registration_deadline: event.registration_deadline || '',
            category: event.category || 'Other',
            status: event.status || 'draft',
            is_paid: event.is_paid || false,
            price: event.price || 0
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            date: '',
            start_time: '',
            end_time: '',
            location: '',
            capacity: 100,
            registration_deadline: '',
            category: 'Other',
            status: 'draft',
            is_paid: false,
            price: 0
        });
        setEditingEvent(null);
    };

    if (loading && !events.length) return <LoadingSpinner />;

    return (
        <div className="event-management-page">
            <div className="page-header">
                <div>
                    <h1>{t('eventManagementTitle')}</h1>
                    <p className="subtitle">{t('eventManagementSubtitle')}</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => {
                        resetForm();
                        setShowForm(!showForm);
                    }}
                >
                    {showForm ? t('cancel') : t('newEvent')}
                </button>
            </div>

            {showForm && (
                <div className="event-form-card">
                    <h3>{editingEvent ? t('editEvent') : t('createEvent')}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('eventTitle')}</label>
                                <input name="title" value={formData.title} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>{t('category')}</label>
                                <select name="category" value={formData.category} onChange={handleInputChange}>
                                    <option value="Atölye">{t('catWorkshop') || 'Atölye'}</option>
                                    <option value="Seminer">{t('catSeminar') || 'Seminer'}</option>
                                    <option value="Konferans">{t('catConference') || 'Konferans'}</option>
                                    <option value="Sosyal">{t('catSocial') || 'Sosyal'}</option>
                                    <option value="Spor">{t('catSports') || 'Spor'}</option>
                                    <option value="Kültürel">{t('catCultural') || 'Kültürel'}</option>
                                    <option value="Diğer">{t('catOther') || 'Diğer'}</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>{t('description')}</label>
                            <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('date')}</label>
                                <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>{t('startTime')}</label>
                                <input type="time" name="start_time" value={formData.start_time} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label>{t('endTime')}</label>
                                <input type="time" name="end_time" value={formData.end_time} onChange={handleInputChange} />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('location')}</label>
                                <input name="location" value={formData.location} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label>{t('capacity')}</label>
                                <input type="number" name="capacity" value={formData.capacity} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label>{t('registrationDeadline')}</label>
                                <input type="date" name="registration_deadline" value={formData.registration_deadline} onChange={handleInputChange} />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('status')}</label>
                                <select name="status" value={formData.status} onChange={handleInputChange}>
                                    <option value="draft">{t('draft')}</option>
                                    <option value="published">{t('published')}</option>
                                    <option value="cancelled">{t('cancelled') || 'İptal'}</option>
                                    <option value="completed">{t('completed')}</option>
                                </select>
                            </div>
                            <div className="form-group checkbox-group">
                                <label>
                                    <input type="checkbox" name="is_paid" checked={formData.is_paid} onChange={handleInputChange} />
                                    {t('isPaid')}
                                </label>
                                {formData.is_paid && (
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        placeholder={t('price')}
                                        style={{ marginTop: '8px' }}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>{t('cancel')}</button>
                            <button type="submit" className="btn-primary">{t('save')}</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="events-table">
                <table>
                    <thead>
                        <tr>
                            <th>{t('eventTitle')}</th>
                            <th>{t('date')}</th>
                            <th>{t('category')}</th>
                            <th>{t('status')}</th>
                            <th>{t('capacity')}</th>
                            <th>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="no-data">{t('noEventsFound')}</td>
                            </tr>
                        ) : (
                            events.map(event => (
                                <tr key={event.id}>
                                    <td>{event.title}</td>
                                    <td>{event.date}</td>
                                    <td>{t(`cat${event.category}`) || event.category}</td>
                                    <td>
                                        <span className={`status-badge ${event.status}`}>
                                            {t(event.status) || event.status}
                                        </span>
                                    </td>
                                    <td>{event.registered_count || 0} / {event.capacity}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn-edit" onClick={() => handleEdit(event)}>{t('edit')}</button>
                                            <button className="btn-delete" onClick={() => handleDelete(event.id)}>{t('delete')}</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EventManagementPage;
