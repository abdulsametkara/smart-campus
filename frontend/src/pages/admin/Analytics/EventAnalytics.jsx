import React, { useEffect, useState } from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    CircularProgress,
    Container,
    Button,
    Paper
} from '@mui/material';
import {
    Event,
    HowToReg,
    ConfirmationNumber,
    Category,
    Download,
    TrendingUp
} from '@mui/icons-material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts';
import analyticsService from '../../../services/analyticsService';
import { useThemeMode } from '../../../context/ThemeContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const StatMiniCard = ({ title, value, icon, color, subtext }) => (
    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.03)' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                    <Typography variant="subtitle2" color="textSecondary" fontWeight="600">
                        {title}
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" sx={{ my: 0.5, color: '#111827' }}>
                        {value}
                    </Typography>
                    {subtext && (
                        <Typography variant="caption" sx={{ color: color, bgcolor: `${color}15`, px: 1, py: 0.5, borderRadius: 1, fontWeight: 600 }}>
                            {subtext}
                        </Typography>
                    )}
                </Box>
                <Box sx={{
                    bgcolor: `${color}15`,
                    p: 1.5,
                    borderRadius: 3,
                    color: color,
                    display: 'flex'
                }}>
                    {icon}
                </Box>
            </Box>
        </CardContent>
    </Card>
);

const EventAnalytics = () => {
    const { t } = useThemeMode();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await analyticsService.getEventsAnalytics();
                setData(response);
            } catch (error) {
                console.error("Error fetching event analytics", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!data) return <Typography>{t('noEventsFound') || 'Veri bulunamadı.'}</Typography>;

    const { popularEvents, stats, categoryDistribution, monthlyTrends } = data;

    const pieData = categoryDistribution?.map(c => ({
        name: t(`cat${c.category}`) || c.category,
        value: parseInt(c.count)
    })) || [];

    return (
        <Container maxWidth="xl" sx={{ mt: 3, mb: 8 }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <div>
                    <Typography variant="h4" fontWeight="800" color="textPrimary" letterSpacing="-0.5px">
                        {t('eventAnalyticsTitle')}
                    </Typography>
                    <Typography variant="body1" color="textSecondary" mt={0.5}>
                        {t('eventAnalyticsSubtitle')}
                    </Typography>
                </div>
                <Button
                    variant="contained"
                    startIcon={<Download />}
                    onClick={() => window.open(`${process.env.REACT_APP_API_URL}/analytics/export/event`, '_blank')}
                    sx={{ borderRadius: 2, textTransform: 'none', px: 3, boxShadow: 'none' }}
                >
                    {t('downloadReport')}
                </Button>
            </Box>

            {/* 1. Row: Stats Overview (4 columns) */}
            <Grid container spacing={2} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatMiniCard
                        title={t('totalEvents')}
                        value={stats?.totalEvents || 0}
                        icon={<Event fontSize="medium" />}
                        color="#3b82f6"
                        subtext={t('activeTerm')}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatMiniCard
                        title={t('registrationRate')}
                        value={`%${stats?.registrationRate || 0}`}
                        icon={<HowToReg fontSize="medium" />}
                        color="#10b981"
                        subtext={t('capacityRatio')}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatMiniCard
                        title={t('checkInRate')}
                        value={`%${stats?.checkInRate || 0}`}
                        icon={<ConfirmationNumber fontSize="medium" />}
                        color="#f59e0b"
                        subtext={t('participationSuccess')}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatMiniCard
                        title={t('publishedEvents')}
                        value={stats?.activeEvents || 0}
                        icon={<Category fontSize="medium" />}
                        color="#8b5cf6"
                        subtext={t('activePublished')}
                    />
                </Grid>
            </Grid>

            {/* 2. Row: Top Events & Categories */}
            <Grid container spacing={3} mb={4}>
                {/* Popular Events (Left - Wider) */}
                <Grid item xs={12} lg={8}>
                    <Paper sx={{ p: 3, borderRadius: 4, height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.03)' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                            <Typography variant="h6" fontWeight="bold">{t('popularEvents')}</Typography>
                            <Typography variant="caption" color="textSecondary">{t('top5ByRegistration')}</Typography>
                        </Box>
                        <Box height={350}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={popularEvents} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        type="category"
                                        dataKey="title"
                                        width={180}
                                        tick={{ fontSize: 13, fontWeight: 500, fill: '#6b7280' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                                    />
                                    <Bar
                                        dataKey="registrationCount"
                                        name={t('registration')}
                                        fill="#3b82f6"
                                        radius={[0, 6, 6, 0]}
                                        barSize={24}
                                        background={{ fill: '#f3f4f6', radius: [0, 6, 6, 0] }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>

                {/* Categories (Right - Narrower) */}
                <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 3, borderRadius: 4, height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.03)' }}>
                        <Typography variant="h6" fontWeight="bold" mb={3}>{t('categoryDistribution')}</Typography>
                        <Box height={350} position="relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: 12 }} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        iconSize={8}
                                        wrapperStyle={{ fontSize: '12px', fontWeight: 500, paddingTop: '20px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <Box position="absolute" top="50%" left="50%" sx={{ transform: 'translate(-50%, -60%)', textAlign: 'center' }}>
                                <Typography variant="h4" fontWeight="bold" color="textPrimary">
                                    {pieData.length}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    {t('category')}
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* 3. Row: Monthly Trend (Full Width) */}
            <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.03)' }}>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                    <Box sx={{ p: 1, bgcolor: '#ecfdf5', borderRadius: 2, color: '#10b981' }}>
                        <TrendingUp />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight="bold">{t('monthlyEventTrend')}</Typography>
                        <Typography variant="caption" color="textSecondary">{t('last6MonthsChange')}</Typography>
                    </Box>
                </Box>
                <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyTrends && monthlyTrends.length > 0 ? monthlyTrends : [{ month: 'No Data', count: 0 }]}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#10b981"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorCount)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </Box>
            </Paper>

        </Container>
    );
};

export default EventAnalytics;
