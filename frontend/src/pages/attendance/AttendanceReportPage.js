import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/attendance.css';

const AttendanceReportPage = () => {
    const [sections, setSections] = useState([]);
    const [selectedSection, setSelectedSection] = useState('');
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);

    const getToken = () => localStorage.getItem('accessToken');

    useEffect(() => {
        fetchSections();
    }, []);

    const fetchSections = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/v1/attendance/sections/my', {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            setSections(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchReport = async (sectionId) => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/v1/attendance/sections/${sectionId}/summary`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            setReport(response.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleSectionChange = (e) => {
        const sectionId = e.target.value;
        setSelectedSection(sectionId);
        if (sectionId) {
            fetchReport(sectionId);
        } else {
            setReport(null);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'OK': return { text: '🟢 İyi', class: 'safe' };
            case 'WARNING': return { text: '🟡 Dikkat', class: 'warning' };
            case 'CRITICAL': return { text: '🔴 Kritik', class: 'danger' };
            default: return { text: status, class: '' };
        }
    };

    return (
        <div className="attendance-page">
            <div className="page-title">
                <span className="icon">📈</span>
                <h1>Dönemlik Yoklama Raporu</h1>
            </div>

            <div className="course-attendance-card" style={{ marginBottom: '2rem' }}>
                <label style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem', display: 'block' }}>
                    Ders Section Seçin
                </label>
                <select
                    value={selectedSection}
                    onChange={handleSectionChange}
                    style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        fontSize: '1rem',
                        borderRadius: '12px',
                        border: '2px solid #eef2f7',
                        background: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <option value="">-- Seçiniz --</option>
                    {sections.map(s => (
                        <option key={s.id} value={s.id}>{s.course_code} - {s.course_name} (Section {s.section_number})</option>
                    ))}
                </select>
            </div>

            {loading && (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Yükleniyor...</p>
                </div>
            )}

            {report && !loading && (
                <>
                    <div className="attendance-stats-grid">
                        <div className="attendance-stat-card primary">
                            <div className="card-header"><div className="card-icon">📚</div></div>
                            <div className="card-title">Ders Kodu</div>
                            <div className="card-value">{report.section.course_code}</div>
                        </div>
                        <div className="attendance-stat-card success">
                            <div className="card-header"><div className="card-icon">👨‍🎓</div></div>
                            <div className="card-title">Toplam Öğrenci</div>
                            <div className="card-value">{report.students.length}</div>
                        </div>
                        <div className="attendance-stat-card warning">
                            <div className="card-header"><div className="card-icon">⏱️</div></div>
                            <div className="card-title">Yapılan Yoklama</div>
                            <div className="card-value">{report.total_sessions}</div>
                        </div>
                    </div>

                    <div className="course-attendance-card">
                        <table className="attendance-table">
                            <thead>
                                <tr>
                                    <th>Öğrenci</th>
                                    <th>E-posta</th>
                                    <th align="center">Katılım Oranı</th>
                                    <th align="center">Devamsızlık</th>
                                    <th align="center">Durum</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.students.map(student => {
                                    const statusInfo = getStatusBadge(student.status);
                                    return (
                                        <tr key={student.student_id}>
                                            <td><strong>{student.student_name}</strong></td>
                                            <td>{student.student_email}</td>
                                            <td align="center">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <span>%{student.percent}</span>
                                                    <div className="custom-progress" style={{ width: '60px', margin: 0, height: '6px' }}>
                                                        <div
                                                            className={`progress-fill ${student.percent < 50 ? 'danger' : student.percent < 70 ? 'warning' : 'success'}`}
                                                            style={{ width: `${student.percent}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td align="center">{student.absence_hours_used} / {student.absence_limit} saat</td>
                                            <td align="center">
                                                <span className={`status-badge ${statusInfo.class}`}>
                                                    {statusInfo.text}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {!report && !loading && selectedSection && (
                <div className="custom-alert warning">
                    <span>⚠️</span> Bu şube için rapor bulunamadı.
                </div>
            )}
        </div>
    );
};

export default AttendanceReportPage;
