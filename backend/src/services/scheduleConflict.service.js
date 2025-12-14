const { CourseSection, Enrollment } = require('../../models');
const { Op } = require('sequelize');

class ScheduleConflictService {
    /**
     * Check if a new section conflicts with existing enrollments.
     * @param {number} studentId 
     * @param {number} newSectionId 
     * @returns {Promise<{hasConflict: boolean, conflicts: Array<{section_id: number, course_code: string, conflict_day: string, conflict_time: string}>}>}
     */
    async checkConflict(studentId, newSectionId) {
        try {
            // Get new section schedule
            const newSection = await CourseSection.findByPk(newSectionId, {
                include: [{
                    model: require('../../models').Course,
                    as: 'course',
                    attributes: ['code', 'name']
                }]
            });

            if (!newSection || !newSection.schedule || !Array.isArray(newSection.schedule)) {
                return { hasConflict: false, conflicts: [] };
            }

            // Get student's active enrollments
            const activeEnrollments = await Enrollment.findAll({
                where: {
                    student_id: studentId,
                    status: 'ACTIVE'
                },
                include: [{
                    model: CourseSection,
                    as: 'section',
                    attributes: ['id', 'schedule', 'semester'],
                    include: [{
                        model: require('../../models').Course,
                        as: 'course',
                        attributes: ['code', 'name']
                    }],
                    required: true
                }]
            });

            const conflicts = [];

            // Check each existing enrollment for conflicts
            for (const enrollment of activeEnrollments) {
                const existingSection = enrollment.section;
                
                // Only check conflicts in the same semester
                if (existingSection.semester !== newSection.semester) {
                    continue;
                }

                if (!existingSection.schedule || !Array.isArray(existingSection.schedule)) {
                    continue;
                }

                // Check for time overlaps
                for (const newScheduleItem of newSection.schedule) {
                    for (const existingScheduleItem of existingSection.schedule) {
                        if (this.hasTimeOverlap(newScheduleItem, existingScheduleItem)) {
                            conflicts.push({
                                section_id: existingSection.id,
                                course_code: existingSection.course.code,
                                course_name: existingSection.course.name,
                                conflict_day: newScheduleItem.day,
                                conflict_time: `${newScheduleItem.start} - ${newScheduleItem.end}`,
                                existing_time: `${existingScheduleItem.start} - ${existingScheduleItem.end}`
                            });
                        }
                    }
                }
            }

            return {
                hasConflict: conflicts.length > 0,
                conflicts
            };
        } catch (error) {
            console.error('Error checking schedule conflict:', error);
            throw error;
        }
    }

    /**
     * Check if two schedule items have time overlap.
     * @param {Object} item1 - {day: string, start: string, end: string}
     * @param {Object} item2 - {day: string, start: string, end: string}
     * @returns {boolean}
     */
    hasTimeOverlap(item1, item2) {
        // Must be on the same day
        if (item1.day !== item2.day) {
            return false;
        }

        // Convert time strings to minutes for easier comparison
        const time1Start = this.timeToMinutes(item1.start);
        const time1End = this.timeToMinutes(item1.end);
        const time2Start = this.timeToMinutes(item2.start);
        const time2End = this.timeToMinutes(item2.end);

        // Check for overlap: item1 starts before item2 ends AND item1 ends after item2 starts
        return time1Start < time2End && time1End > time2Start;
    }

    /**
     * Convert time string (HH:MM) to minutes.
     * @param {string} timeStr - Format: "HH:MM"
     * @returns {number} - Minutes since midnight
     */
    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }
}

module.exports = new ScheduleConflictService();