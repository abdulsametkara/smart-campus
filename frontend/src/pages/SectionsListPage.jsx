import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sectionsService, coursesService, usersService } from '../services/academicService';
import LoadingSpinner from '../components/LoadingSpinner';
import './SectionsListPage.css';

const SectionsListPage = () => {
  const { user } = useAuth();
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    course_id: '',
    semester: '',
    instructor_id: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    fetchSections();
  }, [filters, pagination.page]);

  const fetchDropdownData = async () => {
    try {
      const [coursesData, instructorsData] = await Promise.all([
        coursesService.getAll({ limit: 100 }).catch(() => []),
        usersService.getFaculty().catch(() => [])
      ]);
      setCourses(Array.isArray(coursesData) ? coursesData : coursesData.courses || []);
      setInstructors(Array.isArray(instructorsData) ? instructorsData : []);
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  };

  const fetchSections = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key];
      });

      const data = await sectionsService.getAll(params);
      setSections(data.sections || data);
      if (data.pagination) {
        setPagination(prev => ({ ...prev, ...data.pagination }));
      }
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Bölümler yüklenirken hata oluştu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (loading && sections.length === 0) {
    return (
      <div className="page sections-page">
        <div className="page-header">
          <h1>Sections</h1>
        </div>
        <LoadingSpinner size="large" message="Şubeler yükleniyor..." />
      </div>
    );
  }

  return (
    <div className="page sections-page">
      <div className="page-header">
        <h1>Sections</h1>
        {(user?.role === 'admin' || user?.role === 'faculty') && (
          <Link to="/sections/new" className="btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Yeni Section Ekle
          </Link>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="filters-card">
        <h3>Filtrele</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Dönem</label>
            <select
              name="semester"
              value={filters.semester}
              onChange={handleFilterChange}
            >
              <option value="">Tüm Dönemler</option>
              <option value="2024-FALL">2024-FALL (Güz)</option>
              <option value="2024-SPRING">2024-SPRING (Bahar)</option>
              <option value="2024-SUMMER">2024-SUMMER (Yaz)</option>
              <option value="2025-FALL">2025-FALL (Güz)</option>
              <option value="2025-SPRING">2025-SPRING (Bahar)</option>
              <option value="2025-SUMMER">2025-SUMMER (Yaz)</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Bölüm (Department)</label>
            <select
              name="department_id"
              value={filters.department_id || ''}
              onChange={(e) => {
                handleFilterChange(e);
                // Reset course filter when department changes
                setFilters(prev => ({ ...prev, course_id: '' }));
              }}
            >
              <option value="">Tüm Bölümler</option>
              <option value="1">Bilgisayar Mühendisliği</option>
              <option value="2">Elektrik-Elektronik Müh.</option>
              <option value="3">Makine Mühendisliği</option>
              <option value="4">Endüstri Mühendisliği</option>
              <option value="5">Matematik</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Ders</label>
            <select
              name="course_id"
              value={filters.course_id}
              onChange={handleFilterChange}
            >
              <option value="">Tüm Dersler</option>
              {courses
                .filter(course => !filters.department_id || course.department_id == filters.department_id)
                .map(course => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Öğretim Üyesi</label>
            <select
              name="instructor_id"
              value={filters.instructor_id}
              onChange={handleFilterChange}
            >
              <option value="">Tüm Öğretim Üyeleri</option>
              {instructors.map(instructor => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="sections-grid">
        {(() => {
          // Filter sections by department on frontend
          const filteredSections = filters.department_id
            ? sections.filter(s => s.course?.department_id == filters.department_id)
            : sections;

          if (filteredSections.length === 0) {
            return (
              <div className="empty-state">
                <p>Henüz section bulunmuyor.</p>
              </div>
            );
          }

          return filteredSections.map(section => (
            <Link
              key={section.id}
              to={`/sections/${section.id}`}
              className="section-card"
            >
              <div className="section-card-header">
                <div className="section-badge">
                  Section {section.section_number}
                </div>
                <div className={`capacity-badge ${section.is_full ? 'full' : 'available'}`}>
                  {section.available_spots !== undefined
                    ? `${section.available_spots} boş`
                    : `${section.capacity - section.enrolled_count} boş`}
                </div>
              </div>

              <div className="section-card-body">
                <h3>{section.course?.name || 'Ders Adı Yok'}</h3>
                <p className="course-code">{section.course?.code || '-'}</p>

                <div className="section-info">
                  <div className="info-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>{section.instructor?.full_name || 'Atanmadı'}</span>
                  </div>

                  <div className="info-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>{section.semester}</span>
                  </div>

                  <div className="info-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <span>{section.enrolled_count}/{section.capacity} öğrenci</span>
                  </div>
                </div>
              </div>
            </Link>
          ));
        })()}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn secondary"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Önceki
          </button>
          <span>
            Sayfa {pagination.page} / {pagination.totalPages}
          </span>
          <button
            className="btn secondary"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            Sonraki
          </button>
        </div>
      )}
    </div>
  );
};

export default SectionsListPage;
