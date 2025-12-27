import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sectionsService, enrollmentsService } from '../services/academicService';
import LoadingSpinner from '../components/LoadingSpinner';
import { useThemeMode } from '../context/ThemeContext';
import './SchedulePage.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

// Color palette for different courses
const COLORS = [
    '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
    '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1'
];

const SchedulePage = () => {
    const { user } = useAuth();
    const { t } = useThemeMode();
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [scheduleItems, setScheduleItems] = useState([]);

    useEffect(() => {
        fetchSchedule();
    }, [user?.role]);

    const fetchSchedule = async () => {
        try {
            setLoading(true);
            let sectionsArray = [];

            if (user?.role === 'student') {
                // For students: Get only ACTIVE enrolled sections
                const response = await enrollmentsService.getMyEnrollments();
                // Handle different response formats
                const enrollments = Array.isArray(response) ? response : (response?.enrollments || response?.data || []);
                // Filter only ACTIVE enrollments and extract sections
                sectionsArray = enrollments
                    .filter(e => e.status === 'ACTIVE')
                    .map(e => e.section || e.CourseSection)
                    .filter(s => s);
            } else if (user?.role === 'faculty') {
                // For faculty: Get sections they teach
                const data = await sectionsService.getMySections();
                sectionsArray = data.sections || data || [];
            } else {
                // Admin or other: Get all (limited)
                const data = await sectionsService.getAll({ limit: 50 });
                sectionsArray = data.sections || data || [];
            }

            setSections(sectionsArray);

            // Parse schedule items from sections
            const items = [];
            sectionsArray.forEach((section, index) => {
                const schedule = section.schedule || [];
                const color = COLORS[index % COLORS.length];

                schedule.forEach(slot => {
                    items.push({
                        id: `${section.id}-${slot.day}-${slot.start}`,
                        sectionId: section.id,
                        courseCode: section.course?.code || '',
                        courseName: section.course?.name || '',
                        sectionNumber: section.section_number,
                        instructor: section.instructor?.full_name || '',
                        day: slot.day,
                        startTime: slot.start,
                        endTime: slot.end,
                        room: slot.room_id ? `Sınıf ${slot.room_id}` : '',
                        color
                    });
                });
            });

            setScheduleItems(items);
            setError(null);
        } catch (err) {
            console.error('Error fetching schedule:', err);
            setError(t('fetchError') || 'Ders programı yüklenirken hata oluştu');
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

    const getDayLabel = (day) => {
        return t(`days.${day}`) || day;
    };

    if (loading) {
        return (
            <div className="page schedule-page">
                <LoadingSpinner size="large" message={t('loading')} />
            </div>
        );
    }

    return (
        <div className="page schedule-page">
            <div className="page-header">
                <h1>{t('scheduleTitle')}</h1>
                <p className="page-subtitle">
                    {user?.role === 'student' ? t('studentSchedule') :
                        user?.role === 'faculty' ? t('facultySchedule') :
                            t('allSchedule')}
                </p>
            </div>

            {error && (
                <div className="alert alert-error">{error}</div>
            )}

            {/* Conflict Warnings */}
            {conflicts.length > 0 && (
                <div className="conflict-warnings">
                    <div className="alert alert-warning">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <span><strong>{t('conflictWarning')}</strong> {t('conflictDetected', { count: conflicts.length }).replace('{{count}}', conflicts.length)}</span>
                    </div>
                    <div className="conflict-list">
                        {conflicts.map((c, i) => (
                            <div key={i} className="conflict-item">
                                <span className="conflict-course">{c.item1.courseCode}</span>
                                <span className="conflict-vs">⚡</span>
                                <span className="conflict-course">{c.item2.courseCode}</span>
                                <span className="conflict-time">{getDayLabel(c.item1.day)} {c.item1.startTime}-{c.item1.endTime}</span>
                            </div>
                        ))}
                    </div>
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
                    <h3>{t('noClassesTitle')}</h3>
                    <p>
                        {user?.role === 'student'
                            ? t('noClassesStudent')
                            : t('noClassesFaculty')}
                    </p>
                    {user?.role === 'student' && (
                        <Link to="/sections" className="btn">{t('selectCourse')}</Link>
                    )}
                </div>
            ) : (
                <>
                    {/* Weekly Timetable */}
                    <div className="timetable-container">
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
                                        <span className="day-name">{getDayLabel(day)}</span>
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
                                            >
                                                <div className="schedule-item-code">{item.courseCode}</div>
                                                <div className="schedule-item-name">{item.courseName}</div>
                                                <div className="schedule-item-time">
                                                    {item.startTime} - {item.endTime}
                                                </div>
                                                {item.room && (
                                                    <div className="schedule-item-room">{item.room}</div>
                                                )}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="schedule-legend">
                        <h3>{t('courses')}</h3>
                        <div className="legend-items">
                            {sections.map((section, index) => (
                                <div key={section.id} className="legend-item">
                                    <span
                                        className="legend-color"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    ></span>
                                    <span className="legend-code">{section.course?.code}</span>
                                    <span className="legend-name">{section.course?.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default SchedulePage;
