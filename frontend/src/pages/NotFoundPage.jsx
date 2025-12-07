import { Link } from 'react-router-dom';
import './NotFoundPage.css';

const NotFoundPage = () => {
    return (
        <div className="not-found-page">
            <div className="not-found-content">
                <h1 className="not-found-title">404</h1>
                <h2 className="not-found-subtitle">Sayfa Bulunamadı</h2>
                <p className="not-found-message">
                    Aradığınız sayfa mevcut değil veya taşınmış olabilir.
                </p>
                <Link to="/dashboard" className="not-found-button">
                    Ana Sayfaya Dön
                </Link>
            </div>
        </div>
    );
};

export default NotFoundPage;
