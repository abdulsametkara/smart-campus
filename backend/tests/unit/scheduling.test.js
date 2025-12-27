const schedulingService = require('../../src/services/scheduling.service');

// Mock Models
jest.mock('../../models', () => ({
    CourseSection: {
        findAll: jest.fn(),
        update: jest.fn()
    },
    Classroom: {
        findAll: jest.fn()
    },
    Schedule: {
        bulkCreate: jest.fn(),
        destroy: jest.fn()
    },
    sequelize: {
        transaction: jest.fn(() => ({
            commit: jest.fn(),
            rollback: jest.fn()
        }))
    }
}));

const { CourseSection, Classroom, Schedule } = require('../../models');

describe('SchedulingService Unit Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fail if no sections found', async () => {
        CourseSection.findAll.mockResolvedValue([]);
        Classroom.findAll.mockResolvedValue([{ id: 1, capacity: 50, is_active: true }]);

        const result = await schedulingService.generateSchedule('2024-FALL');
        expect(result.success).toBe(false);
        expect(result.message).toContain('No sections found');
    });

    it('should successfully schedule non-conflicting sections', async () => {
        // Mock Data
        const mockSections = [
            { id: 101, capacity: 30, instructor_id: 1, course: { code: 'CS101' } },
            { id: 102, capacity: 30, instructor_id: 2, course: { code: 'CS102' } }
        ];
        const mockClassrooms = [
            { id: 1, capacity: 40, is_active: true } // Single room, large enough
        ];

        CourseSection.findAll.mockResolvedValue(mockSections);
        Classroom.findAll.mockResolvedValue(mockClassrooms);

        const result = await schedulingService.generateSchedule('2024-FALL');

        expect(result.success).toBe(true);
        expect(result.assignments).toBeDefined();

        // Should have scheduled 2 items
        const assignments = result.assignments;
        expect(Object.keys(assignments)).toHaveLength(2);

        // Since it's the same room, they MUST be at different times
        const slot1 = assignments['101'];
        const slot2 = assignments['102'];

        // Either different days or different times
        const overlap = (slot1.day === slot2.day) &&
            (slot1.start < slot2.end && slot1.end > slot2.start);

        expect(overlap).toBe(false);
    });

    it('should handle capacity constraints (Room too small)', async () => {
        const mockSections = [
            { id: 103, capacity: 50, instructor_id: 3, course: { code: 'CS201' } }
        ];
        const mockClassrooms = [
            { id: 2, capacity: 20, is_active: true } // Too small
        ];

        CourseSection.findAll.mockResolvedValue(mockSections);
        Classroom.findAll.mockResolvedValue(mockClassrooms);

        const result = await schedulingService.generateSchedule('2024-FALL');

        // Should fail to find solution (no room with sufficient capacity)
        expect(result.success).toBe(false);
        expect(result.message).toContain('Uygun bir program');
    });

    it('should handle instructor conflict constraints', async () => {
        // Two sections taught by SAME instructor
        const mockSections = [
            { id: 201, capacity: 30, instructor_id: 5, course: { code: 'MATH101' } },
            { id: 202, capacity: 30, instructor_id: 5, course: { code: 'MATH102' } }
        ];
        // Two rooms available, so room conflict is not an issue
        const mockClassrooms = [
            { id: 1, capacity: 40, is_active: true },
            { id: 2, capacity: 40, is_active: true }
        ];

        CourseSection.findAll.mockResolvedValue(mockSections);
        Classroom.findAll.mockResolvedValue(mockClassrooms);

        const result = await schedulingService.generateSchedule('2024-FALL');
        expect(result.success).toBe(true);

        const assignments = result.assignments;
        const s1 = assignments['201'];
        const s2 = assignments['202'];

        // Must not overlap because same instructor
        const overlap = (s1.day === s2.day) &&
            (s1.start < s2.end && s1.end > s2.start);

        expect(overlap).toBe(false);
    });

});
