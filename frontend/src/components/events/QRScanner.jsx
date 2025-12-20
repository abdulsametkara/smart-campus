import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './QRScanner.css';

const QRScanner = ({ onScanSuccess, onScanError }) => {
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!scannerRef.current) return;

    const scanner = new Html5QrcodeScanner(
      'qr-scanner',
      {
        qrbox: {
          width: 250,
          height: 250
        },
        fps: 10,
        aspectRatio: 1.0
      },
      false // verbose
    );

    scanner.render(
      (decodedText, decodedResult) => {
        if (onScanSuccess) {
          onScanSuccess(decodedText, decodedResult);
        }
      },
      (errorMessage) => {
        // Ignore errors, just log them
        if (onScanError) {
          onScanError(errorMessage);
        }
      }
    );

    setIsScanning(true);

    return () => {
      scanner.clear().catch(err => {
        console.error('Error clearing scanner:', err);
      });
      setIsScanning(false);
    };
  }, []);

  return (
    <div className="qr-scanner-container">
      <div id="qr-scanner" ref={scannerRef} className="qr-scanner" />
      {!isScanning && (
        <div className="scanner-placeholder">
          <p>Kamera yükleniyor...</p>
        </div>
      )}
    </div>
  );
};

export default QRScanner;

