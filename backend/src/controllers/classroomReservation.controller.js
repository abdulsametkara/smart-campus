const { Reservation, Classroom, User } = require('../../models');
const { Op } = require('sequelize');

class ClassroomReservationController {

    // Create a new reservation request
    async createReservation(req, res) {
        try {
            const { classroom_id, date, start_time, end_time, purpose } = req.body;
            
            // Validate required fields
            if (!classroom_id || !date || !start_time || !end_time || !purpose) {
                return res.status(400).json({ message: 'Tüm alanlar zorunludur.' });
            }

            // Validate user is authenticated
            if (!req.user || !req.user.id) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            // Only students and faculty can create reservations (admin should approve, not create)
            if (req.user.role !== 'student' && req.user.role !== 'faculty') {
                return res.status(403).json({ 
                    message: 'Rezervasyon oluşturmak için öğrenci veya öğretim görevlisi olmanız gerekir. Yöneticiler rezervasyon onaylamak için yönetim sayfasını kullanabilir.' 
                });
            }

            const user_id = req.user.id;

            // Validate time format and logic
            if (start_time >= end_time) {
                return res.status(400).json({ message: 'Başlangıç saati bitiş saatinden önce olmalıdır.' });
            }

            // Check if room exists
            const classroom = await Classroom.findByPk(classroom_id);
            if (!classroom) {
                return res.status(404).json({ message: 'Sınıf bulunamadı.' });
            }

            // Check for conflicts with existing APPROVED reservations
            const existing = await Reservation.findOne({
                where: {
                    classroom_id,
                    date,
                    status: 'approved',
                    [Op.and]: [
                        { start_time: { [Op.lt]: end_time } },
                        { end_time: { [Op.gt]: start_time } }
                    ]
                }
            });

            if (existing) {
                return res.status(409).json({ message: 'Bu saat dilimi için sınıf zaten rezerve edilmiş.' });
            }

            // Create reservation
            const reservation = await Reservation.create({
                classroom_id,
                user_id,
                date,
                start_time,
                end_time,
                purpose,
                status: 'pending' // Defaults to pending
            });

            // Fetch reservation with related data
            const reservationWithDetails = await Reservation.findByPk(reservation.id, {
                include: [
                    { model: Classroom, as: 'classroom', attributes: ['id', 'name', 'building', 'room_number', 'capacity'] },
                    { model: User, as: 'user', attributes: ['id', 'full_name', 'email'] }
                ]
            });

            return res.status(201).json({
                message: 'Rezervasyon talebi başarıyla oluşturuldu.',
                reservation: reservationWithDetails
            });

        } catch (error) {
            console.error('Error creating reservation:', error);
            return res.status(500).json({ 
                message: 'Rezervasyon oluşturulurken bir hata oluştu.',
                error: error.message 
            });
        }
    }

    // List reservations (with filters)
    async listReservations(req, res) {
        try {
            const { status, date, classroom_id } = req.query;
            const whereClause = {};

            if (status) whereClause.status = status;
            if (date) whereClause.date = date;
            if (classroom_id) whereClause.classroom_id = classroom_id;

            // If regular user, maybe only show their own? Or public view?
            // Let's assume public view for availability checking, but maybe limit details.

            const reservations = await Reservation.findAll({
                where: whereClause,
                include: [
                    { model: Classroom, as: 'classroom', attributes: ['id', 'name', 'building', 'room_number', 'capacity'] },
                    { model: User, as: 'user', attributes: ['id', 'full_name', 'email'] }
                ],
                order: [['date', 'ASC'], ['start_time', 'ASC']]
            });

            return res.json(reservations);
        } catch (error) {
            console.error('Error listing reservations:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Approve/Reject reservation (Admin only)
    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body; // 'approved', 'rejected'
            
            if (!req.user || !req.user.id) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            
            const adminId = req.user.id;

            if (!['approved', 'rejected', 'cancelled'].includes(status)) {
                return res.status(400).json({ message: 'Invalid status' });
            }

            const reservation = await Reservation.findByPk(id);
            if (!reservation) {
                return res.status(404).json({ message: 'Reservation not found' });
            }

            // If approving, double check conflict just in case
            if (status === 'approved') {
                const conflict = await Reservation.findOne({
                    where: {
                        classroom_id: reservation.classroom_id,
                        date: reservation.date,
                        status: 'approved',
                        id: { [Op.ne]: id }, // Exclude self
                        [Op.and]: [
                            { start_time: { [Op.lt]: reservation.end_time } },
                            { end_time: { [Op.gt]: reservation.start_time } }
                        ]
                    }
                });

                if (conflict) {
                    return res.status(409).json({ message: 'Cannot approve: Time slot conflict with another approved reservation.' });
                }
            }

            reservation.status = status;
            if (status === 'approved') {
                reservation.approved_by = adminId;
            }
            await reservation.save();

            return res.json({ message: `Reservation ${status} successfully.`, reservation });

        } catch (error) {
            console.error('Error updating reservation:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = new ClassroomReservationController();
