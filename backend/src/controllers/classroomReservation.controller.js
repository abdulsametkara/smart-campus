const { Reservation, Classroom, User } = require('../../models');
const { Op } = require('sequelize');

class ClassroomReservationController {

    // Create a new reservation request
    async createReservation(req, res) {
        try {
            const { classroom_id, date, start_time, end_time, purpose } = req.body;
            const user_id = req.user.id; // Assuming auth middleware sets req.user

            // Check if room exists
            const classroom = await Classroom.findByPk(classroom_id);
            if (!classroom) {
                return res.status(404).json({ message: 'Classroom not found' });
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
                return res.status(409).json({ message: 'Room is already reserved for this time slot.' });
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

            return res.status(201).json({
                message: 'Reservation request created successfully.',
                reservation
            });

        } catch (error) {
            console.error('Error creating reservation:', error);
            return res.status(500).json({ message: 'Internal server error' });
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
                    { model: Classroom, as: 'classroom', attributes: ['name', 'location'] },
                    { model: User, as: 'user', attributes: ['name', 'email'] }
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
