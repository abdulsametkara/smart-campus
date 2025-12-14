import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/attendance.css';

const MyAttendancePage = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const response = await axios.get('http://localhost:5000/api/v1/attendance/my-attendance', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(response.data);
                setLoading(false);
            } catch (err) {
                setError('İstatistikler yüklenemedi');
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const getStatusClass = (used, limit) => {
        const remaining = limit - used;
        if (remaining <= 0) return 'danger';
        if (remaining <= limit * 0.25) return 'warning';
        return 'success';
    };

    const getStatusBadge = (used, limit) => {
        const remaining = limit - used;
        if (remaining <= 0) return { text: 'Kritik', class: 'danger' };
        if (remaining <= limit * 0.25) return { text: 'Uyarı', class: 'warning' };
        return { text: 'Güvenli', class: 'safe' };
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

    // Calculate totals
    const totalLimit = stats.reduce((acc, s) => acc + (s.absence_limit || 8), 0);
    const totalUsed = stats.reduce((acc, s) => acc + (s.absence_hours_used || 0), 0);
    const totalRemaining = totalLimit - totalUsed;

    return (
        <div className="attendance-page">
            {/* Page Title */}
            <div className="page-title">
                <span className="icon">📊</span>
                <h1>Devamsızlık Durumum</h1>
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
                        <div className="card-icon">📚</div>
                    </div>
                    <div className="card-title">Toplam Ders</div>
                    <div className="card-value">{stats.length}</div>
                </div>
                <div className="attendance-stat-card success">
                    <div className="card-header">
                        <div className="card-icon">⏱️</div>
                    </div>
                    <div className="card-title">Toplam Hak</div>
                    <div className="card-value">{totalLimit} saat</div>
                </div>
                <div className="attendance-stat-card warning">
                    <div className="card-header">
                        <div className="card-icon">📉</div>
                    </div>
                    <div className="card-title">Kullanılan</div>
                    <div className="card-value">{totalUsed} saat</div>
                </div>
                <div className={`attendance-stat-card ${totalRemaining > 0 ? 'success' : 'danger'}`}>
                    <div className="card-header">
                        <div className="card-icon">✅</div>
                    </div>
                    <div className="card-title">Kalan Hak</div>
                    <div className="card-value">{Math.max(0, totalRemaining)} saat</div>
                </div>
            </div>

            {/* Course Cards */}
            {stats.length === 0 ? (
                <div className="custom-alert info">
                    <span>ℹ️</span> Kayıtlı olduğunuz ders bulunamadı.
                </div>
            ) : (
                stats.map((stat, index) => {
                    const limit = stat.absence_limit || 8;
                    const used = stat.absence_hours_used || 0;
                    const remaining = limit - used;
                    const percent = Math.min((used / limit) * 100, 100);
                    const status = getStatusBadge(used, limit);

                    return (
                        <div
                            className="course-attendance-card"
                            key={stat.section_id}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="course-header">
                                <div>
                                    <div className="course-code">{stat.course_code}</div>
                                    <div className="course-name">{stat.course_name}</div>
                                </div>
                                <span className={`status-badge ${status.class}`}>
                                    {status.text}
                                </span>
                            </div>

                            <div className="stats-row">
                                <div className="stat-item">
                                    <div className="stat-value" style={{ color: '#3b82f6' }}>{limit}</div>
                                    <div className="stat-label">Toplam Hak</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-value" style={{ color: '#ef4444' }}>{used}</div>
                                    <div className="stat-label">Kullanılan</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-value" style={{ color: remaining > 0 ? '#22c55e' : '#ef4444' }}>
                                        {Math.max(0, remaining)}
                                    </div>
                                    <div className="stat-label">Kalan</div>
                                </div>
                            </div>

                            <div className="custom-progress">
                                <div
                                    className={`progress-fill ${getStatusClass(used, limit)}`}
                                    style={{ width: `${percent}%` }}
                                ></div>
                            </div>

                            {remaining <= limit * 0.25 && (
                                <div className={`custom-alert ${remaining <= 0 ? 'danger' : 'warning'}`}>
                                    <span>{remaining <= 0 ? '🚨' : '⚠️'}</span>
                                    {remaining <= 0
                                        ? 'Devamsızlık hakkınız doldu!'
                                        : 'Devamsızlık hakkınız azaldı!'}
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default MyAttendancePage;
