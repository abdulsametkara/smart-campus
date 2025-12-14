import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/attendance.css';

const AttendanceHistoryPage = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.get('http://localhost:5000/api/v1/attendance/my-history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory(response.data);
            setLoading(false);
        } catch (err) {
            setError('Geçmiş yüklenemedi');
            setLoading(false);
        }
    };

    const getStatusChip = (status) => {
        const statusMap = {
            'PRESENT': { text: '✅ Katıldı', class: 'present' },
            'ABSENT': { text: '❌ Gelmedi', class: 'absent' },
            'EXCUSED': { text: '📝 Mazeretli', class: 'excused' }
        };
        return statusMap[status] || { text: status, class: '' };
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="attendance-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Yükleniyor...</p>
                </div>
            </div>
        );
    }

    // Calculate summary
    const summary = {
        total: history.length,
        present: history.filter(h => h.status === 'PRESENT').length,
        absent: history.filter(h => h.status === 'ABSENT').length,
        excused: history.filter(h => h.status === 'EXCUSED').length
    };

    return (
        <div className="attendance-page">
            {/* Page Title */}
            <div className="page-title">
                <span className="icon">📅</span>
                <h1>Yoklama Geçmişim</h1>
            </div>

            {error && (
                <div className="custom-alert danger">
                    <span>⚠️</span> {error}
                </div>
            )}

            {/* Summary Cards */}
            <div className="attendance-stats-grid">
                <div className="attendance-stat-card primary">
                    <div className="card-header">
                        <div className="card-icon">📊</div>
                    </div>
                    <div className="card-title">Toplam Oturum</div>
                    <div className="card-value">{summary.total}</div>
                </div>
                <div className="attendance-stat-card success">
                    <div className="card-header">
                        <div className="card-icon">✅</div>
                    </div>
                    <div className="card-title">Katılım</div>
                    <div className="card-value">{summary.present}</div>
                </div>
                <div className="attendance-stat-card danger">
                    <div className="card-header">
                        <div className="card-icon">❌</div>
                    </div>
                    <div className="card-title">Devamsız</div>
                    <div className="card-value">{summary.absent}</div>
                </div>
                <div className="attendance-stat-card primary">
                    <div className="card-header">
                        <div className="card-icon">📝</div>
                    </div>
                    <div className="card-title">Mazeretli</div>
                    <div className="card-value">{summary.excused}</div>
                </div>
            </div>

            {/* History Table */}
            {history.length === 0 ? (
                <div className="custom-alert info">
                    <span>ℹ️</span> Henüz yoklama kaydınız bulunmuyor.
                </div>
            ) : (
                <table className="attendance-table">
                    <thead>
                        <tr>
                            <th>Ders</th>
                            <th>Tarih</th>
                            <th>Saat</th>
                            <th>Durum</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((record, index) => {
                            const statusInfo = getStatusChip(record.status);
                            return (
                                <tr key={record.id || index}>
                                    <td>
                                        <strong>{record.course_code}</strong>
                                        <br />
                                        <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                            {record.course_name}
                                        </span>
                                    </td>
                                    <td>{formatDate(record.date || record.check_in_time)}</td>
                                    <td>{record.check_in_time ? formatTime(record.check_in_time) : '-'}</td>
                                    <td>
                                        <span className={`status-chip ${statusInfo.class}`}>
                                            {statusInfo.text}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default AttendanceHistoryPage;
