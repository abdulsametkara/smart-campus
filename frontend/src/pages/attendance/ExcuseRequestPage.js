import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import '../../styles/attendance.css';

const ExcuseRequestPage = () => {
    const [absentSessions, setAbsentSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState('');
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [myExcuses, setMyExcuses] = useState([]);
    const [loading, setLoading] = useState(true);

    const getToken = () => localStorage.getItem('accessToken');

    useEffect(() => {
        fetchAbsentSessions();
        fetchMyExcuses();
    }, []);

    const fetchAbsentSessions = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/v1/attendance/my-absences', {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            setAbsentSessions(response.data);
        } catch (error) {
            console.error('Devamsızlıklar yüklenemedi:', error);
        }
    };

    const fetchMyExcuses = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/v1/excuses/my', {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            setMyExcuses(response.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) {
                Swal.fire('Hata', 'Dosya boyutu 5MB\'dan büyük olamaz', 'error');
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedSession || !reason) {
            Swal.fire('Hata', 'Lütfen devamsız olduğunuz tarihi ve mazeret türünü seçin', 'error');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('session_id', selectedSession);
            formData.append('reason', reason);
            formData.append('description', description);
            if (file) {
                formData.append('document', file);
            }

            await axios.post('http://localhost:5000/api/v1/excuses', formData, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            Swal.fire('Başarılı', 'Mazeret talebiniz gönderildi', 'success');
            setSelectedSession('');
            setReason('');
            setDescription('');
            setFile(null);
            fetchAbsentSessions();
            fetchMyExcuses();
        } catch (error) {
            Swal.fire('Hata', error.response?.data?.message || 'Talep gönderilemedi', 'error');
        } finally {
            setUploading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING': return { text: '⏳ Beklemede', class: 'warning' };
            case 'APPROVED': return { text: '✅ Onaylandı', class: 'success' };
            case 'REJECTED': return { text: '❌ Reddedildi', class: 'danger' };
            default: return { text: status, class: '' };
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="attendance-page">
            <div className="page-title">
                <span className="icon">📝</span>
                <h1>Mazeret Dilekçesi</h1>
            </div>

            <div className="attendance-stats-grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>

                {/* Sol: Yeni Mazeret Formu */}
                <div className="course-attendance-card">
                    <div className="card-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0 }}>Yeni Mazeret Gönder</h3>
                    </div>

                    {absentSessions.length === 0 ? (
                        <div className="custom-alert success">
                            <span>🎉</span> Tebrikler! Devamsızlığınız bulunmuyor.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            <div>
                                <label className="stat-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                    1. Devamsızlık Seçin
                                </label>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '12px', padding: '0.5rem' }}>
                                    {absentSessions.map(session => (
                                        <label
                                            key={session.id}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '1rem',
                                                padding: '1rem', borderBottom: '1px solid #f9f9f9', cursor: 'pointer',
                                                background: selectedSession === String(session.id) ? '#f0fdf4' : 'transparent',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name="session"
                                                value={session.id}
                                                checked={selectedSession === String(session.id)}
                                                onChange={(e) => setSelectedSession(e.target.value)}
                                                style={{ width: '20px', height: '20px' }}
                                            />
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{session.course_code} - {session.course_name}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>📅 {formatDate(session.date)}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="stat-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                    2. Mazeret Türü
                                </label>
                                <select
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
                                >
                                    <option value="">Seçiniz</option>
                                    <option value="Hastalık">Hastalık (Raporlu)</option>
                                    <option value="Ailevi">Ailevi Nedenler</option>
                                    <option value="Resmi">Resmi İzin / Görev</option>
                                    <option value="Diğer">Diğer</option>
                                </select>
                            </div>

                            <div>
                                <label className="stat-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                    3. Açıklama
                                </label>
                                <textarea
                                    rows="3"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Lütfen durumunuzu açıklayın..."
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', resize: 'vertical' }}
                                />
                            </div>

                            <div style={{ padding: '1rem', border: '2px dashed #ccc', borderRadius: '12px', textAlign: 'center' }}>
                                <label style={{ cursor: 'pointer', color: '#3b82f6', fontWeight: 600 }}>
                                    📎 Belge Yükle (Opsiyonel)
                                    <input type="file" onChange={handleFileChange} style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png,.gif" />
                                </label>
                                {file && <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>✅ {file.name}</div>}
                            </div>

                            <button
                                type="submit"
                                className="action-button"
                                disabled={uploading || !selectedSession || !reason}
                                style={{ justifyContent: 'center' }}
                            >
                                {uploading ? 'Gönderiliyor...' : 'GÖNDER'}
                            </button>
                        </form>
                    )}
                </div>

                {/* Sağ: Mazeret Geçmişi */}
                <div className="course-attendance-card">
                    <div className="card-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0 }}>Mazeretlerim</h3>
                    </div>

                    {loading ? (
                        <div className="loading-container"><div className="spinner"></div></div>
                    ) : myExcuses.length === 0 ? (
                        <div className="custom-alert info">
                            <span>ℹ️</span> Gönderilmiş mazeret talebiniz yok.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {myExcuses.map(excuse => {
                                const status = getStatusBadge(excuse.status);
                                return (
                                    <div key={excuse.id} style={{ padding: '1rem', border: '1px solid #eef2f7', borderRadius: '12px', background: '#f8f9fa' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontWeight: 600 }}>{excuse.session?.section?.course?.code}</span>
                                            <span className={`status-badge ${status.class}`}>{status.text}</span>
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                                            {formatDate(excuse.session?.start_time)}
                                        </div>
                                        <div style={{ fontSize: '0.95rem' }}>
                                            <strong>{excuse.title}</strong>: {excuse.description}
                                        </div>
                                        {excuse.rejection_reason && (
                                            <div className="custom-alert danger" style={{ marginTop: '0.5rem', padding: '0.5rem' }}>
                                                Red Sebebi: {excuse.rejection_reason}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExcuseRequestPage;
