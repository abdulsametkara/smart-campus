const { ActivityLog, User } = require('../../models');

const listLogs = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20; // Varsayılan 20 log
        const offset = (page - 1) * limit;

        const { count, rows } = await ActivityLog.findAndCountAll({
            include: [
                { model: User, as: 'user', attributes: ['email', 'full_name', 'role'] }
            ],
            order: [['created_at', 'DESC']], // En yeniler en üstte
            limit,
            offset,
        });

        const totalPages = Math.ceil(count / limit);

        return res.json({
            data: rows,
            meta: {
                page,
                limit,
                total: count,
                totalPages,
            },
        });
    } catch (err) {
        console.error('List logs error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    listLogs,
};
