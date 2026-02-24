import { getColorHex, getProductImageUrl } from '../colorUtils';

describe('colorUtils', () => {
  describe('getColorHex', () => {
    it('should return correct hex code for known colors', () => {
      expect(getColorHex('Navy')).toBe('1e3a8a');
      expect(getColorHex('Red')).toBe('ef4444');
      expect(getColorHex('Blue')).toBe('3b82f6');
    });

    it('should return default gray color for unknown colors', () => {
      expect(getColorHex('UnknownColor')).toBe('9ca3af');
    });

    it('should be case-sensitive', () => {
      expect(getColorHex('navy')).toBe('9ca3af'); // lowercase not in map
      expect(getColorHex('Navy')).toBe('1e3a8a'); // uppercase in map
    });
  });

  describe('getProductImageUrl', () => {
    it('should generate URL with default dimensions', () => {
      const url = getProductImageUrl('Red');
      expect(url).toBe('https://placehold.co/400x400/ef4444/white?text=Product');
    });

    it('should generate URL with custom dimensions', () => {
      const url = getProductImageUrl('Blue', 200, 300);
      expect(url).toBe('https://placehold.co/200x300/3b82f6/white?text=Product');
    });

    it('should use default gray when no color provided', () => {
      const url = getProductImageUrl();
      expect(url).toBe('https://placehold.co/400x400/9ca3af/white?text=Product');
    });

    it('should handle unknown colors with default gray', () => {
      const url = getProductImageUrl('InvalidColor', 100, 100);
      expect(url).toBe('https://placehold.co/100x100/9ca3af/white?text=Product');
    });
  });
});
