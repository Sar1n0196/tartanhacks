/**
 * Example Test File
 * 
 * This file demonstrates the testing patterns used in this project:
 * 1. Unit tests for specific examples and edge cases
 * 2. Property-based tests for universal correctness properties
 * 
 * All property tests must include a comment linking to the design document property.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { z } from 'zod';

// Example schema for demonstration
const ExampleSchema = z.object({
  id: z.string(),
  value: z.number().min(0).max(1),
  tags: z.array(z.string()),
});

type Example = z.infer<typeof ExampleSchema>;

// Example function to test
function processExample(example: Example): Example {
  return {
    ...example,
    value: Math.min(1, Math.max(0, example.value)),
  };
}

describe('Example Test Suite', () => {
  describe('Unit Tests', () => {
    it('should process valid example', () => {
      const input: Example = {
        id: 'test-1',
        value: 0.5,
        tags: ['tag1', 'tag2'],
      };
      
      const result = processExample(input);
      
      expect(result.id).toBe('test-1');
      expect(result.value).toBe(0.5);
      expect(result.tags).toEqual(['tag1', 'tag2']);
    });

    it('should handle edge case: value at 0', () => {
      const input: Example = {
        id: 'test-2',
        value: 0,
        tags: [],
      };
      
      const result = processExample(input);
      expect(result.value).toBe(0);
    });

    it('should handle edge case: value at 1', () => {
      const input: Example = {
        id: 'test-3',
        value: 1,
        tags: ['tag'],
      };
      
      const result = processExample(input);
      expect(result.value).toBe(1);
    });

    it('should handle empty tags array', () => {
      const input: Example = {
        id: 'test-4',
        value: 0.7,
        tags: [],
      };
      
      const result = processExample(input);
      expect(result.tags).toEqual([]);
    });
  });

  describe('Property-Based Tests', () => {
    // Custom arbitrary generator for Example type
    // Note: Using double with noNaN to avoid NaN edge cases
    const exampleArbitrary = fc.record({
      id: fc.string(),
      value: fc.double({ min: 0, max: 1, noNaN: true }),
      tags: fc.array(fc.string()),
    });

    // Example Property 1: Value bounds are preserved
    it('should always keep value between 0 and 1', () => {
      fc.assert(
        fc.property(exampleArbitrary, (example) => {
          const result = processExample(example);
          return result.value >= 0 && result.value <= 1;
        }),
        { numRuns: 100 }
      );
    });

    // Example Property 2: ID is preserved
    it('should preserve the ID field', () => {
      fc.assert(
        fc.property(exampleArbitrary, (example) => {
          const result = processExample(example);
          return result.id === example.id;
        }),
        { numRuns: 100 }
      );
    });

    // Example Property 3: Tags are preserved
    it('should preserve the tags array', () => {
      fc.assert(
        fc.property(exampleArbitrary, (example) => {
          const result = processExample(example);
          return JSON.stringify(result.tags) === JSON.stringify(example.tags);
        }),
        { numRuns: 100 }
      );
    });

    // Example Property 4: Schema validation round-trip
    it('should maintain schema validity after processing', () => {
      fc.assert(
        fc.property(exampleArbitrary, (example) => {
          const result = processExample(example);
          // Should not throw
          ExampleSchema.parse(result);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    // Example Property 5: Serialization round-trip
    it('should preserve data through JSON serialization', () => {
      fc.assert(
        fc.property(exampleArbitrary, (example) => {
          const json = JSON.stringify(example);
          const parsed = JSON.parse(json);
          const validated = ExampleSchema.parse(parsed);
          
          return (
            validated.id === example.id &&
            validated.value === example.value &&
            JSON.stringify(validated.tags) === JSON.stringify(example.tags)
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Async Property-Based Tests', () => {
    // Example async function
    async function asyncProcessExample(example: Example): Promise<Example> {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 0));
      return processExample(example);
    }

    const exampleArbitrary = fc.record({
      id: fc.string(),
      value: fc.double({ min: 0, max: 1, noNaN: true }),
      tags: fc.array(fc.string()),
    });

    it('should handle async processing correctly', async () => {
      await fc.assert(
        fc.asyncProperty(exampleArbitrary, async (example) => {
          const result = await asyncProcessExample(example);
          return result.value >= 0 && result.value <= 1;
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Error Handling Tests', () => {
    it('should throw on invalid schema', () => {
      const invalid = {
        id: 'test',
        value: 2, // Out of bounds
        tags: ['tag'],
      };
      
      expect(() => ExampleSchema.parse(invalid)).toThrow();
    });

    it('should throw on missing required fields', () => {
      const invalid = {
        id: 'test',
        // missing value
        tags: ['tag'],
      };
      
      expect(() => ExampleSchema.parse(invalid)).toThrow();
    });
  });
});

describe('Custom Arbitrary Generators', () => {
  it('demonstrates creating custom generators', () => {
    // Generator for confidence scores (0-1)
    const confidenceArbitrary = fc.double({ min: 0, max: 1, noNaN: true });

    // Generator for URLs
    const urlArbitrary = fc.webUrl();

    // Generator for non-empty strings
    const nonEmptyStringArbitrary = fc.string({ minLength: 1 });

    // Generator for arrays with specific length
    const fixedArrayArbitrary = fc.array(fc.integer(), { minLength: 3, maxLength: 3 });

    // Generator for objects with optional fields
    const optionalFieldArbitrary = fc.record({
      required: fc.string(),
      optional: fc.option(fc.string()),
    });

    // Test that generators work
    fc.assert(
      fc.property(
        confidenceArbitrary,
        urlArbitrary,
        nonEmptyStringArbitrary,
        fixedArrayArbitrary,
        optionalFieldArbitrary,
        (confidence, url, str, arr, obj) => {
          return (
            confidence >= 0 &&
            confidence <= 1 &&
            !isNaN(confidence) &&
            url.startsWith('http') &&
            str.length > 0 &&
            arr.length === 3 &&
            typeof obj.required === 'string'
          );
        }
      ),
      { numRuns: 50 }
    );
  });
});
