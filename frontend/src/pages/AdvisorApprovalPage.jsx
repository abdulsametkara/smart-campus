import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Swal from 'sweetalert2';
import './AdvisorApprovalPage.css';

const AdvisorApprovalPage = () => {
    const { user } = useAuth();
    const [pendingEnrollments, setPendingEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPendingEnrollments();
    }, []);

    const fetchPendingEnrollments = async () => {
        try {
            setLoading(true);
            const response = await api.get('/academic/advisor/pending-enrollments');
            setPendingEnrollments(response.data || []);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Bekleyen kayıtlar yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (enrollmentId) => {
        const result = await Swal.fire({
            title: 'Ders Kaydını Onayla',
            text: 'Bu ders kaydını onaylamak istediğinizden emin misiniz?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Onayla',
            cancelButtonText: 'İptal'
        });

        if (result.isConfirmed) {
            try {
                await api.put(`/academic/enrollments/${enrollmentId}/approve`);
                Swal.fire('Onaylandı!', 'Ders kaydı başarıyla onaylandı.', 'success');
                fetchPendingEnrollments();
            } catch (err) {
                Swal.fire('Hata', err.response?.data?.message || 'Onaylama işlemi başarısız', 'error');
            }
        }
    };

    const handleReject = async (enrollmentId) => {
        const { value: reason } = await Swal.fire({
            title: 'Ders Kaydını Reddet',
            input: 'textarea',
            inputLabel: 'Red Sebebi',
            inputPlaceholder: 'Ders kaydının reddedilme sebebini yazınız...',
            inputAttributes: {
                'aria-label': 'Red sebebi'
            },
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Reddet',
            cancelButtonText: 'İptal'
        });

        if (reason !== undefined) {
            try {
                await api.put(`/academic/enrollments/${enrollmentId}/reject`, { reason });
                Swal.fire('Reddedildi', 'Ders kaydı reddedildi.', 'info');
                fetchPendingEnrollments();
            } catch (err) {
                Swal.fire('Hata', err.response?.data?.message || 'Reddetme işlemi başarısız', 'error');
            }
        }
    };

    if (loading) {
        return (
            <div className="page advisor-approval-page">
                <div className="loading-spinner">Yükleniyor...</div>
            </div>
        );
    }

    return (
        <div className="page advisor-approval-page">
            <div className="page-header">
                <h1>📋 Danışman Ders Onay Paneli</h1>
                <p className="page-subtitle">
                    Danışmanı olduğunuz öğrencilerin ders kayıt taleplerini yönetin
                </p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {pendingEnrollments.length === 0 ? (
                <div className="empty-state-card">
                    <span className="empty-icon">✅</span>
                    <h3>Bekleyen Talep Yok</h3>
                    <p>Tüm ders kayıt talepleri işlenmiş durumda.</p>
                </div>
            ) : (
                <div className="enrollment-cards">
                    {pendingEnrollments.map((enrollment) => (
                        <div key={enrollment.id} className="enrollment-card">
                            <div className="card-header">
                                <div className="student-info">
                                    <span className="student-avatar">👤</span>
                                    <div>
                                        <h4>{enrollment.student?.full_name}</h4>
                                        <span className="student-number">
                                            {enrollment.student?.student_number || enrollment.student?.email}
                                        </span>
                                    </div>
                                </div>
                                <span className="pending-badge">Beklemede</span>
                            </div>

                            <div className="card-body">
                                <div className="course-info">
                                    <span className="course-code">{enrollment.section?.course?.code}</span>
                                    <span className="course-name">{enrollment.section?.course?.name}</span>
                                </div>
                                <div className="section-details">
                                    <span>📚 Section {enrollment.section?.section_number}</span>
                                    <span>👨‍🏫 {enrollment.section?.instructor?.full_name || 'Belirtilmemiş'}</span>
                                    <span>🎓 {enrollment.section?.course?.credits || 3} Kredi</span>
                                </div>
                                <div className="enrollment-date">
                                    📅 Talep Tarihi: {new Date(enrollment.enrollment_date).toLocaleDateString('tr-TR')}
                                </div>
                            </div>

                            <div className="card-actions">
                                <button
                                    className="btn btn-approve"
                                    onClick={() => handleApprove(enrollment.id)}
                                >
                                    ✓ Onayla
                                </button>
                                <button
                                    className="btn btn-reject"
                                    onClick={() => handleReject(enrollment.id)}
                                >
                                    ✗ Reddet
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdvisorApprovalPage;
