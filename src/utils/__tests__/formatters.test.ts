/**
 * 🎓 PRACTICE: Your First Test!
 *
 * This is a template to help you write your first test.
 * Follow the instructions below and uncomment the tests one by one.
 *
 * Run: yarn test:watch (in a terminal)
 * Then edit this file - tests will automatically re-run!
 */

import { capitalizeFirstLetter, formatDate, formatPrice, truncateText } from '../formatters';

describe('Formatters - YOUR PRACTICE TESTS', () => {
  /**
   * TEST GROUP 1: formatPrice()
   * ============================
   * This function converts cents to dollar format
   * Example: 1999 cents → "$19.99"
   */
  describe('formatPrice', () => {
    // ✅ Example test (already written for you)
    it('should format cents to dollars with 2 decimals', () => {
      const result = formatPrice(1999);
      expect(result).toBe('$19.99');
    });

    // 🎯 TODO: Uncomment and complete these tests

    // it('should handle zero', () => {
    //   const result = formatPrice(0);
    //   expect(result).toBe('$0.00');
    // });

    // it('should format exactly $1', () => {
    //   const result = formatPrice(100);
    //   expect(result).toBe('___FILL_IN___');  // What should it be?
    // });

    // it('should handle large amounts', () => {
    //   const result = formatPrice(123456);
    //   expect(result).toBe('___FILL_IN___');  // Calculate this!
    // });
  });

  /**
   * TEST GROUP 2: capitalizeFirstLetter()
   * ======================================
   * Makes first letter uppercase, rest lowercase
   * Example: "hELLO" → "Hello"
   */
  describe('capitalizeFirstLetter', () => {
    // 🎯 TODO: Write these tests from scratch!

    // Test 1: Normal text
    it('should capitalize first letter of normal text', () => {
      // ARRANGE: Set up test data
      const input = 'hello';

      // ACT: Call the function
      const result = capitalizeFirstLetter(input);

      // ASSERT: Check the result
      expect(result).toBe('Hello');
    });

    // Test 2: All uppercase text
    // it('should handle all uppercase text', () => {
    //   expect(capitalizeFirstLetter('HELLO')).toBe('___FILL_IN___');
    // });

    // Test 3: Empty string
    // it('should handle empty string', () => {
    //   expect(capitalizeFirstLetter('')).toBe('___FILL_IN___');
    // });
  });

  /**
   * TEST GROUP 3: truncateText()
   * =============================
   * Shortens text if too long, adds "..."
   * Example: truncateText("Hello World", 5) → "Hello..."
   */
  describe('truncateText', () => {
    // 🎯 TODO: Write all these tests!

    it('should truncate text longer than maxLength', () => {
      const result = truncateText('Hello World', 5);
      expect(result).toBe('Hello...');
    });

    // Add more tests:
    // - Text shorter than maxLength (should return as-is)
    // - Text exactly at maxLength (should return as-is)
    // - Empty string
    // - maxLength of 0
  });

  /**
   * 🏆 BONUS CHALLENGE: formatDate()
   * =================================
   * This one is trickier! Dates can be tricky to test.
   * Try writing at least one test.
   */
  describe('formatDate', () => {
    // 🎯 Date tests can be tricky because format depends on timezone
    // This test is modified to be more flexible
    it('should format a date in US locale', () => {
      const testDate = new Date(2024, 0, 15); // January 15, 2024 (month is 0-indexed)
      const result = formatDate(testDate);

      // Check it contains the key parts (format may vary by system)
      expect(result).toContain('2024');
      expect(result).toContain('January');
      expect(result).toContain('15');
    });

    // 🎯 Try adding more date tests if you want!
  });
});

/**
 * 🎓 INSTRUCTIONS:
 * ================
 *
 * 1. Open a terminal and run: yarn test:watch
 * 2. Uncomment tests one at a time
 * 3. Fill in the "___FILL_IN___" values
 * 4. Watch the tests pass or fail in real-time!
 * 5. Try writing your own tests from scratch
 *
 * TIPS:
 * -----
 * - Start with simple cases
 * - Test edge cases (empty, zero, null, very large numbers)
 * - One test should check one thing
 * - Test names should describe what they test
 *
 * When all tests pass, you'll see:
 * ✅ ✅ ✅ ✅ All green!
 */
