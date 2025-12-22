const { CourseSection, Schedule, Classroom, Enrollment, User } = require('../../models');
const { Op } = require('sequelize');

class SchedulingService {
    /**
     * Generate schedule for a given semester using CSP (Constraint Satisfaction Problem) approach.
     * @param {string} semester - e.g., "2024-FALL"
     * @param {Object} options - Configuration options
     * @param {boolean} options.overwriteExisting - Whether to overwrite existing schedules
     * @param {string} options.preferredTimeSlot - 'morning', 'afternoon', or 'any'
     * @returns {Promise<Object>} - Result summary
     */
    async generateSchedule(semester, options = {}) {
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
            const assignment = await this.solve(variables, classrooms, {}, options);

            if (!assignment) {
                console.log('[DEBUG] Solver could not find a solution.');
                return { success: false, message: 'Uygun bir program oluşturulamadı. Lütfen kısıtları (sınıf sayısı vs.) kontrol edin.' };
            }

            console.log(`[DEBUG] Solution found with ${Object.keys(assignment).length} assignments.`);

            // 4. Save Solution to Database
            await this.saveSchedule(assignment, semester, options);

            const assignmentCount = Object.keys(assignment).length;
            const totalSections = sections.length;
            const unassignedCount = totalSections - assignmentCount;

            return { 
                success: true, 
                message: `Ders programı başarıyla oluşturuldu. ${assignmentCount} ders atandı${unassignedCount > 0 ? `, ${unassignedCount} ders atanamadı` : ''}.`, 
                assignmentCount,
                totalSections,
                unassignedCount
            };

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
    async solve(variables, classrooms, currentAssignment, options = {}) {
        // Base case: All variables assigned
        if (Object.keys(currentAssignment).length === variables.length) {
            return currentAssignment;
        }

        // Select unassigned variable (Heuristic: MRV - Minimum Remaining Values could be used here)
        // For simplicity, taking the next one in the list
        const unassignedVar = variables.find(v => !currentAssignment[v.id]);

        // Define Domain for this variable (Time Slots * Classrooms)
        // This is a simplified domain generation. In reality, we might iterate efficiently.
        const domain = this.generateDomain(unassignedVar, classrooms, options);

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

        // Soft Constraint: Minimize Gaps for Instructors
        // 1. Group by Instructor -> Day -> Time Slots
        const instructorSchedules = {};

        for (const [sectionId, val] of Object.entries(assignment)) {
            // val = { classroomId, day, start, end, instructorId }
            if (!val.instructorId) continue;

            if (!instructorSchedules[val.instructorId]) {
                instructorSchedules[val.instructorId] = {};
            }
            if (!instructorSchedules[val.instructorId][val.day]) {
                instructorSchedules[val.instructorId][val.day] = [];
            }
            instructorSchedules[val.instructorId][val.day].push(val);
        }

        // 2. Calculate Penalties
        // For each instructor, for each day, sort slots by time and check gaps
        for (const instructorId in instructorSchedules) {
            for (const day in instructorSchedules[instructorId]) {
                const slots = instructorSchedules[instructorId][day];

                // Sort by start time
                slots.sort((a, b) => a.start.localeCompare(b.start));

                for (let i = 0; i < slots.length - 1; i++) {
                    const current = slots[i];
                    const next = slots[i + 1];

                    // Check gap
                    // current.end vs next.start
                    // Assume format HH:MM
                    const gap = this.calculateGapMinutes(current.end, next.start);

                    if (gap > 60) { // Gap > 60 mins
                        score -= 10; // Penalty
                    } else if (gap > 20) {
                        score -= 2; // Small penalty for medium gaps
                    } else {
                        score += 5; // Bonus for compact schedule
                    }
                }
            }
        }

        return score;
    }

    calculateGapMinutes(endTime, startTime) {
        const [endH, endM] = endTime.split(':').map(Number);
        const [startH, startM] = startTime.split(':').map(Number);

        const endMinutes = endH * 60 + endM;
        const startMinutes = startH * 60 + startM;

        return startMinutes - endMinutes;
    }

    /**
     * Generate possible assignments (Domain) for a variable.
     * @returns {Array} List of { classroomId, day, start, end, classroomObj, instructorId }
     */
    generateDomain(variable, classrooms, options = {}) {
        const domain = [];
        const days = [1, 2, 3, 4, 5]; // Mon-Fri
        
        // Time slots based on preference
        let timeSlots = [];
        const { preferredTimeSlot = 'any' } = options;
        
        if (preferredTimeSlot === 'morning') {
            timeSlots = [
                { start: '09:00', end: '11:50' }, // Morning block
                { start: '08:00', end: '10:50' }, // Early morning
                { start: '10:00', end: '12:50' }  // Late morning
            ];
        } else if (preferredTimeSlot === 'afternoon') {
            timeSlots = [
                { start: '13:00', end: '15:50' }, // Afternoon block
                { start: '14:00', end: '16:50' }, // Late afternoon
                { start: '15:00', end: '17:50' }  // Evening
            ];
        } else {
            // Any time - include all slots
            timeSlots = [
                { start: '09:00', end: '11:50' }, // Morning block
                { start: '13:00', end: '15:50' }, // Afternoon block
                { start: '08:00', end: '10:50' }, // Early morning
                { start: '10:00', end: '12:50' }, // Late morning
                { start: '14:00', end: '16:50' }, // Late afternoon
                { start: '15:00', end: '17:50' }  // Evening
            ];
        }

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

    async saveSchedule(assignment, semester, options = {}) {
        const transaction = await require('../../models').sequelize.transaction();
        try {
            const { overwriteExisting = true } = options;

            // Clear existing schedules for this semester if overwriting
            if (overwriteExisting) {
                // Get section IDs that will be updated
                const sectionIds = Object.keys(assignment).map(id => parseInt(id));
                
                // Delete existing Schedule entries for these sections
                await Schedule.destroy({
                    where: { section_id: { [Op.in]: sectionIds } },
                    transaction
                });
            }

            const scheduleEntries = [];
            const sectionUpdates = {}; // To update CourseSection.schedule JSONB

            for (const [sectionId, val] of Object.entries(assignment)) {
                const sectionIdNum = parseInt(sectionId);
                
                // Add to Schedule table
                scheduleEntries.push({
                    section_id: sectionIdNum,
                    classroom_id: val.classroomId,
                    day_of_week: val.day,
                    start_time: val.start,
                    end_time: val.end
                });

                // Prepare CourseSection.schedule update (JSONB format)
                if (!sectionUpdates[sectionIdNum]) {
                    sectionUpdates[sectionIdNum] = [];
                }
                
                // Map day_of_week (1-5) to day name (Monday-Friday)
                const dayMap = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday' };
                sectionUpdates[sectionIdNum].push({
                    day: dayMap[val.day] || 'Monday',
                    start: val.start,
                    end: val.end,
                    room_id: val.classroomId
                });
            }

            // Bulk Create Schedule entries
            await Schedule.bulkCreate(scheduleEntries, { transaction });

            // Update CourseSection.schedule JSONB fields
            for (const [sectionId, scheduleArray] of Object.entries(sectionUpdates)) {
                await CourseSection.update(
                    { schedule: scheduleArray },
                    { where: { id: parseInt(sectionId) }, transaction }
                );
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = new SchedulingService();
