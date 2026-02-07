import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import * as fc from 'fast-check';

describe('Testing Setup Verification', () => {
  it('should run basic unit tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should support Zod validation', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const valid = { name: 'John', age: 30 };
    expect(() => schema.parse(valid)).not.toThrow();

    const invalid = { name: 'John', age: 'thirty' };
    expect(() => schema.parse(invalid)).toThrow();
  });

  it('should support property-based testing with fast-check', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        // Commutative property of addition
        return a + b === b + a;
      }),
      { numRuns: 100 }
    );
  });

  it('should support async property-based testing', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async (str) => {
        // String length is always non-negative
        return str.length >= 0;
      }),
      { numRuns: 50 }
    );
  });
});
