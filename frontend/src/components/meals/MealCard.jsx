import React from 'react';
import PropTypes from 'prop-types';
import './MealCard.css';

/**
 * MealCard Component
 * Displays a meal menu card with items, nutrition info, and reservation action
 */
const MealCard = ({
    menu,
    date,
    isReserved,
    onReserve,
    price = 20
}) => {
    // Parse items if needed
    const items = menu.items_json && (
        Array.isArray(menu.items_json)
            ? menu.items_json
            : JSON.parse(menu.items_json)
    );

    // Parse nutrition data
    const nutrition = typeof menu.nutrition_json === 'object'
        ? menu.nutrition_json
        : JSON.parse(menu.nutrition_json || '{}');

    // Format date for display
    const formattedDate = new Date(date).toLocaleDateString('tr-TR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    // Render nutrition based on format
    const renderNutrition = () => {
        if (nutrition.items && Array.isArray(nutrition.items)) {
            // New detailed format
            return (
                <>
                    <div className="nutrition-items-list">
                        {nutrition.items.map((item, idx) => (
                            <div key={idx} className="nutrition-item-row">
                                <span className="nut-item-name">{item.name}</span>
                                <div className="nut-item-values">
                                    <span className="nut-pill">{item.calories} kcal</span>
                                    <span className="nut-pill protein">{item.protein}g protein</span>
                                    <span className="nut-pill carbs">{item.carbs}g karb</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {nutrition.total && (
                        <div className="nutrition-total">
                            <span className="total-label">TOPLAM</span>
                            <div className="nutrition-grid">
                                <div className="nutrition-box total">
                                    <span className="nut-val">{nutrition.total.calories}</span>
                                    <span className="nut-key">Kalori</span>
                                </div>
                                <div className="nutrition-box total">
                                    <span className="nut-val">{nutrition.total.protein}g</span>
                                    <span className="nut-key">Protein</span>
                                </div>
                                <div className="nutrition-box total">
                                    <span className="nut-val">{nutrition.total.carbs}g</span>
                                    <span className="nut-key">Karbonhidrat</span>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            );
        } else {
            // Old simple format
            return (
                <div className="nutrition-grid">
                    {Object.entries(nutrition).map(([key, val]) => (
                        <div key={key} className="nutrition-box">
                            <span className="nut-val">{val}</span>
                            <span className="nut-key">{key}</span>
                        </div>
                    ))}
                </div>
            );
        }
    };

    return (
        <div className="meal-card">
            <div className="meal-card-header">
                <h2 className="meal-card-date">{formattedDate}</h2>
                <span className="cafeteria-badge">
                    {menu.Cafeterium?.name || 'Ana Yemekhane'}
                </span>
            </div>

            <div className="meal-card-items">
                {items && items.map((item, idx) => (
                    <div key={idx} className="meal-item">
                        <span className="meal-item-icon">🍽️</span>
                        <span className="meal-item-name">{item}</span>
                    </div>
                ))}
            </div>

            <div className="meal-card-nutrition">
                <h4 className="nutrition-title">Besin Değerleri</h4>
                {renderNutrition()}
            </div>

            <div className="meal-card-action">
                {isReserved ? (
                    <div className="reserved-badge">
                        <span className="check-icon">✓</span>
                        Rezerve Edildi
                    </div>
                ) : (
                    <button
                        className="reserve-btn"
                        onClick={() => onReserve(menu.id)}
                    >
                        Hemen Rezerve Et ({price} TL)
                    </button>
                )}
            </div>
        </div>
    );
};

MealCard.propTypes = {
    menu: PropTypes.shape({
        id: PropTypes.number.isRequired,
        items_json: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
        nutrition_json: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
        Cafeterium: PropTypes.shape({
            name: PropTypes.string
        })
    }).isRequired,
    date: PropTypes.string.isRequired,
    isReserved: PropTypes.bool.isRequired,
    onReserve: PropTypes.func.isRequired,
    price: PropTypes.number
};

export default MealCard;
