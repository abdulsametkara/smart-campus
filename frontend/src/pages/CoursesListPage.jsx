import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coursesService, enrollmentsService } from '../services/academicService';
import LoadingSpinner from '../components/LoadingSpinner';
import { useThemeMode } from '../context/ThemeContext';
import './CoursesListPage.css';

const CoursesListPage = () => {
    const { user } = useAuth();
    const { t } = useThemeMode();
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

            if (user?.role === 'student') {
                const data = await enrollmentsService.getMyEnrollments();
                const myCourses = (data.enrollments || []).map(e => {
                    // Only show ACTIVE (approved) courses
                    if (e.status !== 'ACTIVE') return null;

                    // Extract course from enrollment -> section -> course
                    const course = e.section?.course;
                    return course ? {
                        ...course,
                        department: course.department
                    } : null;
                }).filter(Boolean);

                // Remove duplicates if any (though technically shouldn't happen for active enrollments)
                const uniqueCourses = Array.from(new Map(myCourses.map(c => [c.id, c])).values());
                setCourses(uniqueCourses);
            } else {
                const data = await coursesService.getAll({ limit: 100 });
                setCourses(Array.isArray(data) ? data : data.courses || []);
            }

            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || t('fetchError') || 'Dersler yüklenirken hata oluştu');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, code) => {
        if (!window.confirm(t('confirmDeleteCourse', { code }).replace('{{code}}', code))) {
            return;
        }
        try {
            await coursesService.delete(id);
            setCourses(courses.filter(c => c.id !== id));
        } catch (err) {
            alert(err.response?.data?.message || t('courseDeleteError'));
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
                    <h1>{t('coursesTitle')}</h1>
                </div>
                <LoadingSpinner size="large" message={t('loading')} />
            </div>
        );
    }

    return (
        <div className="page courses-page">
            <div className="page-header">
                <h1>{t('coursesTitle')}</h1>
                {user?.role === 'admin' && (
                    <Link to="/courses/new" className="btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        {t('addNewCourse')}
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
                    placeholder={t('searchCoursesPlaceholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Courses Table */}
            <div className="courses-table-wrapper">
                <table className="courses-table">
                    <thead>
                        <tr>
                            <th>{t('courseCode') || 'Ders Kodu'}</th>
                            <th>{t('courseName') || 'Ders Adı'}</th>
                            <th>{t('credits')}</th>
                            <th>{t('ects')}</th>
                            <th>{t('weeklyHours')}</th>
                            <th>{t('department')}</th>
                            {user?.role === 'admin' && <th>{t('actions') || 'İşlemler'}</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCourses.length === 0 ? (
                            <tr>
                                <td colSpan={user?.role === 'admin' ? 7 : 6} className="empty-state">
                                    {t('noCoursesFound')}
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
                                                {t('edit') || 'Düzenle'}
                                            </Link>
                                            <button
                                                className="btn danger btn-sm"
                                                onClick={() => handleDelete(course.id, course.code)}
                                            >
                                                {t('delete') || 'Sil'}
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
