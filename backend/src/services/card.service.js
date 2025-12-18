const { SavedCard } = require('../../models');

class CardService {
    /**
     * Get all saved cards for a user
     */
    async getSavedCards(userId) {
        return await SavedCard.findAll({
            where: { user_id: userId },
            order: [['is_default', 'DESC'], ['created_at', 'DESC']],
            attributes: ['id', 'card_holder', 'card_last_four', 'card_brand', 'expiry_month', 'expiry_year', 'is_default', 'created_at']
        });
    }

    /**
     * Save a new card
     */
    async saveCard(userId, cardData) {
        const { cardHolder, cardNumber, expiryMonth, expiryYear, setAsDefault } = cardData;

        // Get last 4 digits
        const lastFour = cardNumber.slice(-4);

        // Detect card brand from first digit
        const firstDigit = cardNumber.charAt(0);
        let cardBrand = 'Visa';
        if (firstDigit === '5') cardBrand = 'Mastercard';
        else if (firstDigit === '3') cardBrand = 'Amex';
        else if (firstDigit === '6') cardBrand = 'Discover';

        // If setting as default, unset other defaults
        if (setAsDefault) {
            await SavedCard.update(
                { is_default: false },
                { where: { user_id: userId } }
            );
        }

        // Check if this is user's first card (make it default)
        const existingCards = await SavedCard.count({ where: { user_id: userId } });
        const isDefault = setAsDefault || existingCards === 0;

        const card = await SavedCard.create({
            user_id: userId,
            card_holder: cardHolder,
            card_last_four: lastFour,
            card_brand: cardBrand,
            expiry_month: expiryMonth,
            expiry_year: expiryYear,
            is_default: isDefault
        });

        return {
            id: card.id,
            card_holder: card.card_holder,
            card_last_four: card.card_last_four,
            card_brand: card.card_brand,
            expiry_month: card.expiry_month,
            expiry_year: card.expiry_year,
            is_default: card.is_default
        };
    }

    /**
     * Delete a saved card
     */
    async deleteCard(userId, cardId) {
        const card = await SavedCard.findOne({
            where: { id: cardId, user_id: userId }
        });

        if (!card) {
            throw new Error('Card not found');
        }

        await card.destroy();

        // If deleted card was default, make another card default
        if (card.is_default) {
            const firstCard = await SavedCard.findOne({
                where: { user_id: userId },
                order: [['created_at', 'ASC']]
            });
            if (firstCard) {
                firstCard.is_default = true;
                await firstCard.save();
            }
        }

        return { message: 'Card deleted successfully' };
    }

    /**
     * Set a card as default
     */
    async setDefaultCard(userId, cardId) {
        // Unset all defaults
        await SavedCard.update(
            { is_default: false },
            { where: { user_id: userId } }
        );

        // Set this card as default
        const card = await SavedCard.findOne({
            where: { id: cardId, user_id: userId }
        });

        if (!card) {
            throw new Error('Card not found');
        }

        card.is_default = true;
        await card.save();

        return card;
    }
}

module.exports = new CardService();
