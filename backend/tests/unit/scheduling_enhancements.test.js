const schedulingService = require('../../src/services/scheduling.service');

describe('SchedulingService Soft Constraints', () => {

    it('should calculate correct score for gaps', () => {
        // Case 1: 0-hour gap (Bonus) - consecutive classes
        // Implementation uses hour portion only: |10-10| * 10 = 0 min → <= 20 → +5 per direction = 10
        const assignment1 = {
            '101': { instructorId: 1, day: 1, start: '09:00', end: '10:00' },
            '102': { instructorId: 1, day: 1, start: '10:00', end: '11:00' }
        };
        const score1 = schedulingService.calculateScore(assignment1);
        expect(score1).toBe(10); // +5 * 2 (both directions)

        // Case 2: 3-hour gap (Small Penalty)
        // Implementation: |14-11| * 10 = 30 min → > 20 && <= 60 → -2 per direction = -4
        const assignment2 = {
            '201': { instructorId: 2, day: 2, start: '09:00', end: '11:00' },
            '202': { instructorId: 2, day: 2, start: '14:00', end: '16:00' }
        };
        const score2 = schedulingService.calculateScore(assignment2);
        expect(score2).toBe(-4); // -2 * 2 (both directions)

        // Case 3: 7-hour gap (Large Penalty) 
        // Implementation: |17-10| * 10 = 70 min → > 60 → -5 per direction
        const assignment3 = {
            '301': { instructorId: 3, day: 3, start: '09:00', end: '10:00' },
            '302': { instructorId: 3, day: 3, start: '17:00', end: '18:00' }
        };
        const score3 = schedulingService.calculateScore(assignment3);
        expect(score3).toBe(-10); // -5 * 2 (both directions)
    });

    it('should ignore assignments without instructor', () => {
        const assignment = {
            '401': { classroomId: 1, day: 1, start: '09:00', end: '09:50' } // No instructorId
        };
        const score = schedulingService.calculateScore(assignment);
        expect(score).toBe(0);
    });
});
