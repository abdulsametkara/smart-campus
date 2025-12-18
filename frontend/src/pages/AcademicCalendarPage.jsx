import React, { useState } from 'react';
import './AcademicCalendarPage.css';

const AcademicCalendarPage = () => {
    const [activeSemester, setActiveSemester] = useState('fall');

    const semesters = {
        fall: {
            name: '2025-2026 Güz Dönemi',
            period: 'Eylül 2025 - Ocak 2026',
            events: [
                { date: '15 Eylül 2025', event: 'Derslerin Başlaması', type: 'start', icon: '🎓' },
                { date: '15-19 Eylül 2025', event: 'Ders Ekleme/Bırakma', type: 'info', icon: '📝' },
                { date: '29 Ekim 2025', event: 'Cumhuriyet Bayramı', type: 'holiday', icon: '🇹🇷' },
                { date: '10 Kasım 2025', event: 'Atatürk\'ü Anma Günü', type: 'memorial', icon: '🕯️' },
                { date: '10-21 Kasım 2025', event: 'Ara Sınavlar', type: 'exam', icon: '📚' },
                { date: '26 Aralık 2025', event: 'Derslerin Sona Ermesi', type: 'end', icon: '🏁' },
                { date: '05-16 Ocak 2026', event: 'Final Sınavları', type: 'exam', icon: '📝' },
                { date: '19-23 Ocak 2026', event: 'Bütünleme Sınavları', type: 'makeup', icon: '🔄' },
                { date: '26 Ocak - 9 Şubat 2026', event: 'Yarıyıl Tatili', type: 'holiday', icon: '❄️' }
            ]
        },
        spring: {
            name: '2025-2026 Bahar Dönemi',
            period: 'Şubat 2026 - Haziran 2026',
            events: [
                { date: '10 Şubat 2026', event: 'Derslerin Başlaması', type: 'start', icon: '🌸' },
                { date: '10-14 Şubat 2026', event: 'Ders Ekleme/Bırakma', type: 'info', icon: '📝' },
                { date: '30 Mart - 3 Nisan 2026', event: 'Ramazan Bayramı', type: 'holiday', icon: '🌙' },
                { date: '13-24 Nisan 2026', event: 'Ara Sınavlar', type: 'exam', icon: '📚' },
                { date: '23 Nisan 2026', event: 'Ulusal Egemenlik ve Çocuk Bayramı', type: 'holiday', icon: '🎈' },
                { date: '1 Mayıs 2026', event: 'Emek ve Dayanışma Günü', type: 'holiday', icon: '✊' },
                { date: '19 Mayıs 2026', event: 'Gençlik ve Spor Bayramı', type: 'holiday', icon: '⚽' },
                { date: '05 Haziran 2026', event: 'Derslerin Sona Ermesi', type: 'end', icon: '🏁' },
                { date: '08-19 Haziran 2026', event: 'Kurban Bayramı', type: 'holiday', icon: '🐑' },
                { date: '22 Haziran - 3 Temmuz 2026', event: 'Final Sınavları', type: 'exam', icon: '📝' },
                { date: '06-10 Temmuz 2026', event: 'Bütünleme Sınavları', type: 'makeup', icon: '🔄' }
            ]
        }
    };

    const getTypeColor = (type) => {
        const colors = {
            start: { bg: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' },
            end: { bg: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff' },
            exam: { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff' },
            makeup: { bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#fff' },
            holiday: { bg: 'linear-gradient(135deg, #ec4899, #db2777)', color: '#fff' },
            memorial: { bg: 'linear-gradient(135deg, #64748b, #475569)', color: '#fff' },
            info: { bg: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff' }
        };
        return colors[type] || colors.info;
    };

    const currentSemester = semesters[activeSemester];

    return (
        <div className="page calendar-page">
            <div className="page-header">
                <h1>📅 Akademik Takvim</h1>
                <p className="subtitle">2025-2026 Akademik Yılı</p>
            </div>

            {/* Semester Tabs */}
            <div className="semester-tabs">
                <button
                    className={`tab-btn ${activeSemester === 'fall' ? 'active' : ''}`}
                    onClick={() => setActiveSemester('fall')}
                >
                    🍂 Güz Dönemi
                </button>
                <button
                    className={`tab-btn ${activeSemester === 'spring' ? 'active' : ''}`}
                    onClick={() => setActiveSemester('spring')}
                >
                    🌸 Bahar Dönemi
                </button>
            </div>

            {/* Current Semester Info */}
            <div className="semester-header-card">
                <h2>{currentSemester.name}</h2>
                <span className="period-badge">{currentSemester.period}</span>
            </div>

            {/* Events Table */}
            <div className="events-table-container">
                <table className="events-table">
                    <thead>
                        <tr>
                            <th>Tarih</th>
                            <th>Etkinlik</th>
                            <th>Tür</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentSemester.events.map((event, index) => {
                            const typeStyle = getTypeColor(event.type);
                            return (
                                <tr key={index} className="event-row" style={{ '--delay': `${index * 0.05}s` }}>
                                    <td className="date-cell">
                                        <span className="date-text">{event.date}</span>
                                    </td>
                                    <td className="event-cell">
                                        <span className="event-icon">{event.icon}</span>
                                        <span className="event-name">{event.event}</span>
                                    </td>
                                    <td className="type-cell">
                                        <span
                                            className="type-badge"
                                            style={{ background: typeStyle.bg, color: typeStyle.color }}
                                        >
                                            {event.type === 'start' && 'Başlangıç'}
                                            {event.type === 'end' && 'Bitiş'}
                                            {event.type === 'exam' && 'Sınav'}
                                            {event.type === 'makeup' && 'Bütünleme'}
                                            {event.type === 'holiday' && 'Tatil'}
                                            {event.type === 'memorial' && 'Anma'}
                                            {event.type === 'info' && 'Bilgi'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="legend-card">
                <h3>Renk Kodları</h3>
                <div className="legend-items">
                    <div className="legend-item">
                        <span className="legend-dot" style={{ background: '#10b981' }}></span>
                        <span>Başlangıç</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot" style={{ background: '#ef4444' }}></span>
                        <span>Bitiş</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot" style={{ background: '#f59e0b' }}></span>
                        <span>Sınavlar</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot" style={{ background: '#ec4899' }}></span>
                        <span>Tatil</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot" style={{ background: '#8b5cf6' }}></span>
                        <span>Bütünleme</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot" style={{ background: '#3b82f6' }}></span>
                        <span>Bilgi</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AcademicCalendarPage;
