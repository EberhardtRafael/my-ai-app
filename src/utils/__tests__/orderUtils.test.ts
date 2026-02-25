import { formatDate, getStatusColor } from '../orderUtils';

describe('orderUtils', () => {
  describe('getStatusColor', () => {
    it('should return correct color for pending status', () => {
      expect(getStatusColor('pending')).toBe('bg-yellow-100 text-yellow-800');
    });

    it('should return correct color for processing status', () => {
      expect(getStatusColor('processing')).toBe('bg-blue-100 text-blue-800');
    });

    it('should return correct color for shipped status', () => {
      expect(getStatusColor('shipped')).toBe('bg-purple-100 text-purple-800');
    });

    it('should return correct color for delivered status', () => {
      expect(getStatusColor('delivered')).toBe('bg-green-100 text-green-800');
    });

    it('should return correct color for cancelled status', () => {
      expect(getStatusColor('cancelled')).toBe('bg-red-100 text-red-800');
    });

    it('should return default gray color for unknown status', () => {
      expect(getStatusColor('unknown')).toBe('bg-gray-100 text-gray-800');
    });

    it('should return default gray color for empty string', () => {
      expect(getStatusColor('')).toBe('bg-gray-100 text-gray-800');
    });
  });

  describe('formatDate', () => {
    it('should format ISO date string to US locale', () => {
      const dateString = '2024-01-15T14:30:00Z';
      const result = formatDate(dateString);
      // Result will vary by timezone, just check it's a valid formatted string
      expect(result).toContain('January');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should handle different date formats', () => {
      const dateString = '2026-02-25T10:00:00Z';
      const result = formatDate(dateString);
      expect(result).toContain('February');
      expect(result).toContain('25');
      expect(result).toContain('2026');
    });

    it('should include time in formatted output', () => {
      const dateString = '2024-06-01T23:59:00Z';
      const result = formatDate(dateString);
      // Should contain time elements
      expect(result).toMatch(/\d{1,2}:\d{2}/); // HH:MM format
    });
  });
});
