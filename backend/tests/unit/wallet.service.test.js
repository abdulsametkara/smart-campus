const walletService = require('../../src/services/wallet.service');
const { Wallet, Transaction, sequelize } = require('../../models');

// Mock dependencies
const mockWallet = {
    id: 1, user_id: 1, balance: 100.00, currency: 'TRY',
    save: jest.fn()
};

jest.mock('../../models', () => {
    return {
        Wallet: {
            findOne: jest.fn(),
            create: jest.fn()
        },
        Transaction: {
            create: jest.fn()
        },
        sequelize: {
            transaction: jest.fn(() => ({
                commit: jest.fn(),
                rollback: jest.fn()
            }))
        }
    };
});

describe('Wallet Service Unit Tests', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('topUp should increase balance and create transaction', async () => {
        // Setup mock
        Wallet.findOne.mockResolvedValue({
            id: 1,
            balance: 100.00,
            save: jest.fn()
        });

        const result = await walletService.topUp(1, 50.00);

        expect(Wallet.findOne).toHaveBeenCalled();
        expect(result.balance).toBe(150.00); // 100 + 50
        expect(Transaction.create).toHaveBeenCalled();
    });

    test('topUp should throw error for negative amount', async () => {
        await expect(walletService.topUp(1, -10)).rejects.toThrow('Amount must be positive');
    });

    test('processPayment should deduct balance', async () => {
        const mockWalletInstance = {
            id: 1,
            balance: 100.00,
            save: jest.fn()
        };
        Wallet.findOne.mockResolvedValue(mockWalletInstance);

        await walletService.processPayment(1, 40.00, 'Test Payment');

        expect(mockWalletInstance.balance).toBe(60.00); // 100 - 40
        expect(Transaction.create).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'debit', amount: 40.00 }),
            expect.anything()
        );
    });

    test('processPayment should throw error for insufficient funds', async () => {
        const mockWalletInstance = {
            id: 1,
            balance: 10.00, // Low balance
            save: jest.fn()
        };
        Wallet.findOne.mockResolvedValue(mockWalletInstance);

        await expect(walletService.processPayment(1, 50.00, 'Expensive')).rejects.toThrow('Insufficient funds');
    });
});
