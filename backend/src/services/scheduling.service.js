const { CourseSection, Schedule, Classroom, Enrollment, User } = require('../../models');
const { Op } = require('sequelize');

class SchedulingService {
    /**
     * Generate schedule for a given semester using CSP (Constraint Satisfaction Problem) approach.
     * @param {string} semester - e.g., "2024-FALL"
     * @returns {Promise<Object>} - Result summary
     */
    async generateSchedule(semester) {
        try {
            console.log(`[DEBUG] Starting schedule generation for semester: "${semester}"`);

            // 1. Fetch Data
            const sections = await CourseSection.findAll({
                where: { semester },
                include: ['course', 'instructor']
            });
            console.log(`[DEBUG] Found ${sections.length} sections for semester ${semester}`);

            const classrooms = await Classroom.findAll();
            console.log(`[DEBUG] Found ${classrooms.length} active classrooms`);

            if (sections.length === 0) {
                console.log('[DEBUG] No sections found. Returning error.');
                return { success: false, message: 'Bu dönem için henüz açılmış ders (section) bulunmuyor.' };
            }

            if (classrooms.length === 0) {
                console.log('[DEBUG] No classrooms found. Returning error.');
                return { success: false, message: 'Sistemde aktif sınıf bulunamadı.' };
            }

            // 2. Prepare Variables
            const variables = sections.map(section => ({
                id: section.id,
                courseCode: section.course ? section.course.code : 'UNKNOWN',
                capacity: section.capacity,
                instructorId: section.instructor_id,
            }));

            // 3. Run Backtracking Algorithm
            console.log('[DEBUG] Starting solver...');
            const assignment = await this.solve(variables, classrooms, {});

            if (!assignment) {
                console.log('[DEBUG] Solver could not find a solution.');
                return { success: false, message: 'Uygun bir program oluşturulamadı. Lütfen kısıtları (sınıf sayısı vs.) kontrol edin.' };
            }

            console.log(`[DEBUG] Solution found with ${Object.keys(assignment).length} assignments.`);

            // 4. Save Solution to Database
            await this.saveSchedule(assignment, semester);

            return { success: true, message: 'Ders programı başarıyla oluşturuldu.', assignmentCount: Object.keys(assignment).length };

        } catch (error) {
            console.error('[DEBUG] CRITICAL ERROR in generateSchedule:', error);
            throw error;
        }
    }

    /**
     * Backtracking algorithm to find a valid assignment.
     * @param {Array} variables - List of sections to schedule
     * @param {Array} classrooms - List of available classrooms
     * @param {Object} currentAssignment - Current state of assignments { sectionId: { roomId, day, start, end } }
     * @returns {Object|null} - Complete assignment or null if failure
     */
    async solve(variables, classrooms, currentAssignment) {
        // Base case: All variables assigned
        if (Object.keys(currentAssignment).length === variables.length) {
            return currentAssignment;
        }

        // Select unassigned variable (Heuristic: MRV - Minimum Remaining Values could be used here)
        // For simplicity, taking the next one in the list
        const unassignedVar = variables.find(v => !currentAssignment[v.id]);

        // Define Domain for this variable (Time Slots * Classrooms)
        // This is a simplified domain generation. In reality, we might iterate efficiently.
        const domain = this.generateDomain(unassignedVar, classrooms);

        for (const value of domain) {
            // Value = { classroomId, day, start, end }

            // Check Constraints
            if (this.isConsistent(unassignedVar, value, currentAssignment)) {
                // Assign
                currentAssignment[unassignedVar.id] = value;

                // Recursive Step
                const result = await this.solve(variables, classrooms, currentAssignment);
                if (result) return result;

                // Backtrack
                delete currentAssignment[unassignedVar.id];
            }
        }

        return null; // No solution found from this path
    }

    /**
     * Check if the assignment is consistent with Hard Constraints.
     * @param {Object} variable - The section being scheduled
     * @param {Object} value - The proposed assignment { classroomId, day, start, end }
     * @param {Object} currentAssignment - Existing assignments
     * @returns {boolean}
     */
    isConsistent(variable, value, currentAssignment) {
        // 1. Capacity Constraint
        const classroom = value.classroomObj;
        if (classroom.capacity < variable.capacity) {
            return false; // Room too small
        }

        // 2. Double Booking & Instructor Constraint
        for (const assignedSectionId in currentAssignment) {
            const assigned = currentAssignment[assignedSectionId];

            // Check Time Overlap
            if (this.hasTimeOverlap(assigned, value)) {

                // Room Constraint: Same Room?
                if (assigned.classroomId === value.classroomId) {
                    return false; // Room already occupied
                }

                // Instructor Constraint: Same Instructor?
                // Need to look up instructor for the assigned section. 
                // We stored instructorId in the variable definition, we need to access it here.
                // NOTE: 'currentAssignment' values don't have instructorId by default, 
                // we should probably store more info in currentAssignment or look it up.
                // Let's assume passed 'variable' has instructorId, and we need to find instructor of assignedSectionId.
                // Optimization: Store instructorId in the assignment value too.
                if (assigned.instructorId === variable.instructorId) {
                    return false; // Instructor already busy
                }
            }
        }

        return true;
    }

    /**
     * Calculate a heuristic score for the assignment (Soft Constraints).
     * Higher is better.
     * @param {Object} assignment 
     * @returns {number}
     */
    calculateScore(assignment) {
        let score = 0;
        // Example: Penalize gaps between classes for the same group/semester (omitted for simplicity)
        // Example: Prefer certain rooms for certain departments
        return score;
    }

    /**
     * Generate possible assignments (Domain) for a variable.
     * @returns {Array} List of { classroomId, day, start, end, classroomObj, instructorId }
     */
    generateDomain(variable, classrooms) {
        const domain = [];
        const days = [1, 2, 3, 4, 5]; // Mon-Fri
        const timeSlots = [
            { start: '09:00', end: '11:50' }, // Morning block
            { start: '13:00', end: '15:50' }, // Afternoon block
            // Add more granular slots as needed
        ];

        for (const room of classrooms) {
            // Pre-filter by capacity to reduce domain size early
            if (room.capacity < variable.capacity) continue;

            for (const day of days) {
                for (const slot of timeSlots) {
                    domain.push({
                        classroomId: room.id,
                        classroomObj: room,
                        day: day,
                        start: slot.start,
                        end: slot.end,
                        instructorId: variable.instructorId // Carry over for easier checking
                    });
                }
            }
        }

        // Shuffle domain for randomness or sort by heuristics (optional)
        return domain;
    }

    hasTimeOverlap(slot1, slot2) {
        if (slot1.day !== slot2.day) return false;
        // Simple string comparison works for HH:MM if strictly formatted
        return (slot1.start < slot2.end && slot1.end > slot2.start);
    }

    async saveSchedule(assignment, semester) {
        const transaction = await require('../../models').sequelize.transaction();
        try {
            // First clear existing schedules for this semester if re-generating?
            // Or maybe this is an append operation. For DB safety, let's assume overwrite for the sections involved.

            const scheduleEntries = [];
            for (const [sectionId, val] of Object.entries(assignment)) {
                scheduleEntries.push({
                    section_id: sectionId,
                    classroom_id: val.classroomId,
                    day_of_week: val.day,
                    start_time: val.start,
                    end_time: val.end
                });
            }

            // Bulk Create
            await Schedule.bulkCreate(scheduleEntries, { transaction });

            // Also update CourseSection json if needed, or rely on Schedule table (Schedule table is better relationally)

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = new SchedulingService();
