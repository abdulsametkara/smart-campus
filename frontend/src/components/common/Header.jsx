import React from 'react';
import { Box, IconButton, Tooltip, Stack, Typography, useTheme } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import NotificationBell from '../Notifications/NotificationBell';

const Header = ({ onMenuClick, title }) => {
    const theme = useTheme();

    return (
        <Box
            component="header"
            sx={{
                height: 80,
                px: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 1100,
                bgcolor: 'background.default',
                backdropFilter: 'blur(8px)',
                borderBottom: `1px solid ${theme.palette.divider}`,
                transition: 'all 0.3s ease'
            }}
        >
            <Stack direction="row" alignItems="center" spacing={2}>
                <IconButton
                    onClick={onMenuClick}
                    sx={{ display: { lg: 'none' }, color: 'text.secondary' }}
                >
                    <MenuIcon />
                </IconButton>
                {/* Optional Page Title if needed */}
            </Stack>

            <Stack direction="row" alignItems="center" spacing={2}>
                <NotificationBell />
            </Stack>
        </Box>
    );
};

export default Header;
