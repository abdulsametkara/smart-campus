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
                            Kod: <strong>{activeSession.qr_code.substring(0, 8)}...</strong>
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
                    <h3 style={{ marginBottom: '1rem' }}>
                        Yoklama Raporu - {sessionInfo?.course_code} {sessionInfo?.course_name}
                    </h3>
                    <table className="attendance-table">
                        <thead>
                            <tr>
                                <th>Öğrenci</th>
                                <th>E-posta</th>
                                <th>Durum</th>
                                <th>Giriş Saati</th>
                                <th>Mesafe (m)</th>
                                <th>Devamsızlık</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.map(r => {
                                const status = getStatusBadge(r.status);
                                return (
                                    <tr key={r.student_id}>
                                        <td>{r.student_name}</td>
                                        <td>{r.student_email}</td>
                                        <td>
                                            <span className={`status-badge ${status.class}`}>{status.text}</span>
                                        </td>
                                        <td>{r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString('tr-TR') : '-'}</td>
                                        <td>{r.distance ? r.distance.toFixed(1) : '-'}</td>
                                        <td>{r.absence_hours_used} / {r.absence_limit} saat</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default InstructorAttendancePage;
