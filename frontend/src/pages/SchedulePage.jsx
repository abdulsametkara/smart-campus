
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sectionsService, enrollmentsService } from '../services/academicService';
import LoadingSpinner from '../components/LoadingSpinner';
import WeeklyCalendar from '../components/WeeklyCalendar';
import NotificationService from '../services/notificationService';
import './SchedulePage.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
const DAY_LABELS = {
    'Monday': 'Pazartesi',
    'Tuesday': 'Salı',
    'Wednesday': 'Çarşamba',
    'Thursday': 'Perşembe',
    'Friday': 'Cuma'
};

// Color palette for different courses
const COLORS = [
    '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
    '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1'
];

const SchedulePage = () => {
    const { user } = useAuth();
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [scheduleItems, setScheduleItems] = useState([]);
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'calendar'

    useEffect(() => {
        fetchSchedule();
    }, [user?.role]);

    const fetchSchedule = async () => {
        try {
            setLoading(true);
            setError(null);
            let sectionsArray = [];

            if (user?.role === 'student') {
                // Öğrenciler için: Sadece AKTİF kayıtlı dersler
                const response = await enrollmentsService.getMyEnrollments();
                // Farklı response formatlarını handle et
                const enrollments = Array.isArray(response) ? response : (response?.enrollments || response?.data || []);
                // Sadece ACTIVE enrollments'ları filtrele ve sections'ları çıkar
                sectionsArray = enrollments
                    .filter(e => e.status === 'ACTIVE')
                    .map(e => e.section || e.CourseSection)
                    .filter(s => s && s.schedule); // Schedule'ı olanları al
            } else if (user?.role === 'faculty') {
                // Öğretim üyeleri için: Verdiği dersler
                const data = await sectionsService.getMySections();
                sectionsArray = (data.sections || data || []).filter(s => s.schedule);
            } else {
                // Admin veya diğer: Tüm dersler (sınırlı)
                const data = await sectionsService.getAll({ limit: 50 });
                sectionsArray = (data.sections || data || []).filter(s => s.schedule);
            }

            setSections(sectionsArray);

            // Schedule items'ları parse et
            const items = [];
            sectionsArray.forEach((section, index) => {
                const schedule = section.schedule || [];
                const color = COLORS[index % COLORS.length];

                if (Array.isArray(schedule) && schedule.length > 0) {
                    schedule.forEach(slot => {
                        // Day formatını kontrol et (Monday veya Pazartesi)
                        let dayName = slot.day || slot.day_of_week;
                        if (dayName && !DAYS.includes(dayName)) {
                            // Türkçe gün adını İngilizce'ye çevir
                            const dayMap = {
                                'Pazartesi': 'Monday',
                                'Salı': 'Tuesday',
                                'Çarşamba': 'Wednesday',
                                'Perşembe': 'Thursday',
                                'Cuma': 'Friday'
                            };
                            dayName = dayMap[dayName] || dayName;
                        }

                        items.push({
                            id: `${section.id}-${dayName}-${slot.start || slot.start_time}`,
                            sectionId: section.id,
                            courseCode: section.course?.code || section.course_code || '',
                            courseName: section.course?.name || section.course_name || '',
                            sectionNumber: section.section_number,
                            instructor: section.instructor?.full_name || section.instructor_name || '',
                            day: dayName,
                            startTime: slot.start || slot.start_time || '08:00',
                            endTime: slot.end || slot.end_time || '09:00',
                            room: slot.classroom?.name || slot.room_name || (slot.room_id ? `Sınıf ${slot.room_id}` : ''),
                            color
                        });
                    });
                }
            });

            setScheduleItems(items);
            
            if (sectionsArray.length === 0) {
                setError(null); // Hata değil, sadece ders yok
            }
        } catch (err) {
            console.error('Ders programı yükleme hatası:', err);
            const errorMessage = err.response?.data?.message || 'Ders programı yüklenirken bir hata oluştu.';
            setError(errorMessage);
            NotificationService.error('Hata', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Calculate position and height for a schedule item
    const getItemStyle = (item) => {
        const startHour = parseInt(item.startTime.split(':')[0]);
        const startMin = parseInt(item.startTime.split(':')[1]) || 0;
        const endHour = parseInt(item.endTime.split(':')[0]);
        const endMin = parseInt(item.endTime.split(':')[1]) || 0;

        const top = (startHour - 8) * 60 + startMin;
        const height = (endHour - startHour) * 60 + (endMin - startMin);

        return {
            top: `${top}px`,
            height: `${height}px`,
            backgroundColor: item.color
        };
    };

    // Get items for a specific day
    const getItemsForDay = (day) => {
        return scheduleItems.filter(item => item.day === day);
    };

    // Check for conflicts
    const hasConflict = (item1, item2) => {
        if (item1.day !== item2.day || item1.id === item2.id) return false;
        const start1 = parseInt(item1.startTime.replace(':', ''));
        const end1 = parseInt(item1.endTime.replace(':', ''));
        const start2 = parseInt(item2.startTime.replace(':', ''));
        const end2 = parseInt(item2.endTime.replace(':', ''));
        return start1 < end2 && end1 > start2;
    };

    // Get all conflicts
    const conflicts = [];
    for (let i = 0; i < scheduleItems.length; i++) {
        for (let j = i + 1; j < scheduleItems.length; j++) {
            if (hasConflict(scheduleItems[i], scheduleItems[j])) {
                conflicts.push({
                    item1: scheduleItems[i],
                    item2: scheduleItems[j]
                });
            }
        }
    }

    if (loading) {
        return (
            <div className="page schedule-page">
                <LoadingSpinner size="large" message="Ders programı yükleniyor..." />
            </div>
        );
    }

    return (
        <div className="page schedule-page">
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <h1>Ders Programı</h1>
                        <p className="page-subtitle">
                            {user?.role === 'student' ? 'Kayıtlı olduğunuz derslerin haftalık programı' :
                                user?.role === 'faculty' ? 'Verdiğiniz derslerin haftalık programı' :
                                    'Tüm derslerin haftalık programı'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <div className="schedule-view-toggle" style={{ display: 'flex', gap: '0.25rem' }}>
                            <button
                                type="button"
                                className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setViewMode('table')}
                            >
                                📋 Tablo
                            </button>
                            <button
                                type="button"
                                className={`btn btn-sm ${viewMode === 'calendar' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setViewMode('calendar')}
                            >
                                📅 Takvim
                            </button>
                        </div>
                        <button
                            className="btn btn-sm btn-secondary"
                            onClick={async () => {
                                try {
                                    const blob = await sectionsService.exportICal();
                                    const url = window.URL.createObjectURL(new Blob([blob]));
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.setAttribute('download', 'ders-programi.ics');
                                    document.body.appendChild(link);
                                    link.click();
                                    link.parentNode.removeChild(link);
                                    NotificationService.success('Başarılı', 'iCal dosyası indirildi.');
                                } catch (err) {
                                    console.error('iCal export hatası:', err);
                                    NotificationService.error('Hata', 'Takvim dosyası indirilirken bir hata oluştu.');
                                }
                            }}
                            title="Takviminize ekle"
                        >
                            📥 İndir
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                    <strong>⚠️ Hata:</strong> {error}
                </div>
            )}

            {/* Conflict Warnings - Sadece önemli çakışmalar için */}
            {conflicts.length > 0 && (
                <div className="alert alert-warning" style={{ marginBottom: '1rem', padding: '0.75rem 1rem' }}>
                    <strong>⚠️ Uyarı:</strong> {conflicts.length} ders çakışması tespit edildi.
                </div>
            )}

            {sections.length === 0 ? (
                <div className="empty-state-card">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <h3>Henüz ders yok</h3>
                    <p>
                        {user?.role === 'student'
                            ? 'Henüz bir derse kayıt olmadınız.'
                            : 'Size atanmış ders bulunmuyor.'}
                    </p>
                    {user?.role === 'student' && (
                        <Link to="/sections" className="btn">Ders Seç</Link>
                    )}
                </div>
            ) : (
                <>
                    {viewMode === 'table' && (
                        <div className="timetable-container" style={{ marginTop: '1rem' }}>
                            <div className="timetable">
                                {/* Time column */}
                                <div className="time-column">
                                    <div className="time-header"></div>
                                    {HOURS.map(hour => (
                                        <div key={hour} className="time-slot">
                                            <span>{hour}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Day columns */}
                                {DAYS.map(day => (
                                    <div key={day} className="day-column">
                                        <div className="day-header">
                                            <span className="day-name">{DAY_LABELS[day]}</span>
                                        </div>
                                        <div className="day-slots">
                                            {HOURS.map(hour => (
                                                <div key={hour} className="hour-slot"></div>
                                            ))}
                                            {/* Schedule items */}
                                            {getItemsForDay(day).map(item => (
                                                <Link
                                                    key={item.id}
                                                    to={`/sections/${item.sectionId}`}
                                                    className="schedule-item"
                                                    style={getItemStyle(item)}
                                                    title={`${item.courseCode} - ${item.courseName}\n${item.startTime} - ${item.endTime}\n${item.room || 'Sınıf belirtilmemiş'}\n${item.instructor || 'Öğretim üyesi belirtilmemiş'}`}
                                                >
                                                    <div className="schedule-item-code" style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                                                        {item.courseCode}
                                                    </div>
                                                    <div className="schedule-item-name" style={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.25rem' }}>
                                                        {item.courseName}
                                                    </div>
                                                    <div className="schedule-item-time" style={{ fontSize: '0.7rem', marginBottom: '0.25rem', opacity: 0.9 }}>
                                                        {item.startTime.substring(0, 5)} - {item.endTime.substring(0, 5)}
                                                    </div>
                                                    {item.instructor && (
                                                        <div className="schedule-item-instructor" style={{ fontSize: '0.7rem', opacity: 0.85, marginBottom: '0.15rem' }}>
                                                            👤 {item.instructor}
                                                        </div>
                                                    )}
                                                    {item.room && (
                                                        <div className="schedule-item-room" style={{ fontSize: '0.7rem', opacity: 0.85 }}>
                                                            🏫 {item.room}
                                                        </div>
                                                    )}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {viewMode === 'calendar' && (
                        <div className="calendar-view-container" style={{ marginTop: '1rem' }}>
                            {scheduleItems.length > 0 ? (
                                <WeeklyCalendar
                                    items={scheduleItems.map(item => ({
                                        id: item.id,
                                        title: `${item.courseCode} - ${item.courseName}`,
                                        day: item.day,
                                        startTime: item.startTime,
                                        endTime: item.endTime,
                                        backgroundColor: item.color,
                                        description: `${item.sectionNumber}. Şube${item.instructor ? ` • ${item.instructor}` : ''}`,
                                        location: item.room || 'Sınıf belirtilmemiş'
                                    }))}
                                    height="auto"
                                />
                            ) : (
                                <div className="empty-state-card">
                                    <p>Takvim görünümü için ders programı bulunamadı.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Compact Legend - Sadece ders sayısı göster */}
                    {sections.length > 0 && (
                        <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: '#f9fafb', borderRadius: '8px', fontSize: '0.875rem', color: '#6b7280' }}>
                            <strong>Toplam {sections.length} ders</strong> • 
                            {sections.map((section, index) => (
                                <span key={section.id} style={{ marginLeft: '0.5rem' }}>
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '3px',
                                            backgroundColor: COLORS[index % COLORS.length],
                                            marginRight: '0.25rem',
                                            verticalAlign: 'middle'
                                        }}
                                    ></span>
                                    {section.course?.code}
                                </span>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SchedulePage;

