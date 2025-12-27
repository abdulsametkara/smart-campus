import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, Grid, Button, CircularProgress, Container,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Avatar
} from '@mui/material';
import { Download as DownloadIcon, EventAvailable, EventBusy, AccessTime, TrendingUp } from '@mui/icons-material';
import analyticsService from '../../../services/analyticsService';
import StatCard from '../../../components/common/StatCard';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const AttendanceAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const result = await analyticsService.getAttendanceAnalytics();
                setData(result);
                setLoading(false);
            } catch (e) {
                console.error("Yoklama verileri alınamadı", e);
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleExport = async () => {
        try {
            const blob = await analyticsService.exportReport('attendance');
            if (blob) {
                const url = window.URL.createObjectURL(new Blob([blob]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            }
        } catch (error) {
            console.error("Rapor indirme başarısız", error);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    // API'den gelen verileri kullan
    const overallStats = data?.overallStats || [];

    // Verileri işle ve sabit sıraya koy: Mevcut, Devamsız, İzinli
    const getCountByStatus = (statusKey) => {
        const stat = overallStats.find(s => s.status === statusKey);
        return parseInt(stat?.count) || 0;
    };

    const presentCount = getCountByStatus('PRESENT');
    const absentCount = getCountByStatus('ABSENT');
    const excusedCount = getCountByStatus('EXCUSED');

    const chartData = {
        labels: ['Mevcut', 'Devamsız', 'İzinli'],
        datasets: [{
            data: [presentCount, absentCount, excusedCount],
            backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
            borderWidth: 0,
            hoverOffset: 4
        }]
    };

    // Bölüm bazlı mock veri (backend henüz bölüm bazlı desteklemiyor)
    const departmentData = {
        labels: ['Bilgisayar Müh.', 'Elektrik Müh.', 'Mimarlık', 'Tıp', 'Hukuk'],
        datasets: [{
            label: 'Ort. Devamsızlık (Saat)',
            data: [
                Math.round((data?.absentCount || 0) * 0.3),
                Math.round((data?.absentCount || 0) * 0.25),
                Math.round((data?.absentCount || 0) * 0.15),
                Math.round((data?.absentCount || 0) * 0.18),
                Math.round((data?.absentCount || 0) * 0.12)
            ],
            backgroundColor: '#3b82f6',
        }]
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 5, mb: 8 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={5}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.5px' }}>
                        Yoklama Analizi
                    </Typography>
                    <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
                        Genel katılım durumları ve devamsızlık raporları.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={handleExport}
                    sx={{
                        borderRadius: '12px',
                        textTransform: 'none',
                        px: 3,
                        py: 1,
                        background: 'linear-gradient(45deg, #10b981 30%, #34d399 90%)',
                        boxShadow: '0 3px 5px 2px rgba(16, 185, 129, .3)',
                    }}
                >
                    CSV İndir
                </Button>
            </Box>

            {/* Temel Metrikler - Gerçek Veriler */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Ortalama Katılım"
                        value={`%${data?.attendanceRate || 0}`}
                        icon={<TrendingUp sx={{ fontSize: 30 }} />}
                        color="#10b981"
                        subtext="Genel katılım oranı"
                        trend={3.2}
                        delay={0}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Toplam Oturum"
                        value={data?.totalSessions || 0}
                        icon={<AccessTime sx={{ fontSize: 30 }} />}
                        color="#6366f1"
                        subtext="Açılan yoklama sayısı"
                        delay={100}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Devamsız Sayısı"
                        value={data?.absentCount || 0}
                        icon={<EventBusy sx={{ fontSize: 30 }} />}
                        color="#ef4444"
                        subtext="Toplam devamsızlık"
                        trend={data?.absentCount > 10 ? -5 : 0}
                        delay={200}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Mevcut Sayısı"
                        value={data?.presentCount || 0}
                        icon={<EventAvailable sx={{ fontSize: 30 }} />}
                        color="#f59e0b"
                        subtext="Toplam katılım"
                        delay={300}
                    />
                </Grid>
            </Grid>

            {/* Grafikler */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={5}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            borderRadius: '20px',
                            boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
                            height: '100%',
                            textAlign: 'center'
                        }}
                    >
                        <Typography variant="h6" fontWeight="bold" gutterBottom align="left">Genel Katılım Oranları</Typography>
                        <Box height={300} mt={2} display="flex" justifyContent="center">
                            <Doughnut
                                options={{
                                    cutout: '70%',
                                    plugins: {
                                        legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
                                    }
                                }}
                                data={chartData}
                            />
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={7}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            borderRadius: '20px',
                            boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
                            height: '100%'
                        }}
                    >
                        <Typography variant="h6" fontWeight="bold" gutterBottom>Bölüm Bazlı Devamsızlık</Typography>
                        <Box height={320}>
                            <Bar
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    borderRadius: 8,
                                    scales: {
                                        y: { beginAtZero: true, grid: { borderDash: [5, 5] } },
                                        x: { grid: { display: false } }
                                    },
                                    plugins: { legend: { display: false } }
                                }}
                                data={departmentData}
                            />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Kritik Devamsızlık Listesi */}
            <Grid container spacing={3} mt={1}>
                <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom color="#ef4444">Kritik Devamsızlık Sınırındaki Öğrenciler</Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Öğrenci</TableCell>
                                        <TableCell>Öğrenci No</TableCell>
                                        <TableCell align="right">Devamsızlık Sayısı</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data?.criticalAbsences?.map((student) => (
                                        <TableRow key={student.student_id}>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#fee2e2', color: '#ef4444', fontSize: 14 }}>
                                                        {student.student?.full_name?.[0] || 'S'}
                                                    </Avatar>
                                                    <Typography variant="subtitle2">{student.student?.full_name}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>{student.student?.student_number}</TableCell>
                                            <TableCell align="right">
                                                <Typography fontWeight="bold" color="#ef4444">{student.absentCount}</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!data?.criticalAbsences || data.criticalAbsences.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center">Riskli durumda öğrenci bulunamadı</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>

            {/* Özet Kartlar */}
            <Grid container spacing={3} mt={1}>
                <Grid item xs={12}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: '20px',
                            boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
                        }}
                    >
                        <Typography variant="h6" fontWeight="bold" gutterBottom>Özet Bilgiler</Typography>
                        <Grid container spacing={2} mt={1}>
                            <Grid item xs={6} md={3}>
                                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f0fdf4', borderRadius: 2 }}>
                                    <Typography variant="h4" fontWeight="bold" color="#10b981">{data?.presentCount || 0}</Typography>
                                    <Typography variant="body2" color="textSecondary">Mevcut</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fef2f2', borderRadius: 2 }}>
                                    <Typography variant="h4" fontWeight="bold" color="#ef4444">{data?.absentCount || 0}</Typography>
                                    <Typography variant="body2" color="textSecondary">Devamsız</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fef3c7', borderRadius: 2 }}>
                                    <Typography variant="h4" fontWeight="bold" color="#f59e0b">{data?.excusedCount || 0}</Typography>
                                    <Typography variant="body2" color="textSecondary">İzinli</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#eff6ff', borderRadius: 2 }}>
                                    <Typography variant="h4" fontWeight="bold" color="#3b82f6">{data?.totalRecords || 0}</Typography>
                                    <Typography variant="body2" color="textSecondary">Toplam Kayıt</Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default AttendanceAnalytics;
