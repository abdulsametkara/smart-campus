import React, { useEffect, useState } from 'react';
import {
    Container, Typography, Paper, FormGroup, FormControlLabel, Switch,
    Box, Button, Grid, Divider, Alert, Snackbar
} from '@mui/material';
import notificationService from '../services/notificationService';

const NotificationSettingsPage = () => {
    const [prefs, setPrefs] = useState({});
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ open: false, msg: '', type: 'success' });

    useEffect(() => {
        const load = async () => {
            try {
                const data = await notificationService.getPreferences();
                setPrefs(data);
                setLoading(false);
            } catch (error) {
                console.error("Error loading prefs", error);
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleChange = (e) => {
        setPrefs({ ...prefs, [e.target.name]: e.target.checked });
    };

    const handleSave = async () => {
        try {
            await notificationService.updatePreferences(prefs);
            setToast({ open: true, msg: 'Tercihler güncellendi', type: 'success' });
        } catch (error) {
            setToast({ open: true, msg: 'Güncelleme hatası', type: 'error' });
        }
    };

    if (loading) return null;

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>Bildirim Ayarları</Typography>
            <Paper sx={{ p: 4 }}>
                <Grid container spacing={4}>
                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" gutterBottom>E-posta Bildirimleri</Typography>
                        <FormGroup>
                            <FormControlLabel control={<Switch checked={!!prefs.email_academic} onChange={handleChange} name="email_academic" />} label="Akademik Duyurular" />
                            <FormControlLabel control={<Switch checked={!!prefs.email_attendance} onChange={handleChange} name="email_attendance" />} label="Yoklama Uyarıları" />
                            <FormControlLabel control={<Switch checked={!!prefs.email_meal} onChange={handleChange} name="email_meal" />} label="Yemekhane" />
                            <FormControlLabel control={<Switch checked={!!prefs.email_event} onChange={handleChange} name="email_event" />} label="Etkinlikler" />
                        </FormGroup>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" gutterBottom>Mobil Bildirimler</Typography>
                        <FormGroup>
                            <FormControlLabel control={<Switch checked={!!prefs.push_academic} onChange={handleChange} name="push_academic" />} label="Akademik Duyurular" />
                            <FormControlLabel control={<Switch checked={!!prefs.push_attendance} onChange={handleChange} name="push_attendance" />} label="Yoklama Uyarıları" />
                            <FormControlLabel control={<Switch checked={!!prefs.push_meal} onChange={handleChange} name="push_meal" />} label="Yemekhane" />
                        </FormGroup>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" gutterBottom>SMS Bildirimleri</Typography>
                        <FormGroup>
                            <FormControlLabel control={<Switch checked={!!prefs.sms_attendance} onChange={handleChange} name="sms_attendance" />} label="Kritik Devamsızlık" />
                        </FormGroup>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Box display="flex" justifyContent="flex-end">
                    <Button variant="contained" color="primary" onClick={handleSave}>
                        Kaydet
                    </Button>
                </Box>
            </Paper>

            <Snackbar
                open={toast.open}
                autoHideDuration={4000}
                onClose={() => setToast({ ...toast, open: false })}
            >
                <Alert severity={toast.type}>{toast.msg}</Alert>
            </Snackbar>
        </Container>
    );
};

export default NotificationSettingsPage;
