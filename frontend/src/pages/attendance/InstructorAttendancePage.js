import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import '../../styles/attendance.css';

const InstructorAttendancePage = () => {
    const [sections, setSections] = useState([]);
    const [selectedSection, setSelectedSection] = useState('');
    const [duration, setDuration] = useState(60);
    const [radius, setRadius] = useState(15);
    const [activeSession, setActiveSession] = useState(null);
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [report, setReport] = useState([]);
    const [sessionInfo, setSessionInfo] = useState(null);
    const [locationStatus, setLocationStatus] = useState({ text: 'Konum Bekleniyor', class: '' });

    useEffect(() => {
        // Fetch sections from API
        const fetchSections = async () => {
            try {
                const response = await api.get('/attendance/sections/my');
                setSections(response.data);
            } catch (error) {
                console.error('Error fetching sections', error);
            }
        };
        fetchSections();

        const fetchActiveSession = async () => {
            try {
                const response = await api.get('/attendance/sessions/active');
                if (response.data.active) {
                    setActiveSession({
                        session_id: response.data.session_id,
                        qr_code: response.data.qr_code,
                        expires_at: response.data.expires_at
                    });
                    setSelectedSection(response.data.section_id);
                }
            } catch (error) {
                console.log('No active session found');
            }
        };
        fetchActiveSession();
    }, []);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            Swal.fire('Hata', 'GPS desteklenmiyor', 'error');
            return;
        }
        setLocationStatus({ text: 'Konum aranıyor...', class: 'warning' });

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLatitude(pos.coords.latitude);
                setLongitude(pos.coords.longitude);
                setLocationStatus({ text: 'Konum Alındı ✅', class: 'success' });
                Swal.fire({
                    title: 'Konum Başarılı',
                    text: `Enlem: ${pos.coords.latitude.toFixed(4)}, Boylam: ${pos.coords.longitude.toFixed(4)}`,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            },
            (err) => {
                setLocationStatus({ text: 'Konum Hatası ❌', class: 'danger' });
                alert('Konum hatası: ' + err.message);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleStartSession = async () => {
        try {
            const response = await api.post('/attendance/sessions', {
                section_id: selectedSection,
                duration_minutes: duration,
                radius: radius,
                latitude: latitude,
                longitude: longitude
            });

            setActiveSession(response.data);
            Swal.fire('Başarılı', 'Yoklama oturumu başlatıldı!', 'success');

            // Auto fetch report
            handleFetchReport(response.data.session_id);
        } catch (error) {
            Swal.fire('Hata', error.response?.data?.message || 'Oturum başlatılamadı', 'error');
        }
    };

    const handleFetchReport = async (sessionId = activeSession?.session_id) => {
        if (!sessionId) return;
        try {
            const response = await api.get(`/attendance/sessions/${sessionId}/report`);
            setReport(response.data.report);
            setSessionInfo(response.data.session);
        } catch (error) {
            console.error('Report fetch error:', error);
        }
    };

    const handleEndSession = async () => {
        if (!activeSession) return;
        const result = await Swal.fire({
            title: 'Oturumu Bitir?',
            text: 'Gelmeyenler devamsız olarak işaretlenecek!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Evet, Bitir',
            cancelButtonText: 'İptal',
            confirmButtonColor: '#ef4444'
        });

        if (result.isConfirmed) {
            try {
                const response = await api.post(`/attendance/sessions/${activeSession.session_id}/end`, {});
                Swal.fire('Tamamlandı', `Oturum bitirildi. ${response.data.absent_count} kişi devamsız işaretlendi.`, 'success');
                setActiveSession(null);
                setReport([]);
                setSessionInfo(null);
            } catch (error) {
                Swal.fire('Hata', error.response?.data?.message || 'Oturum bitirilemedi', 'error');
            }
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PRESENT': return { text: 'Geldi', class: 'success' };
            case 'ABSENT': return { text: 'Gelmedi', class: 'danger' };
            case 'NOT_CHECKED_IN': return { text: 'Henüz Katılmadı', class: 'warning' };
            default: return { text: status, class: '' };
        }
    };

    return (
        <div className="attendance-page">
            <div className="page-title">
                <span className="icon">🎓</span>
                <h1>Yoklama Yönetimi</h1>
            </div>

            <div className="attendance-stats-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                {/* Sol: Oturum Başlatma Kartı */}
                <div className="course-attendance-card">
                    <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                        Yeni Yoklama Oturumu
                    </h3>

                    <button
                        className={`action-button ${locationStatus.class === 'success' ? 'success' : ''}`}
                        onClick={handleGetLocation}
                        style={{ width: '100%', marginBottom: '1.5rem', justifyContent: 'center' }}
                    >
                        <span>📍</span> {latitude ? 'Konum Güncelle' : 'SINIF KONUMUMU AL'}
                    </button>

                    {latitude && (
                        <div className="custom-alert success" style={{ marginBottom: '1.5rem' }}>
                            <span>✅</span> Konum Alındı (Enlem: {latitude.toFixed(4)})
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label className="stat-label">Ders Section</label>
                            <select
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.75rem', borderRadius: '8px',
                                    border: '1px solid #ccc', marginTop: '0.25rem'
                                }}
                            >
                                <option value="">Section seçin</option>
                                {sections.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="stat-label">Süre (Dk)</label>
                                <input
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
                                />
                            </div>
                            <div>
                                <label className="stat-label">Yarıçap (m)</label>
                                <input
                                    type="number"
                                    value={radius}
                                    onChange={(e) => setRadius(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
                                />
                            </div>
                        </div>

                        <button
                            className="action-button"
                            onClick={handleStartSession}
                            disabled={!selectedSection || !latitude}
                            style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
                        >
                            OTURUMU BAŞLAT
                        </button>
                    </div>
                </div>

                {/* Sağ: Aktif Oturum Kartı */}
                {activeSession ? (
                    <div className="qr-container" style={{ border: '2px solid #22c55e' }}>
                        <h3 style={{ color: '#166534' }}>Oturum Aktif</h3>
                        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Öğrenciler bu kodu tarayarak katılabilir</p>

                        <div style={{ background: 'white', padding: '1rem', display: 'inline-block', borderRadius: '12px', border: '1px solid #eee' }}>
                            <QRCodeSVG value={activeSession.qr_code} size={180} />
                        </div>

                        <div className="custom-alert info" style={{ marginTop: '1.5rem', justifyContent: 'center' }}>
                            Kod: <strong>{activeSession.qr_code}</strong>
                        </div>

                        <div style={{ marginTop: '1rem', color: '#ef4444', fontWeight: 600 }}>
                            Bitiş: {new Date(activeSession.expires_at).toLocaleTimeString('tr-TR')}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button className="action-button" style={{ flex: 1, background: '#fff', color: '#333', border: '1px solid #ccc' }} onClick={() => handleFetchReport()}>
                                RAPORU GÖSTER
                            </button>
                            <button className="action-button" style={{ flex: 1, background: '#ef4444' }} onClick={handleEndSession}>
                                OTURUMU BİTİR
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="course-attendance-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#9ca3af' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💤</div>
                        <p>Henüz aktif bir oturum yok.</p>
                    </div>
                )}
            </div>

            {/* Rapor Tablosu */}
            {report.length > 0 && (
                <div className="course-attendance-card" style={{ marginTop: '2rem' }}>
                    {/* Report Header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '1.5rem',
                        flexWrap: 'wrap',
                        gap: '1rem'
                    }}>
                        <div>
                            <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.25rem' }}>
                                📋 Yoklama Raporu
                            </h3>
                            <p style={{ margin: '0.5rem 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
                                {sessionInfo?.course_code} - {sessionInfo?.course_name}
                            </p>
                        </div>
                        <button
                            onClick={() => handleFetchReport()}
                            style={{
                                padding: '0.5rem 1rem',
                                background: 'rgba(59, 130, 246, 0.1)',
                                color: '#3b82f6',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            🔄 Yenile
                        </button>
                    </div>

                    {/* Stats Summary */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '1rem',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                            borderRadius: '12px',
                            padding: '1rem',
                            color: 'white',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                                {report.filter(r => r.status === 'PRESENT').length}
                            </div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>✅ Katıldı</div>
                        </div>
                        <div style={{
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            borderRadius: '12px',
                            padding: '1rem',
                            color: 'white',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                                {report.filter(r => r.status === 'NOT_CHECKED_IN').length}
                            </div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>⏳ Bekleniyor</div>
                        </div>
                        <div style={{
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                            borderRadius: '12px',
                            padding: '1rem',
                            color: 'white',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                                {report.filter(r => r.status === 'ABSENT').length}
                            </div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>❌ Gelmedi</div>
                        </div>
                        <div style={{
                            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                            borderRadius: '12px',
                            padding: '1rem',
                            color: 'white',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                                {report.length > 0
                                    ? Math.round((report.filter(r => r.status === 'PRESENT').length / report.length) * 100)
                                    : 0}%
                            </div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>📊 Katılım</div>
                        </div>
                    </div>

                    {/* Enhanced Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'separate',
                            borderSpacing: '0'
                        }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Öğrenci</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Durum</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Giriş Saati</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Mesafe</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Devamsızlık</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.map((r, index) => {
                                    const getStatusStyle = (status) => {
                                        switch (status) {
                                            case 'PRESENT': return { icon: '✅', text: 'Katıldı', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' };
                                            case 'ABSENT': return { icon: '❌', text: 'Gelmedi', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
                                            case 'NOT_CHECKED_IN': return { icon: '⏳', text: 'Bekleniyor', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
                                            default: return { icon: '❓', text: status, color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)' };
                                        }
                                    };
                                    const statusStyle = getStatusStyle(r.status);

                                    return (
                                        <tr
                                            key={r.student_id}
                                            style={{
                                                background: index % 2 === 0 ? 'white' : '#f9fafb',
                                                transition: 'background 0.2s'
                                            }}
                                        >
                                            <td style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                                                <div style={{ fontWeight: 600, color: '#1f2937' }}>{r.student_name}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{r.student_email}</div>
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
                                                    background: statusStyle.bg,
                                                    color: statusStyle.color
                                                }}>
                                                    {statusStyle.icon} {statusStyle.text}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                                                {r.check_in_time ? (
                                                    <span style={{
                                                        fontWeight: 600,
                                                        color: '#1f2937',
                                                        background: 'rgba(59, 130, 246, 0.1)',
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '6px'
                                                    }}>
                                                        🕐 {new Date(r.check_in_time).toLocaleTimeString('tr-TR')}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#9ca3af' }}>-</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                                                {r.distance ? (
                                                    <span style={{
                                                        fontWeight: 600,
                                                        color: r.distance <= 15 ? '#22c55e' : r.distance <= 30 ? '#f59e0b' : '#ef4444'
                                                    }}>
                                                        {r.distance.toFixed(1)}m
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#9ca3af' }}>-</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                                                <span style={{
                                                    fontWeight: 600,
                                                    color: r.absence_hours_used >= r.absence_limit ? '#ef4444' : '#374151'
                                                }}>
                                                    {r.absence_hours_used} / {r.absence_limit}
                                                </span>
                                                <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}> saat</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstructorAttendancePage;
