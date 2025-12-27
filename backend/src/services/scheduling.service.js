'use strict';

const { CourseSection, Classroom, Schedule, User, Course, sequelize } = require('../../models');
const { Op } = require('sequelize');

class SchedulingService {
    /**
     * Generate a schedule for a given semester using CSP.
     * @param {string} semester - e.g., 'Fall', 'Spring'
     * @param {number} year - e.g., 2024
     */
    async generateSchedule(semester) {
        // 1. Fetch Data
        const sections = await CourseSection.findAll({
            where: { semester },
            include: [{ model: Course, as: 'course' }, { model: User, as: 'instructor' }]
        });

        const classrooms = await Classroom.findAll();

        // Filter out sections that already have a schedule (optional, or we can overwrite)
        // For this implementation, we'll try to schedule everything that doesn't have a fixed schedule yet.
        const sectionsToSchedule = sections;

        if (sectionsToSchedule.length === 0) {
            throw new Error('No sections found to schedule for this semester.');
        }

        if (classrooms.length === 0) {
            throw new Error('No active classrooms found.');
        }

        // 2. Define Variables and Domains
        // Variable: Section
        // Domain: All valid (Day, TimeSlot, Room) tuples
        // We will simplify: 
        // Days: Mon(1) - Fri(5)
        // Slots: 09:00, 10:00, ... 16:00 (Assuming 1-hour blocks for simplicity, or we can handle duration)

        const assignments = {}; // sectionId -> { day, start, end, classroomId }

        // Sort variables by constraints (Heuristic: Most Constrained Variable - usually sections with specific equipment needs or large enrollment)
        // For now, sort by capacity needed descending
        sectionsToSchedule.sort((a, b) => b.quota - a.quota);

        // 3. CSP Backtracking
        const success = this.backtrack(sectionsToSchedule, 0, classrooms, assignments);

        if (!success) {
            throw new Error('Could not generate a conflict-free schedule. Please add more rooms or reduce constraints.');
        }

        return assignments;
    }

    /**
     * Recursive backtracking algorithm
     */
    backtrack(sections, index, classrooms, assignments) {
        if (index === sections.length) {
            return true; // All assigned
        }

        const section = sections[index];
        const domains = this.getDomains(section, classrooms);

        for (const slot of domains) {
            if (this.isConsistent(section, slot, assignments)) {
                assignments[section.id] = slot;

                if (this.backtrack(sections, index + 1, classrooms, assignments)) {
                    return true;
                }

                // Backtrack
                delete assignments[section.id];
            }
        }

        return false;
    }

    /**
     * Generate possible slots (Domain) for a section
     */
    getDomains(section, classrooms) {
        const slots = [];
        const days = [1, 2, 3, 4, 5]; // Mon-Fri
        const startHours = [9, 10, 11, 13, 14, 15]; // Available start hours (skip lunch 12-13)
        // Duration: logic could be dynamic. Assuming standard 3 hours per week split into blocks or single block.
        // For simplicity, let's assume each section needs one 3-hour block or modify as needed.
        // Let's assume standard 1 hour blocks for "slots", but typically courses are 2-3 hours.
        // Let's simplified: All sections are treated as 1-hour blocks for this POC algorithm, 
        // or better, use the Course credit to determine hours.

        // Using fixed 2-hour duration for all for demonstration reliability
        const duration = 2;

        for (const room of classrooms) {
            // Constraint: Room Capacity
            if (room.capacity < section.quota) continue;

            for (const day of days) {
                for (const hour of startHours) {
                    if (hour + duration > 17) continue; // Must finish by 5 PM

                    slots.push({
                        classroomId: room.id,
                        classroomName: room.name,
                        day: day,
                        start: `${hour.toString().padStart(2, '0')}:00`,
                        end: `${(hour + duration).toString().padStart(2, '0')}:00`,
                        instructorId: section.instructor_id
                    });
                }
            }
        }

        // Shuffle for randomness so we don't always pick Monday 9am
        return slots.sort(() => Math.random() - 0.5);
    }

    /**
     * Check if assignment is consistent with current assignments
     */
    isConsistent(section, slot, assignments) {
        for (const [assignedId, assignedSlot] of Object.entries(assignments)) {
            // 1. Room Overlap
            if (assignedSlot.classroomId === slot.classroomId) {
                if (this.hasTimeOverlap(slot, assignedSlot)) return false;
            }

            // 2. Instructor Overlap
            if (assignedSlot.instructorId && slot.instructorId && assignedSlot.instructorId === slot.instructorId) {
                if (this.hasTimeOverlap(slot, assignedSlot)) return false;
            }

            // 3. Course Overlap (Same Semester & Department - Soft constraint usually, but let's make it hard for optimal schedule)
            // We need section details for assignedId. Checking section details map might be needed.
            // Skipping strictly for simplified implementation.
        }
        return true;
    }

    hasTimeOverlap(slot1, slot2) {
        if (slot1.day !== slot2.day) return false;

        const start1 = parseInt(slot1.start.split(':')[0]);
        const end1 = parseInt(slot1.end.split(':')[0]);
        const start2 = parseInt(slot2.start.split(':')[0]);
        const end2 = parseInt(slot2.end.split(':')[0]);

        return Math.max(start1, start2) < Math.min(end1, end2);
    }

    /**
     * Save Generated Schedule to DB
     */
    async saveSchedule(assignments) {
        const t = await sequelize.transaction();
        try {
            for (const [sectionId, slot] of Object.entries(assignments)) {
                // Remove existing
                await Schedule.destroy({ where: { section_id: sectionId }, transaction: t });

                // Create new
                await Schedule.create({
                    section_id: sectionId,
                    classroom_id: slot.classroomId,
                    day_of_week: slot.day,
                    start_time: slot.start,
                    end_time: slot.end
                }, { transaction: t });
            }
            await t.commit();
            return { success: true };
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }
}

module.exports = new SchedulingService();
