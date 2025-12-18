const cardService = require('../services/card.service');

const getSavedCards = async (req, res) => {
    try {
        const cards = await cardService.getSavedCards(req.user.id);
        res.json(cards);
    } catch (err) {
        console.error('Get Cards Error:', err);
        res.status(500).json({ message: 'Error retrieving cards' });
    }
};

const saveCard = async (req, res) => {
    try {
        const { cardHolder, cardNumber, expiryMonth, expiryYear, setAsDefault } = req.body;

        if (!cardHolder || !cardNumber || !expiryMonth || !expiryYear) {
            return res.status(400).json({ message: 'All card fields are required' });
        }

        const card = await cardService.saveCard(req.user.id, {
            cardHolder,
            cardNumber,
            expiryMonth,
            expiryYear,
            setAsDefault: setAsDefault || false
        });

        res.status(201).json(card);
    } catch (err) {
        console.error('Save Card Error:', err);
        res.status(500).json({ message: 'Error saving card' });
    }
};

const deleteCard = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await cardService.deleteCard(req.user.id, parseInt(id));
        res.json(result);
    } catch (err) {
        console.error('Delete Card Error:', err);
        res.status(400).json({ message: err.message });
    }
};

const setDefaultCard = async (req, res) => {
    try {
        const { id } = req.params;
        const card = await cardService.setDefaultCard(req.user.id, parseInt(id));
        res.json(card);
    } catch (err) {
        console.error('Set Default Card Error:', err);
        res.status(400).json({ message: err.message });
    }
};

module.exports = {
    getSavedCards,
    saveCard,
    deleteCard,
    setDefaultCard
};
