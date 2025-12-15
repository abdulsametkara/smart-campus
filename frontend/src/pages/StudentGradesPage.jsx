import React, { useState, useEffect } from 'react';
import gradingService from '../services/gradingService';
import { useAuth } from '../context/AuthContext';
import './StudentGradesPage.css';

const StudentGradesPage = () => {
    const { user } = useAuth();
    const [transcript, setTranscript] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchGrades();
    }, []);

    const fetchGrades = async () => {
        try {
            const data = await gradingService.getMyGrades();
            setTranscript(data.data || data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Notlar yüklenirken hata oluştu.');
            setLoading(false);
        }
    };

    const handleExportPDF = () => {
        window.print();
    };

    if (loading) return <div className="loading-spinner">Yükleniyor...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="page grades-page" id="transcript-content">
            <div className="page-header no-print">
                <h1>Notlarım & Transkript</h1>
                <button className="btn-export" onClick={handleExportPDF}>
                    📄 PDF Olarak İndir
                </button>
            </div>

            {/* Print Header - Sadece print'te görünür */}
            <div className="print-header print-only">
                <h1>Öğrenci Transkripti</h1>
                <p>Tarih: {new Date().toLocaleDateString('tr-TR')}</p>
            </div>

            {/* Öğrenci Bilgileri */}
            <div className="student-info-card">
                <div className="student-info-header">
                    <span className="student-info-icon">👤</span>
                    <h3>Öğrenci Bilgileri</h3>
                </div>
                <div className="student-info-grid">
                    <div className="info-item">
                        <label>Ad Soyad</label>
                        <span>{user?.full_name || 'Öğrenci'}</span>
                    </div>
                    <div className="info-item">
                        <label>Öğrenci No</label>
                        <span>{user?.student_number || '20XXXXXX'}</span>
                    </div>
                    <div className="info-item">
                        <label>E-posta</label>
                        <span>{user?.email || '-'}</span>
                    </div>
                    <div className="info-item">
                        <label>Bölüm</label>
                        <span>{transcript[0]?.department_name || 'Bilgisayar Mühendisliği'}</span>
                    </div>
                </div>
            </div>

            <div className="grades-container">
                {transcript.length === 0 ? (
                    <div className="empty-state">Henüz not girişi yapılmamış.</div>
                ) : (
                    transcript.map((course, index) => (
                        <div key={index} className="course-grade-card">
                            <div className="course-grade-header">
                                <div className="course-info">
                                    <h3>{course.course_code} - {course.course_name}</h3>
                                    <span className="section-badge">Section {course.section}</span>
                                </div>
                                <div className="grade-summary">
                                    <div className="average-box">
                                        <span className="label">Ortalama</span>
                                        <span className="value">{course.current_average}</span>
                                    </div>
                                    <div className={`letter-box ${course.letter_grade}`}>
                                        <span className="value">{course.letter_grade}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="exams-table-container">
                                <table className="exams-table">
                                    <thead>
                                        <tr>
                                            <th>Sınav Türü</th>
                                            <th>Başlık</th>
                                            <th>Ağırlık</th>
                                            <th>Puan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {course.exams && course.exams.length > 0 ? (
                                            course.exams.map((exam, i) => (
                                                <tr key={i}>
                                                    <td><span className={`exam-type type-${exam.type?.toLowerCase()}`}>{exam.type}</span></td>
                                                    <td>{exam.exam}</td>
                                                    <td>%{exam.weight}</td>
                                                    <td className="score-cell">{exam.score !== '-' ? exam.score : <span className="text-muted">-</span>}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="text-center text-muted">Henüz sınav açıklanmadı.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default StudentGradesPage;
