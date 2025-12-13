import React, { useState, useEffect } from 'react';
import { Container, Typography, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Button, Paper } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Using material icons or simple text
import CancelIcon from '@mui/icons-material/Cancel';

const ExcuseManagementPage = () => {
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        // Mock Data
        setRequests([
            { id: 1, student: 'Ayse Yilmaz', title: 'Medical Report', status: 'PENDING' },
            { id: 2, student: 'Mehmet Demir', title: 'Family Emergency', status: 'PENDING' },
        ]);
    }, []);

    const handleAction = (id, status) => {
        // Axios PUT call to update status
        setRequests(requests.map(r => r.id === id ? { ...r, status } : r));
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>Excuse Requests</Typography>
            <Paper>
                <List>
                    {requests.map((req) => (
                        <ListItem key={req.id} divider>
                            <ListItemText
                                primary={`${req.title} - ${req.student}`}
                                secondary={`Status: ${req.status}`}
                            />
                            {req.status === 'PENDING' && (
                                <ListItemSecondaryAction>
                                    <Button
                                        color="success"
                                        variant="contained"
                                        size="small"
                                        sx={{ mr: 1 }}
                                        onClick={() => handleAction(req.id, 'APPROVED')}
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        color="error"
                                        variant="contained"
                                        size="small"
                                        onClick={() => handleAction(req.id, 'REJECTED')}
                                    >
                                        Reject
                                    </Button>
                                </ListItemSecondaryAction>
                            )}
                        </ListItem>
                    ))}
                </List>
            </Paper>
        </Container>
    );
};

export default ExcuseManagementPage;
