import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import '../../styles/attendance.css';

const ExcuseManagementPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rejectDialog, setRejectDialog] = useState(false);
    const [selectedExcuse, setSelectedExcuse] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        fetchPendingExcuses();
    }, []);

    const fetchPendingExcuses = async () => {
        try {
            const response = await api.get('/excuses/pending');
            setRequests(response.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleApprove = async (excuseId) => {
        try {
            await api.put(`/excuses/${excuseId}/approve`, {});
            Swal.fire('Onaylandı', 'Mazeret onaylandı ve devamsızlık iade edildi', 'success');
            fetchPendingExcuses();
        } catch (error) {
            Swal.fire('Hata', error.response?.data?.message || 'İşlem başarısız', 'error');
        }
    };

    const handleRejectClick = (excuse) => {
        setSelectedExcuse(excuse);
        setRejectReason('');
        setRejectDialog(true);
    };

    const handleRejectConfirm = async () => {
        try {
            await api.put(`/excuses/${selectedExcuse.id}/reject`, {
                rejection_reason: rejectReason
            });
            Swal.fire('Reddedildi', 'Mazeret talebi reddedildi', 'info');
            setRejectDialog(false);
            fetchPendingExcuses();
        } catch (error) {
            Swal.fire('Hata', error.response?.data?.message || 'İşlem başarısız', 'error');
        }
    };

    return (
        <div className="attendance-page">
            <div className="page-title">
                <span className="icon">⚖️</span>
                <h1>Mazeret Yönetimi</h1>
            </div>

            {loading && (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Yükleniyor...</p>
                </div>
            )}

            {!loading && requests.length === 0 ? (
                <div className="custom-alert info">
                    <span>🎉</span> Bekleyen mazeret talebi bulunmuyor.
                </div>
            ) : (
                <div className="course-attendance-card">
                    <table className="attendance-table">
                        <thead>
                            <tr>
                                <th>Öğrenci</th>
                                <th>Ders</th>
                                <th>Mazeret</th>
                                <th>Tarih</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(req => (
                                <tr key={req.id}>
                                    <td>
                                        <strong>{req.student?.full_name}</strong>
                                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                            {req.student?.email}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="status-badge safe" style={{ display: 'inline-block', marginBottom: '0.25rem' }}>
                                            {req.session?.section?.course?.code}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                            {req.session?.section?.course?.name}
                                        </div>
                                    </td>
                                    <td>
                                        <strong>{req.title}</strong>
                                        <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#4b5563' }}>
                                            {req.description}
                                        </p>
                                        {req.document_url && (
                                            <a
                                                href={`${process.env.REACT_APP_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'}${req.document_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="status-chip excused"
                                                style={{ textDecoration: 'none', marginTop: '0.5rem', display: 'inline-flex' }}
                                            >
                                                📎 Belge Görüntüle
                                            </a>
                                        )}
                                    </td>
                                    <td>
                                        {req.createdAt ? new Date(req.createdAt).toLocaleDateString('tr-TR') : '-'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="action-button success"
                                                onClick={() => handleApprove(req.id)}
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: '#22c55e' }}
                                            >
                                                ✓ Onayla
                                            </button>
                                            <button
                                                className="action-button danger"
                                                onClick={() => handleRejectClick(req)}
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: '#ef4444' }}
                                            >
                                                ✕ Reddet
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Custom Modal for Rejection */}
            {rejectDialog && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{
                        background: 'white', padding: '2rem', borderRadius: '16px',
                        width: '400px', maxWidth: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }}>
                        <h3 style={{ marginBottom: '1rem', color: '#1a1a2e' }}>Mazereti Reddet</h3>
                        <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
                            Lütfen ret sebebini belirtin. Bu mesaj öğrenciye iletilecektir.
                        </p>
                        <textarea
                            autoFocus
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Ret sebebi..."
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '8px',
                                border: '1px solid #ddd', minHeight: '100px', marginBottom: '1.5rem',
                                resize: 'vertical'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setRejectDialog(false)}
                                style={{ padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer' }}
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleRejectConfirm}
                                className="action-button danger"
                                style={{ background: '#ef4444', padding: '0.5rem 1rem' }}
                            >
                                Reddet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExcuseManagementPage;
