import React, { useEffect, useState } from 'react';
import mealService from '../../services/meal.service';
import LoadingSpinner from '../../components/LoadingSpinner';
import Swal from 'sweetalert2';
import './MenuPage.css';

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

const MenuPage = () => {
    const [menus, setMenus] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [weekDates, setWeekDates] = useState([]);
    const [weekOffset, setWeekOffset] = useState(0);

    useEffect(() => {
        generateWeekDates(weekOffset);
        fetchData();
    }, [weekOffset]);

    const fetchData = async () => {
        try {
            const [menuData, resData] = await Promise.all([
                mealService.getWeeklyMenus(),
                mealService.getMyReservations()
            ]);
            setMenus(menuData);
            setReservations(resData);
        } catch (error) {
            console.error(error);
            Swal.fire('Hata', 'Veriler yüklenemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    const generateWeekDates = (offset = 0) => {
        // Generate 7 days for the week based on offset
        const today = new Date();
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + (offset * 7));

        const dates = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(monday);
            day.setDate(monday.getDate() + i);
            dates.push(day.toISOString().split('T')[0]);
        }
        setWeekDates(dates);

        // Default to today if in range, else first day of week
        const todayStr = new Date().toISOString().split('T')[0];
        if (offset === 0 && dates.includes(todayStr)) {
            setSelectedDate(todayStr);
        } else {
            setSelectedDate(dates[0]);
        }
    };


    const handleReserve = async (menuId) => {
        try {
            const result = await Swal.fire({
                title: 'Yemek Rezervasyonu',
                text: "Hesabınızdan 20 TL düşülecektir. Onaylıyor musunuz?",
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Evet, Rezerve Et',
                cancelButtonText: 'İptal'
            });

            if (result.isConfirmed) {
                await mealService.makeReservation(menuId);
                Swal.fire('Başarılı', 'Rezervasyonunuz oluşturuldu.', 'success');
                // Refresh reservations
                const resData = await mealService.getMyReservations();
                setReservations(resData);
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Hata', error.response?.data?.message || 'Rezervasyon yapılamadı (Yetersiz bakiye olabilir).', 'error');
        }
    };

    // Check if the current menu is already reserved
    const isMenuReserved = (menuId) => {
        return reservations.some(r => r.menu_id === menuId && r.status !== 'cancelled');
    };

    const currentMenu = menus.find(m => m.date === selectedDate);

    if (loading) return <LoadingSpinner message="Menüler Yükleniyor..." />;

    const goToPrevWeek = () => setWeekOffset(prev => prev - 1);
    const goToNextWeek = () => setWeekOffset(prev => prev + 1);

    // Get week label
    const getWeekLabel = () => {
        if (weekDates.length === 0) return '';
        const start = new Date(weekDates[0]);
        const end = new Date(weekDates[6]);
        return `${start.getDate()}.${start.getMonth() + 1} - ${end.getDate()}.${end.getMonth() + 1}.${end.getFullYear()}`;
    };

    return (
        <div className="menu-page-container">
            <h1 className="page-title">Yemek Menüsü</h1>

            <div className="nav-arrows">
                <button className="nav-arrow" onClick={goToPrevWeek}>
                    ←
                </button>
                <span className="week-label">
                    📅 {getWeekLabel()}
                </span>
                <button className="nav-arrow" onClick={goToNextWeek}>
                    →
                </button>
            </div>

            <div className="week-tabs">
                {weekDates.map((date, index) => (
                    <button
                        key={date}
                        className={`day-tab ${selectedDate === date ? 'active' : ''}`}
                        onClick={() => setSelectedDate(date)}
                    >
                        <span className="day-name">{DAYS[index]}</span>
                        <span className="day-date">{date.split('-').slice(1).reverse().join('.')}</span>
                    </button>
                ))}
            </div>

            <div className="menu-content">
                {currentMenu ? (
                    <div className="menu-card">
                        <div className="menu-header">
                            <h2>{new Date(selectedDate).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
                            <span className="cafeteria-badge">{currentMenu.Cafeterium?.name || 'Ana Yemekhane'}</span>
                        </div>

                        <div className="menu-items">
                            {/* Assuming items_json is array of strings */}
                            {currentMenu.items_json && (Array.isArray(currentMenu.items_json) ? currentMenu.items_json : JSON.parse(currentMenu.items_json)).map((item, idx) => (
                                <div key={idx} className="menu-item">
                                    <span className="item-icon">🍽️</span>
                                    <span className="item-name">{item}</span>
                                </div>
                            ))}
                        </div>

                        <div className="nutrition-info">
                            <h4>Besin Değerleri</h4>
                            {(() => {
                                const nutrition = typeof currentMenu.nutrition_json === 'object'
                                    ? currentMenu.nutrition_json
                                    : JSON.parse(currentMenu.nutrition_json || '{}');

                                // Check if new format with items array
                                if (nutrition.items && Array.isArray(nutrition.items)) {
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
                                    // Old format - just show key/value pairs
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
                            })()}
                        </div>

                        <div className="action-area">
                            {isMenuReserved(currentMenu.id) ? (
                                <div className="reserved-badge">
                                    <span className="check-icon">✓</span>
                                    Rezerve Edildi
                                </div>
                            ) : (
                                <button className="reserve-btn" onClick={() => handleReserve(currentMenu.id)}>
                                    Hemen Rezerve Et (20 TL)
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="no-menu-state">
                        <p>Bugün için planlanmış bir menü bulunamadı.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MenuPage;
