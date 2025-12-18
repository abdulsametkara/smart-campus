import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import '../../styles/attendance.css';

const AttendanceReportPage = () => {
    const [sections, setSections] = useState([]);
    const [selectedSection, setSelectedSection] = useState('');
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSections();
    }, []);

    const fetchSections = async () => {
        try {
            const response = await api.get('/attendance/sections/my');
            setSections(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchReport = async (sectionId) => {
        setLoading(true);
        try {
            const response = await api.get(`/attendance/sections/${sectionId}/summary`);
            setReport(response.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleSectionChange = (e) => {
        const sectionId = e.target.value;
        setSelectedSection(sectionId);
        if (sectionId) {
            fetchReport(sectionId);
        } else {
            setReport(null);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'OK': return { text: 'İyi', icon: '✅', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' };
            case 'WARNING': return { text: 'Dikkat', icon: '⚠️', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
            case 'CRITICAL': return { text: 'Kritik', icon: '🔴', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
            default: return { text: status, icon: '❓', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)' };
        }
    };

    const getPercentColor = (percent) => {
        if (percent >= 80) return '#22c55e';
        if (percent >= 60) return '#f59e0b';
        return '#ef4444';
    };

    // Calculate statistics
    const getStats = () => {
        if (!report || !report.students) return { ok: 0, warning: 0, critical: 0, avgPercent: 0 };
        const ok = report.students.filter(s => s.status === 'OK').length;
        const warning = report.students.filter(s => s.status === 'WARNING').length;
        const critical = report.students.filter(s => s.status === 'CRITICAL').length;
        const avgPercent = report.students.length > 0
            ? Math.round(report.students.reduce((sum, s) => sum + s.percent, 0) / report.students.length)
            : 0;
        return { ok, warning, critical, avgPercent };
    };

    const stats = getStats();

    return (
        <div className="attendance-page">
            <div className="page-title">
                <span className="icon">📊</span>
                <h1>Dönemlik Yoklama Raporu</h1>
            </div>

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
                    <option value="">-- Seçiniz --</option>
                    {sections.map(s => (
                        <option key={s.id} value={s.id}>{s.course_code || s.course?.code} - {s.course_name || s.course?.name} (Section {s.section_number})</option>
                    ))}
                </select>
            </div>

            {loading && (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Yükleniyor...</p>
                </div>
            )}

            {report && !loading && (
                <>
                    {/* Stats Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '1rem',
                        marginBottom: '2rem'
                    }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                            borderRadius: '16px',
                            padding: '1.25rem',
                            color: 'white',
                            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                        }}>
                            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>📚 Ders</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{report.section.course_code}</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.25rem' }}>{report.section.course_name}</div>
                        </div>

                        <div style={{
                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                            borderRadius: '16px',
                            padding: '1.25rem',
                            color: 'white',
                            boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)'
                        }}>
                            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>👨‍🎓 Öğrenci</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{report.students.length}</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Kayıtlı</div>
                        </div>

                        <div style={{
                            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                            borderRadius: '16px',
                            padding: '1.25rem',
                            color: 'white',
                            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
                        }}>
                            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>⏱️ Oturum</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{report.total_sessions}</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Tamamlandı</div>
                        </div>

                        <div style={{
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            borderRadius: '16px',
                            padding: '1.25rem',
                            color: 'white',
                            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
                        }}>
                            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>📈 Ortalama</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700 }}>%{stats.avgPercent}</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Katılım</div>
                        </div>
                    </div>

                    {/* Status Summary */}
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        marginBottom: '1.5rem',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: 'rgba(34, 197, 94, 0.1)',
                            borderRadius: '20px',
                            fontSize: '0.9rem'
                        }}>
                            <span>✅</span>
                            <span style={{ fontWeight: 600, color: '#22c55e' }}>{stats.ok}</span>
                            <span style={{ color: '#6b7280' }}>İyi</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: 'rgba(245, 158, 11, 0.1)',
                            borderRadius: '20px',
                            fontSize: '0.9rem'
                        }}>
                            <span>⚠️</span>
                            <span style={{ fontWeight: 600, color: '#f59e0b' }}>{stats.warning}</span>
                            <span style={{ color: '#6b7280' }}>Dikkat</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '20px',
                            fontSize: '0.9rem'
                        }}>
                            <span>🔴</span>
                            <span style={{ fontWeight: 600, color: '#ef4444' }}>{stats.critical}</span>
                            <span style={{ color: '#6b7280' }}>Kritik</span>
                        </div>
                    </div>

                    {/* Students Table */}
                    <div className="course-attendance-card" style={{ overflow: 'hidden' }}>
                        <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>📋 Öğrenci Listesi</h3>

                        {report.students.length === 0 ? (
                            <div className="custom-alert warning">
                                <span>ℹ️</span> Bu derse kayıtlı öğrenci bulunmuyor.
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'separate',
                                    borderSpacing: '0'
                                }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc' }}>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Öğrenci</th>
                                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Katılım</th>
                                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Devamsızlık</th>
                                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Durum</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.students.map((student, index) => {
                                            const statusInfo = getStatusBadge(student.status);
                                            const percentColor = getPercentColor(student.percent);

                                            return (
                                                <tr
                                                    key={student.student_id}
                                                    style={{
                                                        background: index % 2 === 0 ? 'white' : '#f9fafb',
                                                        transition: 'background 0.2s'
                                                    }}
                                                >
                                                    <td style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                                                        <div style={{ fontWeight: 600, color: '#1f2937' }}>{student.student_name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{student.student_email}</div>
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                                                            <span style={{
                                                                fontWeight: 700,
                                                                fontSize: '1.1rem',
                                                                color: percentColor
                                                            }}>
                                                                %{student.percent}
                                                            </span>
                                                            <div style={{
                                                                width: '60px',
                                                                height: '6px',
                                                                background: '#e5e7eb',
                                                                borderRadius: '3px',
                                                                overflow: 'hidden'
                                                            }}>
                                                                <div style={{
                                                                    width: `${student.percent}%`,
                                                                    height: '100%',
                                                                    background: percentColor,
                                                                    borderRadius: '3px'
                                                                }}></div>
                                                            </div>
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                                                            {student.attended}/{student.total} oturum
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                                                        <span style={{
                                                            fontWeight: 600,
                                                            color: student.absence_hours_used >= student.absence_limit ? '#ef4444' : '#374151'
                                                        }}>
                                                            {student.absence_hours_used} / {student.absence_limit}
                                                        </span>
                                                        <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}> saat</span>
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.35rem',
                                                            padding: '0.35rem 0.75rem',
                                                            borderRadius: '20px',
                                                            fontSize: '0.85rem',
                                                            fontWeight: 500,
                                                            background: statusInfo.bg,
                                                            color: statusInfo.color
                                                        }}>
                                                            {statusInfo.icon} {statusInfo.text}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {!report && !loading && !selectedSection && (
                <div className="custom-alert info">
                    <span>👆</span> Raporu görüntülemek için yukarıdan bir ders seçin.
                </div>
            )}

            {!report && !loading && selectedSection && (
                <div className="custom-alert warning">
                    <span>⚠️</span> Bu şube için rapor bulunamadı veya henüz yoklama alınmamış.
                </div>
            )}
        </div>
    );
};

export default AttendanceReportPage;

