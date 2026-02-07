import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  confidenceScoreArbitrary,
  nonEmptyStringArbitrary,
  urlArbitrary,
  citationTypeArbitrary,
  questionCategoryArbitrary,
  isoDateArbitrary,
  uuidArbitrary,
  waitFor,
  createMockFn,
  deepClone,
  deepEqual,
  createTestCitation,
  createTestConfidenceScore,
  createTestContextField,
  assertInRange,
  assertNotEmpty,
  assertDefined,
} from './test-utils';

describe('Test Utilities', () => {
  describe('Arbitrary Generators', () => {
    it('confidenceScoreArbitrary generates valid scores', () => {
      fc.assert(
        fc.property(confidenceScoreArbitrary, (score) => {
          return score >= 0 && score <= 1 && !isNaN(score);
        }),
        { numRuns: 100 }
      );
    });

    it('nonEmptyStringArbitrary generates non-empty strings', () => {
      fc.assert(
        fc.property(nonEmptyStringArbitrary, (str) => {
          return str.length > 0;
        }),
        { numRuns: 100 }
      );
    });

    it('urlArbitrary generates valid URLs', () => {
      fc.assert(
        fc.property(urlArbitrary, (url) => {
          return url.startsWith('http://') || url.startsWith('https://');
        }),
        { numRuns: 100 }
      );
    });

    it('citationTypeArbitrary generates valid citation types', () => {
      fc.assert(
        fc.property(citationTypeArbitrary, (type) => {
          return ['url', 'interview', 'section'].includes(type);
        }),
        { numRuns: 100 }
      );
    });

    it('questionCategoryArbitrary generates valid categories', () => {
      fc.assert(
        fc.property(questionCategoryArbitrary, (category) => {
          return ['vision', 'icp', 'business-model', 'engineering-kpis', 'decision-rules'].includes(category);
        }),
        { numRuns: 100 }
      );
    });

    it('isoDateArbitrary generates valid ISO date strings', () => {
      fc.assert(
        fc.property(isoDateArbitrary, (dateStr) => {
          const date = new Date(dateStr);
          return !isNaN(date.getTime());
        }),
        { numRuns: 100 }
      );
    });

    it('uuidArbitrary generates valid UUID format', () => {
      fc.assert(
        fc.property(uuidArbitrary, (uuid) => {
          // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          return uuidRegex.test(uuid);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Helper Functions', () => {
    it('waitFor resolves when condition is met', async () => {
      let counter = 0;
      const result = await waitFor(() => {
        counter++;
        return counter >= 3 ? 'success' : null;
      }, { timeout: 1000, interval: 10 });

      expect(result).toBe('success');
      expect(counter).toBeGreaterThanOrEqual(3);
    });

    it('waitFor throws on timeout', async () => {
      await expect(
        waitFor(() => null, { timeout: 100, interval: 10 })
      ).rejects.toThrow('waitFor timed out');
    });

    it('createMockFn tracks calls', () => {
      const mockFn = createMockFn<(a: number, b: string) => void>();
      
      mockFn(1, 'hello');
      mockFn(2, 'world');

      expect(mockFn.calls).toHaveLength(2);
      expect(mockFn.calls[0]).toEqual([1, 'hello']);
      expect(mockFn.calls[1]).toEqual([2, 'world']);
    });

    it('deepClone creates independent copy', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);

      cloned.b.c = 3;

      expect(original.b.c).toBe(2);
      expect(cloned.b.c).toBe(3);
    });

    it('deepEqual compares objects correctly', () => {
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { a: 1, b: { c: 2 } };
      const obj3 = { a: 1, b: { c: 3 } };

      expect(deepEqual(obj1, obj2)).toBe(true);
      expect(deepEqual(obj1, obj3)).toBe(false);
    });
  });

  describe('Test Data Factories', () => {
    it('createTestCitation creates valid citation', () => {
      const citation = createTestCitation();

      expect(citation.type).toBe('url');
      expect(citation.reference).toBe('https://example.com');
      expect(citation.text).toBe('Example citation');
    });

    it('createTestCitation accepts overrides', () => {
      const citation = createTestCitation({
        type: 'interview',
        reference: 'custom-ref',
      });

      expect(citation.type).toBe('interview');
      expect(citation.reference).toBe('custom-ref');
      expect(citation.text).toBe('Example citation');
    });

    it('createTestConfidenceScore creates valid score', () => {
      const score = createTestConfidenceScore();

      expect(score.value).toBe(0.8);
      expect(score.reason).toBe('Test confidence');
    });

    it('createTestContextField creates valid field', () => {
      const field = createTestContextField();

      expect(field.content).toBe('Test content');
      expect(field.confidence.value).toBe(0.8);
      expect(field.citations).toHaveLength(1);
    });
  });

  describe('Assertion Helpers', () => {
    it('assertInRange passes for valid values', () => {
      expect(() => assertInRange(5, 0, 10)).not.toThrow();
      expect(() => assertInRange(0, 0, 10)).not.toThrow();
      expect(() => assertInRange(10, 0, 10)).not.toThrow();
    });

    it('assertInRange throws for invalid values', () => {
      expect(() => assertInRange(-1, 0, 10)).toThrow();
      expect(() => assertInRange(11, 0, 10)).toThrow();
    });

    it('assertNotEmpty passes for non-empty arrays', () => {
      expect(() => assertNotEmpty([1, 2, 3])).not.toThrow();
    });

    it('assertNotEmpty throws for empty arrays', () => {
      expect(() => assertNotEmpty([])).toThrow();
    });

    it('assertDefined passes for defined values', () => {
      expect(() => assertDefined(0)).not.toThrow();
      expect(() => assertDefined('')).not.toThrow();
      expect(() => assertDefined(false)).not.toThrow();
    });

    it('assertDefined throws for undefined/null', () => {
      expect(() => assertDefined(undefined)).toThrow();
      expect(() => assertDefined(null)).toThrow();
    });
  });
});
