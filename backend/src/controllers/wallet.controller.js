const walletService = require('../services/wallet.service');

const getMyWallet = async (req, res) => {
    try {
        const wallet = await walletService.getWallet(req.user.id);
        res.json(wallet);
    } catch (err) {
        console.error('Wallet Error:', err);
        res.status(500).json({ message: 'Error retrieving wallet' });
    }
};

const topUp = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount) {
            return res.status(400).json({ message: 'Amount is required' });
        }

        const wallet = await walletService.topUp(req.user.id, amount);
        res.json({ message: 'Top-up successful', balance: wallet.balance });
    } catch (err) {
        console.error('TopUp Error:', err);
        if (err.message.includes('Amount') || err.message.includes('Insufficient')) {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: err.message || 'Error processing top-up' });
    }
};

const getHistory = async (req, res) => {
    try {
        const history = await walletService.getHistory(req.user.id);
        res.json(history);
    } catch (err) {
        console.error('Wallet History Error:', err);
        res.status(500).json({ message: 'Error retrieving history' });
    }
};

module.exports = {
    getMyWallet,
    topUp,
    getHistory
};
