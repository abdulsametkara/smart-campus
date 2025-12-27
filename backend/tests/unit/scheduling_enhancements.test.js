const schedulingService = require('../../src/services/scheduling.service');

describe('SchedulingService Soft Constraints', () => {

    it('should calculate correct score for gaps', () => {
        // Case 1: 0-hour gap (Bonus) - consecutive classes
        // end1=10, start2=10 → gap=0 → <=20 → +5
        // end1=11, start2=9 → gap=20 → <=20 → +5
        // Total: +10
        const assignment1 = {
            '101': { instructorId: 1, day: 1, start: '09:00', end: '10:00' },
            '102': { instructorId: 1, day: 1, start: '10:00', end: '11:00' }
        };
        const score1 = schedulingService.calculateScore(assignment1);
        expect(score1).toBe(10); // +5 + +5 (both directions)

        // Case 2: Asymmetric gap calculation
        // Direction 1 (201→202): end=11, start=14 → gap=30 → -2
        // Direction 2 (202→201): end=16, start=9 → gap=70 → -5
        // Total: -7
        const assignment2 = {
            '201': { instructorId: 2, day: 2, start: '09:00', end: '11:00' },
            '202': { instructorId: 2, day: 2, start: '14:00', end: '16:00' }
        };
        const score2 = schedulingService.calculateScore(assignment2);
        expect(score2).toBe(-7); // -2 + -5 (asymmetric)

        // Case 3: Large gap both directions
        // Direction 1 (301→302): end=10, start=17 → gap=70 → -5
        // Direction 2 (302→301): end=18, start=9 → gap=90 → -5
        // Total: -10
        const assignment3 = {
            '301': { instructorId: 3, day: 3, start: '09:00', end: '10:00' },
            '302': { instructorId: 3, day: 3, start: '17:00', end: '18:00' }
        };
        const score3 = schedulingService.calculateScore(assignment3);
        expect(score3).toBe(-10); // -5 + -5 (both large gaps)
    });

    it('should ignore assignments without instructor', () => {
        const assignment = {
            '401': { classroomId: 1, day: 1, start: '09:00', end: '09:50' } // No instructorId
        };
        const score = schedulingService.calculateScore(assignment);
        expect(score).toBe(0);
    });
});
