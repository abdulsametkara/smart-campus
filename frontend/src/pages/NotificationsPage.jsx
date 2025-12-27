import React, { useEffect, useState } from 'react';
import {
    Container, Typography, Box, Paper, Chip, Button, Pagination,
    Grid, Card, CardContent, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, FormControl,
    InputLabel, Select, MenuItem, Checkbox, FormControlLabel,
    Stack, Avatar
} from '@mui/material';
import {
    Notifications as IconGeneral,
    School as IconAcademic,
    Restaurant as IconMeal,
    Event as IconEvent,
    Delete as IconDelete,
    DoneAll as IconDoneAll,
    Send as IconSend,
    Close as IconClose,
    AccessTime as IconTime
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import notificationService from '../services/notificationService';
import { useAuth } from '../context/AuthContext'; // Verify path or context name

// --- Styled Components ---

const NotificationCard = styled(Card)(({ theme, isread }) => ({
    display: 'flex',
    marginBottom: theme.spacing(2),
    borderRadius: '16px',
    boxShadow: isread === 'true'
        ? '0 2px 8px rgba(0,0,0,0.05)'
        : '0 4px 12px rgba(99, 102, 241, 0.15)', // Light indigo shadow for unread
    background: isread === 'true'
        ? '#ffffff'
        : 'linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)', // Subtle gradient for unread
    borderLeft: isread === 'true'
        ? '4px solid transparent'
        : `4px solid ${theme.palette.primary.main}`,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 16px rgba(0,0,0,0.1)'
    }
}));

const IconWrapper = styled(Box)(({ theme, type }) => {
    let bgcolor = theme.palette.grey[200];
    let color = theme.palette.grey[700];

    switch (type) {
        case 'academic':
            bgcolor = '#e0f2fe'; // Light Blue
            color = '#0284c7';
            break;
        case 'meal':
            bgcolor = '#fef3c7'; // Light Amber
            color = '#d97706';
            break;
        case 'event':
            bgcolor = '#f3e8ff'; // Light Purple
            color = '#9333ea';
            break;
        case 'system':
            bgcolor = '#e0e7ff'; // Light Indigo
            color = '#4f46e5';
            break;
        default: break;
    }

    return {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 48,
        borderRadius: '12px',
        backgroundColor: bgcolor,
        color: color,
        marginRight: theme.spacing(2)
    };
});

const NotificationsPage = () => {
    const { user } = useAuth(); // Get current user (role check)
    const [notifications, setNotifications] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    // eslint-disable-next-line no-unused-vars
    const [unreadCount, setUnreadCount] = useState(0);

    // Modal State
    const [openModal, setOpenModal] = useState(false);
    const [sendData, setSendData] = useState({
        title: '',
        message: '',
        type: 'system',
        all: true
    });

    const fetchNotifications = async () => {
        try {
            const data = await notificationService.getNotifications(page, 10);
            setNotifications(data.notifications);
            setTotalPages(data.totalPages);
            setUnreadCount(data.unreadCount);
        } catch (error) {
            console.error("Error fetching notifications", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const handleMarkAllRead = async () => {
        await notificationService.markAllRead();
        fetchNotifications();
    };

    const handleRead = async (id, isRead) => {
        if (isRead) return;
        await notificationService.markAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation(); // Prevent triggering card click
        if (!window.confirm("Are you sure?")) return;
        await notificationService.deleteNotification(id);
        fetchNotifications();
    };

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    // --- Detail Modal Logic ---
    const [selectedNotification, setSelectedNotification] = useState(null);

    const handleNotificationClick = async (notif) => {
        // Mark as read if not already
        if (!notif.isRead) {
            handleRead(notif.id, false);
        }
        setSelectedNotification(notif);
    };

    const handleDetailClose = () => setSelectedNotification(null);

    // --- Send Notification Logic (Admin) ---
    const handleSendOpen = () => setOpenModal(true);
    const handleSendClose = () => setOpenModal(false);

    const handleSendChange = (e) => {
        const { name, value, checked, type } = e.target;
        setSendData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSendSubmit = async () => {
        try {
            await notificationService.sendNotification(sendData);
            alert("Bildirim başarıyla gönderildi!");
            setOpenModal(false);
            setSendData({ title: '', message: '', type: 'system', all: true });
            // Optionally refetch if sending to self too?
            fetchNotifications();
        } catch (error) {
            console.error("Failed to send notification", error);
            alert("Gönderim başarısız oldu.");
        }
    };

    const getIconComponent = (type) => {
        switch (type) {
            case 'academic': return <IconAcademic />;
            case 'meal': return <IconMeal />;
            case 'event': return <IconEvent />;
            default: return <IconGeneral />;
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Bildirimler
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                        Önemli duyurular ve güncellemeler
                    </Typography>
                </Box>

                <Stack direction="row" spacing={2}>
                    {user?.role === 'admin' && (
                        <Button
                            startIcon={<IconSend />}
                            variant="contained"
                            color="primary"
                            onClick={handleSendOpen}
                            sx={{ borderRadius: '10px', textTransform: 'none' }}
                        >
                            Bildirim Gönder
                        </Button>
                    )}
                    <Button
                        startIcon={<IconDoneAll />}
                        onClick={handleMarkAllRead}
                        variant="outlined"
                        sx={{ borderRadius: '10px', textTransform: 'none' }}
                    >
                        Hepsini Okundu Say
                    </Button>
                </Stack>
            </Box>

            {notifications.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, bgcolor: '#f8fafc' }}>
                    <IconGeneral sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">Henüz hiç bildiriminiz yok.</Typography>
                </Paper>
            ) : (
                <Box>
                    {notifications.map((notif) => (
                        <NotificationCard
                            key={notif.id}
                            isread={notif.isRead.toString()}
                            onClick={() => handleNotificationClick(notif)}
                            sx={{ cursor: 'pointer' }}
                        >
                            <CardContent sx={{ display: 'flex', width: '100%', alignItems: 'start', p: 3, '&:last-child': { pb: 3 } }}>
                                <IconWrapper type={notif.type}>
                                    {getIconComponent(notif.type)}
                                </IconWrapper>

                                <Box flexGrow={1}>
                                    <Box display="flex" justifyContent="space-between" alignItems="start">
                                        <Typography variant="subtitle1" fontWeight={notif.isRead ? 600 : 700} sx={{ mb: 0.5 }}>
                                            {notif.title}
                                        </Typography>
                                        <Box display="flex" alignItems="center">
                                            <IconTime sx={{ fontSize: 14, color: 'text.disabled', mr: 0.5 }} />
                                            <Typography variant="caption" color="textSecondary">
                                                {new Date(notif.createdAt).toLocaleString('tr-TR', {
                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => handleDelete(notif.id, e)}
                                                sx={{ ml: 1, color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                                            >
                                                <IconDelete fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            lineHeight: 1.6,
                                            display: '-webkit-box',
                                            overflow: 'hidden',
                                            WebkitBoxOrient: 'vertical',
                                            WebkitLineClamp: 2 // Limit to 2 lines for cleaner list view
                                        }}
                                    >
                                        {notif.message}
                                    </Typography>

                                    {!notif.isRead && (
                                        <Chip
                                            label="YENİ"
                                            size="small"
                                            color="primary"
                                            sx={{ mt: 1.5, height: 20, fontSize: '0.7rem', fontWeight: 600, borderRadius: '6px' }}
                                        />
                                    )}
                                </Box>
                            </CardContent>
                        </NotificationCard>
                    ))}
                </Box>
            )}

            <Box display="flex" justifyContent="center" mt={4}>
                <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    shape="rounded"
                />
            </Box>

            {/* DETAIL POP-UP MODAL */}
            <Dialog
                open={!!selectedNotification}
                onClose={handleDetailClose}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: { borderRadius: '20px', p: 1 }
                }}
            >
                {selectedNotification && (
                    <>
                        <DialogContent sx={{ textAlign: 'center', pt: 4, pb: 4 }}>
                            <Box display="flex" justifyContent="center" mb={2}>
                                <IconWrapper type={selectedNotification.type} sx={{ width: 80, height: 80, fontSize: 40, margin: 0 }}>
                                    {React.cloneElement(getIconComponent(selectedNotification.type), { sx: { fontSize: 40 } })}
                                </IconWrapper>
                            </Box>
                            <Typography variant="caption" color="textSecondary" display="block" mb={1}>
                                {new Date(selectedNotification.createdAt).toLocaleString('tr-TR')}
                            </Typography>
                            <Typography variant="h5" fontWeight="bold" gutterBottom>
                                {selectedNotification.title}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mt: 2, lineHeight: 1.8 }}>
                                {selectedNotification.message}
                            </Typography>
                        </DialogContent>
                        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
                            <Button
                                onClick={handleDetailClose}
                                variant="contained"
                                sx={{ borderRadius: '20px', px: 4, textTransform: 'none' }}
                            >
                                Kapat
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* SEND NOTIFICATION MODAL (ADMIN) */}
            <Dialog open={openModal} onClose={handleSendClose} fullWidth maxWidth="sm">
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Bildirim Gönder
                    <IconButton onClick={handleSendClose} size="small"><IconClose /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            name="title"
                            label="Başlık"
                            fullWidth
                            variant="outlined"
                            value={sendData.title}
                            onChange={handleSendChange}
                        />
                        <TextField
                            name="message"
                            label="Mesaj İçeriği"
                            fullWidth
                            multiline
                            rows={4}
                            variant="outlined"
                            value={sendData.message}
                            onChange={handleSendChange}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Bildirim Tipi</InputLabel>
                            <Select
                                name="type"
                                value={sendData.type}
                                label="Bildirim Tipi"
                                onChange={handleSendChange}
                            >
                                <MenuItem value="system">Sistem</MenuItem>
                                <MenuItem value="academic">Akademik</MenuItem>
                                <MenuItem value="meal">Yemekhane</MenuItem>
                                <MenuItem value="event">Etkinlik</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    name="all"
                                    checked={sendData.all}
                                    onChange={handleSendChange}
                                />
                            }
                            label="Tüm Kullanıcılara Gönder (System Broadcast)"
                        />
                        {/* If we implemented individual selection, we would add that UI here */}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleSendClose} color="inherit">İptal</Button>
                    <Button
                        onClick={handleSendSubmit}
                        variant="contained"
                        disabled={!sendData.title || !sendData.message}
                    >
                        Gönder
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default NotificationsPage;
