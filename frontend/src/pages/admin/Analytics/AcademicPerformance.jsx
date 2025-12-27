import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, Grid, Button, CircularProgress, Container,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Avatar
} from '@mui/material';
import { Download as DownloadIcon, School as SchoolIcon, Grade as GradeIcon, TrendingUp } from '@mui/icons-material';
import analyticsService from '../../../services/analyticsService';
import StatCard from '../../../components/common/StatCard';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const AcademicPerformance = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await analyticsService.getAcademicPerformance();
                setData(result);
                setLoading(false);
            } catch (error) {
                console.error("Akademik veriler alınamadı", error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleExport = async () => {
        try {
            const blob = await analyticsService.exportReport('academic');
            if (blob) {
                const url = window.URL.createObjectURL(new Blob([blob]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `academic_report_${new Date().toISOString().split('T')[0]}.csv`);
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

    // API'den gelen gerçek not dağılımı verilerini kullan
    const gradeLabels = data?.gradeDistribution?.map(g => g.grade) || ['AA', 'BA', 'BB', 'CB', 'CC', 'DC', 'DD', 'FF'];
    const gradeCounts = data?.gradeDistribution?.map(g => g.count) || [0, 0, 0, 0, 0, 0, 0, 0];

    const pieData = {
        labels: gradeLabels,
        datasets: [
            {
                data: gradeCounts,
                backgroundColor: [
                    '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#fde047', '#fbbf24', '#fb923c', '#ef4444'
                ],
                borderWidth: 0,
            },
        ],
    };

    // Bölüm karşılaştırması (mock - backend henüz bölüm bazlı veri sağlamıyor)
    const departmentData = {
        labels: ['Bilgisayar Müh.', 'Elektrik Müh.', 'Mimarlık', 'Tıp', 'Hukuk'],
        datasets: [{
            label: 'Ortalama Not',
            data: [78, 72, 68, 82, 75],
            backgroundColor: '#3b82f6',
            borderRadius: 6
        }]
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 5, mb: 8 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={5}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.5px' }}>
                        Akademik Başarı
                    </Typography>
                    <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
                        Öğrenci notları ve bölüm başarı oranlarının detaylı analizi.
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
                        background: 'linear-gradient(45deg, #2563eb 30%, #4f46e5 90%)',
                        boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                    }}
                >
                    Raporu İndir
                </Button>
            </Box>

            {/* Temel Metrikler */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard
                        title="Ortalama Not"
                        value={data?.averageScore || '0'}
                        icon={<SchoolIcon sx={{ fontSize: 30 }} />}
                        color="#7c3aed"
                        subtext="Kampüs geneli ortalama"
                        trend={2.4}
                        delay={0}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard
                        title="Geçme Oranı"
                        value={`%${data?.passRate || 0}`}
                        icon={<TrendingUp sx={{ fontSize: 30 }} />}
                        color="#059669"
                        subtext="Dersleri geçen öğrenciler"
                        trend={1.1}
                        delay={100}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard
                        title="En Başarılı Bölüm"
                        value="Bilgisayar Müh."
                        icon={<GradeIcon sx={{ fontSize: 30 }} />}
                        color="#ea580c"
                        subtext="En yüksek not ortalaması"
                        delay={200}
                    />
                </Grid>
            </Grid>

            {/* Grafik Bölümü */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
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
                        <Typography variant="h6" fontWeight="bold" gutterBottom mb={3} align="left">Not Dağılımı</Typography>
                        <Box height={300} display="flex" justifyContent="center" position="relative">
                            <Pie options={{
                                plugins: {
                                    legend: { position: 'right', labels: { usePointStyle: true } }
                                }
                            }} data={pieData} />
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            borderRadius: '20px',
                            boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
                            height: '100%'
                        }}
                    >
                        <Typography variant="h6" fontWeight="bold" gutterBottom mb={3}>Bölüm Karşılaştırması</Typography>
                        <Box height={300}>
                            <Bar
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: { y: { beginAtZero: true, max: 100 } }
                                }}
                                data={departmentData}
                            />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
            {/* Öğrenci Listeleri */}
            <Grid container spacing={3} mt={1}>
                {/* En Başarılı Öğrenciler */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>En Başarılı Öğrenciler</Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Öğrenci</TableCell>
                                        <TableCell>Bölüm</TableCell>
                                        <TableCell align="right">Ortalama</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data?.topStudents?.map((student) => (
                                        <TableRow key={student.id}>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#e0e7ff', color: '#4f46e5', fontSize: 14 }}>
                                                        {student.user?.full_name?.[0] || 'S'}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="subtitle2">{student.user?.full_name}</Typography>
                                                        <Typography variant="caption" color="textSecondary">{student.student_number}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>{student.department?.name}</TableCell>
                                            <TableCell align="right">
                                                <Typography fontWeight="bold" color="#10b981">{student.gpa}</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!data?.topStudents || data.topStudents.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center">Veri bulunamadı</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* Riskli Öğrenciler */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom color="#ef4444">Riskli Öğrenciler (GPA &lt; 2.0)</Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Öğrenci</TableCell>
                                        <TableCell>Bölüm</TableCell>
                                        <TableCell align="right">Ortalama</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data?.atRiskStudents?.map((student) => (
                                        <TableRow key={student.id}>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#fee2e2', color: '#ef4444', fontSize: 14 }}>
                                                        {student.user?.full_name?.[0] || 'S'}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="subtitle2">{student.user?.full_name}</Typography>
                                                        <Typography variant="caption" color="textSecondary">{student.student_number}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>{student.department?.name}</TableCell>
                                            <TableCell align="right">
                                                <Typography fontWeight="bold" color="#ef4444">{student.gpa}</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!data?.atRiskStudents || data.atRiskStudents.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center">Riskli öğrenci bulunamadı</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default AcademicPerformance;
