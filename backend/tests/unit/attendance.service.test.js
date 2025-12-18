/**
 * AttendanceService Unit Tests - Haversine & Spoofing Detection
 */

const attendanceService = require('../../src/services/attendance.service');

describe('AttendanceService', () => {
    describe('Haversine Distance Calculation', () => {
        test('should calculate distance correctly for known coordinates', () => {
            // Istanbul Technical University to Galata Tower (~3.5 km)
            const lat1 = 41.1054; // ITU
            const lon1 = 29.0238;
            const lat2 = 41.0256; // Galata
            const lon2 = 28.9741;

            const distance = attendanceService.calculateDistance(lat1, lon1, lat2, lon2);

            // Should be around 9-10 km (actual is ~9.4 km)
            expect(distance).toBeGreaterThan(8000);
            expect(distance).toBeLessThan(11000);
        });

        test('should return 0 for same coordinates', () => {
            const lat = 41.1054;
            const lon = 29.0238;

            const distance = attendanceService.calculateDistance(lat, lon, lat, lon);

            expect(distance).toBe(0);
        });

        test('should calculate short distance accurately', () => {
            // Two points ~100 meters apart
            const lat1 = 41.1054;
            const lon1 = 29.0238;
            const lat2 = 41.1055; // ~100m north
            const lon2 = 29.0238;

            const distance = attendanceService.calculateDistance(lat1, lon1, lat2, lon2);

            // Should be around 11 meters (1 degree lat ~111km, so 0.0001 ~ 11m)
            expect(distance).toBeGreaterThan(5);
            expect(distance).toBeLessThan(20);
        });
    });

    describe('isWithinRadius', () => {
        test('should return true when within radius', () => {
            const studentLat = 41.1054;
            const studentLon = 29.0238;
            const classroomLat = 41.1055;
            const classroomLon = 29.0238;
            const radius = 50; // 50 meters

            const result = attendanceService.isWithinRadius(
                studentLat, studentLon,
                classroomLat, classroomLon,
                radius
            );

            expect(result).toBe(true);
        });

        test('should return false when outside radius', () => {
            const studentLat = 41.1054;
            const studentLon = 29.0238;
            const classroomLat = 41.1100; // ~500m away
            const classroomLon = 29.0238;
            const radius = 50; // 50 meters

            const result = attendanceService.isWithinRadius(
                studentLat, studentLon,
                classroomLat, classroomLon,
                radius
            );

            expect(result).toBe(false);
        });
    });

    describe('Spoofing Detection', () => {
        test('should flag low GPS accuracy as suspicious', () => {
            const checkData = {
                latitude: 41.1054,
                longitude: 29.0238,
                accuracy: 500 // Very low accuracy (high number = less accurate)
            };

            const result = attendanceService.checkSpoofingIndicators(checkData);

            expect(result.isSuspicious).toBe(true);
            expect(result.reasons).toContain('low_accuracy');
        });

        test('should not flag high GPS accuracy', () => {
            const checkData = {
                latitude: 41.1054,
                longitude: 29.0238,
                accuracy: 10 // Good accuracy
            };

            const result = attendanceService.checkSpoofingIndicators(checkData);

            expect(result.isSuspicious).toBe(false);
        });

        test('should flag impossible travel speed', () => {
            const checkData = {
                latitude: 41.1054,
                longitude: 29.0238,
                accuracy: 10,
                previousLocation: {
                    latitude: 40.0000, // ~120 km away
                    longitude: 29.0238,
                    timestamp: Date.now() - 60000 // 1 minute ago
                }
            };

            const result = attendanceService.checkSpoofingIndicators(checkData);

            // 120km in 1 minute = 7200 km/h - impossible
            expect(result.isSuspicious).toBe(true);
            expect(result.reasons).toContain('impossible_speed');
        });
    });
});
