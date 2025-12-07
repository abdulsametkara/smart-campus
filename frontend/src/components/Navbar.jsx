import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/dashboard" className="navbar-brand">
                    🎓 Smart Campus
                </Link>

                {user && (
                    <div className="navbar-menu">
                        <span className="navbar-user">
                            {user.full_name || user.email}
                        </span>
                        <Link to="/profile" className="navbar-link">
                            Profil
                        </Link>
                        {user.role === 'admin' && (
                            <Link to="/admin/users" className="navbar-link">
                                Kullanıcılar
                            </Link>
                        )}
                        <button onClick={handleLogout} className="navbar-logout">
                            Çıkış
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
