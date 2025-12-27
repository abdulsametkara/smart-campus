import React, { useEffect, useState } from 'react';
import mealService from '../../services/meal.service';
import LoadingSpinner from '../../components/LoadingSpinner';
import Swal from 'sweetalert2';
import { useThemeMode } from '../../context/ThemeContext';
import './MenuPage.css';

const MenuPage = () => {
    const { t, isEnglish } = useThemeMode();
    const [menus, setMenus] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [weekDates, setWeekDates] = useState([]);
    const [weekOffset, setWeekOffset] = useState(0);

    // Dynamic days based on locale
    const getDayName = (dateStr) => {
        return new Date(dateStr).toLocaleDateString(isEnglish ? 'en-US' : 'tr-TR', { weekday: 'long' });
    };

    useEffect(() => {
        generateWeekDates(weekOffset);
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            Swal.fire(t('error') || 'Hata', t('fetchError'), 'error');
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
                title: t('confirmReserve'),
                text: t('reserveCostWarning'),
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: t('confirmReserveBtn'),
                cancelButtonText: t('cancel')
            });

            if (result.isConfirmed) {
                await mealService.makeReservation(menuId);
                Swal.fire(t('success') || 'Başarılı', t('reserveSuccess'), 'success');
                // Refresh reservations
                const resData = await mealService.getMyReservations();
                setReservations(resData);
            }
        } catch (error) {
            console.error(error);
            Swal.fire(t('error') || 'Hata', error.response?.data?.message || t('reserveError'), 'error');
        }
    };

    // Check if the current menu is already reserved
    const isMenuReserved = (menuId) => {
        return reservations.some(r => r.menu_id === menuId && r.status !== 'cancelled');
    };

    const currentMenu = menus.find(m => m.date === selectedDate);

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                {t('loading')}
            </div>
        );
    }

    const goToPrevWeek = () => setWeekOffset(prev => prev - 1);
    const goToNextWeek = () => setWeekOffset(prev => prev + 1);

    // Get week label formatted efficiently
    const getWeekLabel = () => {
        if (weekDates.length === 0) return '';
        const start = new Date(weekDates[0]);
        const end = new Date(weekDates[6]);
        const options = { day: 'numeric', month: 'numeric' };
        const locale = isEnglish ? 'en-US' : 'tr-TR';
        return `${start.toLocaleDateString(locale, options)} - ${end.toLocaleDateString(locale, { ...options, year: 'numeric' })}`;
    };

    return (
        <div className="menu-page-container">
            <h1 className="page-title">{t('menuTitle')}</h1>

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
                        <span className="day-name">{getDayName(date).toUpperCase()}</span>
                        <span className="day-date">{date.split('-').slice(1).reverse().join('.')}</span>
                    </button>
                ))}
            </div>

            <div className="menu-content">
                {currentMenu ? (
                    <div className="menu-card">
                        <div className="menu-header">
                            <h2>{new Date(selectedDate).toLocaleDateString(isEnglish ? 'en-US' : 'tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
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
                            <h4>{t('nutritionValues')}</h4>
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
                                                            <span className="nut-pill protein">{item.protein}g {t('protein').toLowerCase()}</span>
                                                            <span className="nut-pill carbs">{item.carbs}g {t('carbs').toLowerCase()}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {nutrition.total && (
                                                <div className="nutrition-total">
                                                    <span className="total-label">{t('total')}</span>
                                                    <div className="nutrition-grid">
                                                        <div className="nutrition-box total">
                                                            <span className="nut-val">{nutrition.total.calories}</span>
                                                            <span className="nut-key">{t('calories')}</span>
                                                        </div>
                                                        <div className="nutrition-box total">
                                                            <span className="nut-val">{nutrition.total.protein}g</span>
                                                            <span className="nut-key">{t('protein')}</span>
                                                        </div>
                                                        <div className="nutrition-box total">
                                                            <span className="nut-val">{nutrition.total.carbs}g</span>
                                                            <span className="nut-key">{t('carbs')}</span>
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
                                    {t('reserved')}
                                </div>
                            ) : (
                                <button className="reserve-btn" onClick={() => handleReserve(currentMenu.id)}>
                                    {t('reserveNow')} (20 TL)
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="no-menu-state">
                        <p>{t('noMenu')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MenuPage;
