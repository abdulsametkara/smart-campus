const { Course, Enrollment, sequelize } = require('../../models');
const { Op } = require('sequelize');

class PrerequisiteService {
    /**
     * Check if a student has completed all recursive prerequisites for a course.
     * Uses BFS (Breadth-First Search) to traverse prerequisite graph.
     * @param {number} studentId 
     * @param {number} courseId 
     * @returns {Promise<{valid: boolean, missing: Array<{course_id: number, course_code: string, course_name: string}>}>}
     */
    async checkPrerequisites(studentId, courseId) {
        try {
            // Get all prerequisites recursively using BFS
            const prerequisites = await this.getAllPrerequisites(courseId);
            
            if (prerequisites.length === 0) {
                return { valid: true, missing: [] };
            }

            // Get student's completed courses (status = 'PASSED' or letter_grade >= 'DD')
            const completedEnrollments = await Enrollment.findAll({
                where: {
                    student_id: studentId,
                    status: {
                        [Op.in]: ['PASSED', 'ACTIVE']
                    },
                    [Op.or]: [
                        { letter_grade: { [Op.gte]: 'DD' } },
                        { status: 'PASSED' }
                    ]
                },
                include: [{
                    model: require('../../models').CourseSection,
                    as: 'section',
                    attributes: ['course_id'],
                    required: true
                }]
            });

            const completedCourseIds = new Set(
                completedEnrollments.map(e => e.section.course_id)
            );

            // Check which prerequisites are missing
            const missing = prerequisites.filter(prereq => 
                !completedCourseIds.has(prereq.id)
            );

            return {
                valid: missing.length === 0,
                missing: missing.map(p => ({
                    course_id: p.id,
                    course_code: p.code,
                    course_name: p.name
                }))
            };
        } catch (error) {
            console.error('Error checking prerequisites:', error);
            throw error;
        }
    }

    /**
     * Get all prerequisites for a course recursively using BFS.
     * @param {number} courseId 
     * @returns {Promise<Array<Course>>}
     */
    async getAllPrerequisites(courseId) {
        const visited = new Set();
        const queue = [courseId];
        const allPrerequisites = [];

        while (queue.length > 0) {
            const currentCourseId = queue.shift();
            
            if (visited.has(currentCourseId)) {
                continue;
            }
            visited.add(currentCourseId);

            // Get direct prerequisites
            const course = await Course.findByPk(currentCourseId, {
                include: [{
                    model: Course,
                    as: 'Prerequisites',
                    attributes: ['id', 'code', 'name'],
                    through: { attributes: [] }
                }]
            });

            if (!course) continue;

            const directPrereqs = course.Prerequisites || [];

            for (const prereq of directPrereqs) {
                if (!visited.has(prereq.id)) {
                    allPrerequisites.push(prereq);
                    queue.push(prereq.id);
                }
            }
        }

        return allPrerequisites;
    }

    /**
     * Check if student has completed a specific course.
     * @param {number} studentId 
     * @param {number} courseId 
     * @returns {Promise<boolean>}
     */
    async hasCompletedCourse(studentId, courseId) {
        const enrollment = await Enrollment.findOne({
            where: {
                student_id: studentId,
                status: {
                    [Op.in]: ['PASSED', 'ACTIVE']
                },
                [Op.or]: [
                    { letter_grade: { [Op.gte]: 'DD' } },
                    { status: 'PASSED' }
                ]
            },
            include: [{
                model: require('../../models').CourseSection,
                as: 'section',
                where: { course_id: courseId },
                required: true
            }]
        });

        return !!enrollment;
    }
}

module.exports = new PrerequisiteService();
