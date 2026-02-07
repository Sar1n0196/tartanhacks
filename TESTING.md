# Testing Guide

This project uses **Vitest** for unit and property-based testing, with **fast-check** for property-based tests and **@testing-library/react** for component testing.

## Running Tests

```bash
# Run tests in watch mode (interactive)
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

### Unit Tests
Unit tests verify specific examples and edge cases:

```typescript
import { describe, it, expect } from 'vitest';

describe('MyFunction', () => {
  it('should handle empty input', () => {
    expect(myFunction('')).toBe('');
  });

  it('should handle normal input', () => {
    expect(myFunction('hello')).toBe('HELLO');
  });
});
```

### Property-Based Tests
Property-based tests verify universal properties across many random inputs:

```typescript
import { describe, it } from 'vitest';
import * as fc from 'fast-check';

describe('MyFunction Properties', () => {
  it('should always return uppercase', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = myFunction(input);
        return result === result.toUpperCase();
      }),
      { numRuns: 100 }
    );
  });
});
```

## Property Test Format

All property-based tests MUST include a comment linking to the design document:

```typescript
// Feature: onboarding-intelligence-agent, Property 4: Context Pack Schema Validation Round-Trip
it('Context Pack serialization round-trip preserves data', () => {
  fc.assert(
    fc.property(contextPackArbitrary, (pack) => {
      const json = JSON.stringify(pack);
      const parsed = JSON.parse(json);
      const validated = ContextPackSchema.parse(parsed);
      expect(validated).toEqual(pack);
    }),
    { numRuns: 100 }
  );
});
```

## Test Configuration

- **Environment**: jsdom (for DOM testing)
- **Globals**: Enabled (no need to import `describe`, `it`, `expect`)
- **Setup File**: `vitest.setup.ts` (runs before each test file)
- **Coverage**: v8 provider with text, JSON, and HTML reports

## Test File Naming

- Unit tests: `*.test.ts` or `*.test.tsx`
- Property tests: Can be in the same file or separate `*.property.test.ts`
- Place tests next to the code they test: `lib/scraper.ts` → `lib/scraper.test.ts`

## Dependencies

- **vitest**: Test runner and assertion library
- **fast-check**: Property-based testing library
- **@testing-library/react**: React component testing utilities
- **@testing-library/dom**: DOM testing utilities
- **jsdom**: DOM implementation for Node.js
- **@vitejs/plugin-react**: Vite plugin for React support

## Writing Good Tests

### Unit Tests
- Test specific examples that demonstrate correct behavior
- Test edge cases (empty, null, boundary values)
- Test error conditions
- Use descriptive test names

### Property-Based Tests
- Define universal properties that should always hold
- Use appropriate generators (arbitraries) for input data
- Run at least 100 iterations for thorough coverage
- Keep properties simple and focused

## Example Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { myFunction } from './myFunction';

describe('myFunction', () => {
  // Unit tests
  describe('Unit Tests', () => {
    it('should handle empty string', () => {
      expect(myFunction('')).toBe('');
    });

    it('should handle normal input', () => {
      expect(myFunction('hello')).toBe('HELLO');
    });
  });

  // Property-based tests
  describe('Property Tests', () => {
    // Feature: onboarding-intelligence-agent, Property X: Description
    it('should always return uppercase', () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          const result = myFunction(input);
          return result === result.toUpperCase();
        }),
        { numRuns: 100 }
      );
    });
  });
});
```

## Troubleshooting

### Tests not running
- Check that test files match the pattern `**/*.{test,spec}.{ts,tsx}`
- Ensure `vitest.config.ts` is in the project root

### Import errors
- Check path aliases in `vitest.config.ts`
- Ensure dependencies are installed: `npm install`

### DOM not available
- Verify `environment: 'jsdom'` is set in `vitest.config.ts`
- Check that `jsdom` is installed

### Property tests failing
- Increase `numRuns` to find edge cases
- Add `.verbose()` to see failing examples: `fc.assert(...).verbose()`
- Use `fc.sample()` to preview generated values
