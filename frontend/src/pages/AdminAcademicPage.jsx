import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sectionsService, usersService } from '../services/academicService';
import Swal from 'sweetalert2';
import './AdminAcademicPage.css';

const AdminAcademicPage = () => {
    const { user } = useAuth();
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal state
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [showStudentsModal, setShowStudentsModal] = useState(false);
    const [selectedSection, setSelectedSection] = useState(null);
    const [faculty, setFaculty] = useState([]);
    const [sectionStudents, setSectionStudents] = useState([]);
    const [studentEmail, setStudentEmail] = useState('');
    const [selectedInstructor, setSelectedInstructor] = useState('');

    // Filter state
    const [filters, setFilters] = useState({
        search: '',
        department_id: '',
        instructor_id: ''
    });

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // Get filtered sections
    const getFilteredSections = () => {
        return sections.filter(section => {
            // Search filter
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const matchCode = section.course?.code?.toLowerCase().includes(searchLower);
                const matchName = section.course?.name?.toLowerCase().includes(searchLower);
                if (!matchCode && !matchName) return false;
            }

            // Department filter
            if (filters.department_id && section.course?.department_id != filters.department_id) {
                return false;
            }

            // Instructor filter
            if (filters.instructor_id && section.instructor?.id != filters.instructor_id) {
                return false;
            }

            return true;
        });
    };

    const [enrollmentOpen, setEnrollmentOpen] = useState(true);

    useEffect(() => {
        fetchData();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const settings = await sectionsService.getSettings();
            if (settings && settings.enrollment_open !== undefined) {
                setEnrollmentOpen(settings.enrollment_open === 'true');
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const handleToggleEnrollment = async () => {
        try {
            const newValue = !enrollmentOpen;
            await sectionsService.updateSettings('enrollment_open', newValue);
            setEnrollmentOpen(newValue);
            Swal.fire({
                icon: 'success',
                title: 'Başarılı',
                text: `Ders kayıtları ${newValue ? 'açıldı' : 'kapatıldı'}.`,
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.fire('Hata', 'Ayar güncellenemedi', 'error');
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [sectionsData, facultyData] = await Promise.all([
                sectionsService.getAll({ limit: 100 }),
                usersService.getFaculty().catch(() => [])
            ]);

            const sectionsArray = sectionsData.sections || sectionsData || [];
            setSections(Array.isArray(sectionsArray) ? sectionsArray : []);
            setFaculty(Array.isArray(facultyData) ? facultyData : []);
            setError(null);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Veriler yüklenirken hata oluştu: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleAssignInstructor = async () => {
        if (!selectedInstructor) {
            Swal.fire('Hata', 'Lütfen bir öğretim üyesi seçin', 'error');
            return;
        }

        try {
            await sectionsService.assignInstructor(selectedSection.id, selectedInstructor);
            Swal.fire('Başarılı!', 'Öğretim üyesi atandı', 'success');
            setShowAssignModal(false);
            setSelectedInstructor('');
            fetchData();
        } catch (err) {
            Swal.fire('Hata', err.response?.data?.message || 'Bir hata oluştu', 'error');
        }
    };

    const handleEnrollStudent = async () => {
        if (!studentEmail) {
            Swal.fire('Hata', 'Lütfen öğrenci emaili girin', 'error');
            return;
        }

        try {
            await sectionsService.enrollStudent(selectedSection.id, studentEmail);
            Swal.fire('Başarılı!', 'Öğrenci kaydedildi', 'success');
            setShowEnrollModal(false);
            setStudentEmail('');
            fetchData();
        } catch (err) {
            Swal.fire('Hata', err.response?.data?.message || 'Bir hata oluştu', 'error');
        }
    };

    const handleViewStudents = async (section) => {
        setSelectedSection(section);
        try {
            const students = await sectionsService.getStudents(section.id);
            setSectionStudents(Array.isArray(students) ? students : []);
            setShowStudentsModal(true);
        } catch (err) {
            Swal.fire('Hata', 'Öğrenci listesi yüklenemedi', 'error');
        }
    };

    if (loading) {
        return (
            <div className="page academic-page">
                <div className="loading-spinner">Yükleniyor...</div>
            </div>
        );
    }

    return (
        <div className="page academic-page">
            <div className="page-header">
                <h1>Akademik Yönetim</h1>
                <p className="page-subtitle">Section'lara öğretim üyesi atayın ve öğrenci kaydedin</p>

                <div className="header-actions" style={{ marginTop: '1rem' }}>
                    <button
                        className={`btn ${enrollmentOpen ? 'btn-danger' : 'btn-success'}`}
                        onClick={handleToggleEnrollment}
                    >
                        {enrollmentOpen ? '🔴 Ders Kayıtlarını Kapat' : '🟢 Ders Kayıtlarını Aç'}
                    </button>
                    <span style={{ marginLeft: '1rem', color: 'var(--text-muted)' }}>
                        Durum: <strong>{enrollmentOpen ? 'Açık' : 'Kapalı'}</strong>
                    </span>
                </div>
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
                        <label>Ara</label>
                        <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Ders kodu veya adı..."
                        />
                    </div>
                    <div className="filter-group">
                        <label>Bölüm</label>
                        <select
                            name="department_id"
                            value={filters.department_id}
                            onChange={handleFilterChange}
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
                        <label>Öğretim Üyesi</label>
                        <select
                            name="instructor_id"
                            value={filters.instructor_id}
                            onChange={handleFilterChange}
                        >
                            <option value="">Tüm Öğretim Üyeleri</option>
                            {faculty.map(f => (
                                <option key={f.id} value={f.id}>{f.full_name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="academic-table-wrapper">
                <table className="academic-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Ders Kodu</th>
                            <th>Ders Adı</th>
                            <th>Section</th>
                            <th>Öğretim Üyesi</th>
                            <th>Kapasite</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(() => {
                            const filteredSections = getFilteredSections();
                            if (filteredSections.length === 0) {
                                return (
                                    <tr>
                                        <td colSpan="7" className="empty-state">
                                            {sections.length === 0 ? 'Henüz section bulunmuyor' : 'Filtreye uygun section bulunamadı'}
                                        </td>
                                    </tr>
                                );
                            }
                            return filteredSections.map(section => (
                                <tr key={section.id}>
                                    <td>{section.id}</td>
                                    <td className="course-code">{section.course?.code || '-'}</td>
                                    <td>{section.course?.name || '-'}</td>
                                    <td>
                                        <span className="section-badge-small">Section {section.section_number}</span>
                                    </td>
                                    <td>
                                        {section.instructor ? (
                                            <span className="instructor-name">{section.instructor.full_name}</span>
                                        ) : (
                                            <span className="no-instructor">Atanmadı</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className="capacity-info">
                                            {section.enrolled_count}/{section.capacity}
                                        </span>
                                    </td>
                                    <td className="actions-cell">
                                        <button
                                            className="action-btn assign"
                                            onClick={() => {
                                                setSelectedSection(section);
                                                setSelectedInstructor(section.instructor?.id || '');
                                                setShowAssignModal(true);
                                            }}
                                            title="Öğretim Üyesi Ata"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                            </svg>
                                        </button>
                                        <button
                                            className="action-btn enroll"
                                            onClick={() => {
                                                setSelectedSection(section);
                                                setShowEnrollModal(true);
                                            }}
                                            title="Öğrenci Ekle"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                <circle cx="8.5" cy="7" r="4" />
                                                <line x1="20" y1="8" x2="20" y2="14" />
                                                <line x1="23" y1="11" x2="17" y2="11" />
                                            </svg>
                                        </button>
                                        <button
                                            className="action-btn view"
                                            onClick={() => handleViewStudents(section)}
                                            title="Öğrencileri Gör"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ));
                        })()}
                    </tbody>
                </table>
            </div>

            {/* Assign Instructor Modal */}
            {showAssignModal && (
                <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Öğretim Üyesi Ata</h2>
                            <button className="modal-close" onClick={() => setShowAssignModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p className="modal-info">
                                <strong>{selectedSection?.course?.code} - {selectedSection?.course?.name}</strong>
                                <br />
                                Section {selectedSection?.section_number}
                            </p>
                            <div className="form-group">
                                <label>Öğretim Üyesi Seçin</label>
                                <select
                                    value={selectedInstructor}
                                    onChange={(e) => setSelectedInstructor(e.target.value)}
                                >
                                    <option value="">Seçiniz...</option>
                                    {faculty.map(f => (
                                        <option key={f.id} value={f.id}>
                                            {f.full_name} ({f.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn secondary" onClick={() => setShowAssignModal(false)}>İptal</button>
                            <button className="btn" onClick={handleAssignInstructor}>Ata</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Enroll Student Modal */}
            {showEnrollModal && (
                <div className="modal-overlay" onClick={() => setShowEnrollModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Öğrenci Kaydet</h2>
                            <button className="modal-close" onClick={() => setShowEnrollModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p className="modal-info">
                                <strong>{selectedSection?.course?.code} - {selectedSection?.course?.name}</strong>
                                <br />
                                Section {selectedSection?.section_number}
                            </p>
                            <div className="form-group">
                                <label>Öğrenci E-postası</label>
                                <input
                                    type="email"
                                    value={studentEmail}
                                    onChange={(e) => setStudentEmail(e.target.value)}
                                    placeholder="ornek@ogrenci.edu.tr"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn secondary" onClick={() => setShowEnrollModal(false)}>İptal</button>
                            <button className="btn" onClick={handleEnrollStudent}>Kaydet</button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Students Modal */}
            {showStudentsModal && (
                <div className="modal-overlay" onClick={() => setShowStudentsModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Kayıtlı Öğrenciler</h2>
                            <button className="modal-close" onClick={() => setShowStudentsModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p className="modal-info">
                                <strong>{selectedSection?.course?.code} - {selectedSection?.course?.name}</strong>
                                <br />
                                Section {selectedSection?.section_number}
                            </p>
                            {sectionStudents.length === 0 ? (
                                <p className="empty-message">Henüz kayıtlı öğrenci yok</p>
                            ) : (
                                <ul className="students-list">
                                    {sectionStudents.map(student => (
                                        <li key={student.id}>
                                            <span className="student-name">{student.full_name}</span>
                                            <span className="student-email">{student.email}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn secondary" onClick={() => setShowStudentsModal(false)}>Kapat</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAcademicPage;
