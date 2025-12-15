import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Link } from 'react-router-dom';
import './MyAdviseesPage.css';

const MyAdviseesPage = () => {
    const { user } = useAuth();
    const [advisees, setAdvisees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAdvisees();
    }, []);

    const fetchAdvisees = async () => {
        try {
            setLoading(true);
            const response = await api.get('/academic/my-advisees');
            setAdvisees(response.data?.advisees || []);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Danışmanlık yaptığınız öğrenciler yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page my-advisees-page">
                <div className="loading-spinner">Yükleniyor...</div>
            </div>
        );
    }

    return (
        <div className="page my-advisees-page">
            <div className="page-header">
                <h1>👨‍🎓 Danışmanlık Yaptığım Öğrenciler</h1>
                <p className="page-subtitle">
                    Danışmanlık yaptığınız öğrencilerin listesi ({advisees.length} öğrenci)
                </p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {advisees.length === 0 ? (
                <div className="empty-state-card">
                    <span className="empty-icon">📚</span>
                    <h3>Danışmanlık Yapılan Öğrenci Yok</h3>
                    <p>Henüz size atanmış danışmanlık öğrencisi bulunmuyor.</p>
                </div>
            ) : (
                <div className="advisees-grid">
                    {advisees.map((student) => (
                        <div key={student.id} className="advisee-card">
                            <div className="advisee-avatar">
                                {student.profile_picture ? (
                                    <img src={student.profile_picture} alt={student.name} />
                                ) : (
                                    <span>{student.name?.[0] || '?'}</span>
                                )}
                            </div>
                            <div className="advisee-info">
                                <h3>{student.name}</h3>
                                <p className="student-number">📋 {student.student_number}</p>
                                <p className="student-email">📧 {student.email}</p>
                                <p className="student-department">🏛️ {student.department}</p>
                                {(student.gpa || student.cgpa) && (
                                    <div className="gpa-info">
                                        {student.gpa && <span>Dönem: {student.gpa}</span>}
                                        {student.cgpa && <span>Genel: {student.cgpa}</span>}
                                    </div>
                                )}
                            </div>
                            <div className="advisee-actions">
                                <Link
                                    to={`/advisor/approvals`}
                                    className="btn btn-sm"
                                >
                                    Ders Onayları
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyAdviseesPage;
