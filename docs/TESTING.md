# Unit Testing Setup Guide

This project now has automated unit testing configured for both frontend and backend!

## Frontend Tests (Jest + React Testing Library)

### Running Tests
```bash
# Run all tests once
yarn test

# Run tests in watch mode (re-runs on file changes)
yarn test:watch

# Run tests with coverage report
yarn test:coverage
```

### Test Files Location
- Tests are located next to the files they test in `__tests__` folders
- Example: `src/utils/__tests__/colorUtils.test.ts`
- Example: `src/components/__tests__/ProductCard.test.tsx`

### Writing Frontend Tests
```typescript
import { render, screen } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Backend Tests (Pytest)

### Running Tests
```bash
# Run all Python tests
yarn test:python

# Run with coverage report
yarn test:python:coverage

# Or run directly from backend folder
cd src/app/api/backend
pytest -v
pytest --cov=. --cov-report=html
```

### Test Files Location
- Tests are in `src/app/api/backend/test_*.py`
- `test_app.py` - Tests for GraphQL API endpoints
- `test_models.py` - Tests for database models
- `test_backend.py` - Tests for recommendation engine

### Writing Backend Tests
```python
import pytest

class TestMyFunction:
    def test_something(self):
        result = my_function(input)
        assert result == expected_value
```

## Run All Tests
```bash
# Run both frontend and backend tests
yarn test:all
```

## What Are Unit Tests?

Unit tests are automated tests that verify individual pieces of code work correctly:
- **Fast**: Run in seconds
- **Reliable**: Same input = same output
- **Documentation**: Show how code should be used
- **Safety Net**: Catch bugs before deployment

## Best Practices

1. **Write tests as you code** - Test new features immediately
2. **Test edge cases** - Empty inputs, null values, boundary conditions
3. **Keep tests simple** - One concept per test
4. **Use descriptive names** - `test_user_login_with_invalid_password`
5. **Run tests before committing** - Ensure nothing broke

## Continuous Integration

Add these to your CI/CD pipeline:
```bash
yarn test:coverage  # Ensure code coverage stays high
yarn test:python:coverage
```

## Coverage Reports

After running coverage commands, view HTML reports:
- Frontend: Open `coverage/lcov-report/index.html`
- Backend: Open `src/app/api/backend/htmlcov/index.html`

## Next Steps

1. Run `yarn test` to see your first tests pass!
2. Try breaking a test to see what failure looks like
3. Write tests for new features before implementing them (TDD)
4. Aim for >80% code coverage on critical paths
