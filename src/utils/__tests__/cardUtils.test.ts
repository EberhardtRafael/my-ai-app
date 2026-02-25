import { formatCardNumber, formatExpiryDate, simulatePayment } from '../cardUtils';

describe('cardUtils', () => {
  describe('formatCardNumber', () => {
    it('should format 16-digit card number with spaces', () => {
      expect(formatCardNumber('1234567890123456')).toBe('1234 5678 9012 3456');
    });

    it('should format already-spaced card number', () => {
      expect(formatCardNumber('1234 5678 9012 3456')).toBe('1234 5678 9012 3456');
    });

    it('should handle partial card numbers', () => {
      expect(formatCardNumber('1234')).toBe('1234');
      expect(formatCardNumber('12345678')).toBe('1234 5678');
    });

    it('should remove existing spaces and reformat', () => {
      expect(formatCardNumber('12 34 56 78')).toBe('1234 5678');
    });

    it('should handle empty string', () => {
      expect(formatCardNumber('')).toBe('');
    });

    it('should handle card numbers longer than 16 digits', () => {
      expect(formatCardNumber('12345678901234567890')).toBe('1234 5678 9012 3456 7890');
    });
  });

  describe('formatExpiryDate', () => {
    it('should format 4 digits as MM/YY', () => {
      expect(formatExpiryDate('1225')).toBe('12/25');
    });

    it('should format partial input (2 digits)', () => {
      expect(formatExpiryDate('12')).toBe('12/');
    });

    it('should format partial input (1 digit)', () => {
      expect(formatExpiryDate('1')).toBe('1');
    });

    it('should handle already formatted date', () => {
      expect(formatExpiryDate('12/25')).toBe('12/25');
    });

    it('should remove non-digit characters and reformat', () => {
      expect(formatExpiryDate('12-25')).toBe('12/25');
      expect(formatExpiryDate('12.25')).toBe('12/25');
    });

    it('should handle empty string', () => {
      expect(formatExpiryDate('')).toBe('');
    });

    it('should limit to 4 digits', () => {
      expect(formatExpiryDate('123456')).toBe('12/34');
    });
  });

  describe('simulatePayment', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return success for valid card number', async () => {
      const promise = simulatePayment('4242 4242 4242 4242');
      
      // Fast-forward the timer
      jest.advanceTimersByTime(2000);
      
      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.message).toBe('Payment processed successfully!');
    });

    it('should return failure for card starting with 4000', async () => {
      const promise = simulatePayment('4000 0000 0000 0000');
      
      // Fast-forward the timer
      jest.advanceTimersByTime(2000);
      
      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.message).toBe('Payment declined. Please try another card.');
    });

    it('should handle card numbers without spaces', async () => {
      const promise = simulatePayment('4242424242424242');
      
      jest.advanceTimersByTime(2000);
      
      const result = await promise;
      expect(result.success).toBe(true);
    });

    it('should delay response by 2 seconds', async () => {
      const promise = simulatePayment('4242 4242 4242 4242');
      
      // Before timer advance, promise should not resolve
      let resolved = false;
      promise.then(() => {
        resolved = true;
      });
      
      await Promise.resolve(); // Flush microtasks
      expect(resolved).toBe(false);
      
      // After advancing timer
      jest.advanceTimersByTime(2000);
      await promise;
      expect(resolved).toBe(true);
    });
  });
});
