import { getSizeLabel } from '../productUtils';

describe('productUtils', () => {
  describe('getSizeLabel', () => {
    it('should return "Small" for S', () => {
      expect(getSizeLabel('S')).toBe('Small');
    });

    it('should return "Medium" for M', () => {
      expect(getSizeLabel('M')).toBe('Medium');
    });

    it('should return "Large" for L', () => {
      expect(getSizeLabel('L')).toBe('Large');
    });

    it('should return "Extra Large" for XL', () => {
      expect(getSizeLabel('XL')).toBe('Extra Large');
    });

    it('should return empty string for null', () => {
      expect(getSizeLabel(null)).toBe('');
    });

    it('should return original value for unknown sizes', () => {
      expect(getSizeLabel('XXL')).toBe('XXL');
      expect(getSizeLabel('Custom')).toBe('Custom');
    });

    it('should not be case-insensitive', () => {
      // Original implementation is case-sensitive
      expect(getSizeLabel('s')).toBe('s');
      expect(getSizeLabel('m')).toBe('m');
    });

    it('should handle numeric strings', () => {
      expect(getSizeLabel('42')).toBe('42');
    });
  });
});
