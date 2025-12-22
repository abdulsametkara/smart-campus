// Shared QR code payload helpers for different domains.

const QrCodeService = {
  // Event registration QR payload
  buildEventPayload({ eventId, userId, registrationId }) {
    return JSON.stringify({
      type: 'event',
      eventId,
      userId,
      registrationId
    });
  },

  // Meal reservation QR payload (kept for documentation; backend already returns image/string)
  buildMealPayload({ reservationId, userId, menuId }) {
    return JSON.stringify({
      type: 'meal',
      reservationId,
      userId,
      menuId
    });
  },

  // Attendance QR payload (if needed on frontend)
  buildAttendancePayload({ sessionId, code }) {
    return JSON.stringify({
      type: 'attendance',
      sessionId,
      code
    });
  }
};

export default QrCodeService;


