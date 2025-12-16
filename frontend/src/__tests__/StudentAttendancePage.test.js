import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StudentAttendancePage from '../pages/attendance/StudentAttendancePage';
import api from '../services/api';

// Mock API
jest.mock('../services/api');

// Mock Leaflet
jest.mock('react-leaflet', () => ({
    MapContainer: ({ children }) => <div>{children}</div>,
    TileLayer: () => <div>TileLayer</div>,
    Marker: () => <div>Marker</div>,
    Popup: () => <div>Popup</div>,
    Circle: () => <div>Circle</div>,
    useMap: () => ({ setView: jest.fn() }),
}));

// Mock Html5QrcodeScanner
jest.mock('html5-qrcode', () => ({
    Html5QrcodeScanner: jest.fn().mockImplementation(() => ({
        render: jest.fn(),
        clear: jest.fn(),
    })),
}));

// Mock Geolocation
const mockGeolocation = {
    getCurrentPosition: jest.fn().mockImplementation((success) =>
        success({
            coords: {
                latitude: 41.0082,
                longitude: 28.9784,
                accuracy: 10
            }
        })
    ),
    watchPosition: jest.fn()
};

// Safer way to mock navigator
Object.defineProperty(global.navigator, 'geolocation', {
    value: mockGeolocation,
    writable: true
});

describe('StudentAttendancePage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders location step initially', () => {
        render(<StudentAttendancePage />);
        expect(screen.getByText('1. Adım: Konum Doğrulama')).toBeInTheDocument();
        expect(screen.getByText('📍 Konumumu Al')).toBeInTheDocument();
    });

    test('gets location and moves to step 2', async () => {
        render(<StudentAttendancePage />);

        fireEvent.click(screen.getByText('📍 Konumumu Al'));

        await waitFor(() => {
            // Use regex for looser matching
            expect(screen.getByText(/Konum başarıyla alındı/i)).toBeInTheDocument();
        });

        // Step 2 should be visible
        expect(screen.getByText('2. Adım: QR Kod ve Onay')).toBeInTheDocument();
        expect(screen.getByText('✅ YOKLAMAYI ONAYLA')).toBeInTheDocument();
    });

    test('submits check-in successfully', async () => {
        api.post.mockResolvedValue({ data: { success: true } });
        render(<StudentAttendancePage />);

        // Get Location
        fireEvent.click(screen.getByText('📍 Konumumu Al'));
        await waitFor(() => screen.getByText('2. Adım: QR Kod ve Onay'));

        // Enter QR Code
        const input = screen.getByPlaceholderText('Tahtadaki kodu girin...');
        fireEvent.change(input, { target: { value: 'TEST-QR-123' } });

        // Submit
        fireEvent.click(screen.getByText('✅ YOKLAMAYI ONAYLA'));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/attendance/checkin', {
                latitude: 41.0082,
                longitude: 28.9784,
                accuracy: 10,
                qr_code: 'TEST-QR-123'
            });
        });
    });
});
