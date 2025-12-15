import React, { useState, useEffect, useCallback } from 'react';
import announcementService from '../services/announcementService';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import './AnnouncementManagementPage.css';

const AnnouncementManagementPage = () => {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        priority: 'NORMAL',
        expiry_date: ''
    });

    const fetchAnnouncements = useCallback(async () => {
        try {
            setLoading(true);
            const response = await announcementService.getAll();
            const data = response.data || response;
            setAnnouncements(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.content.trim()) {
            Swal.fire('Uyarı', 'Başlık ve içerik zorunludur', 'warning');
            return;
        }

        try {
            await announcementService.create(formData);
            Swal.fire('Başarılı', 'Duyuru oluşturuldu', 'success');
            setFormData({ title: '', content: '', priority: 'NORMAL', expiry_date: '' });
            setShowForm(false);
            fetchAnnouncements();
        } catch (error) {
            Swal.fire('Hata', error.response?.data?.message || 'Duyuru oluşturulamadı', 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Emin misiniz?',
            text: 'Bu duyuru kalıcı olarak silinecek!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Evet, Sil',
            cancelButtonText: 'İptal'
        });

        if (result.isConfirmed) {
            try {
                await announcementService.delete(id);
                Swal.fire('Silindi!', 'Duyuru başarıyla silindi.', 'success');
                fetchAnnouncements();
            } catch (error) {
                Swal.fire('Hata', 'Silinemedi', 'error');
            }
        }
    };

    const getPriorityBadge = (priority) => {
        const badges = {
            'HIGH': { class: 'priority-high', label: 'Yüksek' },
            'NORMAL': { class: 'priority-normal', label: 'Normal' },
            'LOW': { class: 'priority-low', label: 'Düşük' }
        };
        const badge = badges[priority] || badges['NORMAL'];
        return <span className={`priority-badge ${badge.class}`}>{badge.label}</span>;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="page announcement-management-page">
            <div className="page-header">
                <div>
                    <h1>📢 Duyuru Yönetimi</h1>
                    <p className="subtitle">Duyuruları oluşturun ve yönetin</p>
                </div>
                <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? '✕ Kapat' : '+ Yeni Duyuru'}
                </button>
            </div>

            {/* Yeni Duyuru Formu */}
            {showForm && (
                <div className="announcement-form-card">
                    <h3>Yeni Duyuru Oluştur</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Başlık *</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="Duyuru başlığı"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>İçerik *</label>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleInputChange}
                                placeholder="Duyuru içeriğini yazın..."
                                rows={5}
                                required
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Öncelik</label>
                                <select name="priority" value={formData.priority} onChange={handleInputChange}>
                                    <option value="LOW">Düşük</option>
                                    <option value="NORMAL">Normal</option>
                                    <option value="HIGH">Yüksek</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Geçerlilik Tarihi (Opsiyonel)</label>
                                <input
                                    type="date"
                                    name="expiry_date"
                                    value={formData.expiry_date}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                                İptal
                            </button>
                            <button type="submit" className="btn-primary">
                                Duyuru Yayınla
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Duyuru Listesi */}
            <div className="announcements-list">
                <h3>Mevcut Duyurular ({announcements.length})</h3>

                {loading ? (
                    <div className="loading-placeholder">Yükleniyor...</div>
                ) : announcements.length === 0 ? (
                    <div className="empty-placeholder">
                        <span className="empty-icon">📭</span>
                        <p>Henüz duyuru bulunmuyor</p>
                    </div>
                ) : (
                    <div className="announcement-cards">
                        {announcements.map(ann => (
                            <div key={ann.id} className="announcement-card">
                                <div className="card-header">
                                    <h4>{ann.title}</h4>
                                    {getPriorityBadge(ann.priority)}
                                </div>
                                <p className="card-content">{ann.content}</p>
                                <div className="card-footer">
                                    <div className="meta-info">
                                        <span className="author">👤 {ann.author?.full_name || 'Sistem'}</span>
                                        <span className="date">📅 {formatDate(ann.created_at)}</span>
                                        {ann.expiry_date && (
                                            <span className="expiry">⏰ Son: {formatDate(ann.expiry_date)}</span>
                                        )}
                                    </div>
                                    {(user?.role === 'admin' || ann.created_by === user?.id) && (
                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDelete(ann.id)}
                                            title="Sil"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnnouncementManagementPage;
