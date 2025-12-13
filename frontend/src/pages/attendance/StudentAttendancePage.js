import React, { useState, useEffect } from 'react';
import { Container, Typography, Card, CardContent, Button, Box, CircularProgress, Alert, TextField } from '@mui/material';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

const StudentAttendancePage = () => {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [session, setSession] = useState(null); // Active session data
    const [qrCode, setQrCode] = useState(''); // Would come from QR Scanner or Input

    // Session will be set when user gets their location (for demo purposes)

    const getLocation = () => {
        setLoading(true);
        setError(null);
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                setLocation({ latitude, longitude, accuracy });

                // For demo: Set session center to user's location so they can test check-in
                setSession({
                    id: 1,
                    latitude: latitude,
                    longitude: longitude,
                    radius: 50 // 50 meter radius for testing
                });

                setLoading(false);
            },
            (err) => {
                setError("Unable to retrieve your location. Please ensure GPS is enabled.");
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleCheckIn = async () => {
        if (!location || !session) return;

        try {
            const token = localStorage.getItem('accessToken');
            await axios.post('http://localhost:5000/api/v1/attendance/checkin', {
                latitude: location.latitude,
                longitude: location.longitude,
                qr_code: qrCode // Session will be found by QR code
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Check-in Successful!');
        } catch (err) {
            alert('Check-in Failed: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>Yoklamaya Katıl</Typography>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6">1. Konum Al</Typography>
                    <Box sx={{ mt: 2, mb: 2 }}>
                        <Button variant="contained" onClick={getLocation} disabled={loading}>
                            {loading ? <CircularProgress size={24} /> : 'Konumumu Al'}
                        </Button>
                    </Box>
                    {error && <Alert severity="error">{error}</Alert>}
                    {location && (
                        <Alert severity="success">
                            Konum alındı! (Enlem: {location.latitude.toFixed(4)}, Boylam: {location.longitude.toFixed(4)})
                            <br />Doğruluk: {location.accuracy.toFixed(1)}m
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {location && session && (
                <Card>
                    <CardContent>
                        <Typography variant="h6">2. Doğrula ve Katıl</Typography>
                        <Box sx={{ height: 300, mt: 2, mb: 2 }}>
                            <MapContainer center={[session.latitude, session.longitude]} zoom={18} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <Circle
                                    center={[session.latitude, session.longitude]}
                                    radius={session.radius}
                                    pathOptions={{ color: 'green', fillColor: 'green' }}
                                />
                                <Marker position={[location.latitude, location.longitude]}>
                                    <Popup>Buradasınız</Popup>
                                </Marker>
                            </MapContainer>
                        </Box>

                        <TextField
                            fullWidth
                            label="Oturum Kodu / QR Metni"
                            variant="outlined"
                            value={qrCode}
                            onChange={(e) => setQrCode(e.target.value)}
                            placeholder="Öğretmenin ekranındaki kodu girin"
                            sx={{ mb: 2 }}
                        />

                        <Button
                            variant="contained"
                            color="success"
                            fullWidth
                            size="large"
                            onClick={handleCheckIn}
                            disabled={!qrCode}
                        >
                            Yoklamayı Onayla
                        </Button>
                    </CardContent>
                </Card>
            )}
        </Container>
    );
};

export default StudentAttendancePage;
