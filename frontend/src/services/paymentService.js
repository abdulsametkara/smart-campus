import walletService from './wallet.service';
import mealService from './meal.service';
import eventService from './eventService';

// Frontend payment abstraction.
// In this project, actual charging is done in backend (walletService.processPayment),
// but this layer allows swapping implementation with Stripe/PayTR in future.

const PaymentService = {
  // Generic wallet top-up
  async topUp(amount) {
    return walletService.topUp(amount);
  },

  // Reserve a meal (uses wallet + QR behind the scenes via backend)
  async reserveMeal(menuId) {
    return mealService.makeReservation(menuId);
  },

  // Register to an event (paid/free handled by backend)
  async registerToEvent(eventId, customFields = {}) {
    return eventService.register(eventId, customFields);
  }
};

export default PaymentService;


