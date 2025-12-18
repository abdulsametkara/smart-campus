const qrcode = require('qrcode');

class QrService {
    /**
     * Generate QR Code Data URL
     * @param {Object} data - Data to encode
     * @returns {Promise<string>} - QR Code Data URL
     */
    async generate(data) {
        try {
            const jsonString = JSON.stringify(data);
            return await qrcode.toDataURL(jsonString);
        } catch (error) {
            console.error('QR Generation Error:', error);
            throw new Error('Failed to generate QR code');
        }
    }

    /**
     * Validate QR Code Data
     * @param {string} qrString - JSON string from QR
     * @returns {Object} - Parsed data
     */
    validate(qrString) {
        try {
            return JSON.parse(qrString);
        } catch (error) {
            throw new Error('Invalid QR code format');
        }
    }
}

module.exports = new QrService();
