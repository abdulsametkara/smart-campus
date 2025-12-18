import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './ReservationModal.css';

/**
 * ReservationModal Component
 * Modal dialog for meal reservation confirmation
 */
const ReservationModal = ({
    isOpen,
    onClose,
    onConfirm,
    menu,
    price = 20,
    loading = false
}) => {
    if (!isOpen || !menu) return null;

    // Parse items
    const items = menu.items_json && (
        Array.isArray(menu.items_json)
            ? menu.items_json
            : JSON.parse(menu.items_json)
    );

    const handleConfirm = () => {
        onConfirm(menu.id);
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="reservation-modal-overlay" onClick={handleOverlayClick}>
            <div className="reservation-modal">
                <button className="modal-close-btn" onClick={onClose}>
                    ×
                </button>

                <div className="modal-header">
                    <span className="modal-icon">🍽️</span>
                    <h2>Yemek Rezervasyonu</h2>
                </div>

                <div className="modal-body">
                    <div className="menu-preview">
                        <h4>Seçilen Menü</h4>
                        <div className="menu-items-preview">
                            {items && items.map((item, idx) => (
                                <div key={idx} className="preview-item">
                                    <span className="preview-bullet">•</span>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="price-info">
                        <span className="price-label">Tutar</span>
                        <span className="price-value">{price} TL</span>
                    </div>

                    <div className="warning-box">
                        <span className="warning-icon">⚠️</span>
                        <p>Bu tutar cüzdanınızdan düşülecektir.</p>
                    </div>
                </div>

                <div className="modal-actions">
                    <button
                        className="cancel-btn"
                        onClick={onClose}
                        disabled={loading}
                    >
                        İptal
                    </button>
                    <button
                        className="confirm-btn"
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="loading-spinner"></span>
                        ) : (
                            <>Rezerve Et</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

ReservationModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    menu: PropTypes.shape({
        id: PropTypes.number,
        items_json: PropTypes.oneOfType([PropTypes.array, PropTypes.string])
    }),
    price: PropTypes.number,
    loading: PropTypes.bool
};

export default ReservationModal;
