const schedulingService = require('../services/scheduling.service');
const { Schedule, CourseSection, Classroom, Course } = require('../../models');

class SchedulingController {

    // POST /generate
    async triggerScheduling(req, res) {
        try {
            const { semester } = req.body;

            if (!semester) {
                return res.status(400).json({ message: 'Semester is required.' });
            }

            // This could be a long running process. 
            // In production, offload to a queue. For now, await it.
            const result = await schedulingService.generateSchedule(semester);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.json(result);

        } catch (error) {
            console.error('Error generating schedule:', error);
            return res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    }

    // GET /
    async getSchedule(req, res) {
        try {
            const { semester, student_id, instructor_id, classroom_id } = req.query;
            const whereClause = {};

            // Basic filtering
            if (classroom_id) whereClause.classroom_id = classroom_id;

            // Note: student_id requires joining enrollments, instructor_id requires joining sections.
            // For MVP, let's support general view and classroom view primarily.

            const includeOptions = [
                {
                    model: CourseSection,
                    as: 'section',
                    where: semester ? { semester } : undefined,
                    include: [
                        { model: Course, as: 'course', attributes: ['code', 'name'] },
                        // { model: User, as: 'instructor', attributes: ['name'] } // If instructor relation exists
                    ]
                },
                { model: Classroom, as: 'classroom', attributes: ['name', 'location'] }
            ];

            const schedules = await Schedule.findAll({
                where: whereClause,
                include: includeOptions,
                order: [['day_of_week', 'ASC'], ['start_time', 'ASC']]
            });

            return res.json(schedules);

        } catch (error) {
            console.error('Error fetching schedule:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async exportICal(req, res) {
        try {
            const ical = require('ical-generator').default;
            const { semester, student_id } = req.query;

            // Fetch schedules (reuse getSchedule logic or simplified equivalent)
            const includeOptions = [
                {
                    model: CourseSection,
                    as: 'section',
                    where: semester ? { semester } : undefined,
                    include: [
                        { model: Course, as: 'course', attributes: ['code', 'name'] }
                    ]
                },
                { model: Classroom, as: 'classroom', attributes: ['name', 'building', 'room_number'] }
            ];

            // Filter by student if requested (needs Enrollment join, omitting for MVP brevity unless requested)
            // Assuming generic export for now or filtered by semester
            const schedules = await Schedule.findAll({
                include: includeOptions
            });

            const calendar = ical({ name: 'Smart Campus Schedule' });

            schedules.forEach(slot => {
                // slot.day_of_week: 1=Mon, ..., 5=Fri
                // Need to map to next occurrence of this day? or generic recurring event?
                // For a semester schedule, it's usually recurring. 
                // iCal generator supports recurring events.

                // Construct a start date for the next occurrence of this day
                // This is a bit complex without specific semester start/end dates.
                // Simplified: Create an event for "today" + offset if matches day, or just a sample week?
                // Standard approach: Set start date to a known semester start, repeat weekly.

                const dayMap = { 1: 'MO', 2: 'TU', 3: 'WE', 4: 'TH', 5: 'FR' };
                const dayStr = dayMap[slot.day_of_week];

                // Let's assume semester starts "next Monday" for demo purposes or use a fixed date.
                // Better: Create a non-recurring event for "Next [Day]" to show it works, or Recurring.
                // Let's go with Recurring Rule (RRULE).

                if (!dayStr) return;

                const eventParams = {
                    start: new Date(), // Placeholder, needs real date calculation
                    end: new Date(),   // Placeholder
                    summary: `${slot.section.course.code} - ${slot.section.course.name}`,
                    location: slot.classroom.name, // Use Schedule's classroom
                    description: `Instructor: TBD`, // If we had instructor info
                    repeating: {
                        freq: 'WEEKLY',
                        byDay: [dayStr]
                    }
                };

                // Correct time setting
                // slot.start_time is '09:00:00'
                const [sH, sM] = slot.start_time.split(':');
                const [eH, eM] = slot.end_time.split(':');

                // Set start/end to next instance of that day
                const now = new Date();
                const currentDay = now.getDay(); // 0=Sun, 1=Mon...
                const targetDay = slot.day_of_week; // 1=Mon
                let daysToAdd = (targetDay - currentDay + 7) % 7;
                if (daysToAdd === 0) daysToAdd = 7; // Next week if today

                const startDate = new Date(now);
                startDate.setDate(startDate.getDate() + daysToAdd);
                startDate.setHours(parseInt(sH), parseInt(sM), 0);

                const endDate = new Date(startDate);
                endDate.setHours(parseInt(eH), parseInt(eM), 0);

                calendar.createEvent({
                    start: startDate,
                    end: endDate,
                    summary: `${slot.section.course.code} - ${slot.section.course.name}`,
                    location: slot.classroom.name,
                    repeating: {
                        freq: 'WEEKLY',
                    }
                });
            });

            // calendar.serve(res) is deprecated or not working in this version
            // serve manually
            const icalContent = calendar.toString();
            res.set('Content-Type', 'text/calendar; charset=utf-8');
            res.set('Content-Disposition', 'attachment; filename="schedule.ics"');
            res.send(icalContent);
        } catch (error) {
            console.error('Error exporting iCal:', error);
            res.status(500).json({ message: 'Error generating calendar file' });
        }
    }
}

module.exports = new SchedulingController();
