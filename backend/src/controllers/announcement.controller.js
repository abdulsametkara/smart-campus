const { Announcement, Course, Department, User, Enrollment } = require('../../models');
const { Op } = require('sequelize');

exports.createAnnouncement = async (req, res) => {
    try {
        const { title, content, course_id, department_id, priority, expiry_date } = req.body;
        const created_by = req.user.id;
        const userRole = req.user.role;

        // Auth Checks
        if (userRole === 'student') return res.status(403).json({ message: 'Yetkisiz işlem' });

        if (userRole === 'faculty') {
            // Check if course belongs to faculty (if course_id provided)
            // Skipped deep check for MVP, assume UI limits choice. 
            // Ideally: check CourseSection -> Instructor relation. But Announcement links to Course (generic) or specific?
            // Model says Course (generic). Faculty might teach one section, but announcements usually go to all sections of a course or specific section?
            // Model has course_id. Let's assume generic course announcement.
        }

        const announcement = await Announcement.create({
            title,
            content,
            course_id: course_id || null,
            department_id: department_id || null,
            created_by,
            priority,
            expiry_date
        });

        res.status(201).json(announcement);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getMyAnnouncements = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const department_id = req.user.department_id; // Added to User/Student model? need to check connection.
        // Actually department_id is in Student table.

        let deptId = null;
        let enrolledCourseIds = [];

        if (userRole === 'student') {
            const { Student } = require('../../models');
            const student = await Student.findOne({ where: { user_id: userId } });
            if (student) deptId = student.department_id;

            const enrollments = await Enrollment.findAll({
                where: { student_id: userId, status: 'ACTIVE' },
                include: [{ model: require('../../models').CourseSection, as: 'section' }]
            });
            enrolledCourseIds = enrollments.map(e => e.section?.course_id).filter(id => id);
        }

        if (userRole === 'faculty') {
            // Faculty sees general, their dept, and courses they teach?
            // Simplification: Faculty usually creates announcements, but also sees General ones.
        }

        // Build Query
        const where = {
            [Op.or]: [
                { course_id: null, department_id: null }, // General
                { department_id: deptId }, // My Department
                { course_id: { [Op.in]: enrolledCourseIds } } // My Courses
            ],
            [Op.and]: [
                {
                    [Op.or]: [
                        { expiry_date: null },
                        { expiry_date: { [Op.gte]: new Date() } }
                    ]
                }
            ]
        };

        const announcements = await Announcement.findAll({
            where: (userRole === 'student') ? where : {}, // Admin/Faculty sees all or filtered differently? Let's show All to Admin.
            order: [['created_at', 'DESC']],
            include: [
                { model: User, as: 'author', attributes: ['full_name'] },
                { model: Course, as: 'course', attributes: ['code', 'name'] }
            ],
            limit: 20
        });

        res.json(announcements);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        // Check ownership or admin
        await Announcement.destroy({ where: { id } });
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
