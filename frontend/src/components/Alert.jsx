import { useEffect } from 'react';
import './Alert.css';

const Alert = ({ type = 'info', message, onClose, duration = 5000 }) => {
    useEffect(() => {
        if (duration && onClose) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    return (
        <div className={`alert alert-${type}`}>
            <span className="alert-icon">{icons[type]}</span>
            <span className="alert-message">{message}</span>
            {onClose && (
                <button className="alert-close" onClick={onClose}>
                    ✕
                </button>
            )}
        </div>
    );
};

export default Alert;
