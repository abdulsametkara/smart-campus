const { CourseSection, Enrollment } = require('../../models');

class ScheduleConflictService {
    /**
     * Check if a new section conflicts with existing enrollments.
     * @param {number} studentId 
     * @param {number} newSectionId 
     * @returns {Promise<boolean>}
     */
    async checkConflict(studentId, newSectionId) {
        // TODO: Implement time overlap detection
        return false;
    }
}

module.exports = new ScheduleConflictService();
