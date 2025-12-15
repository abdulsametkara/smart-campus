const { Exam, Grade, CourseSection, Enrollment, User } = require('../../models');
const { Op } = require('sequelize');
const sequelize = require('../../models').sequelize;

// --- EXAM MANAGEMENT ---

exports.createExam = async (req, res) => {
    try {
        const { section_id, title, type, weight, date } = req.body;
        const instructor_id = req.user.id; // From auth

        // Check if section belongs to instructor (unless admin)
        const section = await CourseSection.findByPk(section_id);

        if (!section) return res.status(404).json({ message: 'Section not found' });

        if (req.user.role !== 'admin' && section.instructor_id !== instructor_id) {
            return res.status(403).json({ message: 'Not authorized for this section' });
        }

        // Validate weight total (Optional but good) - skipped for MVP speed

        const exam = await Exam.create({
            section_id,
            title,
            type,
            weight,
            date,
            is_published: false
        });

        res.status(201).json(exam);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getSectionExams = async (req, res) => {
    try {
        const { sectionId } = req.params;

        // Authorization Check
        if (req.user.role === 'faculty') {
            const section = await CourseSection.findByPk(sectionId);
            if (!section) return res.status(404).json({ message: 'Section not found' });
            if (section.instructor_id !== req.user.id) {
                return res.status(403).json({ message: 'Forbidden: You do not teach this section' });
            }
        }
        // If student, check enrollment?
        if (req.user.role === 'student') {
            const enrollment = await Enrollment.findOne({ where: { student_id: req.user.id, section_id: sectionId, status: 'ACTIVE' } });
            if (!enrollment) return res.status(403).json({ message: 'Forbidden: You are not enrolled in this section' });
        }

        const exams = await Exam.findAll({
            where: { section_id: sectionId },
            order: [['date', 'ASC']]
        });
        res.json(exams);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deleteExam = async (req, res) => {
    try {
        const { id } = req.params;
        const exam = await Exam.findByPk(id, { include: ['section'] }); // Include section to check instructor

        if (!exam) return res.status(404).json({ message: 'Exam not found' });

        // Authorization Check
        if (req.user.role === 'faculty') {
            if (!exam.section || exam.section.instructor_id !== req.user.id) {
                return res.status(403).json({ message: 'Forbidden' });
            }
        }

        await exam.destroy();
        res.json({ message: 'Exam deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.publishExam = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_published } = req.body;

        const exam = await Exam.findByPk(id, { include: ['section'] });
        if (!exam) return res.status(404).json({ message: 'Exam not found' });

        // Authorization Check
        if (req.user.role === 'faculty') {
            if (!exam.section || exam.section.instructor_id !== req.user.id) {
                return res.status(403).json({ message: 'Forbidden' });
            }
        }

        await Exam.update({ is_published }, { where: { id } });
        res.json({ message: 'Exam publish status updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- GRADE MANAGEMENT ---

// Enter multiple grades for an exam
exports.submitValidGrades = async (req, res) => {
    try {
        const { exam_id, grades } = req.body; // grades: [{ student_id, score, feedback }]

        const exam = await Exam.findByPk(exam_id, { include: ['section'] });
        if (!exam) return res.status(404).json({ message: 'Exam not found' });

        // Authorization Check
        if (req.user.role === 'faculty') {
            if (!exam.section || exam.section.instructor_id !== req.user.id) {
                return res.status(403).json({ message: 'Forbidden' });
            }
        }

        // Upsert grades
        for (const item of grades) {
            const [grade, created] = await Grade.findOrCreate({
                where: { exam_id, student_id: item.student_id },
                defaults: { score: item.score, feedback: item.feedback }
            });

            if (!created) {
                grade.score = item.score;
                grade.feedback = item.feedback;
                await grade.save();
            }
        }

        // Recalculate Average of exam
        // We can do this more efficiently, but for now reuse simple logic
        const allGrades = await Grade.findAll({ where: { exam_id } });
        if (allGrades.length > 0) {
            const sum = allGrades.reduce((acc, g) => acc + g.score, 0);
            exam.average_score = sum / allGrades.length;
            await exam.save();
        }

        res.json({ message: 'Grades saved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getExamGrades = async (req, res) => {
    try {
        const { examId } = req.params;
        const exam = await Exam.findByPk(examId, { include: ['section'] });
        if (!exam) return res.status(404).json({ message: 'Exam not found' });

        // Authorization Check
        if (req.user.role === 'faculty') {
            if (!exam.section || exam.section.instructor_id !== req.user.id) {
                return res.status(403).json({ message: 'Forbidden' });
            }
        }

        // Fetch grades with student info
        // JOIN to get user data. 
        // Note: 'student' alias must be defined in Grade model
        const grades = await Grade.findAll({
            where: { exam_id: examId },
            include: [{ model: User, as: 'student', attributes: ['id', 'full_name', 'email'] }]
        });

        // Enhance with student_number if needed, but not critical for Instructor View if not in User model
        // Assuming Frontend displays full_name and basic info.

        res.json(grades);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all grades for a student (TRANSCRIPT view logic)
exports.getMyGrades = async (req, res) => {
    try {
        const student_id = req.user.id;

        // Get all enrollments
        const enrollments = await Enrollment.findAll({
            where: { student_id, status: 'ACTIVE' },
            include: [{
                model: CourseSection,
                as: 'section',
                include: [{ model: require('../../models').Course, as: 'course' }]
            }]
        });

        const transcript = [];

        for (const enrollment of enrollments) {
            // Get all exams for this section
            const exams = await Exam.findAll({
                where: { section_id: enrollment.section_id, is_published: true },
                include: [{
                    model: Grade,
                    as: 'grades',
                    where: { student_id },
                    required: false
                }]
            });

            // Calculate current average
            let totalWeightedScore = 0;
            let totalWeight = 0;

            const examDetails = exams.map(e => {
                const myGrade = e.grades[0]; // hasMany but handled with student_id filter
                const score = myGrade ? myGrade.score : 0; // Or null? If not entered, count as 0 or ignore?
                if (myGrade) {
                    totalWeightedScore += (score * e.weight);
                    totalWeight += e.weight;
                }
                return {
                    exam: e.title,
                    type: e.type,
                    weight: e.weight,
                    score: myGrade ? myGrade.score : '-'
                };
            });

            // Normalize to 100 base if totalWeight > 0
            // Logic: (Total Weighted Score) / 100 (assuming weights satisfy 100 total)
            const currentAverage = totalWeight > 0 ? (totalWeightedScore / 100) * 100 : 0;
            // Wait, logic correction: if weights sum to 100, then simply sum(score*weight/100)
            // If weights are percentage (e.g. 30%), then score*0.30 is point contribution.
            // My previous code was: totalWeightedScore += (score * weight). 
            // Eg: Score 90, Weight 30 -> 2700.
            // Then totalWeightedScore / 100 -> 27. Correct.

            // Re-check logic:
            // midterm (30%): 90 -> 27 pts
            // final (70%): 80 -> 56 pts
            // Total: 83
            // Code: (90*30 + 80*70) / 100 = (2700 + 5600) / 100 = 8300 / 100 = 83. Correct.
            const calculatedAverage = totalWeightedScore / 100;

            // Calculate Letter
            let letter = '-';
            if (totalWeight >= 100 || exams.some(e => e.type === 'FINAL')) { // Only show letter if final is done or weights full
                letter = calculateLetter(calculatedAverage);
            }

            transcript.push({
                course_code: enrollment.section?.course?.code,
                course_name: enrollment.section?.course?.name,
                section: enrollment.section?.section_number,
                exams: examDetails,
                current_average: calculatedAverage.toFixed(2),
                letter_grade: letter
            });
        }

        res.json(transcript);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

function calculateLetter(score) {
    if (score >= 90) return 'AA';
    if (score >= 85) return 'BA';
    if (score >= 80) return 'BB';
    if (score >= 75) return 'CB';
    if (score >= 70) return 'CC';
    if (score >= 60) return 'DC';
    if (score >= 50) return 'DD';
    if (score >= 40) return 'FD';
    return 'FF';
}

exports.downloadTranscriptPdf = async (req, res) => {
    try {
        const student_id = req.user.id;
        const student = await User.findByPk(student_id);
        const PDFDocument = require('pdfkit');

        // Fetch Data (Same logic as getMyGrades)
        const enrollments = await Enrollment.findAll({
            where: { student_id, status: 'ACTIVE' },
            include: [{
                model: CourseSection,
                as: 'section',
                include: [{ model: require('../../models').Course, as: 'course' }]
            }]
        });

        const transcriptData = [];
        let totalCredits = 0;
        let totalWeightedPoints = 0;

        for (const enrollment of enrollments) {
            const exams = await Exam.findAll({
                where: { section_id: enrollment.section_id, is_published: true },
                include: [{
                    model: Grade,
                    as: 'grades',
                    where: { student_id },
                    required: false
                }]
            });

            let totalWeightedScore = 0;
            let totalWeight = 0;

            exams.forEach(e => {
                const myGrade = e.grades[0];
                if (myGrade) {
                    totalWeightedScore += (myGrade.score * e.weight);
                    totalWeight += e.weight;
                }
            });

            const calculatedAverage = totalWeight > 0 ? (totalWeightedScore / 100) : 0;
            let letter = '-';
            let numericGrade = 0.0;

            if (totalWeight >= 100 || exams.some(e => e.type === 'FINAL')) {
                letter = calculateLetter(calculatedAverage * 100); // Scale back to 100 for letter check? No, calculatedAverage is already scaled?
                // Wait, previous logic was: totalWeightedScore / 100.
                // Example: 90*0.3 + 80*0.7 = 27 + 56 = 83.
                // calculatedAverage above is 83.

                letter = calculateLetter(calculatedAverage);

                // Simple 4.0 scale mapping
                if (letter === 'AA') numericGrade = 4.0;
                else if (letter === 'BA') numericGrade = 3.5;
                else if (letter === 'BB') numericGrade = 3.0;
                else if (letter === 'CB') numericGrade = 2.5;
                else if (letter === 'CC') numericGrade = 2.0;
                else if (letter === 'DC') numericGrade = 1.5;
                else if (letter === 'DD') numericGrade = 1.0;
                else if (letter === 'FD') numericGrade = 0.5;
                else numericGrade = 0.0;
            }

            const credits = enrollment.section?.course?.credits || 0;

            // Only count towards GPA if finalized (letter assigned)
            if (letter !== '-') {
                totalCredits += credits;
                totalWeightedPoints += (numericGrade * credits);
            }

            transcriptData.push({
                code: enrollment.section?.course?.code,
                name: enrollment.section?.course?.name,
                credits: credits,
                average: calculatedAverage.toFixed(2),
                letter: letter
            });
        }

        const gpa = totalCredits > 0 ? (totalWeightedPoints / totalCredits).toFixed(2) : '0.00';

        // generate PDF
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=transcript.pdf');
        doc.pipe(res);

        // Header
        doc.fontSize(20).text('SMART CAMPUS UNIVERSITY', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text('OFFICIAL TRANSCRIPT', { align: 'center' });
        doc.moveDown();

        // Student Info
        doc.fontSize(12).text(`Student Name: ${student.full_name}`);
        doc.text(`Student ID: ${student.student_number || '-'}`);
        doc.text(`Email: ${student.email}`);
        doc.text(`Date: ${new Date().toLocaleDateString('tr-TR')}`);
        doc.moveDown();
        doc.text(`GPA: ${gpa}`, { stroke: true });
        doc.moveDown();

        // Table Header
        const tableTop = 250;
        let y = tableTop;

        doc.font('Helvetica-Bold');
        doc.text('Course Code', 50, y);
        doc.text('Course Name', 150, y);
        doc.text('Credits', 350, y);
        doc.text('Grade', 420, y);
        doc.text('Letter', 480, y);

        // Separator
        y += 20;
        doc.moveTo(50, y).lineTo(550, y).stroke();
        y += 10;

        // Table Content
        doc.font('Helvetica');
        transcriptData.forEach(item => {
            doc.text(item.code, 50, y);
            doc.text(item.name.substring(0, 35), 150, y); // Truncate long names
            doc.text(item.credits.toString(), 350, y);
            doc.text(item.average, 420, y);
            doc.text(item.letter, 480, y);
            y += 20;
        });

        // Footer
        doc.fontSize(10).text('Generated by Smart Campus System', 50, 700, { align: 'center', width: 500 });

        doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating PDF', error: error.message });
    }
};
