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

    // GET /export/ical
    async exportICal(req, res) {
        // Placeholder for iCal export
        // Would use a library like 'ical-generator'
        res.status(501).json({ message: 'iCal export not implemented yet.' });
    }
}

module.exports = new SchedulingController();
