const { Course, CourseSection, User, Enrollment, Department } = require('../../models');

// Get all sections with course and instructor info
exports.getAllSections = async (req, res) => {
    try {
        const sections = await CourseSection.findAll({
            include: [
                { model: Course, as: 'course', attributes: ['code', 'name'] },
                { model: User, as: 'instructor', attributes: ['id', 'full_name', 'email'] }
            ],
            order: [['section_number', 'ASC']]
        });
        res.json(sections);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Assign instructor to a section
exports.assignInstructor = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const { instructorId } = req.body;

        const section = await CourseSection.findByPk(sectionId);
        if (!section) return res.status(404).json({ message: 'Section not found' });

        // Verify user is faculty
        const instructor = await User.findOne({ where: { id: instructorId, role: 'faculty' } });
        if (!instructor) return res.status(400).json({ message: 'User is not a faculty member' });

        section.instructor_id = instructorId;
        await section.save();

        res.json({ message: 'Instructor assigned successfully', section });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Enroll a student to a section
exports.enrollStudent = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const { email } = req.body; // Assign by email for ease

        const section = await CourseSection.findByPk(sectionId);
        if (!section) return res.status(404).json({ message: 'Section not found' });

        const student = await User.findOne({ where: { email, role: 'student' } });
        if (!student) return res.status(404).json({ message: 'Student not found or not a student role' });

        // Check if already enrolled
        const existing = await Enrollment.findOne({
            where: { student_id: student.id, section_id: sectionId }
        });

        if (existing) {
            if (existing.status !== 'ACTIVE') {
                existing.status = 'ACTIVE';
                await existing.save();
                return res.json({ message: 'Student re-enrolled successfully' });
            }
            return res.status(400).json({ message: 'Student already enrolled' });
        }

        await Enrollment.create({
            student_id: student.id,
            section_id: sectionId,
            status: 'ACTIVE'
        });

        res.json({ message: 'Student enrolled successfully', student });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get students in a section
exports.getSectionStudents = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const enrollments = await Enrollment.findAll({
            where: { section_id: sectionId, status: 'ACTIVE' },
            include: [{ model: User, as: 'student', attributes: ['id', 'full_name', 'email'] }]
        });

        const students = enrollments.map(e => e.student);
        res.json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
