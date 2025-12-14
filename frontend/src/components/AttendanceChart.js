import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { Box, Paper, Typography } from '@mui/material';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Attendance Pie Chart
export const AttendancePieChart = ({ present = 0, absent = 0, excused = 0 }) => {
    const data = {
        labels: ['Katılım', 'Devamsız', 'Mazeretli'],
        datasets: [{
            data: [present, absent, excused],
            backgroundColor: ['#22c55e', '#ef4444', '#3b82f6'],
            borderColor: ['#16a34a', '#dc2626', '#2563eb'],
            borderWidth: 2
        }]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
            },
        },
    };

    return (
        <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>Genel Katılım Durumu</Typography>
            <Box sx={{ maxWidth: 250, mx: 'auto' }}>
                <Pie data={data} options={options} />
            </Box>
        </Paper>
    );
};

// Weekly Attendance Bar Chart
export const WeeklyAttendanceChart = ({ weeklyData = [] }) => {
    const data = {
        labels: weeklyData.map(d => d.week),
        datasets: [
            {
                label: 'Katılım',
                data: weeklyData.map(d => d.present),
                backgroundColor: '#22c55e',
            },
            {
                label: 'Devamsız',
                data: weeklyData.map(d => d.absent),
                backgroundColor: '#ef4444',
            }
        ]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Haftalık Yoklama İstatistikleri'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
            }
        }
    };

    return (
        <Paper sx={{ p: 2 }}>
            <Bar data={data} options={options} />
        </Paper>
    );
};

// Course-based Attendance Bar Chart
export const CourseAttendanceChart = ({ courses = [] }) => {
    const data = {
        labels: courses.map(c => c.code),
        datasets: [{
            label: 'Katılım Oranı (%)',
            data: courses.map(c => c.rate),
            backgroundColor: courses.map(c => c.rate >= 70 ? '#22c55e' : (c.rate >= 50 ? '#f59e0b' : '#ef4444')),
            borderRadius: 4
        }]
    };

    const options = {
        responsive: true,
        indexAxis: 'y',
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: 'Ders Bazlı Katılım Oranları'
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    callback: (value) => value + '%'
                }
            }
        }
    };

    return (
        <Paper sx={{ p: 2 }}>
            <Bar data={data} options={options} />
        </Paper>
    );
};

export default { AttendancePieChart, WeeklyAttendanceChart, CourseAttendanceChart };
