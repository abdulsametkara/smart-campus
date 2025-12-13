import React, { useState, useEffect } from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const AttendanceReportPage = () => {
    const [students, setStudents] = useState([]);

    useEffect(() => {
        // Mock Data
        setStudents([
            { id: 1, number: '2024001', name: 'Ayse Yilmaz', attended: 12, total: 14, percent: 85 },
            { id: 2, number: '2024002', name: 'Mehmet Demir', attended: 5, total: 14, percent: 35 },
        ]);
    }, []);

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>Class Attendance Report</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Student ID</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell align="right">Attended</TableCell>
                            <TableCell align="right">Total</TableCell>
                            <TableCell align="right">Percentage</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {students.map((student) => (
                            <TableRow key={student.id}>
                                <TableCell>{student.number}</TableCell>
                                <TableCell>{student.name}</TableCell>
                                <TableCell align="right">{student.attended}</TableCell>
                                <TableCell align="right">{student.total}</TableCell>
                                <TableCell align="right">{student.percent}%</TableCell>
                                <TableCell>
                                    {student.percent < 70 ? (
                                        <span style={{ color: 'red', fontWeight: 'bold' }}>Critical</span>
                                    ) : (
                                        <span style={{ color: 'green' }}>OK</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default AttendanceReportPage;
