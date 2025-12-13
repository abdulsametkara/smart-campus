const { AttendanceSession, AttendanceRecord, Enrollment, User } = require('../../models');
const { Op } = require('sequelize');

class AttendanceService {

    /**
     * Calculate distance between two points in meters using Haversine formula
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth radius in meters
        const phi1 = lat1 * Math.PI / 180;
        const phi2 = lat2 * Math.PI / 180;
        const deltaPhi = (lat2 - lat1) * Math.PI / 180;
        const deltaLambda = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }

    /**
     * Validate student check-in
     */
    async validateCheckIn(session, studentId, userLat, userLon, userQrCode) {
        const result = { valid: false, reason: null, distance: 0, isFlagged: false, flagReason: null };

        // 1. QR Code Check
        if (session.qr_code && session.qr_code !== userQrCode) {
            result.reason = 'Invalid QR Code';
            return result;
        }

        // 2. Session Status
        if (session.status !== 'ACTIVE') {
            result.reason = 'Session is closed';
            return result;
        }

        // 3. Time Check (Optional buffer)
        const now = new Date();
        if (now < new Date(session.start_time) || (session.end_time && now > new Date(session.end_time))) {
            result.reason = 'Session expired';
            return result;
        }

        // 4. Enrollment Check (Is student in this section?)
        const enrollment = await Enrollment.findOne({
            where: {
                student_id: studentId,
                section_id: session.section_id,
                status: 'ACTIVE'
            }
        });

        if (!enrollment) {
            result.reason = 'Student not enrolled in this section';
            return result;
        }

        // 5. Distance Check (Haversine)
        if (session.latitude && session.longitude) {
            const distance = this.calculateDistance(
                parseFloat(session.latitude),
                parseFloat(session.longitude),
                parseFloat(userLat),
                parseFloat(userLon)
            );
            result.distance = distance;

            // Allow 5m extra accuracy buffer
            const maxDistance = (session.radius || 15) + 5;

            if (distance > maxDistance) {
                // SPOOFING SUSPICION: User is too far but tried to check in
                // Ideally we block them, or we flag them. Requirement says "Validate distance <= radius".
                result.reason = `Too far from classroom (${distance.toFixed(1)}m > ${maxDistance}m)`;
                result.isFlagged = true; // Use this to log a failed attempt or flagged record
                result.flagReason = 'Distance mismatch';
                return result;
            }
        }

        // 6. Duplicate Check (Already checked in?)
        const existingRecord = await AttendanceRecord.findOne({
            where: {
                session_id: session.id,
                student_id: studentId
            }
        });

        if (existingRecord) {
            result.reason = 'Already checking in';
            return result;
        }

        result.valid = true;
        return result;
    }
}

module.exports = new AttendanceService();
