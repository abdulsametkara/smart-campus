import React, { useState, useEffect, useRef } from 'react';
import { Badge, IconButton } from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import notificationService from '../../services/notificationService';
import io from 'socket.io-client';

const NotificationBell = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();
    const { user } = useAuth();
    const socketRef = useRef(null);

    useEffect(() => {
        // Only fetch and connect socket if user is authenticated
        if (!user) {
            setUnreadCount(0);
            return;
        }

        // Fetch initial count
        const fetchCount = async () => {
            try {
                const data = await notificationService.getNotifications(1, 1);
                setUnreadCount(data.unreadCount || 0);
            } catch (e) {
                // Silently fail - user may not be authenticated
                console.log('Notification fetch skipped');
            }
        };
        fetchCount();

        // Connect Socket only if user is authenticated
        try {
            // Strip /api/v1 from URL for socket connection (socket is at root)
            const socketUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace('/api/v1', '');

            socketRef.current = io(socketUrl, {
                path: '/socket.io',
                transports: ['polling', 'websocket'], // Start with polling for reliability
                reconnectionAttempts: 3,
                timeout: 5000
            });

            socketRef.current.on('connect', () => {
                console.log('Notification socket connected');
                // Join user-specific room
                if (user?.id) {
                    socketRef.current.emit('join-user-room', user.id);
                }
            });

            socketRef.current.on('notification', () => {
                setUnreadCount(prev => prev + 1);
            });

            socketRef.current.on('connect_error', (error) => {
                console.log('Socket connection issue - will retry');
            });
        } catch (e) {
            console.log('Socket initialization skipped');
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [user]);

    const handleClick = () => {
        navigate('/notifications');
    };

    return (
        <IconButton color="inherit" onClick={handleClick}>
            <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
            </Badge>
        </IconButton>
    );
};

export default NotificationBell;

