/**
 * Test Utilities
 * 
 * Common utilities and generators for testing throughout the project.
 */

import * as fc from 'fast-check';

/**
 * Arbitrary generators for common types used in the application
 */

// Confidence score generator (0-1, no NaN)
export const confidenceScoreArbitrary = fc.double({ 
  min: 0, 
  max: 1, 
  noNaN: true 
});

// Non-empty string generator
export const nonEmptyStringArbitrary = fc.string({ minLength: 1 });

// URL generator
export const urlArbitrary = fc.webUrl();

// Citation type generator
export const citationTypeArbitrary = fc.constantFrom('url', 'interview', 'section');

// Question category generator
export const questionCategoryArbitrary = fc.constantFrom(
  'vision',
  'icp',
  'business-model',
  'engineering-kpis',
  'decision-rules'
);

// ISO date string generator - generates valid ISO date strings
export const isoDateArbitrary = fc.integer({ min: 946684800000, max: 1924905600000 })
  .map(timestamp => new Date(timestamp).toISOString());

// UUID-like string generator
export const uuidArbitrary = fc.uuid();

// Version generator
export const versionArbitrary = fc.constantFrom('v0', 'v1');

/**
 * Complex arbitrary generators for data structures
 */

// Citation arbitrary
export const citationArbitrary = fc.record({
  type: citationTypeArbitrary,
  reference: fc.oneof(urlArbitrary, nonEmptyStringArbitrary),
  text: fc.option(nonEmptyStringArbitrary, { nil: undefined }),
});

// Confidence score arbitrary
export const confidenceScoreObjectArbitrary = fc.record({
  value: confidenceScoreArbitrary,
  reason: fc.option(nonEmptyStringArbitrary, { nil: undefined }),
});

// Context field arbitrary
export const contextFieldArbitrary = fc.record({
  content: nonEmptyStringArbitrary,
  confidence: confidenceScoreObjectArbitrary,
  citations: fc.array(citationArbitrary, { minLength: 0, maxLength: 3 }),
});

// ICP segment arbitrary
export const icpSegmentArbitrary = fc.record({
  name: nonEmptyStringArbitrary,
  description: contextFieldArbitrary,
  painPoints: fc.array(contextFieldArbitrary, { minLength: 0, maxLength: 3 }),
});

// Context Pack arbitrary - generates valid Context Pack objects
export const contextPackArbitrary = fc.record({
  id: uuidArbitrary,
  companyName: nonEmptyStringArbitrary,
  companyUrl: urlArbitrary,
  version: versionArbitrary,
  createdAt: isoDateArbitrary,
  updatedAt: isoDateArbitrary,
  vision: contextFieldArbitrary,
  mission: contextFieldArbitrary,
  values: fc.array(contextFieldArbitrary, { minLength: 0, maxLength: 5 }),
  icp: fc.record({
    segments: fc.array(icpSegmentArbitrary, { minLength: 0, maxLength: 3 }),
    evolution: contextFieldArbitrary,
  }),
  businessModel: fc.record({
    revenueDrivers: fc.array(contextFieldArbitrary, { minLength: 0, maxLength: 5 }),
    pricingModel: contextFieldArbitrary,
    keyMetrics: fc.array(contextFieldArbitrary, { minLength: 0, maxLength: 5 }),
  }),
  product: fc.record({
    jobsToBeDone: fc.array(contextFieldArbitrary, { minLength: 0, maxLength: 5 }),
    keyFeatures: fc.array(contextFieldArbitrary, { minLength: 0, maxLength: 5 }),
  }),
  decisionRules: fc.record({
    priorities: fc.array(contextFieldArbitrary, { minLength: 0, maxLength: 5 }),
    antiPatterns: fc.array(contextFieldArbitrary, { minLength: 0, maxLength: 5 }),
  }),
  engineeringKPIs: fc.array(contextFieldArbitrary, { minLength: 0, maxLength: 5 }),
  summary: nonEmptyStringArbitrary,
});

/**
 * Helper functions for testing
 */

// Wait for a promise to resolve or reject
export async function waitFor<T>(
  fn: () => T | Promise<T>,
  options: { timeout?: number; interval?: number } = {}
): Promise<T> {
  const { timeout = 5000, interval = 50 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const result = await fn();
      if (result) {
        return result;
      }
    } catch (error) {
      // Continue waiting
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`waitFor timed out after ${timeout}ms`);
}

// Create a mock function that tracks calls
export function createMockFn<T extends (...args: any[]) => any>() {
  const calls: Parameters<T>[] = [];
  const mockFn = ((...args: Parameters<T>) => {
    calls.push(args);
  }) as T & { calls: Parameters<T>[] };
  mockFn.calls = calls;
  return mockFn;
}

// Deep clone an object (useful for test data)
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Check if two objects are deeply equal
export function deepEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Test data factories
 */

// Create a minimal valid citation
export function createTestCitation(overrides?: Partial<any>) {
  return {
    type: 'url' as const,
    reference: 'https://example.com',
    text: 'Example citation',
    ...overrides,
  };
}

// Create a minimal valid confidence score
export function createTestConfidenceScore(overrides?: Partial<any>) {
  return {
    value: 0.8,
    reason: 'Test confidence',
    ...overrides,
  };
}

// Create a minimal valid context field
export function createTestContextField(overrides?: Partial<any>) {
  return {
    content: 'Test content',
    confidence: createTestConfidenceScore(),
    citations: [createTestCitation()],
    ...overrides,
  };
}

/**
 * Assertion helpers
 */

// Assert that a value is within a range
export function assertInRange(value: number, min: number, max: number) {
  if (value < min || value > max) {
    throw new Error(`Expected ${value} to be between ${min} and ${max}`);
  }
}

// Assert that an array is not empty
export function assertNotEmpty<T>(arr: T[]): asserts arr is [T, ...T[]] {
  if (arr.length === 0) {
    throw new Error('Expected array to not be empty');
  }
}

// Assert that a value is defined
export function assertDefined<T>(value: T | undefined | null): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error('Expected value to be defined');
  }
}
