import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coursesService } from '../services/academicService';
import LoadingSpinner from '../components/LoadingSpinner';
import './CoursesListPage.css';

const CoursesListPage = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const data = await coursesService.getAll({ limit: 100 });
            setCourses(Array.isArray(data) ? data : data.courses || []);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Dersler yüklenirken hata oluştu');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, code) => {
        if (!window.confirm(`"${code}" dersini silmek istediğinizden emin misiniz?`)) {
            return;
        }
        try {
            await coursesService.delete(id);
            setCourses(courses.filter(c => c.id !== id));
        } catch (err) {
            alert(err.response?.data?.message || 'Ders silinirken hata oluştu');
        }
    };

    const filteredCourses = courses.filter(course =>
        course.code.toLowerCase().includes(search.toLowerCase()) ||
        course.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="page courses-page">
                <div className="page-header">
                    <h1>Dersler</h1>
                </div>
                <LoadingSpinner size="large" message="Dersler yükleniyor..." />
            </div>
        );
    }

    return (
        <div className="page courses-page">
            <div className="page-header">
                <h1>Dersler</h1>
                {user?.role === 'admin' && (
                    <Link to="/courses/new" className="btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Yeni Ders Ekle
                    </Link>
                )}
            </div>

            {error && (
                <div className="alert alert-error">{error}</div>
            )}

            {/* Search */}
            <div className="search-box">
                <input
                    type="text"
                    placeholder="Ders kodu veya adı ile ara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Courses Table */}
            <div className="courses-table-wrapper">
                <table className="courses-table">
                    <thead>
                        <tr>
                            <th>Ders Kodu</th>
                            <th>Ders Adı</th>
                            <th>Kredi</th>
                            <th>AKTS</th>
                            <th>Haftalık Saat</th>
                            <th>Bölüm</th>
                            {user?.role === 'admin' && <th>İşlemler</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCourses.length === 0 ? (
                            <tr>
                                <td colSpan={user?.role === 'admin' ? 7 : 6} className="empty-state">
                                    Ders bulunamadı
                                </td>
                            </tr>
                        ) : (
                            filteredCourses.map(course => (
                                <tr key={course.id}>
                                    <td className="course-code">
                                        <strong>{course.code}</strong>
                                    </td>
                                    <td>{course.name}</td>
                                    <td className="center">{course.credits}</td>
                                    <td className="center">{course.ects}</td>
                                    <td className="center">{course.weekly_hours}</td>
                                    <td>{course.department?.name || '-'}</td>
                                    {user?.role === 'admin' && (
                                        <td className="actions">
                                            <Link to={`/courses/${course.id}/edit`} className="btn secondary btn-sm">
                                                Düzenle
                                            </Link>
                                            <button
                                                className="btn danger btn-sm"
                                                onClick={() => handleDelete(course.id, course.code)}
                                            >
                                                Sil
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CoursesListPage;
