# 🎓 Interactive Unit Testing Tutorial

Welcome! This tutorial will walk you through **what unit tests are**, **how they work**, and **how to write your own**.

---

## 📊 STEP 1: View Your Coverage Reports (Charts & Visualizations!)

Open these HTML files in your browser to see beautiful charts showing what code is tested:

### Frontend Coverage Report:
```bash
# Open in browser (or just double-click the file):
xdg-open coverage/lcov-report/index.html
```
**Location:** `coverage/lcov-report/index.html`

### Backend Coverage Report:
```bash
# Open in browser:
xdg-open src/app/api/backend/htmlcov/index.html
```
**Location:** `src/app/api/backend/htmlcov/index.html`

These reports show:
- 📊 **Charts and graphs** of your code coverage
- 🟢 **Green lines** = tested code
- 🔴 **Red lines** = untested code
- 📈 **Percentages** showing how much is covered

---

## 🔍 STEP 2: Look at a Real Test

Let's examine a simple test to understand what it does:

### File: `src/utils/__tests__/colorUtils.test.ts`

```typescript
import { getColorHex, getProductImageUrl } from '../colorUtils';

describe('colorUtils', () => {
  describe('getColorHex', () => {
    it('should return correct hex code for known colors', () => {
      // ✅ ARRANGE: Set up the input
      const colorName = 'Red';
      
      // ✅ ACT: Call the function
      const result = getColorHex(colorName);
      
      // ✅ ASSERT: Check the result is correct
      expect(result).toBe('ef4444');
    });
  });
});
```

### Breaking It Down:

1. **`describe()`** = Groups related tests together
2. **`it()`** = One specific test case (reads like English: "it should...")
3. **`expect()`** = Checks if the result matches what you expected
4. **`.toBe()`** = The matcher that compares actual vs expected

### What This Test Does:
- **Tests:** The `getColorHex()` function
- **Input:** The string `'Red'`
- **Expected Output:** The hex code `'ef4444'`
- **Result:** If the function returns anything else, the test FAILS ❌

---

## 🎯 STEP 3: Understand the 3 A's of Testing

Every test follows this pattern:

```typescript
it('should do something', () => {
  // 1️⃣ ARRANGE - Set up your test data
  const input = 'test data';
  
  // 2️⃣ ACT - Run the code you're testing
  const result = functionToTest(input);
  
  // 3️⃣ ASSERT - Verify the result is correct
  expect(result).toBe('expected output');
});
```

---

## 🧪 STEP 4: Write Your First Test

Let's create a simple function and test it together!

### Create a new file: `src/utils/calculator.ts`

```typescript
export function add(a: number, b: number): number {
  return a + b;
}

export function subtract(a: number, b: number): number {
  return a - b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}
```

### Create the test: `src/utils/__tests__/calculator.test.ts`

```typescript
import { add, subtract, multiply } from '../calculator';

describe('Calculator Functions', () => {
  
  describe('add', () => {
    it('should add two positive numbers', () => {
      // ARRANGE
      const num1 = 5;
      const num2 = 3;
      
      // ACT
      const result = add(num1, num2);
      
      // ASSERT
      expect(result).toBe(8);
    });
    
    it('should add negative numbers', () => {
      expect(add(-5, -3)).toBe(-8);
    });
    
    it('should handle zero', () => {
      expect(add(0, 5)).toBe(5);
    });
  });
  
  describe('subtract', () => {
    it('should subtract two numbers', () => {
      expect(subtract(10, 3)).toBe(7);
    });
    
    it('should handle negative results', () => {
      expect(subtract(3, 10)).toBe(-7);
    });
  });
  
  describe('multiply', () => {
    it('should multiply two numbers', () => {
      expect(multiply(4, 5)).toBe(20);
    });
    
    it('should return zero when multiplying by zero', () => {
      expect(multiply(100, 0)).toBe(0);
    });
  });
  
});
```

### Now run your test!

```bash
yarn test
```

**Watch it pass!** ✅ All tests should be green.

---

## 🔥 STEP 5: See a Test FAIL

Let's intentionally break something to see what happens:

### Modify `src/utils/calculator.ts` (break the add function):

```typescript
export function add(a: number, b: number): number {
  return a - b;  // ❌ OOPS! This should be a + b
}
```

### Run tests again:

```bash
yarn test
```

You'll see:
```
❌ FAIL  src/utils/__tests__/calculator.test.ts
  ● Calculator Functions › add › should add two positive numbers

    expect(received).toBe(expected) // Object.is equality

    Expected: 8
    Received: 2  👈 Wrong answer!
```

**This is the power of tests!** They immediately tell you:
- ❌ What broke
- 📍 Where it broke
- 🔍 Expected vs actual values

### Fix it back:

```typescript
export function add(a: number, b: number): number {
  return a + b;  // ✅ Fixed!
}
```

---

## 📈 STEP 6: Common Test Matchers

Here are the most useful test assertions:

```typescript
// Equality
expect(value).toBe(5);                    // Exact match
expect(value).toEqual({ name: 'John' });  // Deep equality for objects

// Truthiness
expect(value).toBeTruthy();               // Is truthy
expect(value).toBeFalsy();                // Is falsy
expect(value).toBeNull();                 // Is null
expect(value).toBeUndefined();            // Is undefined
expect(value).toBeDefined();              // Is not undefined

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThan(10);
expect(value).toBeCloseTo(0.3);           // For floats

// Strings
expect(text).toContain('substring');
expect(text).toMatch(/regex/);

// Arrays
expect(array).toContain('item');
expect(array).toHaveLength(5);

// React/DOM (with @testing-library)
expect(element).toBeInTheDocument();
expect(element).toHaveClass('active');
expect(element).toHaveTextContent('Hello');
```

---

## 🎯 STEP 7: Test React Components

Let's look at how we test React components:

### Example from `src/components/__tests__/ProductCard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import ProductCard from '../ProductCard';

describe('ProductCard', () => {
  it('should render product information correctly', () => {
    // ARRANGE - Render the component
    render(
      <ProductCard 
        id={1}
        name="Test Product"
        category="Test Category"
        price={99.99}
      />
    );
    
    // ACT & ASSERT - Check what's on the screen
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Test Category')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });
});
```

### Testing User Interactions:

```typescript
import { fireEvent } from '@testing-library/react';

it('should toggle favorite when button is clicked', () => {
  render(<ProductCard {...props} />);
  
  // Find the button
  const button = screen.getByRole('button');
  
  // Simulate a click
  fireEvent.click(button);
  
  // Check something changed
  expect(button).toHaveClass('active');
});
```

---

## 🐍 STEP 8: Python/Backend Tests

Python tests work the same way! Here's from `test_backend.py`:

```python
class TestRecommendationAPI:
    """Group of related tests"""
    
    def test_recommend_valid_input(self, client):
        # ARRANGE - Prepare test data
        request_data = {
            'feature1': 0.3,
            'feature2': 0.7
        }
        
        # ACT - Make the API call
        response = client.post('/recommend', json=request_data)
        
        # ASSERT - Check the response
        assert response.status_code == 200
        data = response.get_json()
        assert 'recommendations' in data
        assert len(data['recommendations']) > 0
```

---

## 📊 STEP 9: Understanding Coverage Reports

### What the numbers mean:

- **Statements**: % of code lines executed
- **Branches**: % of if/else paths tested
- **Functions**: % of functions called
- **Lines**: % of lines run

### Example from your reports:

```
File               | % Stmts | % Branch | % Funcs | % Lines
---------------|---------|----------|---------|----------
colorUtils.ts  |     100 |      100 |     100 |     100  ✅ Fully tested!
ProductCard.tsx|    93.1 |    68.42 |     100 |   96.29  ⚠️ Good, but some branches missing
Header.tsx     |       0 |        0 |       0 |       0  ❌ No tests yet!
```

**Goal:** Aim for 80%+ coverage on important code!

---

## 🎬 STEP 10: Practice Exercise

**Your Turn!** Write a test for this function:

### Create `src/utils/formatters.ts`:

```typescript
export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toFixed(2)}`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
```

### Your Task:

1. Create `src/utils/__tests__/formatters.test.ts`
2. Write at least 3 tests for `formatPrice()`
3. Write at least 2 tests for `formatDate()`
4. Run `yarn test` and see them pass!

### Hints:

```typescript
// Test cases you might want:
- formatPrice(1999) should return "$19.99"
- formatPrice(0) should return "$0.00"
- formatPrice(100) should return "$1.00"
- formatDate should handle different dates
- formatDate should format in correct locale
```

---

## 🚀 STEP 11: Run Tests in Watch Mode

The **best way** to develop with tests:

```bash
yarn test:watch
```

Now:
1. Keep this running in a terminal
2. Edit your code
3. Tests automatically re-run when you save!
4. Instant feedback! ⚡

---

## 📚 STEP 12: Test-Driven Development (TDD)

Professional developers often write tests FIRST:

1. **Write the test** (it will fail - RED ❌)
2. **Write minimal code** to make it pass (GREEN ✅)
3. **Refactor** to improve code (REFACTOR ♻️)
4. **Repeat**

### Example:

```typescript
// 1. Write test FIRST (will fail)
it('should reverse a string', () => {
  expect(reverseString('hello')).toBe('olleh');
});

// 2. Write code to pass
function reverseString(str: string): string {
  return str.split('').reverse().join('');
}

// 3. Test passes! ✅
```

---

## 🎯 Quick Reference Commands

```bash
# Frontend
yarn test                  # Run all tests once
yarn test:watch            # Run in watch mode (best for development)
yarn test:coverage         # Generate coverage report + charts

# Backend
yarn test:python           # Run Python tests
yarn test:python:coverage  # Generate Python coverage + charts

# Everything
yarn test:all              # Run ALL tests (frontend + backend)
```

---

## 🏆 Testing Best Practices

1. ✅ **Test behavior, not implementation** - Test what the user sees
2. ✅ **One assertion per test** - Keep tests focused
3. ✅ **Descriptive test names** - Read like documentation
4. ✅ **Test edge cases** - Empty arrays, null values, zero, negative numbers
5. ✅ **Keep tests fast** - Tests should run in milliseconds
6. ✅ **Mock external dependencies** - Don't call real APIs in tests
7. ✅ **Arrange-Act-Assert** - Follow the 3 A's pattern

---

## 📖 What You Learned

- ✅ What unit tests are and why they matter
- ✅ How to read and understand test code
- ✅ The Arrange-Act-Assert pattern
- ✅ How to write your own tests
- ✅ How to use coverage reports to see what's tested
- ✅ Common test matchers and assertions
- ✅ Testing React components and user interactions
- ✅ Testing backend APIs and functions
- ✅ Test-Driven Development basics

---

## 🎉 Next Steps

1. **Open the coverage reports** in your browser (see Step 1)
2. **Complete the practice exercise** (Step 10)
3. **Write tests for your own code** - Pick a file with 0% coverage
4. **Run tests in watch mode** while you code
5. **Aim for 80%+ coverage** on critical code paths

**Remember:** Tests are your safety net. Write them, and code fearlessly! 🚀
