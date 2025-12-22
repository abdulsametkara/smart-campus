import React, { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';

/**
 * Generic weekly calendar view based on FullCalendar.
 *
 * Props:
 * - items: Array<{
 *     id: string;
 *     title: string;
 *     day: string;        // 'Monday' | 'Tuesday' | ...
 *     startTime: string;  // 'HH:MM'
 *     endTime: string;    // 'HH:MM'
 *     backgroundColor?: string;
 *   }>
 */
const WeeklyCalendar = ({ items = [], initialView = 'timeGridWeek', height = 'auto' }) => {
  // Reference week: next Monday from "today" so FullCalendar can show real dates
  const referenceMonday = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon...
    const monday = new Date(today);
    const offset = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
    monday.setDate(today.getDate() + offset);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }, []);

  const dayIndex = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6,
  };

  const events = useMemo(() => {
    return items.map((item) => {
      const idx = dayIndex[item.day] ?? 0;
      const date = new Date(referenceMonday);
      date.setDate(referenceMonday.getDate() + idx);

      const [sH, sM] = (item.startTime || '09:00').split(':').map(Number);
      const [eH, eM] = (item.endTime || '10:00').split(':').map(Number);

      const start = new Date(date);
      start.setHours(sH, sM || 0, 0, 0);

      const end = new Date(date);
      end.setHours(eH, eM || 0, 0, 0);

      return {
        id: item.id,
        title: item.title,
        start,
        end,
        backgroundColor: item.backgroundColor,
        borderColor: item.backgroundColor,
        extendedProps: {
          description: item.description || '',
          location: item.location || '',
        },
      };
    });
  }, [items, referenceMonday]);

  return (
    <div className="weekly-calendar-wrapper">
      <FullCalendar
        plugins={[timeGridPlugin]}
        initialView={initialView}
        allDaySlot={false}
        height={height}
        slotMinTime="08:00:00"
        slotMaxTime="18:00:00"
        weekends={false}
        headerToolbar={{
          left: '',
          center: 'title',
          right: 'timeGridWeek,timeGridDay',
        }}
        buttonText={{
          week: 'Hafta',
          day: 'Gün',
        }}
        events={events}
        locale="tr"
        nowIndicator={true}
        eventContent={(eventInfo) => {
          const { description, location } = eventInfo.event.extendedProps || {};
          return (
            <div style={{ padding: '2px 4px', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                {eventInfo.event.title}
              </div>
              {description && (
                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                  {description}
                </div>
              )}
              {location && (
                <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>
                  🏫 {location}
                </div>
              )}
            </div>
          );
        }}
      />
    </div>
  );
};

export default WeeklyCalendar;


