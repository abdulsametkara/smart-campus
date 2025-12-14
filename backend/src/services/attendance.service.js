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
     * Validate student check-in with enhanced spoofing detection
     */
    async validateCheckIn(session, studentId, userLat, userLon, userQrCode, accuracy = 10) {
        const result = { valid: false, reason: null, distance: 0, isFlagged: false, flagReason: null };

        // 1. QR Code Check (if required)
        if (session.qr_code && userQrCode && session.qr_code !== userQrCode) {
            result.reason = 'Geçersiz QR Kod';
            return result;
        }

        // 2. Session Status
        if (session.status !== 'ACTIVE') {
            result.reason = 'Yoklama oturumu kapalı';
            return result;
        }

        // 3. Time Check
        const now = new Date();
        if (now < new Date(session.start_time) || (session.end_time && now > new Date(session.end_time))) {
            result.reason = 'Yoklama süresi dolmuş';
            return result;
        }

        // 4. Enrollment Check
        const enrollment = await Enrollment.findOne({
            where: {
                student_id: studentId,
                section_id: session.section_id,
                status: 'ACTIVE'
            }
        });

        if (!enrollment) {
            result.reason = 'Bu derse kayıtlı değilsiniz';
            return result;
        }

        // 5. GPS Accuracy Spoofing Check
        if (accuracy > 100) {
            result.reason = 'GPS doğruluğu çok düşük. Lütfen açık alanda deneyin.';
            result.isFlagged = true;
            result.flagReason = 'Düşük GPS doğruluğu (accuracy > 100m)';
            return result;
        }

        // 6. Distance Check (Haversine)
        if (session.latitude && session.longitude) {
            const distance = this.calculateDistance(
                parseFloat(session.latitude),
                parseFloat(session.longitude),
                parseFloat(userLat),
                parseFloat(userLon)
            );
            result.distance = distance;

            // Add accuracy buffer to allowed radius
            const accuracyBuffer = Math.min(accuracy, 20); // Max 20m buffer
            const maxDistance = (session.radius || 15) + accuracyBuffer;

            if (distance > maxDistance) {
                result.reason = `Sınıfa çok uzaksınız (${distance.toFixed(0)}m > ${maxDistance.toFixed(0)}m)`;
                result.isFlagged = true;
                result.flagReason = `Mesafe aşımı: ${distance.toFixed(1)}m`;
                return result;
            }

            // Warning: Suspicious if exactly at boundary (possible spoofing)
            if (distance > maxDistance * 0.9 && accuracy < 5) {
                result.isFlagged = true;
                result.flagReason = 'Sınır bölgesi + düşük accuracy (şüpheli)';
            }
        }

        // 7. Duplicate Check
        const existingRecord = await AttendanceRecord.findOne({
            where: {
                session_id: session.id,
                student_id: studentId
            }
        });

        if (existingRecord) {
            result.reason = 'Bu oturumda zaten yoklama verdiniz';
            return result;
        }

        result.valid = true;
        return result;
    }
}

module.exports = new AttendanceService();

