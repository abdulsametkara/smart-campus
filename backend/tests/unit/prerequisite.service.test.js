/**
 * PrerequisiteService Unit Tests
 */

const prerequisiteService = require('../../src/services/prerequisite.service');

// Mock the models
jest.mock('../../models', () => ({
    Enrollment: {
        findAll: jest.fn()
    },
    Course: {
        findByPk: jest.fn()
    },
    Grade: {
        findOne: jest.fn()
    }
}));

const { Enrollment, Course, Grade } = require('../../models');

describe('PrerequisiteService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('checkPrerequisites', () => {
        test('should return valid when course has no prerequisites', async () => {
            Course.findByPk.mockResolvedValue({
                id: 1,
                code: 'CENG101',
                Prerequisites: []
            });

            const result = await prerequisiteService.checkPrerequisites(1, 1);

            expect(result.valid).toBe(true);
            expect(result.missing).toEqual([]);
        });

        test('should return invalid when prerequisite not completed', async () => {
            Course.findByPk.mockResolvedValue({
                id: 2,
                code: 'CENG201',
                Prerequisites: [{ id: 1, code: 'CENG101', name: 'Intro to CS' }]
            });

            // Student has no enrollments for prerequisite
            Enrollment.findAll.mockResolvedValue([]);
            Grade.findOne.mockResolvedValue(null);

            const result = await prerequisiteService.checkPrerequisites(1, 2);

            expect(result.valid).toBe(false);
            expect(result.missing.length).toBe(1);
            expect(result.missing[0].course_code).toBe('CENG101');
        });

        test('should return valid when prerequisite is completed with passing grade', async () => {
            Course.findByPk.mockResolvedValue({
                id: 2,
                code: 'CENG201',
                Prerequisites: [{ id: 1, code: 'CENG101', name: 'Intro to CS' }]
            });

            // Student completed the prerequisite
            Enrollment.findAll.mockResolvedValue([
                {
                    status: 'COMPLETED',
                    section: { course_id: 1 }
                }
            ]);

            // Has passing grade (DD or better)
            Grade.findOne.mockResolvedValue({ score: 60 }); // DD grade

            const result = await prerequisiteService.checkPrerequisites(1, 2);

            expect(result.valid).toBe(true);
        });

        test('should handle recursive prerequisite chains', async () => {
            // CENG301 requires CENG201, which requires CENG101
            Course.findByPk
                .mockResolvedValueOnce({
                    id: 3,
                    code: 'CENG301',
                    Prerequisites: [{ id: 2, code: 'CENG201', name: 'Data Structures' }]
                })
                .mockResolvedValueOnce({
                    id: 2,
                    code: 'CENG201',
                    Prerequisites: [{ id: 1, code: 'CENG101', name: 'Intro to CS' }]
                });

            // Student hasn't completed any
            Enrollment.findAll.mockResolvedValue([]);
            Grade.findOne.mockResolvedValue(null);

            const result = await prerequisiteService.checkPrerequisites(1, 3);

            expect(result.valid).toBe(false);
            expect(result.missing.length).toBeGreaterThanOrEqual(1);
        });
    });
});
