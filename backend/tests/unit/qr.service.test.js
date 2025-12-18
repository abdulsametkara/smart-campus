const qrService = require('../../src/services/qr.service');

describe('QR Service Unit Tests', () => {

    test('Should generate a QR code data URL', async () => {
        const data = { userId: 1, type: 'TEST' };
        const qrCode = await qrService.generate(data);

        expect(typeof qrCode).toBe('string');
        expect(qrCode.startsWith('data:image/png;base64,')).toBe(true);
    });

    test('Should validate and parse a JSON string', () => {
        const data = { userId: 123 };
        const jsonString = JSON.stringify(data);

        const result = qrService.validate(jsonString);
        expect(result).toEqual(data);
    });

    test('Should throw error for invalid JSON string', () => {
        const invalidString = '{ "bad_json": ';

        expect(() => {
            qrService.validate(invalidString);
        }).toThrow('Invalid QR code format');
    });
});
