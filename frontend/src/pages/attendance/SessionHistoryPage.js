import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import '../../styles/attendance.css';

const SessionHistoryPage = () => {
    const [sections, setSections] = useState([]);
    const [selectedSection, setSelectedSection] = useState('');
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSections();
    }, []);

    const fetchSections = async () => {
        try {
            const response = await api.get('/attendance/sections/my');
            setSections(response.data);
        } catch (err) {
            console.error('Sections fetch error:', err);
        }
    };

    const fetchHistory = async (sectionId) => {
        setLoading(true);
        try {
            const response = await api.get(`/attendance/sections/${sectionId}/history`);
            setHistory(response.data);
        } catch (err) {
            console.error('History fetch error:', err);
        }
        setLoading(false);
    };

    const handleSectionChange = (e) => {
        const sectionId = e.target.value;
        setSelectedSection(sectionId);
        if (sectionId) {
            fetchHistory(sectionId);
        } else {
            setHistory(null);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Tarih Yok';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Geçersiz Tarih';
        return date.toLocaleDateString('tr-TR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        return status === 'ACTIVE'
            ? { text: 'Aktif', class: 'safe', icon: '🟢' }
            : { text: 'Tamamlandı', class: 'completed', icon: '✅' };
    };

    const getRateColor = (rate) => {
        if (rate >= 80) return { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' };
        if (rate >= 60) return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
        return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
    };

    return (
        <div className="attendance-page">
            {/* Page Title */}
            <div className="page-title">
                <span className="icon">📋</span>
                <h1>Oturum Geçmişi</h1>
            </div>

            {/* Section Selector */}
            <div className="course-attendance-card" style={{ marginBottom: '2rem' }}>
                <label style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem', display: 'block' }}>
                    Ders Section Seçin
                </label>
                <select
                    value={selectedSection}
                    onChange={handleSectionChange}
                    style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        fontSize: '1rem',
                        borderRadius: '12px',
                        border: '2px solid #eef2f7',
                        background: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <option value="">-- Section Seçin --</option>
                    {sections.map(section => (
                        <option key={section.id} value={section.id}>
                            {section.course?.code} - {section.course?.name} (Section {section.section_number})
                        </option>
                    ))}
                </select>
            </div>

            {/* Loading */}
            {loading && (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Yükleniyor...</p>
                </div>
            )}

            {/* History */}
            {history && !loading && (
                <>
                    {/* Section Info */}
                    <div className="custom-alert info" style={{ marginBottom: '1.5rem' }}>
                        <span>📚</span>
                        <strong>{history.section?.course_code}</strong> - {history.section?.course_name}
                    </div>

                    {/* Sessions */}
                    {history.sessions?.length === 0 ? (
                        <div className="custom-alert warning">
                            <span>ℹ️</span> Bu section için henüz yoklama oturumu bulunmuyor.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {history.sessions?.map((session, index) => {
                                const statusInfo = getStatusBadge(session.status);
                                const rate = session.attendance_rate || 0;
                                const rateStyle = getRateColor(rate);

                                return (
                                    <div
                                        className="course-attendance-card"
                                        key={session.id}
                                        style={{
                                            animationDelay: `${index * 0.05}s`,
                                            borderLeft: `4px solid ${rateStyle.color}`,
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            {/* Left Side - Date & Status */}
                                            <div>
                                                <div style={{
                                                    fontSize: '1.1rem',
                                                    fontWeight: 600,
                                                    color: '#1f2937',
                                                    marginBottom: '0.5rem'
                                                }}>
                                                    📅 {formatDate(session.date)}
                                                </div>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.75rem',
                                                    flexWrap: 'wrap'
                                                }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '20px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 500,
                                                        background: statusInfo.class === 'safe' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                                        color: statusInfo.class === 'safe' ? '#16a34a' : '#2563eb'
                                                    }}>
                                                        {statusInfo.icon} {statusInfo.text}
                                                    </span>
                                                    {session.end_time && (
                                                        <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                                            🕐 {formatTime(session.date)} - {formatTime(session.end_time)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right Side - Rate */}
                                            <div style={{
                                                textAlign: 'center',
                                                padding: '0.75rem 1.25rem',
                                                borderRadius: '12px',
                                                background: rateStyle.bg
                                            }}>
                                                <div style={{
                                                    fontSize: '2rem',
                                                    fontWeight: 700,
                                                    color: rateStyle.color,
                                                    lineHeight: 1
                                                }}>
                                                    %{rate}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.8rem',
                                                    color: '#6b7280',
                                                    marginTop: '0.25rem'
                                                }}>
                                                    {session.present_count}/{session.total_students} öğrenci
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div style={{
                                            height: '8px',
                                            background: '#e5e7eb',
                                            borderRadius: '4px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${rate}%`,
                                                height: '100%',
                                                background: `linear-gradient(90deg, ${rateStyle.color}, ${rateStyle.color}dd)`,
                                                borderRadius: '4px',
                                                transition: 'width 0.5s ease'
                                            }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* Empty State */}
            {!selectedSection && !loading && (
                <div className="custom-alert info">
                    <span>👆</span> Yoklama geçmişini görmek için yukarıdan bir section seçin.
                </div>
            )}
        </div>
    );
};

export default SessionHistoryPage;

