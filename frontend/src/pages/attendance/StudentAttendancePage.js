import React, { useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../services/api';
import L from 'leaflet';
import { Html5QrcodeScanner } from 'html5-qrcode';
import Swal from 'sweetalert2';
import '../../styles/attendance.css';

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

const StudentAttendancePage = () => {
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [status, setStatus] = useState({ type: 'info', msg: 'Lütfen derse katılmak için konumunuzu doğrulayın.' });

    // Effect to handle scanner cleanup/init
    React.useEffect(() => {
        let scanner = null;
        if (showScanner) {
            scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );
            scanner.render(onScanSuccess, onScanFailure);
        }

        function onScanSuccess(decodedText, decodedResult) {
            setQrCode(decodedText);
            setShowScanner(false);
            scanner.clear();
            Swal.fire({
                title: 'QR Kod Okundu! ✅',
                text: `Kod: ${decodedText}`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        }

        function onScanFailure(error) {
            // handle scan failure, usually better to ignore and keep scanning.
            // console.warn(`Code scan error = ${error}`);
        }

        return () => {
            if (scanner) {
                scanner.clear().catch(error => {
                    console.error("Failed to clear html5-qrcode scanner. ", error);
                });
            }
        };
    }, [showScanner]);

    // Dummy session coords for visualization before actual check-in data is known
    // In a real app, you might fetch active session coordinates first, or just show user location map
    const [mapCenter, setMapCenter] = useState(null);

    const getLocation = () => {
        setLoading(true);
        setStatus({ type: 'info', msg: 'Konum alınıyor...' });

        if (!navigator.geolocation) {
            setStatus({ type: 'error', msg: 'Tarayıcınız GPS desteklemiyor.' });
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                setLocation({ latitude, longitude, accuracy });
                setMapCenter([latitude, longitude]);
                setStatus({ type: 'success', msg: `Konum başarıyla alındı! (Doğruluk: ${accuracy.toFixed(1)}m)` });
                setLoading(false);
            },
            (err) => {
                setStatus({ type: 'error', msg: 'Konum alınamadı. Lütfen GPS izni verin.' });
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleCheckIn = async () => {
        if (!location || !qrCode) {
            Swal.fire('Eksik Bilgi', 'Lütfen konum alın ve QR kodunu girin.', 'warning');
            return;
        }

        try {
            await api.post('/attendance/checkin', {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                qr_code: qrCode
            });
            Swal.fire({
                title: 'Yoklama Başarılı! 🎉',
                text: 'Derse katılımınız onaylandı.',
                icon: 'success',
                confirmButtonColor: '#22c55e'
            });
            setQrCode('');
        } catch (err) {
            Swal.fire({
                title: 'Yoklama Başarısız ❌',
                text: err.response?.data?.message || err.message,
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        }
    };

    return (
        <div className="attendance-page">
            <div className="page-title">
                <span className="icon">📍</span>
                <h1>Yoklamaya Katıl</h1>
            </div>

            <div className="attendance-stats-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="course-attendance-card">
                    <div className="card-header" style={{ marginBottom: '1rem', borderBottom: '1px solid #f0f0f0', paddingBottom: '1rem' }}>
                        <h3 style={{ margin: 0, color: '#1a1a2e' }}>1. Adım: Konum Doğrulama</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <p style={{ color: '#666', fontSize: '0.95rem' }}>
                            Derse katılım için kampüs içinde olduğunuzu doğrulamanız gerekmektedir.
                        </p>

                        <button
                            className={`action-button ${location ? 'success' : 'primary'}`}
                            onClick={getLocation}
                            disabled={loading}
                            style={{ justifyContent: 'center', width: '100%', padding: '1rem' }}
                        >
                            {loading ? 'Konum Alınıyor...' : location ? 'Konumu Güncelle' : '📍 Konumumu Al'}
                        </button>

                        {status.msg && (
                            <div className={`custom-alert ${status.type === 'error' ? 'danger' : status.type === 'success' ? 'success' : 'info'}`}>
                                <span>{status.type === 'error' ? '❌' : status.type === 'success' ? '✅' : 'ℹ️'}</span>
                                {status.msg}
                            </div>
                        )}
                    </div>
                </div>

                {location && (
                    <div className="course-attendance-card" style={{ animation: 'slideIn 0.3s ease-out' }}>
                        <div className="card-header" style={{ marginBottom: '1rem', borderBottom: '1px solid #f0f0f0', paddingBottom: '1rem' }}>
                            <h3 style={{ margin: 0, color: '#1a1a2e' }}>2. Adım: QR Kod ve Onay</h3>
                        </div>

                        {/* Map Preview */}
                        <div className="map-container" style={{ height: '250px', marginBottom: '1.5rem', borderRadius: '12px', border: '2px solid #eef2f7' }}>
                            <MapContainer center={mapCenter} zoom={18} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <Marker position={[location.latitude, location.longitude]}>
                                    <Popup>Şu an buradasınız</Popup>
                                </Marker>
                                {/* Circle representing simplified range visualization */}
                                <Circle
                                    center={[location.latitude, location.longitude]}
                                    radius={20}
                                    pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.2 }}
                                />
                            </MapContainer>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="stat-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Oturum Kodu / QR</label>

                            {!showScanner ? (
                                <>
                                    <button
                                        className="action-button primary"
                                        onClick={() => setShowScanner(true)}
                                        style={{ width: '100%', marginBottom: '1rem', justifyContent: 'center' }}
                                    >
                                        📷 QR KOD TARA
                                    </button>
                                    <div style={{ textAlign: 'center', margin: '0.5rem', color: '#888' }}>- VEYA -</div>
                                </>
                            ) : (
                                <div style={{ marginBottom: '1rem' }}>
                                    <div id="reader" width="100%"></div>
                                    <button
                                        className="action-button danger"
                                        onClick={() => setShowScanner(false)}
                                        style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}
                                    >
                                        İPTAL
                                    </button>
                                </div>
                            )}

                            <input
                                type="text"
                                className="action-input"
                                value={qrCode}
                                onChange={(e) => setQrCode(e.target.value)}
                                placeholder="Tahtadaki kodu girin..."
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: '2px solid #eef2f7',
                                    fontSize: '1.1rem',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        </div>

                        <button
                            className="action-button success"
                            onClick={handleCheckIn}
                            style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1.1rem' }}
                        >
                            ✅ YOKLAMAYI ONAYLA
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentAttendancePage;
