/**
 * ScheduleConflictService Unit Tests
 */

const scheduleConflictService = require('../../src/services/scheduleConflict.service');

// Mock the models
jest.mock('../../models', () => ({
    Enrollment: {
        findAll: jest.fn()
    },
    CourseSection: {
        findByPk: jest.fn()
    }
}));

const { Enrollment, CourseSection } = require('../../models');

describe('ScheduleConflictService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('checkConflict', () => {
        test('should detect time overlap on same day', async () => {
            // Existing enrollment
            Enrollment.findAll.mockResolvedValue([{
                section: {
                    id: 1,
                    schedule: [{ day: 'Monday', start: '09:00', end: '12:00' }],
                    course: { code: 'CENG101', name: 'Intro' }
                }
            }]);

            // New section with overlapping time
            CourseSection.findByPk.mockResolvedValue({
                id: 2,
                schedule: [{ day: 'Monday', start: '10:00', end: '13:00' }],
                course: { code: 'CENG201', name: 'Data Structures' }
            });

            const result = await scheduleConflictService.checkConflict(1, 2);

            expect(result.hasConflict).toBe(true);
            expect(result.conflicts.length).toBe(1);
        });

        test('should not flag conflict on different days', async () => {
            Enrollment.findAll.mockResolvedValue([{
                section: {
                    id: 1,
                    schedule: [{ day: 'Monday', start: '09:00', end: '12:00' }],
                    course: { code: 'CENG101', name: 'Intro' }
                }
            }]);

            CourseSection.findByPk.mockResolvedValue({
                id: 2,
                schedule: [{ day: 'Tuesday', start: '09:00', end: '12:00' }],
                course: { code: 'CENG201', name: 'Data Structures' }
            });

            const result = await scheduleConflictService.checkConflict(1, 2);

            expect(result.hasConflict).toBe(false);
        });

        test('should not flag conflict when times do not overlap', async () => {
            Enrollment.findAll.mockResolvedValue([{
                section: {
                    id: 1,
                    schedule: [{ day: 'Monday', start: '09:00', end: '10:00' }],
                    course: { code: 'CENG101', name: 'Intro' }
                }
            }]);

            CourseSection.findByPk.mockResolvedValue({
                id: 2,
                schedule: [{ day: 'Monday', start: '10:00', end: '12:00' }],
                course: { code: 'CENG201', name: 'Data Structures' }
            });

            const result = await scheduleConflictService.checkConflict(1, 2);

            expect(result.hasConflict).toBe(false);
        });

        test('should handle no existing enrollments', async () => {
            Enrollment.findAll.mockResolvedValue([]);

            CourseSection.findByPk.mockResolvedValue({
                id: 2,
                schedule: [{ day: 'Monday', start: '09:00', end: '12:00' }],
                course: { code: 'CENG201', name: 'Data Structures' }
            });

            const result = await scheduleConflictService.checkConflict(1, 2);

            expect(result.hasConflict).toBe(false);
        });
    });

    describe('timeOverlap helper', () => {
        test('should correctly identify overlapping times', () => {
            // Testing internal logic - times overlap if:
            // start1 < end2 AND start2 < end1
            const overlap = (s1, e1, s2, e2) => {
                return s1 < e2 && s2 < e1;
            };

            expect(overlap('09:00', '12:00', '10:00', '13:00')).toBe(true);
            expect(overlap('09:00', '10:00', '10:00', '12:00')).toBe(false);
            expect(overlap('14:00', '16:00', '09:00', '12:00')).toBe(false);
        });
    });
});
