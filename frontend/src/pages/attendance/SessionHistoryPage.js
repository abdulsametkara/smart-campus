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
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        return status === 'ACTIVE'
            ? { text: '🟢 Aktif', class: 'safe' }
            : { text: '⚫ Bitti', class: 'warning' };
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
                                const rate = session.attendance_rate;
                                const rateClass = rate >= 70 ? 'success' : rate >= 50 ? 'warning' : 'danger';

                                return (
                                    <div
                                        className="course-attendance-card"
                                        key={session.id}
                                        style={{ animationDelay: `${index * 0.05}s` }}
                                    >
                                        <div className="course-header">
                                            <div>
                                                <div className="course-code">{formatDate(session.start_time)}</div>
                                                <span className={`status-badge ${statusInfo.class}`} style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                                                    {statusInfo.text}
                                                </span>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '2rem', fontWeight: 700, color: rateClass === 'success' ? '#22c55e' : rateClass === 'warning' ? '#f59e0b' : '#ef4444' }}>
                                                    %{rate}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                                    {session.present_count}/{session.total_students} öğrenci
                                                </div>
                                            </div>
                                        </div>
                                        <div className="custom-progress">
                                            <div
                                                className={`progress-fill ${rateClass}`}
                                                style={{ width: `${rate}%` }}
                                            ></div>
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
