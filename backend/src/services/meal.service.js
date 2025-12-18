const { MealMenu, MealReservation, Cafeteria, sequelize } = require('../../models');
const walletService = require('./wallet.service');
const qrService = require('./qr.service');
const { Op } = require('sequelize');

class MealService {
    /**
     * Get menus for a date range (defaults to current week)
     */
    async getMenus(startDate, endDate) {
        return await MealMenu.findAll({
            where: {
                date: {
                    [Op.between]: [startDate, endDate]
                }
            },
            include: [{ model: Cafeteria, as: 'cafeteria' }],
            order: [['date', 'ASC']]
        });
    }

    /**
     * Make a meal reservation
     */
    async makeReservation(userId, menuId) {
        const t = await sequelize.transaction();

        try {
            // 1. Check if menu exists
            const menu = await MealMenu.findByPk(menuId);
            if (!menu) throw new Error('Menu not found');

            // 2. Check if already reserved
            const existing = await MealReservation.findOne({
                where: { user_id: userId, menu_id: menuId, status: { [Op.not]: 'cancelled' } }
            });
            if (existing) throw new Error('Already reserved for this meal');

            // 3. Process Payment (Assuming fixed price for simplicity, e.g., 20 TL)
            // In a real app, price should be in the menu model.
            const PRICE = 20.00;
            await walletService.processPayment(userId, PRICE, `Meal Reservation: ${menu.date}`); // Uses its own transaction

            // 4. Generate QR Code
            // Format: RES-{userId}-{menuId}-{UniqueSuffix}
            const qrData = {
                u: userId,
                m: menuId,
                t: Date.now()
            };
            const qrImage = await qrService.generate(qrData);

            // 5. Create Reservation
            const reservation = await MealReservation.create({
                user_id: userId,
                menu_id: menuId,
                cafeteria_id: menu.cafeteria_id,
                status: 'reserved',
                qr_code: qrImage
            }, { transaction: t });

            await t.commit();
            return reservation;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    /**
     * Get user's reservations
     */
    async getUserReservations(userId) {
        return await MealReservation.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: MealMenu,
                    as: 'menu',
                    include: [{ model: Cafeteria, as: 'cafeteria' }]
                }
            ],
            order: [['created_at', 'DESC']]
        });
    }

    /**
     * Cancel reservation (Refund logic usually applies here)
     */
    async cancelReservation(userId, reservationId) {
        const t = await sequelize.transaction();
        try {
            const reservation = await MealReservation.findOne({
                where: { id: reservationId, user_id: userId }
            });

            if (!reservation) throw new Error('Reservation not found');
            if (reservation.status !== 'reserved') throw new Error('Cannot cancel this reservation');

            // Refund logic
            // Assuming fixed price 20.00 as per reservation logic
            // In a real system, we should store the price in the reservation record
            const REFUND_AMOUNT = 20.00;
            await walletService.topUp(userId, REFUND_AMOUNT);
            // Create refund transaction record
            /* Note: topUp already creates a 'credit' transaction, 
               but we might want a specific 'refund' type eventually. 
               For now, topUp is sufficient to return money. */

            reservation.status = 'cancelled';
            await reservation.save({ transaction: t });

            await t.commit();
            return { message: 'Reservation cancelled' };
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    /**
     * Mark reservation as used (QR scanned at turnstile)
     */
    async markAsUsed(userId, reservationId) {
        const reservation = await MealReservation.findOne({
            where: { id: reservationId, user_id: userId }
        });

        if (!reservation) throw new Error('Reservation not found');
        if (reservation.status !== 'reserved') throw new Error('Reservation is not active');

        reservation.status = 'used';
        reservation.used_at = new Date();
        await reservation.save();

        return { message: 'Reservation marked as used', reservation };
    }
}

module.exports = new MealService();
