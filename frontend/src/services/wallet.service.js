import api from './api';

const getMyWallet = async () => {
    const response = await api.get('/wallet');
    return response.data;
};

const topUp = async (amount) => {
    const response = await api.post('/wallet/top-up', { amount });
    return response.data;
};

const getHistory = async () => {
    const response = await api.get('/wallet/history');
    return response.data;
};

// Saved Cards API
const getSavedCards = async () => {
    const response = await api.get('/wallet/cards');
    return response.data;
};

const saveCard = async (cardData) => {
    const response = await api.post('/wallet/cards', cardData);
    return response.data;
};

const deleteCard = async (cardId) => {
    const response = await api.delete(`/wallet/cards/${cardId}`);
    return response.data;
};

const walletService = {
    getMyWallet,
    topUp,
    getHistory,
    getSavedCards,
    saveCard,
    deleteCard
};

export default walletService;
