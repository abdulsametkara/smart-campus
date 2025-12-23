import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import mealService from '../../services/meal.service';
import NotificationService from '../../services/notificationService';
import './MenuPage.css'; // Reuse existing styles

const MealCheckInPage = () => {
    const [reservationId, setReservationId] = useState('');
    const [status, setStatus] = useState('idle'); // idle, processing, success, error
    const [resultData, setResultData] = useState(null);
    const [scanMode, setScanMode] = useState(true); // Toggle between Camera and Manual

    // Scanner Ref
    const scannerRef = useRef(null);

    // If QR code passes ID via URL query ?id=123
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const id = params.get('id');
        if (id) {
            setReservationId(id);
            handleCheckIn(id);
        }

        // Cleanup scanner on unmount
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear html5-qrcode scanner. ", error);
                });
            }
        };
    }, [location]);

    // Initialize Scanner when in Scan Mode
    useEffect(() => {
        if (scanMode && !resultData) {
            // Function to init scanner
            const initScanner = () => {
                // Ensure DOM element exists
                if (document.getElementById('reader')) {
                    if (scannerRef.current) {
                        try { scannerRef.current.clear(); } catch (e) { }
                    }

                    const scanner = new Html5QrcodeScanner(
                        "reader",
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 },
                            aspectRatio: 1.0
                        },
                        /* verbose= */ false
                    );

                    scanner.render(onScanSuccess, onScanFailure);
                    scannerRef.current = scanner;
                }
            };

            // Small timeout to ensure DOM render
            const timer = setTimeout(initScanner, 100);
            return () => clearTimeout(timer);
        }
    }, [scanMode, resultData]);

    const onScanSuccess = (decodedText, decodedResult) => {
        console.log(`Code matched = ${decodedText}`, decodedResult);
        // Handle both simple ID and JSON format
        let idToUse = decodedText;

        try {
            // Try parsing JSON if valid
            const json = JSON.parse(decodedText);
            if (json && json.id) {
                idToUse = json.id;
            } else if (json && json.r) {
                idToUse = json.r;
            }
        } catch (e) {
            // Not JSON, use raw text (legacy ID)
        }

        // Stop scanning temporarily
        if (scannerRef.current) {
            scannerRef.current.pause(true);
        }

        handleCheckIn(idToUse);
    };

    const onScanFailure = (error) => {
        // console.warn(`Code scan error = ${error}`);
    };

    const handleCheckIn = async (idToUse) => {
        let id = idToUse || reservationId;
        // Strip '#' if present
        if (id && id.toString().startsWith('#')) {
            id = id.toString().substring(1);
        }

        if (!id) {
            NotificationService.error('Hata', 'Lütfen rezervasyon ID giriniz.');
            if (scannerRef.current) scannerRef.current.resume();
            return;
        }

        try {
            setStatus('processing');
            const response = await mealService.markAsUsed(id);

            setStatus('success');
            setResultData(response.reservation || response);

            // Play success sound if desired
            // const audio = new Audio('/success.mp3'); audio.play();

            NotificationService.success('Başarılı', 'Yemek teslim edildi.');
            setReservationId(''); // Reset input

            // Clear scanner if active
            if (scannerRef.current) {
                scannerRef.current.clear().catch(e => console.error(e));
                scannerRef.current = null;
            }

        } catch (error) {
            console.error(error);
            setStatus('error');
            NotificationService.error('Hata', error.response?.data?.message || 'Geçersiz veya kullanılmış rezervasyon.');

            // Resume scanning after error delay if needed, or stay in error state
            // For now, let user manually reset to scan again
            if (scannerRef.current && scanMode) {
                // Optionally resume
                // scannerRef.current.resume();
            }
        }
    };

    const resetScanner = () => {
        setStatus('idle');
        setResultData(null);
        setReservationId('');
        if (scanMode) {
            // Effect will re-init
        }
    };

    return (
        <div className="menu-page-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h1 className="page-title">Yemekhane QR Kontrol</h1>

            <div className="menu-card" style={{ padding: '2rem', textAlign: 'center' }}>

                {/* Mode Toggle */}
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <button
                        onClick={() => { setScanMode(true); setResultData(null); setStatus('idle'); }}
                        className={`res-tab-btn ${scanMode ? 'active' : ''}`}
                        style={{ background: scanMode ? '#f1f5f9' : 'transparent', borderRadius: '8px', fontWeight: 'bold' }}
                    >
                        📷 Kamera
                    </button>
                    <button
                        onClick={() => { setScanMode(false); setResultData(null); setStatus('idle'); if (scannerRef.current) scannerRef.current.clear(); }}
                        className={`res-tab-btn ${!scanMode ? 'active' : ''}`}
                        style={{ background: !scanMode ? '#f1f5f9' : 'transparent', borderRadius: '8px', fontWeight: 'bold' }}
                    >
                        ⌨️ Manuel Giriş
                    </button>
                </div>

                {/* Scanner Area */}
                {scanMode && status !== 'success' && status !== 'error' && (
                    <div style={{ marginBottom: '2rem', minHeight: '300px', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
                        <div id="reader" style={{ width: '100%' }}></div>
                    </div>
                )}

                {/* Manual Input Area */}
                {!scanMode && status !== 'success' && status !== 'error' && (
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⌨️</div>
                        <p style={{ color: '#666' }}>
                            Rezervasyon numarasını manuel olarak girin.
                        </p>
                    </div>
                )}

                {/* Controls */}
                {status !== 'success' && status !== 'error' && (
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '2rem' }}>
                        <input
                            type="text"
                            value={reservationId}
                            onChange={(e) => setReservationId(e.target.value.replace('#', ''))}
                            placeholder="Rezervasyon ID"
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                fontSize: '1.1rem'
                            }}
                            disabled={status === 'processing'}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={() => handleCheckIn()}
                            disabled={status === 'processing'}
                        >
                            {status === 'processing' ? '...' : (scanMode ? 'Manuel Onayla' : 'Kontrol Et')}
                        </button>
                    </div>
                )}

                {/* Success State */}
                {status === 'success' && resultData && (
                    <div className="success-box" style={{
                        background: '#dcfce7',
                        padding: '2rem',
                        borderRadius: '16px',
                        border: '2px solid #22c55e',
                        color: '#166534',
                        animation: 'popIn 0.3s ease-out'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✅</div>
                        <h2 style={{ color: '#15803d', marginBottom: '0.5rem', fontSize: '1.8rem' }}>ONAYLANDI</h2>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {resultData.meal_type === 'lunch' ? 'Öğle Yemeği' : 'Akşam Yemeği'}
                        </div>
                        <div style={{ marginTop: '0.5rem', fontSize: '1.2rem' }}>
                            {new Date(resultData.date).toLocaleDateString('tr-TR')}
                        </div>
                        {resultData.user && (
                            <div style={{ marginTop: '1rem', borderTop: '1px solid #86efac', paddingTop: '1rem', fontWeight: '600' }}>
                                👤 {resultData.user.full_name || 'Öğrenci'}
                            </div>
                        )}
                        <button
                            onClick={resetScanner}
                            style={{
                                marginTop: '20px',
                                padding: '12px 30px',
                                background: '#166534',
                                color: 'white',
                                border: 'none',
                                borderRadius: '30px',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Sonraki Kişi ➡️
                        </button>
                    </div>
                )}

                {/* Error State */}
                {status === 'error' && (
                    <div className="error-box" style={{
                        background: '#fee2e2',
                        padding: '2rem',
                        borderRadius: '16px',
                        border: '2px solid #ef4444',
                        color: '#991b1b',
                        animation: 'shake 0.4s ease-in-out'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>❌</div>
                        <h2 style={{ color: '#b91c1c', marginBottom: '0.5rem' }}>REDDEDİLDİ</h2>
                        <p style={{ fontSize: '1.2rem' }}>Geçersiz rezervasyon veya bakiye yetersiz.</p>

                        <button
                            onClick={resetScanner}
                            style={{
                                marginTop: '20px',
                                padding: '12px 30px',
                                background: '#b91c1c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '30px',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Tekrar Dene 🔄
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes popIn {
                    0% { transform: scale(0.8); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
            `}</style>
        </div>
    );
};

export default MealCheckInPage;
