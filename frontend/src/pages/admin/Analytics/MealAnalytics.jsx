import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Container, Button, alpha } from '@mui/material';
import { Download as DownloadIcon, Restaurant, TrendingUp, LocalDining, AttachMoney, EmojiEvents } from '@mui/icons-material';
import analyticsService from '../../../services/analyticsService';
import StatCard from '../../../components/common/StatCard';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const MealAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await analyticsService.getMealUsage();
                setData(res);
            } catch (e) {
                console.error('Yemek analizi hatası', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress size={48} />
            </Box>
        );
    }

    // API'den gelen verileri kullan
    const usageData = data?.dailyUsage || [];

    const lineChartData = {
        labels: usageData.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('tr-TR', { weekday: 'short' });
        }),
        datasets: [{
            label: 'Günlük Rezervasyon',
            data: usageData.map(d => parseInt(d.count) || 0),
            borderColor: '#ea580c',
            backgroundColor: alpha('#ea580c', 0.1),
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#ea580c',
            pointRadius: 5,
            pointHoverRadius: 7
        }]
    };

    // Öğün dağılımı - API'den gelen veriler
    const mealTypeDist = data?.mealTypeDistribution || [];
    const lunchCount = mealTypeDist.find(m => m.meal_type === 'lunch')?.count || 0;
    const dinnerCount = mealTypeDist.find(m => m.meal_type === 'dinner')?.count || 0;

    const mealTimeData = {
        labels: ['Öğle Yemeği', 'Akşam Yemeği'],
        datasets: [{
            label: 'Öğün Dağılımı',
            data: [parseInt(lunchCount), parseInt(dinnerCount)],
            backgroundColor: ['#10b981', '#8b5cf6'],
            borderRadius: 8,
            barThickness: 60
        }]
    };

    // En popüler yemek belirleme
    const totalReservations = data?.totalReservations || 0;

    return (
        <Container maxWidth="xl" sx={{ mt: 5, mb: 8 }}>
            {/* Başlık */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={5}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.5px' }}>
                        Yemekhane Analizi
                    </Typography>
                    <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
                        Menü tercihleri, tüketim verileri ve rezervasyon analizi
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    sx={{
                        borderRadius: '12px',
                        textTransform: 'none',
                        px: 3,
                        py: 1.2,
                        background: 'linear-gradient(45deg, #ea580c 30%, #f97316 90%)',
                        boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)'
                    }}
                >
                    Raporu İndir
                </Button>
            </Box>

            {/* İstatistik Kartları */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Bugünkü Rezervasyon"
                        value={data?.todayCount || 0}
                        icon={<Restaurant sx={{ fontSize: 28 }} />}
                        color="#ea580c"
                        subtext="Günlük toplam"
                        trend={8.5}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Haftalık Ortalama"
                        value={data?.weeklyAverage || 0}
                        icon={<TrendingUp sx={{ fontSize: 28 }} />}
                        color="#10b981"
                        subtext="Günlük ortalama"
                        trend={3.2}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Toplam Rezervasyon"
                        value={totalReservations}
                        icon={<LocalDining sx={{ fontSize: 28 }} />}
                        color="#3b82f6"
                        subtext="Tüm zamanlar"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Haftalık Toplam"
                        value={data?.weeklyTotal || 0}
                        icon={<EmojiEvents sx={{ fontSize: 28 }} />}
                        color="#f59e0b"
                        subtext="Son 7 gün"
                    />
                </Grid>
            </Grid>

            {/* Grafikler Satır 1 */}
            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} lg={8}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: '20px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                            height: '100%'
                        }}
                    >
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            Haftalık Rezervasyon Trendi
                        </Typography>
                        <Box height={320}>
                            <Line
                                data={lineChartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        y: { beginAtZero: true, grid: { borderDash: [5, 5] } },
                                        x: { grid: { display: false } }
                                    }
                                }}
                            />
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} lg={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: '20px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                            height: '100%'
                        }}
                    >
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            Öğün Dağılımı
                        </Typography>
                        <Box height={320} display="flex" justifyContent="center" alignItems="center">
                            <Bar
                                data={mealTimeData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        y: { beginAtZero: true },
                                        x: { grid: { display: false } }
                                    }
                                }}
                            />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Grafikler Satır 2 */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: '20px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
                        }}
                    >
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            Rezervasyon Durumu
                        </Typography>
                        <Box sx={{ mt: 3 }}>
                            <Box sx={{ mb: 3 }}>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography variant="body2" fontWeight="600">Öğle Yemeği</Typography>
                                    <Typography variant="body2" color="textSecondary">{parseInt(lunchCount)} rezervasyon</Typography>
                                </Box>
                                <Box sx={{ height: 8, bgcolor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                                    <Box sx={{
                                        height: '100%',
                                        width: `${totalReservations > 0 ? (parseInt(lunchCount) / totalReservations * 100) : 0}%`,
                                        bgcolor: '#10b981',
                                        borderRadius: 4,
                                        transition: 'width 0.5s ease'
                                    }} />
                                </Box>
                            </Box>
                            <Box sx={{ mb: 3 }}>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography variant="body2" fontWeight="600">Akşam Yemeği</Typography>
                                    <Typography variant="body2" color="textSecondary">{parseInt(dinnerCount)} rezervasyon</Typography>
                                </Box>
                                <Box sx={{ height: 8, bgcolor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                                    <Box sx={{
                                        height: '100%',
                                        width: `${totalReservations > 0 ? (parseInt(dinnerCount) / totalReservations * 100) : 0}%`,
                                        bgcolor: '#8b5cf6',
                                        borderRadius: 4,
                                        transition: 'width 0.5s ease'
                                    }} />
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: '20px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
                        }}
                    >
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            Özet Bilgiler
                        </Typography>
                        <Box sx={{ mt: 3 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f0fdf4', borderRadius: 2 }}>
                                        <Typography variant="h4" fontWeight="bold" color="#10b981">{data?.todayCount || 0}</Typography>
                                        <Typography variant="body2" color="textSecondary">Bugün</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fef3c7', borderRadius: 2 }}>
                                        <Typography variant="h4" fontWeight="bold" color="#f59e0b">{data?.weeklyTotal || 0}</Typography>
                                        <Typography variant="body2" color="textSecondary">Bu Hafta</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#eff6ff', borderRadius: 2 }}>
                                        <Typography variant="h4" fontWeight="bold" color="#3b82f6">{data?.weeklyAverage || 0}</Typography>
                                        <Typography variant="body2" color="textSecondary">Ortalama/Gün</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fef2f2', borderRadius: 2 }}>
                                        <Typography variant="h4" fontWeight="bold" color="#ea580c">{totalReservations}</Typography>
                                        <Typography variant="body2" color="textSecondary">Toplam</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default MealAnalytics;
