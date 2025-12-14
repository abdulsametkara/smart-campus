import React, { useState, useEffect } from 'react';
import { Container, Typography, Card, CardContent, Grid, LinearProgress, Box } from '@mui/material';
import axios from 'axios';

const MyAttendancePage = () => {
    const [stats, setStats] = useState([]);

    useEffect(() => {
        // Mock Data
        setStats([
            { id: 1, course: 'CENG101', attended: 12, total: 14, percent: 85 },
            { id: 2, course: 'IE202', attended: 8, total: 14, percent: 57 },
        ]);
    }, []);

    const getStatusColor = (percent) => {
        if (percent >= 80) return 'success';
        if (percent >= 70) return 'warning';
        return 'error';
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>My Attendance Overview</Typography>
            <Grid container spacing={3}>
                {stats.map((stat) => (
                    <Grid item xs={12} sm={6} key={stat.id}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6">{stat.course}</Typography>
                                <Typography color="textSecondary">
                                    Attended: {stat.attended} / {stat.total} Sessions
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                    <Box sx={{ width: '100%', mr: 1 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={stat.percent}
                                            color={getStatusColor(stat.percent)}
                                            sx={{ height: 10, borderRadius: 5 }}
                                        />
                                    </Box>
                                    <Box sx={{ minWidth: 35 }}>
                                        <Typography variant="body2" color="textSecondary">{`${Math.round(stat.percent)}%`}</Typography>
                                    </Box>
                                </Box>
                                {stat.percent < 70 && (
                                    <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                                        Critical: Risk of failure due to absence!
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default MyAttendancePage;
