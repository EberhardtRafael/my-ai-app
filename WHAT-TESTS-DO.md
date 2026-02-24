# 🔍 WHAT ARE TESTS ACTUALLY TESTING?

This document shows you **exactly** what each test is checking, line by line.

---

## Example 1: Testing a Utility Function

### The Code Being Tested
File: `src/utils/colorUtils.ts`
```typescript
export function getColorHex(colorName: string): string {
  const colorMap = {
    'Red': 'ef4444',
    'Blue': '3b82f6',
    'Green': '22c55e',
  };
  return colorMap[colorName] || '9ca3af'; // default gray
}
```

### The Test
File: `src/utils/__tests__/colorUtils.test.ts`
```typescript
it('should return correct hex code for known colors', () => {
  expect(getColorHex('Red')).toBe('ef4444');
  expect(getColorHex('Blue')).toBe('3b82f6');
});
```

### What This Tests:
✅ **Input:** `'Red'` → **Output:** `'ef4444'` (correct!)
✅ **Input:** `'Blue'` → **Output:** `'3b82f6'` (correct!)
❌ **If it returned anything else**, the test would FAIL

### Visual Flow:
```
Test calls: getColorHex('Red')
     ↓
Function runs: looks up 'Red' in colorMap
     ↓
Function returns: 'ef4444'
     ↓
Test checks: Is 'ef4444' === 'ef4444'? YES ✅
     ↓
Test PASSES ✅
```

---

## Example 2: Testing Edge Cases

### The Test
```typescript
it('should return default gray for unknown colors', () => {
  expect(getColorHex('UnknownColor')).toBe('9ca3af');
});
```

### What This Tests:
✅ **Input:** Unknown color name → **Output:** Default gray `'9ca3af'`
✅ Ensures the function doesn't crash on bad input
✅ Verifies the fallback behavior works

### Why This Matters:
Without this test, you might break the default behavior and not know until production!

---

## Example 3: Testing a React Component

### The Component
File: `src/components/ProductCard.tsx`
```typescript
const ProductCard = ({ name, price, category }) => {
  return (
    <div>
      <h2>{name}</h2>
      <p>{category}</p>
      <p>${price}</p>
    </div>
  );
};
```

### The Test
File: `src/components/__tests__/ProductCard.test.tsx`
```typescript
it('should render product information correctly', () => {
  render(
    <ProductCard 
      name="Test Product"
      category="Test Category"
      price={99.99}
    />
  );
  
  expect(screen.getByText('Test Product')).toBeInTheDocument();
  expect(screen.getByText('Test Category')).toBeInTheDocument();
  expect(screen.getByText('$99.99')).toBeInTheDocument();
});
```

### What This Tests:
✅ Component renders without crashing
✅ Product name appears on screen
✅ Category appears on screen
✅ Price appears on screen with correct formatting

### Visual Flow:
```
Test renders: <ProductCard name="Test Product" ... />
     ↓
Component creates HTML:
<div>
  <h2>Test Product</h2>
  <p>Test Category</p>
  <p>$99.99</p>
</div>
     ↓
Test searches: Is "Test Product" in the document?
     ↓
Found it! ✅ Test PASSES
```

---

## Example 4: Testing User Interactions

### The Test
```typescript
it('should toggle favorite when heart icon is clicked', async () => {
  // Mock the API call
  global.fetch = jest.fn().mockResolvedValue({
    json: async () => ({ data: { addFavorite: { id: 1 } } })
  });
  
  render(<ProductCard userId="123" id={1} />);
  
  const button = screen.getByRole('button');
  fireEvent.click(button);  // 👆 Simulate user clicking
  
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalled();
  });
});
```

### What This Tests:
✅ Button exists and can be clicked
✅ Clicking triggers the API call
✅ Component behaves correctly after the click

### Step-by-Step:
1. **Setup:** Render component with props
2. **Find:** Locate the button element
3. **Simulate:** Fake a user click event
4. **Verify:** Check that fetch was called
5. **Result:** Test passes if all checks pass ✅

---

## Example 5: Testing API Endpoints (Backend)

### The API Code
File: `src/app/api/backend/backend.py`
```python
@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json()
    feature1 = data.get("feature1")
    feature2 = data.get("feature2")
    
    if feature1 is None or feature2 is None:
        return jsonify({"error": "Required fields missing"}), 400
    
    # ... recommendation logic ...
    return jsonify({"recommendations": results})
```

### The Test
File: `test_backend.py`
```python
def test_recommend_missing_feature1(client):
    response = client.post('/recommend', json={'feature2': 0.5})
    
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data
```

### What This Tests:
✅ **Input:** Missing `feature1` → **Output:** 400 error
✅ Error response includes an error message
✅ API doesn't crash on invalid input

### Visual Flow:
```
Test sends: POST /recommend with { feature2: 0.5 }
     ↓
API checks: Is feature1 present? NO
     ↓
API returns: 400 error + error message
     ↓
Test checks: Is status code 400? YES ✅
Test checks: Does response have 'error' key? YES ✅
     ↓
Test PASSES ✅
```

---

## 📊 Coverage Reports Explained

When you run `yarn test:coverage`, you see:

```
File               | % Stmts | % Branch | % Funcs | % Lines
---------------|---------|----------|---------|----------
colorUtils.ts  |     100 |      100 |     100 |     100
ProductCard.tsx|    93.1 |    68.42 |     100 |   96.29
```

### What Each Column Means:

#### % Stmts (Statements)
**What:** Percentage of code statements executed during tests
```typescript
function example() {
  const a = 1;        // ← Statement 1
  const b = 2;        // ← Statement 2
  return a + b;       // ← Statement 3
}
// If test runs this: 100% statements covered
```

#### % Branch (Branches)
**What:** Percentage of if/else paths tested
```typescript
function checkAge(age) {
  if (age >= 18) {     // ← Branch point
    return "adult";    // ← Branch A
  } else {
    return "minor";    // ← Branch B
  }
}
// Need tests for BOTH age >= 18 AND age < 18 to get 100%
```

#### % Funcs (Functions)
**What:** Percentage of functions called
```typescript
function add() { ... }      // ← Function 1
function subtract() { ... } // ← Function 2

// If only testing add(): 50% functions covered
// If testing both: 100% functions covered
```

#### % Lines (Lines)
**What:** Percentage of lines executed
Similar to statements but counts physical lines

---

## 🎯 Real-World Example: What Tests Catch

### Scenario: You Change the Code

**Original Code:**
```typescript
export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toFixed(2)}`;
}
```

**Your Change (Oops!):**
```typescript
export function formatPrice(cents: number): string {
  const dollars = cents / 10;  // ❌ Bug! Should be 100
  return `$${dollars.toFixed(2)}`;
}
```

**Test:**
```typescript
it('should format 1999 cents as $19.99', () => {
  expect(formatPrice(1999)).toBe('$19.99');
});
```

**Result:**
```
❌ FAIL  formatters.test.ts
  
  expect(received).toBe(expected)

  Expected: "$19.99"
  Received: "$199.90"  👈 CAUGHT THE BUG!
```

**Without tests:** This bug goes to production and breaks the app! 💥
**With tests:** Caught immediately, fixed in 30 seconds ✅

---

## 🔥 Interactive Challenge

Want to SEE tests in action? Try this:

### 1. Open Two Terminals

**Terminal 1:**
```bash
yarn test:watch
```
This runs tests automatically when you save files.

**Terminal 2:** 
Open VS Code and edit `src/utils/formatters.ts`

### 2. Break Something

Change line 3 to introduce a bug:
```typescript
return `$${dollars.toFixed(2)}`;  // Original
return `${dollars.toFixed(2)}`;   // Changed (removed $)
```

### 3. Watch Terminal 1

You'll see:
```
❌ FAIL  formatters.test.ts
  Expected: "$19.99"
  Received: "19.99"  👈 Missing $ sign!
```

### 4. Fix It

Put the $ back. Terminal 1 shows:
```
✅ PASS  formatters.test.ts
```

**That's unit testing in action!** 🎉

---

## 🎓 Summary: What Tests Do

1. **Verify Correctness**
   - Input X → Should produce Output Y
   - Tests check this automatically

2. **Prevent Regressions**
   - Code works today
   - You change something tomorrow
   - Tests ensure it still works

3. **Document Behavior**
   - Tests show how code should be used
   - Better than comments (they can't lie!)

4. **Enable Refactoring**
   - Want to rewrite a function?
   - Tests tell you if you broke anything

5. **Catch Bugs Early**
   - Bug found in dev: 5 minutes to fix
   - Bug found in production: Hours + user impact

---

## 🚀 Next Steps

1. **Run:** `./demo-testing.sh` for an interactive demo
2. **Open:** Coverage reports in your browser
3. **Practice:** Edit `src/utils/__tests__/formatters.test.ts`
4. **Experiment:** Break something and watch tests fail
5. **Build:** Write tests for your own code

**Remember:** Every test you write is like a safety net. The more nets you have, the safer you can code! 🎪
