import React, { useEffect, useState } from 'react';
import mealService from '../../services/meal.service';
import LoadingSpinner from '../../components/LoadingSpinner';
import Swal from 'sweetalert2';
import './MyReservationsPage.css';

const MyReservationsPage = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
    const [selectedReservation, setSelectedReservation] = useState(null);

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async () => {
        try {
            const data = await mealService.getMyReservations();
            setReservations(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = (res) => {
        if (res.status?.toLowerCase() === 'reserved') {
            setSelectedReservation(res);
        }
    };

    const closeModal = () => {
        setSelectedReservation(null);
    };

    const handleMarkAsUsed = async () => {
        if (!selectedReservation) return;

        try {
            await mealService.markAsUsed(selectedReservation.id);
            Swal.fire({
                icon: 'success',
                title: 'Yemek Alındı!',
                text: 'Afiyet olsun! 🍽️',
                timer: 2000,
                showConfirmButton: false
            });
            setSelectedReservation(null);
            // Refresh reservations
            const data = await mealService.getMyReservations();
            setReservations(data);
        } catch (error) {
            console.error(error);
            Swal.fire('Hata', error.response?.data?.message || 'İşlem başarısız', 'error');
        }
    };

    const getStatusLabel = (status) => {
        switch (status?.toLowerCase()) {
            case 'reserved': return 'AKTİF';
            case 'used': return 'KULLANILDI';
            case 'cancelled': return 'İPTAL';
            default: return status?.toUpperCase();
        }
    };

    // Filter reservations based on active tab
    const getFilteredReservations = () => {
        const today = new Date().toISOString().split('T')[0];

        return reservations.filter(res => {
            const isExpired = res.menu?.date < today;
            const isReserved = res.status === 'reserved';

            if (activeTab === 'active') {
                // Show ONLY: Reserved AND Not Expired
                return isReserved && !isExpired;
            } else {
                // Show: Expired OR Not Reserved (Used/Cancelled)
                return isExpired || !isReserved;
            }
        });
    };

    const filteredReservations = getFilteredReservations();

    if (loading) return <LoadingSpinner message="Rezervasyonlarınız yükleniyor..." />;

    return (
        <div className="reservations-page-container">
            <h1 className="page-title">Yemek Rezervasyonlarım</h1>

            {/* Tabs */}
            <div className="res-tabs">
                <button
                    className={`res-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                    onClick={() => setActiveTab('active')}
                >
                    Aktif Biletler
                </button>
                <button
                    className={`res-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    Geçmiş / Kullanılan
                </button>
            </div>

            <div className="tickets-grid">
                {filteredReservations.length > 0 ? (
                    filteredReservations.map((res) => {
                        const today = new Date().toISOString().split('T')[0];
                        const isExpired = res.status === 'reserved' && res.menu?.date < today;

                        return (
                            <div
                                key={res.id}
                                className={`ticket-card ${isExpired ? 'expired' : res.status?.toLowerCase() || 'reserved'} ${!isExpired && res.status?.toLowerCase() === 'reserved' ? 'clickable' : ''}`}
                                onClick={() => !isExpired && handleCardClick(res)}
                            >
                                <div className="ticket-header">
                                    <span className="meal-date">{new Date(res.menu?.date).toLocaleDateString('tr-TR')}</span>
                                    <span className={`status-tag ${isExpired ? 'expired' : res.status?.toLowerCase() || 'reserved'}`}>
                                        {isExpired ? 'SÜRESİ GEÇTİ' : getStatusLabel(res.status)}
                                    </span>
                                </div>

                                <div className="ticket-body">
                                    <div className="menu-preview">
                                        <h4>{res.menu?.cafeteria?.name || 'Ana Yemekhane'}</h4>
                                        <p>Öğle Yemeği</p>
                                        {res.status?.toLowerCase() === 'used' && (
                                            <div className="used-message">
                                                <span className="used-icon">✓</span>
                                                Kullanıldı
                                            </div>
                                        )}
                                        {isExpired && (
                                            <div className="expired-message">
                                                <span>⚠️ Kullanılamaz</span>
                                            </div>
                                        )}
                                    </div>

                                    {!isExpired && res.status?.toLowerCase() === 'reserved' && res.qr_code && (
                                        <div className="qr-section">
                                            <img src={res.qr_code} alt="QR Bilet" className="qr-img" />
                                            <small>Tıkla ve Okut</small>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="no-tickets">
                        <p>
                            {activeTab === 'active'
                                ? 'Aktif yemek rezervasyonunuz bulunmuyor.'
                                : 'Geçmiş rezervasyon kaydı bulunamadı.'}
                        </p>
                        {activeTab === 'active' && <a href="/meals/menu" className="go-menu-link">Menüye Git</a>}
                    </div>
                )}
            </div>

            {/* QR Modal */}
            {selectedReservation && (
                <div className="qr-modal-overlay" onClick={closeModal}>
                    <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeModal}>×</button>
                        <h2>Yemek Bileti</h2>
                        <p className="modal-date">
                            {new Date(selectedReservation.menu?.date).toLocaleDateString('tr-TR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </p>
                        <div className="modal-qr-container">
                            <img
                                src={selectedReservation.qr_code}
                                alt="QR Kod"
                                className="modal-qr-img"
                            />
                        </div>
                        <p className="modal-instruction">QR kodu turnikede okutunuz</p>
                        <button className="simulate-scan-btn" onClick={handleMarkAsUsed}>
                            <span className="scan-icon">📱</span>
                            Taramayı Simüle Et
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyReservationsPage;
