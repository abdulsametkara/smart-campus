const schedulingService = require('../../src/services/scheduling.service');

describe('SchedulingService Soft Constraints', () => {

    it('should calculate correct score for gaps', () => {
        // Mock Assignment: Instructor 1 has two classes on Day 1
        // Case 1: 10 min gap (Bonus)
        const assignment1 = {
            '101': { instructorId: 1, day: 1, start: '09:00', end: '09:50' },
            '102': { instructorId: 1, day: 1, start: '10:00', end: '10:50' }
        };
        // Gap = 10 mins. Logic: <= 20 -> +5. Score = 10 (counted both directions).
        const score1 = schedulingService.calculateScore(assignment1);
        expect(score1).toBe(10);

        // Case 2: 40 min gap (Small Penalty)
        const assignment2 = {
            '201': { instructorId: 2, day: 2, start: '09:00', end: '09:50' },
            '202': { instructorId: 2, day: 2, start: '10:30', end: '11:20' }
        };
        // Gap = 40 mins. Logic: > 20 && <= 60 -> -2. Score = -4 (counted both directions).
        const score2 = schedulingService.calculateScore(assignment2);
        expect(score2).toBe(-4);

        // Case 3: 120 min gap (Large Penalty)
        const assignment3 = {
            '301': { instructorId: 3, day: 3, start: '09:00', end: '09:50' },
            '302': { instructorId: 3, day: 3, start: '12:00', end: '12:50' }
        };
        // Gap = 130 mins. Logic: > 60 -> -5. Score = -10 (counted both directions).
        const score3 = schedulingService.calculateScore(assignment3);
        expect(score3).toBe(-10);
    });

    it('should ignore assignments without instructor', () => {
        const assignment = {
            '401': { classroomId: 1, day: 1, start: '09:00', end: '09:50' } // No instructorId
        };
        const score = schedulingService.calculateScore(assignment);
        expect(score).toBe(0);
    });
});
