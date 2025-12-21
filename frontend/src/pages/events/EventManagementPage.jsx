import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import eventService from '../../services/eventService';
import LoadingSpinner from '../../components/LoadingSpinner';
import Swal from 'sweetalert2';
import './EventManagementPage.css';

const EventManagementPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    capacity: '',
    registration_deadline: '',
    is_paid: false,
    price: '0',
    status: 'draft'
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventService.getAll({ status: '', limit: 100 });
      setEvents(response.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      Swal.fire('Hata', 'Etkinlikler yüklenemedi', 'error');
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
      const submitData = {
        ...formData,
        capacity: parseInt(formData.capacity) || null,
        price: parseFloat(formData.price) || 0,
        registration_deadline: formData.registration_deadline || null
      };

      if (editingEvent) {
        await eventService.update(editingEvent.id, submitData);
        Swal.fire('Başarılı', 'Etkinlik güncellendi', 'success');
      } else {
        await eventService.create(submitData);
        Swal.fire('Başarılı', 'Etkinlik oluşturuldu', 'success');
      }

      setShowForm(false);
      setEditingEvent(null);
      setFormData({
        title: '',
        description: '',
        category: '',
        date: '',
        start_time: '',
        end_time: '',
        location: '',
        capacity: '',
        registration_deadline: '',
        is_paid: false,
        price: '0',
        status: 'draft'
      });
      fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      Swal.fire('Hata', error.response?.data?.message || 'Etkinlik kaydedilemedi', 'error');
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title || '',
      description: event.description || '',
      category: event.category || '',
      date: event.date || '',
      start_time: event.start_time || '',
      end_time: event.end_time || '',
      location: event.location || '',
      capacity: event.capacity || '',
      registration_deadline: event.registration_deadline || '',
      is_paid: event.is_paid || false,
      price: event.price || '0',
      status: event.status || 'draft'
    });
    setShowForm(true);
  };

  const handleDelete = async (eventId) => {
    try {
      const result = await Swal.fire({
        title: 'Etkinliği Sil?',
        text: 'Bu işlem geri alınamaz!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Evet, Sil',
        cancelButtonText: 'İptal'
      });

      if (result.isConfirmed) {
        await eventService.delete(eventId);
        Swal.fire('Başarılı', 'Etkinlik silindi', 'success');
        fetchEvents();
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      Swal.fire('Hata', error.response?.data?.message || 'Etkinlik silinemedi', 'error');
    }
  };

  const categories = ['Workshop', 'Seminar', 'Conference', 'Social', 'Sports', 'Cultural', 'Other'];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="event-management-page">
      <div className="page-header">
        <div>
          <h1>📅 Etkinlik Yönetimi</h1>
          <p className="subtitle">Etkinlikleri oluşturun ve yönetin</p>
        </div>
        <button className="btn-primary" onClick={() => {
          setEditingEvent(null);
          setFormData({
            title: '',
            description: '',
            category: '',
            date: '',
            start_time: '',
            end_time: '',
            location: '',
            capacity: '',
            registration_deadline: '',
            is_paid: false,
            price: '0',
            status: 'draft'
          });
          setShowForm(!showForm);
        }}>
          {showForm ? '✕ Kapat' : '+ Yeni Etkinlik'}
        </button>
      </div>

      {showForm && (
        <div className="event-form-card">
          <h3>{editingEvent ? 'Etkinlik Düzenle' : 'Yeni Etkinlik Oluştur'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Başlık *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Etkinlik başlığı"
                  required
                />
              </div>
              <div className="form-group">
                <label>Kategori</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  <option value="">Kategori Seçin</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Açıklama</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Etkinlik açıklaması"
                rows={4}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Tarih *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Başlangıç Saati</label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Bitiş Saati</label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Konum</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Etkinlik konumu"
                />
              </div>
              <div className="form-group">
                <label>Kapasite</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  placeholder="Maksimum katılımcı sayısı"
                  min="1"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Kayıt Son Tarihi</label>
                <input
                  type="datetime-local"
                  name="registration_deadline"
                  value={formData.registration_deadline}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Durum</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="draft">Taslak</option>
                  <option value="published">Yayında</option>
                  <option value="cancelled">İptal</option>
                  <option value="completed">Tamamlandı</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_paid"
                    checked={formData.is_paid}
                    onChange={handleInputChange}
                  />
                  Ücretli Etkinlik
                </label>
              </div>
              {formData.is_paid && (
                <div className="form-group">
                  <label>Ücret (₺)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => {
                setShowForm(false);
                setEditingEvent(null);
              }}>
                İptal
              </button>
              <button type="submit" className="btn-primary">
                {editingEvent ? 'Güncelle' : 'Oluştur'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="events-table">
        <table>
          <thead>
            <tr>
              <th>Başlık</th>
              <th>Kategori</th>
              <th>Tarih</th>
              <th>Kapasite</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">Henüz etkinlik yok</td>
              </tr>
            ) : (
              events.map(event => (
                <tr key={event.id}>
                  <td>{event.title}</td>
                  <td>{event.category || '-'}</td>
                  <td>{event.date ? new Date(event.date).toLocaleDateString('tr-TR') : '-'}</td>
                  <td>{event.capacity ? `${event.registered_count || 0}/${event.capacity}` : '-'}</td>
                  <td>
                    <span className={`status-badge ${event.status}`}>
                      {event.status === 'published' ? 'Yayında' :
                       event.status === 'draft' ? 'Taslak' :
                       event.status === 'cancelled' ? 'İptal' : 'Tamamlandı'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-view"
                        onClick={() => navigate(`/events/${event.id}`)}
                      >
                        Görüntüle
                      </button>
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(event)}
                      >
                        Düzenle
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(event.id)}
                      >
                        Sil
                      </button>
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

