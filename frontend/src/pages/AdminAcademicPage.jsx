import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow,
    Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    IconButton, List, ListItem, ListItemText, Alert
} from '@mui/material';
import { PersonAdd, Edit, Visibility } from '@mui/icons-material';
import axios from 'axios';

const AdminAcademicPage = () => {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Dialogs State
    const [assignInstructorDialog, setAssignInstructorDialog] = useState(false);
    const [enrollStudentDialog, setEnrollStudentDialog] = useState(false);
    const [viewStudentsDialog, setViewStudentsDialog] = useState(false);

    const [selectedSection, setSelectedSection] = useState(null);
    const [instructorIdInput, setInstructorIdInput] = useState('');
    const [studentEmailInput, setStudentEmailInput] = useState('');
    const [sectionStudents, setSectionStudents] = useState([]);

    const fetchSections = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await axios.get('http://localhost:5000/api/v1/academic/sections', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Ensure sections is always an array
            const sectionsData = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.sections || []);
            setSections(sectionsData);
            setLoading(false);
        } catch (err) {
            setError('Failed to load sections');
            setLoading(false);
            setSections([]); // Ensure sections is always an array even on error
        }
    };

    useEffect(() => {
        fetchSections();
    }, []);

    const handleAssignInstructor = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            await axios.put(`http://localhost:5000/api/v1/academic/sections/${selectedSection.id}/instructor`,
                { instructorId: instructorIdInput },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Instructor assigned successfully');
            setAssignInstructorDialog(false);
            fetchSections();
        } catch (err) {
            alert('Failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleEnrollStudent = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(`http://localhost:5000/api/v1/academic/sections/${selectedSection.id}/enroll`,
                { email: studentEmailInput },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Student enrolled successfully');
            setEnrollStudentDialog(false);
        } catch (err) {
            alert('Failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleViewStudents = async (section) => {
        setSelectedSection(section);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await axios.get(`http://localhost:5000/api/v1/academic/sections/${section.id}/students`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSectionStudents(res.data);
            setViewStudentsDialog(true);
        } catch (err) {
            alert('Failed to load students');
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>Akademik Yönetim</Typography>

            {error && <Alert severity="error">{error}</Alert>}

            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Ders Kodu</TableCell>
                            <TableCell>Ders Adı</TableCell>
                            <TableCell>Şube</TableCell>
                            <TableCell>Öğretim Üyesi</TableCell>
                            <TableCell>İşlemler</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">Yükleniyor...</TableCell>
                            </TableRow>
                        ) : sections && Array.isArray(sections) && sections.length > 0 ? (
                            sections.map(section => (
                            <TableRow key={section.id}>
                                <TableCell>{section.id}</TableCell>
                                <TableCell>{section.course?.code || '-'}</TableCell>
                                <TableCell>{section.course?.name || '-'}</TableCell>
                                <TableCell>{section.section_number}</TableCell>
                                <TableCell>{section.instructor?.full_name || 'Atanmadı'} (ID: {section.instructor?.id || '-'})</TableCell>
                                <TableCell>
                                    <IconButton title="Öğretim Üyesi Ata" onClick={() => {
                                        setSelectedSection(section);
                                        setAssignInstructorDialog(true);
                                    }}>
                                        <Edit />
                                    </IconButton>
                                    <IconButton title="Öğrenci Ekle" onClick={() => {
                                        setSelectedSection(section);
                                        setEnrollStudentDialog(true);
                                    }}>
                                        <PersonAdd />
                                    </IconButton>
                                    <IconButton title="Öğrencileri Gör" onClick={() => handleViewStudents(section)}>
                                        <Visibility />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    {error || 'Henüz şube bulunmuyor'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Paper>

            {/* Öğretim Üyesi Ata Dialog */}
            <Dialog open={assignInstructorDialog} onClose={() => setAssignInstructorDialog(false)}>
                <DialogTitle>Öğretim Üyesi Ata</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Öğretim Üyesi ID"
                        fullWidth
                        value={instructorIdInput}
                        onChange={(e) => setInstructorIdInput(e.target.value)}
                        helperText="Akademisyenin kullanıcı ID'sini girin"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAssignInstructorDialog(false)}>İptal</Button>
                    <Button onClick={handleAssignInstructor}>Ata</Button>
                </DialogActions>
            </Dialog>

            {/* Öğrenci Ekle Dialog */}
            <Dialog open={enrollStudentDialog} onClose={() => setEnrollStudentDialog(false)}>
                <DialogTitle>Öğrenci Kaydet</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Öğrenci E-postası"
                        fullWidth
                        value={studentEmailInput}
                        onChange={(e) => setStudentEmailInput(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEnrollStudentDialog(false)}>İptal</Button>
                    <Button onClick={handleEnrollStudent}>Kaydet</Button>
                </DialogActions>
            </Dialog>

            {/* Öğrenci Listesi Dialog */}
            <Dialog open={viewStudentsDialog} onClose={() => setViewStudentsDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle>Kayıtlı Öğrenciler</DialogTitle>
                <DialogContent>
                    <List>
                        {sectionStudents.length === 0 ? <ListItem><ListItemText primary="Kayıtlı öğrenci yok" /></ListItem> :
                            sectionStudents.map(student => (
                                <ListItem key={student.id}>
                                    <ListItemText primary={student.full_name} secondary={student.email} />
                                </ListItem>
                            ))
                        }
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewStudentsDialog(false)}>Kapat</Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
};

export default AdminAcademicPage;
