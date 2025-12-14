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
                    Campy
                </Link>

                {user && (
                    <div className="navbar-menu">
                        {/* Öğrenci Menüsü */}
                        {user.role === 'student' && (
                            <>
                                <Link to="/attendance/student" className="navbar-link">
                                    Yoklama
                                </Link>
                                <Link to="/attendance/my" className="navbar-link">
                                    Devamsızlığım
                                </Link>
                                <Link to="/excuse/request" className="navbar-link">
                                    Mazeret
                                </Link>
                            </>
                        )}

                        {/* Hoca (Faculty) Menüsü */}
                        {user.role === 'faculty' && (
                            <>
                                <Link to="/attendance/instructor" className="navbar-link">
                                    Yoklama
                                </Link>
                                <Link to="/attendance/report" className="navbar-link">
                                    Rapor
                                </Link>
                                <Link to="/excuse/manage" className="navbar-link">
                                    Mazeretler
                                </Link>
                            </>
                        )}

                        {/* Admin Menüsü */}
                        {user.role === 'admin' && (
                            <>
                                <Link to="/admin/users" className="navbar-link">
                                    Kullanıcılar
                                </Link>
                                <Link to="/admin/academic" className="navbar-link">
                                    Akademik
                                </Link>
                            </>
                        )}

                        <Link to="/dashboard" className="navbar-link">
                            Dashboard
                        </Link>
                        <Link to="/profile" className="navbar-link">
                            Profil
                        </Link>
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
