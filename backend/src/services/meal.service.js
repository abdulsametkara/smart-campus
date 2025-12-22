const { MealMenu, MealReservation, Cafeteria, sequelize } = require('../../models');
const walletService = require('./wallet.service');
const qrService = require('./qr.service');
const { Op } = require('sequelize');

class MealService {
    /**
     * Get menus for a date range (defaults to current week)
     */
    async getMenus(startDate, endDate) {
        // Normalize dates to YYYY-MM-DD format
        const normalizeDate = (date) => {
            if (!date) return null;
            if (date instanceof Date) {
                return date.toISOString().split('T')[0];
            }
            if (typeof date === 'string') {
                return date.split('T')[0];
            }
            return date;
        };

        const start = normalizeDate(startDate);
        const end = normalizeDate(endDate);

        console.log('[MealService] Fetching menus from', start, 'to', end);

        const menus = await MealMenu.findAll({
            where: {
                date: {
                    [Op.between]: [start, end]
                },
                is_published: true // Only show published menus
            },
            include: [{ model: Cafeteria, as: 'cafeteria' }],
            order: [['date', 'ASC']]
        });

        console.log('[MealService] Found', menus.length, 'menus');
        return menus;
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

            // VALIDATION: Prevent past dates
            const today = new Date().toISOString().split('T')[0];
            if (menu.date < today) {
                // Return 400 error
                const error = new Error('Geçmiş tarihe rezervasyon yapılamaz.');
                error.statusCode = 400;
                throw error;
            }

            // 2. Check if already reserved
            const existing = await MealReservation.findOne({
                where: { user_id: userId, menu_id: menuId, status: { [Op.not]: 'cancelled' } }
            });
            if (existing) throw new Error('Already reserved for this meal');

            // 3. Process Payment - Use menu price if available, otherwise default to 20.00
            const PRICE = parseFloat(menu.price) || 20.00;
            const mealTypeLabel = menu.meal_type === 'dinner' ? 'Akşam' : 'Öğle';
            await walletService.processPayment(userId, PRICE, `${mealTypeLabel} Yemeği Rezervasyonu: ${menu.date}`); // Uses its own transaction

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
                meal_type: menu.meal_type, // Store meal type
                date: menu.date, // Store date for easier querying
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
                where: { id: reservationId, user_id: userId },
                include: [{ model: MealMenu, as: 'menu' }]
            });

            if (!reservation) throw new Error('Reservation not found');
            if (reservation.status !== 'reserved') throw new Error('Cannot cancel this reservation');

            // VALIDATION: Cannot cancel past reservations
            const today = new Date().toISOString().split('T')[0];
            if (reservation.menu.date < today) {
                const error = new Error('Geçmiş rezervasyonlar iptal edilemez.');
                error.statusCode = 400;
                throw error;
            }

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
            where: { id: reservationId, user_id: userId },
            include: [{ model: MealMenu, as: 'menu' }]
        });

        if (!reservation) throw new Error('Reservation not found');
        if (reservation.status !== 'reserved') throw new Error('Reservation is not active');

        // VALIDATION: Strict date check
        const today = new Date().toISOString().split('T')[0];
        if (reservation.menu.date !== today) {
            const error = new Error('Bu bilet sadece menü tarihinde kullanılabilir.');
            error.statusCode = 400;
            throw error;
        }

        reservation.status = 'used';
        reservation.used_at = new Date();
        await reservation.save();

        return { message: 'Reservation marked as used', reservation };
    }

    /**
     * Create a new menu (Admin only)
     */
    async createMenu(menuData) {
        const { cafeteria_id, date, meal_type, items_json, nutrition_json, price, is_published } = menuData;

        // Validate required fields
        if (!cafeteria_id || !date || !meal_type) {
            throw new Error('Cafeteria ID, date, and meal type are required');
        }

        // Check if cafeteria exists
        const cafeteria = await Cafeteria.findByPk(cafeteria_id);
        if (!cafeteria) {
            throw new Error('Cafeteria not found');
        }

        // Check if menu already exists for this date and meal type
        const existing = await MealMenu.findOne({
            where: {
                cafeteria_id,
                date,
                meal_type
            }
        });

        if (existing) {
            throw new Error('Menu already exists for this date and meal type');
        }

        // Create menu
        const menu = await MealMenu.create({
            cafeteria_id,
            date,
            meal_type,
            items_json: items_json || [],
            nutrition_json: nutrition_json || {},
            price: price || 20.00,
            is_published: is_published || false
        });

        return await MealMenu.findByPk(menu.id, {
            include: [{ model: Cafeteria, as: 'cafeteria' }]
        });
    }

    /**
     * Update a menu (Admin only)
     */
    async updateMenu(menuId, menuData) {
        const menu = await MealMenu.findByPk(menuId);
        if (!menu) {
            throw new Error('Menu not found');
        }

        // Update fields
        if (menuData.items_json !== undefined) menu.items_json = menuData.items_json;
        if (menuData.nutrition_json !== undefined) menu.nutrition_json = menuData.nutrition_json;
        if (menuData.price !== undefined) menu.price = menuData.price;
        if (menuData.is_published !== undefined) menu.is_published = menuData.is_published;
        if (menuData.meal_type !== undefined) menu.meal_type = menuData.meal_type;

        await menu.save();

        return await MealMenu.findByPk(menu.id, {
            include: [{ model: Cafeteria, as: 'cafeteria' }]
        });
    }

    /**
     * Delete a menu (Admin only)
     */
    async deleteMenu(menuId) {
        const menu = await MealMenu.findByPk(menuId);
        if (!menu) {
            throw new Error('Menu not found');
        }

        // Check if there are active reservations
        const activeReservations = await MealReservation.count({
            where: {
                menu_id: menuId,
                status: { [Op.in]: ['reserved', 'used'] }
            }
        });

        if (activeReservations > 0) {
            throw new Error('Cannot delete menu with active reservations');
        }

        await menu.destroy();
        return { message: 'Menu deleted successfully' };
    }

    /**
     * Toggle menu publish status (Admin only)
     */
    async togglePublish(menuId) {
        const menu = await MealMenu.findByPk(menuId);
        if (!menu) {
            throw new Error('Menu not found');
        }

        menu.is_published = !menu.is_published;
        await menu.save();

        return await MealMenu.findByPk(menu.id, {
            include: [{ model: Cafeteria, as: 'cafeteria' }]
        });
    }

    /**
     * Get all menus (Admin only - for management)
     */
    async getAllMenus(filters = {}) {
        const { start, end, cafeteria_id, is_published } = filters;
        const whereClause = {};

        if (start && end) {
            whereClause.date = {
                [Op.between]: [start, end]
            };
        }

        if (cafeteria_id) {
            whereClause.cafeteria_id = cafeteria_id;
        }

        if (is_published !== undefined) {
            whereClause.is_published = is_published;
        }

        return await MealMenu.findAll({
            where: whereClause,
            include: [{ model: Cafeteria, as: 'cafeteria' }],
            order: [['date', 'DESC'], ['meal_type', 'ASC']]
        });
    }
}

module.exports = new MealService();
