import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sectionsService, enrollmentsService } from '../services/academicService';
import Swal from 'sweetalert2';
import './SectionDetailPage.css';

const SectionDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    fetchSection();
  }, [id, user?.id]);

  const fetchSection = async () => {
    try {
      setLoading(true);
      const data = await sectionsService.getById(id);
      setSection(data);

      // Check if current user is enrolled
      if (user?.role === 'student' && data.enrollments) {
        const enrolled = data.enrollments.some(
          e => e.student_id === user.id && e.status === 'ACTIVE'
        );
        setIsEnrolled(enrolled);
      }

      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Section yüklenirken hata oluştu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bu section\'ı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setDeleting(true);
      await sectionsService.delete(id);
      navigate('/sections');
    } catch (err) {
      alert(err.response?.data?.message || 'Section silinirken hata oluştu');
      setDeleting(false);
    }
  };

  const handleEnroll = async () => {
    if (!section) return;

    // Check if section is full
    if (section.is_full) {
      Swal.fire({
        icon: 'warning',
        title: 'Kontenjan Dolu',
        text: 'Bu bölümün kontenjanı dolmuş. Başka bir bölüm seçebilirsiniz.',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Derse Kayıt Ol',
      html: `
        <p><strong>${section.course?.code} - ${section.course?.name}</strong></p>
        <p>Section: ${section.section_number}</p>
        <p>Dönem: ${section.semester}</p>
        <p>Bu derse kayıt olmak istediğinizden emin misiniz?</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Evet, Kayıt Ol',
      cancelButtonText: 'İptal',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280'
    });

    if (!result.isConfirmed) return;

    try {
      setEnrolling(true);
      await enrollmentsService.enroll(section.id);

      Swal.fire({
        icon: 'success',
        title: 'Kayıt Başarılı! 🎉',
        text: 'Derse başarıyla kayıt oldunuz.',
        confirmButtonColor: '#10b981'
      });

      // Refresh section data
      await fetchSection();
    } catch (err) {
      const errorData = err.response?.data;
      let errorMessage = errorData?.message || 'Kayıt olurken hata oluştu';
      let errorDetails = '';

      // Handle schedule conflict
      if (errorData?.conflicts && errorData.conflicts.length > 0) {
        errorMessage = 'Program Çakışması Tespit Edildi! ⚠️';
        errorDetails = '<div style="text-align: left; margin-top: 1rem;"><strong>Çakışan dersler:</strong><ul style="margin-top: 0.5rem;">';
        errorData.conflicts.forEach(conflict => {
          errorDetails += `<li><strong>${conflict.course_code}</strong> - ${conflict.course_name}<br/>`;
          errorDetails += `${conflict.conflict_day} ${conflict.conflict_time}</li>`;
        });
        errorDetails += '</ul></div>';
      }

      // Handle prerequisites
      if (errorData?.missing_prerequisites && errorData.missing_prerequisites.length > 0) {
        errorMessage = 'Önkoşul Eksik! 📚';
        errorDetails = '<div style="text-align: left; margin-top: 1rem;"><strong>Tamamlanması gereken dersler:</strong><ul style="margin-top: 0.5rem;">';
        errorData.missing_prerequisites.forEach(prereq => {
          errorDetails += `<li><strong>${prereq.course_code}</strong> - ${prereq.course_name}</li>`;
        });
        errorDetails += '</ul></div>';
      }

      Swal.fire({
        icon: 'error',
        title: errorMessage,
        html: errorDetails || errorMessage,
        confirmButtonColor: '#ef4444',
        width: '600px'
      });
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="page section-detail-page">
        <div className="loading-spinner">Yükleniyor...</div>
      </div>
    );
  }

  if (error || !section) {
    return (
      <div className="page section-detail-page">
        <div className="alert alert-error">
          {error || 'Section bulunamadı'}
        </div>
        <Link to="/sections" className="btn">Geri Dön</Link>
      </div>
    );
  }

  return (
    <div className="page section-detail-page">
      <div className="page-header">
        <div>
          <Link to="/sections" className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Sections
          </Link>
          <h1>
            {section.course?.name || 'Ders Adı Yok'}
            <span className="section-badge">Section {section.section_number}</span>
          </h1>
        </div>
        <div className="action-buttons">
          {/* Student: Enroll button */}
          {user?.role === 'student' && !isEnrolled && (
            <button
              className="btn primary"
              onClick={handleEnroll}
              disabled={enrolling || section.is_full}
            >
              {enrolling ? 'Kayıt Olunuyor...' : section.is_full ? 'Kontenjan Dolu' : 'Kayıt Ol'}
            </button>
          )}

          {/* Student: Already enrolled message */}
          {user?.role === 'student' && isEnrolled && (
            <div className="enrolled-badge" style={{
              padding: '0.5rem 1rem',
              background: '#10b981',
              color: 'white',
              borderRadius: '8px',
              fontWeight: '500'
            }}>
              ✓ Kayıtlısınız
            </div>
          )}

          {/* Admin/Faculty: Edit and Delete buttons */}
          {(user?.role === 'admin' || (user?.role === 'faculty' && section.instructor_id === user.id)) && (
            <>
              <Link to={`/sections/${id}/edit`} className="btn secondary">
                Düzenle
              </Link>
              {user?.role === 'admin' && (
                <button
                  className="btn danger"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Siliniyor...' : 'Sil'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="section-detail-grid">
        {/* Main Info */}
        <div className="detail-card">
          <h2>Genel Bilgiler</h2>
          <div className="info-grid">
            <div className="info-row">
              <span className="label">Ders Kodu:</span>
              <span className="value">{section.course?.code || '-'}</span>
            </div>
            <div className="info-row">
              <span className="label">Ders Adı:</span>
              <span className="value">{section.course?.name || '-'}</span>
            </div>
            <div className="info-row">
              <span className="label">Dönem:</span>
              <span className="value">{section.semester}</span>
            </div>
            <div className="info-row">
              <span className="label">Öğretim Üyesi:</span>
              <span className="value">{section.instructor?.full_name || 'Atanmadı'}</span>
            </div>
            <div className="info-row">
              <span className="label">Kapasite:</span>
              <span className="value">
                {section.enrolled_count} / {section.capacity} öğrenci
              </span>
            </div>
            <div className="info-row">
              <span className="label">Boş Kontenjan:</span>
              <span className={`value ${section.is_full ? 'full' : 'available'}`}>
                {section.available_spots !== undefined
                  ? section.available_spots
                  : section.capacity - section.enrolled_count} boş
              </span>
            </div>
          </div>
        </div>

        {/* Schedule */}
        {section.schedule && section.schedule.length > 0 && (
          <div className="detail-card">
            <h2>Program</h2>
            <div className="schedule-list">
              {section.schedule.map((item, index) => (
                <div key={index} className="schedule-item">
                  <div className="schedule-day">{item.day}</div>
                  <div className="schedule-time">
                    {item.start} - {item.end}
                  </div>
                  {item.classroom && (
                    <div className="schedule-room">
                      {item.classroom.building} - {item.classroom.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enrolled Students */}
        {section.enrollments && section.enrollments.length > 0 && (
          <div className="detail-card">
            <h2>Kayıtlı Öğrenciler ({section.enrollments.length})</h2>
            <div className="students-list">
              {section.enrollments.map((enrollment) => (
                <div key={enrollment.id} className="student-item">
                  <div>
                    <div className="student-name">
                      {enrollment.student?.full_name || 'İsimsiz'}
                    </div>
                    <div className="student-email">
                      {enrollment.student?.email || '-'}
                    </div>
                  </div>
                  <div className="enrollment-date">
                    {new Date(enrollment.enrollment_date).toLocaleDateString('tr-TR')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attendance Sessions */}
        {section.sessions && section.sessions.length > 0 && (
          <div className="detail-card">
            <h2>Yoklama Oturumları</h2>
            <div className="sessions-list">
              {section.sessions.map((session) => (
                <div key={session.id} className="session-item">
                  <div>
                    <div className="session-date">
                      {new Date(session.start_time).toLocaleDateString('tr-TR')}
                    </div>
                    <div className="session-time">
                      {new Date(session.start_time).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })} - {session.end_time && new Date(session.end_time).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className={`session-status ${session.status.toLowerCase()}`}>
                    {session.status === 'ACTIVE' ? 'Aktif' : 'Kapalı'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SectionDetailPage;

