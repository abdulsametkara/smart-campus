import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { coursesService } from '../services/academicService';
import './CourseFormPage.css';

const CourseFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        credits: 3,
        ects: 5,
        weekly_hours: 3,
        department_id: 1
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isEdit) {
            fetchCourse();
        }
    }, [id]);

    const fetchCourse = async () => {
        try {
            setLoading(true);
            const course = await coursesService.getById(id);
            setFormData({
                code: course.code || '',
                name: course.name || '',
                description: course.description || '',
                credits: course.credits || 3,
                ects: course.ects || 5,
                weekly_hours: course.weekly_hours || 3,
                department_id: course.department_id || 1
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Ders yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ['credits', 'ects', 'weekly_hours', 'department_id'].includes(name)
                ? parseInt(value) || 0
                : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            if (isEdit) {
                await coursesService.update(id, formData);
                alert('Ders başarıyla güncellendi!');
            } else {
                await coursesService.create(formData);
                alert('Ders başarıyla oluşturuldu!');
            }
            navigate('/courses');
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.details?.join(', ') || 'Bir hata oluştu');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="page course-form-page">
                <div className="loading-spinner">Yükleniyor...</div>
            </div>
        );
    }

    return (
        <div className="page course-form-page">
            <div className="page-header">
                <h1>{isEdit ? 'Ders Düzenle' : 'Yeni Ders Ekle'}</h1>
                <button className="btn secondary" onClick={() => navigate('/courses')}>
                    İptal
                </button>
            </div>

            {error && (
                <div className="alert alert-error">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="course-form">
                <div className="form-grid">
                    <div className="form-group">
                        <label>Ders Kodu *</label>
                        <input
                            type="text"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            placeholder="örn: CENG101"
                            required
                            maxLength={20}
                        />
                        <small>Benzersiz ders kodu (max 20 karakter)</small>
                    </div>

                    <div className="form-group full-width">
                        <label>Ders Adı *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="örn: Bilgisayar Mühendisliğine Giriş"
                            required
                            maxLength={150}
                        />
                    </div>

                    <div className="form-group full-width">
                        <label>Açıklama</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Ders hakkında kısa açıklama..."
                            rows={3}
                        />
                    </div>

                    <div className="form-group">
                        <label>Kredi *</label>
                        <input
                            type="number"
                            name="credits"
                            value={formData.credits}
                            onChange={handleChange}
                            min={1}
                            max={10}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>AKTS *</label>
                        <input
                            type="number"
                            name="ects"
                            value={formData.ects}
                            onChange={handleChange}
                            min={1}
                            max={30}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Haftalık Saat *</label>
                        <input
                            type="number"
                            name="weekly_hours"
                            value={formData.weekly_hours}
                            onChange={handleChange}
                            min={1}
                            max={10}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Bölüm ID *</label>
                        <select
                            name="department_id"
                            value={formData.department_id}
                            onChange={handleChange}
                            required
                        >
                            <option value={1}>Bilgisayar Mühendisliği</option>
                            <option value={2}>Elektrik-Elektronik Müh.</option>
                            <option value={3}>Makine Mühendisliği</option>
                            <option value={4}>Endüstri Mühendisliği</option>
                            <option value={5}>Matematik</option>
                        </select>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn secondary" onClick={() => navigate('/courses')}>
                        İptal
                    </button>
                    <button type="submit" className="btn" disabled={submitting}>
                        {submitting ? 'Kaydediliyor...' : (isEdit ? 'Güncelle' : 'Oluştur')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CourseFormPage;
