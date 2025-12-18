const { Wallet, Transaction, sequelize } = require('../../models');

class WalletService {
    /**
     * Get user's wallet and balance. Creates one if it doesn't exist.
     */
    async getWallet(userId) {
        let wallet = await Wallet.findOne({ where: { user_id: userId } });

        if (!wallet) {
            wallet = await Wallet.create({
                user_id: userId,
                balance: 0.00,
                currency: 'TRY'
            });
        }
        return wallet;
    }

    /**
     * Add money to wallet (Top-up)
     */
    async topUp(userId, amount) {
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }

        const t = await sequelize.transaction();

        try {
            const wallet = await this.getWallet(userId);

            // Update balance
            wallet.balance = parseFloat(wallet.balance) + parseFloat(amount);
            await wallet.save({ transaction: t });

            // Create transaction record
            await Transaction.create({
                wallet_id: wallet.id,
                type: 'credit',
                amount: amount,
                description: `Wallet top-up (Ref: TOPUP-${Date.now()})`,
                status: 'COMPLETED', // Assuming instant for now
                reference_id: null
            }, { transaction: t });

            await t.commit();
            return wallet;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    /**
     * Deduct money from wallet (Payment)
     */
    async processPayment(userId, amount, description) {
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }

        const t = await sequelize.transaction();

        try {
            const wallet = await this.getWallet(userId);

            if (parseFloat(wallet.balance) < parseFloat(amount)) {
                throw new Error('Insufficient funds');
            }

            // Deduct balance
            wallet.balance = parseFloat(wallet.balance) - parseFloat(amount);
            await wallet.save({ transaction: t });

            // Create transaction record
            await Transaction.create({
                wallet_id: wallet.id,
                type: 'debit',
                amount: amount,
                description: description || `Payment (Ref: PAY-${Date.now()})`,
                status: 'COMPLETED',
                reference_id: null
            }, { transaction: t });

            await t.commit();
            return wallet;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    /**
     * Get transaction history
     */
    async getHistory(userId) {
        const wallet = await this.getWallet(userId);
        return await Transaction.findAll({
            where: { wallet_id: wallet.id },
            attributes: ['id', 'type', 'amount', 'description', 'reference_id', 'created_at', 'updated_at'],
            order: [['created_at', 'DESC']]
        });
    }
}

module.exports = new WalletService();
