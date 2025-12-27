import React, { useEffect, useState, useRef } from 'react';
import {
    Grid, Card, CardContent, Typography, Box, CircularProgress,
    Container, Chip, Button, alpha, IconButton
} from '@mui/material';
import {
    DeviceThermostat,
    Opacity,
    Bolt,
    Refresh,
    Sensors,
    SensorsOff,
    CheckCircle,
    Warning as WarningIcon,
    Groups
} from '@mui/icons-material';
import iotService from '../../../services/iotService';
import io from 'socket.io-client';

// Sensor configuration
const getSensorConfig = (type) => {
    switch (type?.toLowerCase()) {
        case 'temperature':
            return { icon: <DeviceThermostat />, color: '#ef4444', unit: '°C', label: 'Sıcaklık' };
        case 'humidity':
            return { icon: <Opacity />, color: '#3b82f6', unit: '%', label: 'Nem' };
        case 'energy':
            return { icon: <Bolt />, color: '#eab308', unit: 'kW', label: 'Enerji' };
        case 'occupancy':
            return { icon: <Groups />, color: '#10b981', unit: 'kişi', label: 'Doluluk' };
        default:
            return { icon: <Sensors />, color: '#6366f1', unit: '', label: 'Sensör' };
    }
};

// Mock sensors for demo
const MOCK_SENSORS = [
    { id: 1, name: 'Kütüphane Ana Salon', type: 'temperature', location: 'Kütüphane - Kat 1', status: 'active' },
    { id: 2, name: 'Yemekhane Girişi', type: 'occupancy', location: 'Yemekhane', status: 'active' },
    { id: 3, name: 'Sunucu Odası', type: 'humidity', location: 'B.İ.M Binası', status: 'warning' },
    { id: 4, name: 'Kampüs Aydınlatma', type: 'energy', location: 'Dış Mekan', status: 'active' },
    { id: 5, name: 'Amfi A Salonu', type: 'temperature', location: 'Mühendislik Fak.', status: 'active' },
    { id: 6, name: 'Spor Merkezi', type: 'occupancy', location: 'Spor Kompleksi', status: 'active' }
];

const IoTDashboard = () => {
    const [sensors, setSensors] = useState([]);
    const [readings, setReadings] = useState({});
    const [loading, setLoading] = useState(true);
    const socketRef = useRef(null);

    const generateMockReading = (type) => {
        switch (type) {
            case 'temperature': return (20 + Math.random() * 8).toFixed(1);
            case 'humidity': return Math.floor(40 + Math.random() * 30);
            case 'energy': return Math.floor(100 + Math.random() * 100);
            case 'occupancy': return Math.floor(Math.random() * 50);
            default: return Math.floor(Math.random() * 100);
        }
    };

    const fetchSensors = async () => {
        setLoading(true);
        try {
            let list = await iotService.getSensors();

            // If no sensors from API, use mock data
            if (!list || list.length === 0) {
                list = MOCK_SENSORS;
            }
            setSensors(list);

            // Generate initial readings
            const initialReadings = {};
            list.forEach(sensor => {
                initialReadings[sensor.id] = {
                    value: generateMockReading(sensor.type),
                    timestamp: new Date().toISOString(),
                    unit: getSensorConfig(sensor.type).unit
                };
            });
            setReadings(initialReadings);
        } catch (error) {
            console.error('IoT fetch error:', error);
            // Fallback to mock data on error
            setSensors(MOCK_SENSORS);
            const initialReadings = {};
            MOCK_SENSORS.forEach(sensor => {
                initialReadings[sensor.id] = {
                    value: generateMockReading(sensor.type),
                    timestamp: new Date().toISOString(),
                    unit: getSensorConfig(sensor.type).unit
                };
            });
            setReadings(initialReadings);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSensors();

        // Socket Connection
        socketRef.current = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
            path: '/socket.io'
        });

        socketRef.current.on('connect', () => {
            console.log('IoT Dashboard connected to socket');
        });

        socketRef.current.on('sensor-update', ({ sensorId, data }) => {
            setReadings(prev => ({
                ...prev,
                [sensorId]: data
            }));
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    const handleSimulate = async (sensor) => {
        const newValue = generateMockReading(sensor.type);

        try {
            await iotService.simulateData(sensor.id, parseFloat(newValue));
        } catch (e) {
            // Silent fail for demo
        }

        setReadings(prev => ({
            ...prev,
            [sensor.id]: {
                value: newValue,
                timestamp: new Date().toISOString(),
                unit: getSensorConfig(sensor.type).unit
            }
        }));
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress size={48} />
            </Box>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 5, mb: 8 }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={5}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.5px' }}>
                        IoT Sensör Ağı
                    </Typography>
                    <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
                        Kampüs genelindeki akıllı cihazların gerçek zamanlı izlemesi
                    </Typography>
                </Box>
                <Button
                    startIcon={<Refresh />}
                    onClick={fetchSensors}
                    variant="outlined"
                    sx={{
                        borderRadius: '12px',
                        textTransform: 'none',
                        px: 3,
                        py: 1
                    }}
                >
                    Yenile
                </Button>
            </Box>

            {/* Stats Overview */}
            <Grid container spacing={2} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{
                        p: 2,
                        borderRadius: '16px',
                        bgcolor: alpha('#10b981', 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                    }}>
                        <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#10b981', color: 'white' }}>
                            <CheckCircle />
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight="bold">{sensors.filter(s => s.status === 'active').length}</Typography>
                            <Typography variant="caption" color="textSecondary">Aktif Sensör</Typography>
                        </Box>
                    </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{
                        p: 2,
                        borderRadius: '16px',
                        bgcolor: alpha('#f59e0b', 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                    }}>
                        <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#f59e0b', color: 'white' }}>
                            <WarningIcon />
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight="bold">{sensors.filter(s => s.status === 'warning').length}</Typography>
                            <Typography variant="caption" color="textSecondary">Uyarı</Typography>
                        </Box>
                    </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{
                        p: 2,
                        borderRadius: '16px',
                        bgcolor: alpha('#3b82f6', 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                    }}>
                        <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#3b82f6', color: 'white' }}>
                            <Sensors />
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight="bold">{sensors.length}</Typography>
                            <Typography variant="caption" color="textSecondary">Toplam Cihaz</Typography>
                        </Box>
                    </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{
                        p: 2,
                        borderRadius: '16px',
                        bgcolor: alpha('#8b5cf6', 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                    }}>
                        <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#8b5cf6', color: 'white' }}>
                            <DeviceThermostat />
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight="bold">4</Typography>
                            <Typography variant="caption" color="textSecondary">Sensör Tipi</Typography>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            {/* Sensor Cards */}
            <Typography variant="h6" fontWeight="bold" mb={3}>Aktif Sensörler</Typography>
            <Grid container spacing={3}>
                {sensors.map(sensor => {
                    const config = getSensorConfig(sensor.type);
                    const reading = readings[sensor.id];
                    const isWarning = sensor.status === 'warning';

                    return (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={sensor.id}>
                            <Card
                                elevation={0}
                                sx={{
                                    height: '100%',
                                    borderRadius: '20px',
                                    border: '1px solid',
                                    borderColor: isWarning ? '#fbbf24' : 'rgba(0,0,0,0.06)',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: `0 12px 24px ${alpha(config.color, 0.15)}`,
                                        borderColor: config.color
                                    }
                                }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    {/* Header */}
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                        <Chip
                                            size="small"
                                            icon={isWarning ? <WarningIcon sx={{ fontSize: '14px !important' }} /> : <CheckCircle sx={{ fontSize: '14px !important' }} />}
                                            label={isWarning ? 'Uyarı' : 'Aktif'}
                                            sx={{
                                                height: 26,
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                bgcolor: isWarning ? '#fef3c7' : '#d1fae5',
                                                color: isWarning ? '#b45309' : '#059669',
                                                border: 'none'
                                            }}
                                        />
                                        <Box
                                            sx={{
                                                p: 1.5,
                                                borderRadius: '14px',
                                                bgcolor: alpha(config.color, 0.1),
                                                color: config.color
                                            }}
                                        >
                                            {config.icon}
                                        </Box>
                                    </Box>

                                    {/* Sensor Info */}
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 0.5, color: '#0f172a' }}>
                                        {sensor.name}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary" display="block" mb={3}>
                                        📍 {sensor.location}
                                    </Typography>

                                    {/* Value Display */}
                                    <Box display="flex" alignItems="baseline" mb={2}>
                                        <Typography
                                            variant="h3"
                                            fontWeight="800"
                                            sx={{ color: config.color, letterSpacing: '-1px' }}
                                        >
                                            {reading?.value ?? '--'}
                                        </Typography>
                                        <Typography variant="h6" sx={{ ml: 0.5, color: '#64748b', fontWeight: 500 }}>
                                            {config.unit}
                                        </Typography>
                                    </Box>

                                    {/* Footer */}
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="caption" color="textSecondary">
                                            {reading ? new Date(reading.timestamp).toLocaleTimeString('tr-TR') : '--:--:--'}
                                        </Typography>
                                        <Button
                                            size="small"
                                            onClick={() => handleSimulate(sensor)}
                                            sx={{
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                color: config.color,
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            Simüle Et
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        </Container>
    );
};

export default IoTDashboard;
