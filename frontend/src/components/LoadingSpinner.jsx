import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', message = 'Yükleniyor...' }) => {
    return (
        <div className="loading-spinner-container">
            <div className={`loading-spinner ${size}`}></div>
            {message && <p className="loading-message">{message}</p>}
        </div>
    );
};

export default LoadingSpinner;
