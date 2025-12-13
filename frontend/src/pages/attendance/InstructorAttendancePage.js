import React, { useState, useEffect } from 'react';
import { Container, Typography, Card, CardContent, Button, TextField, Box, Grid, Table, TableBody, TableCell, TableHead, TableRow, Chip, Paper } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import Swal from 'sweetalert2';

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

    useEffect(() => {
        setSections([
            { id: 1, name: 'CENG101 - Şube 1' },
            { id: 2, name: 'CENG101 - Şube 2' }
        ]);

        // Fetch active session on page load
        const fetchActiveSession = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const response = await axios.get('http://localhost:5000/api/v1/attendance/sessions/active', {
                    headers: { Authorization: `Bearer ${token}` }
                });
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

    const getToken = () => localStorage.getItem('accessToken');

    const handleStartSession = async () => {
        try {
            const response = await axios.post('http://localhost:5000/api/v1/attendance/sessions', {
                section_id: selectedSection,
                duration_minutes: duration,
                radius: radius,
                latitude: latitude,
                longitude: longitude
            }, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });

            setActiveSession(response.data);
            Swal.fire('Başarılı', 'Yoklama oturumu başlatıldı!', 'success');
        } catch (error) {
            Swal.fire('Hata', error.response?.data?.message || 'Oturum başlatılamadı', 'error');
        }
    };

    const handleFetchReport = async () => {
        if (!activeSession) return;
        try {
            const response = await axios.get(`http://localhost:5000/api/v1/attendance/sessions/${activeSession.session_id}/report`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            setReport(response.data.report);
            setSessionInfo(response.data.session);
        } catch (error) {
            Swal.fire('Hata', 'Rapor alınamadı: ' + (error.response?.data?.message || error.message), 'error');
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
            cancelButtonText: 'İptal'
        });

        if (result.isConfirmed) {
            try {
                const response = await axios.post(`http://localhost:5000/api/v1/attendance/sessions/${activeSession.session_id}/end`, {}, {
                    headers: { Authorization: `Bearer ${getToken()}` }
                });
                Swal.fire('Tamamlandı', `Oturum bitirildi. ${response.data.absent_count} kişi devamsız işaretlendi (${response.data.hours_deducted} saat).`, 'success');
                setActiveSession(null);
                setReport([]);
            } catch (error) {
                Swal.fire('Hata', error.response?.data?.message || 'Oturum bitirilemedi', 'error');
            }
        }
    };

    const getStatusChip = (status) => {
        switch (status) {
            case 'PRESENT': return <Chip label="Geldi" color="success" size="small" />;
            case 'ABSENT': return <Chip label="Gelmedi" color="error" size="small" />;
            case 'NOT_CHECKED_IN': return <Chip label="Henüz Katılmadı" color="warning" size="small" />;
            default: return <Chip label={status} size="small" />;
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>Yoklama Yönetimi (Öğretmen)</Typography>

            <Grid container spacing={3}>
                {/* Sol: Oturum Başlat */}
                <Grid item xs={12} md={5}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Yeni Yoklama Oturumu</Typography>
                            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        if (!navigator.geolocation) return alert('GPS desteklenmiyor');
                                        navigator.geolocation.getCurrentPosition(
                                            (pos) => {
                                                setLatitude(pos.coords.latitude);
                                                setLongitude(pos.coords.longitude);
                                                Swal.fire('Konum Alındı', `Enlem: ${pos.coords.latitude.toFixed(4)}, Boylam: ${pos.coords.longitude.toFixed(4)}`, 'info');
                                            },
                                            (err) => alert('Konum hatası: ' + err.message),
                                            { enableHighAccuracy: true }
                                        );
                                    }}
                                >
                                    📍 Sınıf Konumumu Al
                                </Button>

                                <TextField
                                    select
                                    label="Ders Şubesi"
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                    SelectProps={{ native: true }}
                                >
                                    <option value="">Şube seçin</option>
                                    {sections.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </TextField>

                                <TextField
                                    label="Süre (Dakika)"
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                />

                                <TextField
                                    label="Geofence Yarıçapı (Metre)"
                                    type="number"
                                    value={radius}
                                    onChange={(e) => setRadius(e.target.value)}
                                />

                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleStartSession}
                                    disabled={!selectedSection || !latitude}
                                >
                                    Oturumu Başlat
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Sağ: Aktif Oturum & QR */}
                <Grid item xs={12} md={7}>
                    {activeSession && (
                        <Card sx={{ bgcolor: '#e8f5e9' }}>
                            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Typography variant="h5" color="success.main">Oturum Aktif</Typography>
                                <Typography variant="body2" gutterBottom>Öğrenciler bu kodu tarayarak katılabilir</Typography>

                                <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, my: 2 }}>
                                    <QRCodeSVG value={activeSession.qr_code} size={180} />
                                </Box>

                                <Typography variant="body2" sx={{ wordBreak: 'break-all', textAlign: 'center' }}>
                                    Kod: <strong>{activeSession.qr_code}</strong>
                                </Typography>

                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    Bitiş: {new Date(activeSession.expires_at).toLocaleTimeString('tr-TR')}
                                </Typography>

                                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                    <Button variant="outlined" onClick={handleFetchReport}>
                                        Raporu Göster
                                    </Button>
                                    <Button variant="contained" color="error" onClick={handleEndSession}>
                                        Oturumu Bitir
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    )}
                </Grid>
            </Grid>

            {/* Yoklama Raporu Tablosu */}
            {report.length > 0 && (
                <Paper sx={{ mt: 4, p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Yoklama Raporu - {sessionInfo?.course_code} {sessionInfo?.course_name}
                    </Typography>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Öğrenci</TableCell>
                                <TableCell>E-posta</TableCell>
                                <TableCell>Durum</TableCell>
                                <TableCell>Giriş Saati</TableCell>
                                <TableCell>Mesafe (m)</TableCell>
                                <TableCell>Devamsızlık</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {report.map(r => (
                                <TableRow key={r.student_id}>
                                    <TableCell>{r.student_name}</TableCell>
                                    <TableCell>{r.student_email}</TableCell>
                                    <TableCell>{getStatusChip(r.status)}</TableCell>
                                    <TableCell>{r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString('tr-TR') : '-'}</TableCell>
                                    <TableCell>{r.distance ? r.distance.toFixed(1) : '-'}</TableCell>
                                    <TableCell>{r.absence_hours_used} / {r.absence_limit} saat</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>
            )}
        </Container>
    );
};

export default InstructorAttendancePage;
