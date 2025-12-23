import React, { useEffect, useState } from 'react';
import mealService from '../../services/meal.service';
import LoadingSpinner from '../../components/LoadingSpinner';
import NotificationService from '../../services/notificationService';
import PaymentService from '../../services/paymentService';
import './MenuPage.css';

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

const MenuPage = () => {
    const [menus, setMenus] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMealType, setSelectedMealType] = useState('lunch'); // 'lunch' or 'dinner'
    const [weekDates, setWeekDates] = useState([]);
    const [weekOffset, setWeekOffset] = useState(0);

    useEffect(() => {
        generateWeekDates(weekOffset);
    }, [weekOffset]);

    useEffect(() => {
        if (weekDates.length > 0) {
            fetchData();
        }
    }, [weekDates]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Hafta başlangıç ve bitiş tarihlerini gönder
            const startDate = weekDates[0]; // İlk gün (Pazartesi)
            const endDate = weekDates[6]; // Son gün (Pazar)

            console.log('[MenuPage] Fetching menus for week:', startDate, 'to', endDate);

            const [menuData, resData] = await Promise.all([
                mealService.getWeeklyMenus(startDate, endDate),
                mealService.getMyReservations()
            ]);

            console.log('[MenuPage] Received menu data:', menuData);
            console.log('[MenuPage] Received reservation data:', resData);

            // Backend'den gelen menüleri array olarak al
            const menusArray = Array.isArray(menuData) ? menuData : (menuData.menus || menuData.data || []);
            console.log('[MenuPage] Processed menus array:', menusArray);
            setMenus(menusArray);
            setReservations(Array.isArray(resData) ? resData : (resData.reservations || resData.data || []));
        } catch (error) {
            console.error('Menu fetch error:', error);
            NotificationService.error('Hata', 'Veriler yüklenemedi');
            setMenus([]);
            setReservations([]);
        } finally {
            setLoading(false);
        }
    };

    const generateWeekDates = (offset = 0) => {
        // Generate 7 days for the week based on offset
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const monday = new Date(today);
        // Calculate Monday: if today is Sunday (0), go back 6 days, otherwise go back (dayOfWeek - 1) days
        monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + (offset * 7));
        monday.setHours(0, 0, 0, 0); // Set to midnight local time

        const dates = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(monday);
            day.setDate(monday.getDate() + i);
            // Format as YYYY-MM-DD in local timezone
            const year = day.getFullYear();
            const month = String(day.getMonth() + 1).padStart(2, '0');
            const dayNum = String(day.getDate()).padStart(2, '0');
            dates.push(`${year}-${month}-${dayNum}`);
        }
        setWeekDates(dates);

        // Default to today if in range, else first day of week
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        if (offset === 0 && dates.includes(todayStr)) {
            setSelectedDate(todayStr);
        } else {
            setSelectedDate(dates[0]);
        }
    };


    const handleReserve = async (menuId) => {
        try {
            const menu = menus.find(m => m.id === menuId);
            const price = parseFloat(menu?.price || 20.00).toFixed(2);
            const mealTypeLabel = menu?.meal_type === 'dinner' ? 'Akşam' : 'Öğle';

            const result = await NotificationService.confirm(
                'Yemek Rezervasyonu',
                `${mealTypeLabel} yemeği için hesabınızdan ${price} TL düşülecektir. Onaylıyor musunuz?`,
                {
                    confirmButtonText: 'Evet, Rezerve Et',
                    cancelButtonText: 'İptal'
                }
            );

            if (result.isConfirmed) {
                await PaymentService.reserveMeal(menuId);
                NotificationService.success('Başarılı', 'Rezervasyonunuz oluşturuldu.');
                // Refresh reservations and menus
                const resData = await mealService.getMyReservations();
                setReservations(Array.isArray(resData) ? resData : (resData.reservations || resData.data || []));
                // Refresh menus to update reservation status
                const startDate = weekDates[0];
                const endDate = weekDates[6];
                const menuData = await mealService.getWeeklyMenus(startDate, endDate);
                const menusArray = Array.isArray(menuData) ? menuData : (menuData.menus || menuData.data || []);
                setMenus(menusArray);
            }
        } catch (error) {
            console.error(error);
            NotificationService.error('Hata', error.response?.data?.message || 'Rezervasyon yapılamadı (Yetersiz bakiye olabilir).');
        }
    };

    // Check if the current menu is already reserved
    const isMenuReserved = (menuId) => {
        return reservations.some(r => r.menu_id === menuId && r.status !== 'cancelled');
    };

    // Menü tarihini normalize et (YYYY-MM-DD formatına çevir)
    const normalizeDate = (dateStr) => {
        if (!dateStr) return null;
        // Eğer Date objesi ise
        if (dateStr instanceof Date) {
            return dateStr.toISOString().split('T')[0];
        }
        // Eğer string ise, T'den önceki kısmı al
        if (typeof dateStr === 'string') {
            return dateStr.split('T')[0];
        }
        return dateStr;
    };

    const currentMenu = menus.find(m => {
        const menuDate = normalizeDate(m.date);
        return menuDate === selectedDate && m.meal_type === selectedMealType;
    });

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                Menüler Yükleniyor...
            </div>
        );
    }

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
                {weekDates.map((date, index) => {
                    // Calculate day name from date to ensure consistency with menu header
                    const [year, month, day] = date.split('-').map(Number);
                    const dateObj = new Date(year, month - 1, day);
                    const dayIndex = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
                    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
                    const dayName = dayNames[dayIndex];

                    return (
                        <button
                            key={date}
                            className={`day-tab ${selectedDate === date ? 'active' : ''}`}
                            onClick={() => setSelectedDate(date)}
                        >
                            <span className="day-name">{dayName.toUpperCase()}</span>
                            <span className="day-date">{date.split('-').slice(1).reverse().join('.')}</span>
                        </button>
                    );
                })}
            </div>

            {/* Meal Type Toggle */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <button
                    className={`btn ${selectedMealType === 'lunch' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setSelectedMealType('lunch')}
                >
                    🍽️ Öğle Yemeği
                </button>
                <button
                    className={`btn ${selectedMealType === 'dinner' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setSelectedMealType('dinner')}
                >
                    🌙 Akşam Yemeği
                </button>
            </div>

            <div className="menu-content">
                {currentMenu ? (
                    <div className="menu-card">
                        <div className="menu-header">
                            <h2>
                                {(() => {
                                    // Parse date correctly (YYYY-MM-DD format) - use local timezone
                                    const [year, month, day] = selectedDate.split('-').map(Number);
                                    const date = new Date(year, month - 1, day);
                                    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
                                    const dayName = dayNames[date.getDay()];
                                    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
                                    return `${day} ${monthNames[month - 1]} ${dayName}`;
                                })()}
                            </h2>
                            <span className="cafeteria-badge">{currentMenu.cafeteria?.name || currentMenu.Cafeterium?.name || 'Ana Yemekhane'}</span>
                        </div>

                        <div className="menu-items">
                            {/* Assuming items_json is array of strings */}
                            {currentMenu.items_json && (Array.isArray(currentMenu.items_json) ? currentMenu.items_json : JSON.parse(currentMenu.items_json)).map((item, idx) => (
                                <div key={idx} className="menu-item">
                                    <span className="item-icon">🍽️</span>
                                    <span className="item-name">{item}</span>
                                    {(item.toLowerCase().includes('vegan') || item.toLowerCase().includes('vejetaryen') || item.toLowerCase().includes('sebze')) && (
                                        <span className="badge badge-green" style={{ marginLeft: 'auto', fontSize: '0.7rem', background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px' }}>
                                            🌱
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Vegan/Veg Indicators Summary */}
                        <div style={{ padding: '0 1.5rem', marginBottom: '1rem', display: 'flex', gap: '5px' }}>
                            {/* Simple check for demo purposes */}
                            {(JSON.stringify(currentMenu.items_json).toLowerCase().includes('vegan')) && (
                                <span className="badge-pill" style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    🌱 Vegan Seçenek Mevcut
                                </span>
                            )}
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
                                    Hemen Rezerve Et ({parseFloat(currentMenu.price || 20.00).toFixed(2)} TL)
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
