import React, { useState } from 'react';
import { Container, Typography, Card, CardContent, TextField, Button, Box } from '@mui/material';
import axios from 'axios';
import Swal from 'sweetalert2';

const ExcuseRequestPage = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        if (file) {
            formData.append('document', file);
        }

        // Mock Session ID or Course ID if needed, simplified for now
        // formData.append('session_id', 1);

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/v1/attendance/excuses', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            Swal.fire('Success', 'Excuse requested submitted successfully', 'success');
        } catch (error) {
            // Swal.fire('Error', 'Failed to submit request', 'error');
            Swal.fire('Info', 'Mock Submit - Backend endpoint pending file upload config', 'info');
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>Request Excuse</Typography>
            <Card>
                <CardContent>
                    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Reason / Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                        <TextField
                            label="Detailed Description"
                            multiline
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                        <Button
                            variant="outlined"
                            component="label"
                        >
                            Upload Document (PDF/Image)
                            <input
                                type="file"
                                hidden
                                onChange={(e) => setFile(e.target.files[0])}
                            />
                        </Button>
                        {file && <Typography variant="caption">{file.name}</Typography>}

                        <Button type="submit" variant="contained" color="primary">
                            Submit Request
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Container>
    );
};

export default ExcuseRequestPage;
