import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sectionsService, coursesService, usersService, classroomsService } from '../services/academicService';
import './SectionFormPage.css';

const SectionFormPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    course_id: '',
    section_number: '',
    semester: '',
    instructor_id: '',
    capacity: '',
    schedule: [{ day: 'Monday', start: '09:00', end: '12:00', room_id: '' }]
  });

  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDropdownData();
    if (isEdit) {
      fetchSection();
    }
  }, [id]);

  const fetchDropdownData = async () => {
    try {
      const [coursesData, instructorsData, classroomsData] = await Promise.all([
        coursesService.getAll().catch(() => []),
        usersService.getFaculty().catch(() => []),
        classroomsService.getAll().catch(() => [])
      ]);

      setCourses(Array.isArray(coursesData) ? coursesData : coursesData.courses || []);
      setInstructors(Array.isArray(instructorsData) ? instructorsData : instructorsData.users || []);
      setClassrooms(Array.isArray(classroomsData) ? classroomsData : classroomsData.classrooms || []);
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  };

  const fetchSection = async () => {
    try {
      setLoading(true);
      const section = await sectionsService.getById(id);
      setFormData({
        course_id: section.course_id || '',
        section_number: section.section_number || '',
        semester: section.semester || '',
        instructor_id: section.instructor_id || '',
        capacity: section.capacity || '',
        schedule: section.schedule && section.schedule.length > 0
          ? section.schedule
          : [{ day: 'Monday', start: '09:00', end: '12:00', room_id: '' }]
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Bölüm yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleScheduleChange = (index, field, value) => {
    const newSchedule = [...formData.schedule];
    newSchedule[index] = {
      ...newSchedule[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      schedule: newSchedule
    }));
  };

  const addScheduleItem = () => {
    setFormData(prev => ({
      ...prev,
      schedule: [...prev.schedule, { day: 'Monday', start: '09:00', end: '12:00', room_id: '' }]
    }));
  };

  const removeScheduleItem = (index) => {
    if (formData.schedule.length > 1) {
      setFormData(prev => ({
        ...prev,
        schedule: prev.schedule.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // Clean schedule - remove empty room_id
      const cleanedSchedule = formData.schedule.map(item => {
        const cleaned = { ...item };
        if (!cleaned.room_id || cleaned.room_id === '') {
          delete cleaned.room_id;
        }
        return cleaned;
      });

      const submitData = {
        ...formData,
        course_id: parseInt(formData.course_id),
        section_number: parseInt(formData.section_number),
        instructor_id: parseInt(formData.instructor_id),
        capacity: parseInt(formData.capacity),
        schedule: cleanedSchedule
      };

      if (isEdit) {
        await sectionsService.update(id, submitData);
        alert('Bölüm başarıyla güncellendi!');
      } else {
        await sectionsService.create(submitData);
        alert('Bölüm başarıyla oluşturuldu!');
      }

      navigate('/sections');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.details?.join(', ') || 'Bir hata oluştu');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page section-form-page">
        <div className="loading-spinner">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="page section-form-page">
      <div className="page-header">
        <h1>{isEdit ? 'Section Düzenle' : 'Yeni Section Ekle'}</h1>
        <button className="btn secondary" onClick={() => navigate('/sections')}>
          İptal
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="section-form">
        <div className="form-grid">
          <div className="form-group">
            <label>Ders *</label>
            <select
              name="course_id"
              value={formData.course_id}
              onChange={handleChange}
              required
            >
              <option value="">Ders Seçin</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Section Number *</label>
            <input
              type="number"
              name="section_number"
              value={formData.section_number}
              onChange={handleChange}
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label>Dönem *</label>
            <select
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              required
            >
              <option value="">Dönem Seçin</option>
              <option value="2024-FALL">2024-FALL (Güz)</option>
              <option value="2024-SPRING">2024-SPRING (Bahar)</option>
              <option value="2024-SUMMER">2024-SUMMER (Yaz)</option>
              <option value="2025-FALL">2025-FALL (Güz)</option>
              <option value="2025-SPRING">2025-SPRING (Bahar)</option>
              <option value="2025-SUMMER">2025-SUMMER (Yaz)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Öğretim Üyesi *</label>
            <select
              name="instructor_id"
              value={formData.instructor_id}
              onChange={handleChange}
              required
            >
              <option value="">Öğretim Üyesi Seçin</option>
              {instructors.map(instructor => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.full_name || instructor.name} ({instructor.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Kapasite *</label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              min="1"
              required
            />
          </div>
        </div>

        <div className="schedule-section">
          <div className="schedule-header">
            <h3>Program</h3>
            <button type="button" className="btn secondary btn-sm" onClick={addScheduleItem}>
              + Ders Saati Ekle
            </button>
          </div>

          {formData.schedule.map((item, index) => (
            <div key={index} className="schedule-item-form">
              <div className="form-group">
                <label>Gün</label>
                <select
                  value={item.day}
                  onChange={(e) => handleScheduleChange(index, 'day', e.target.value)}
                  required
                >
                  <option value="Monday">Pazartesi</option>
                  <option value="Tuesday">Salı</option>
                  <option value="Wednesday">Çarşamba</option>
                  <option value="Thursday">Perşembe</option>
                  <option value="Friday">Cuma</option>
                  <option value="Saturday">Cumartesi</option>
                  <option value="Sunday">Pazar</option>
                </select>
              </div>

              <div className="form-group">
                <label>Başlangıç</label>
                <input
                  type="time"
                  value={item.start}
                  onChange={(e) => handleScheduleChange(index, 'start', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Bitiş</label>
                <input
                  type="time"
                  value={item.end}
                  onChange={(e) => handleScheduleChange(index, 'end', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Derslik (Opsiyonel)</label>
                <select
                  value={item.room_id || ''}
                  onChange={(e) => handleScheduleChange(index, 'room_id', e.target.value)}
                >
                  <option value="">Derslik Seçin</option>
                  {classrooms.map(classroom => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.building} - {classroom.name}
                    </option>
                  ))}
                </select>
              </div>

              {formData.schedule.length > 1 && (
                <button
                  type="button"
                  className="btn danger btn-sm"
                  onClick={() => removeScheduleItem(index)}
                >
                  Sil
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button type="button" className="btn secondary" onClick={() => navigate('/sections')}>
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

export default SectionFormPage;

