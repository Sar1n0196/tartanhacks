/**
 * Property-Based Tests for Schema Validation
 * 
 * These tests validate universal properties that should hold for all valid inputs.
 * Using fast-check for property-based testing with 100 iterations per test.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ContextPackSchema } from './schemas';
import { contextPackArbitrary } from './test-utils';

describe('Schema Property-Based Tests', () => {
  /**
   * Property 4: Context Pack Schema Validation Round-Trip
   * 
   * **Validates: Requirements 2.9, 2.10, 14.6, 14.7**
   * 
   * For any valid Context Pack object, serializing to JSON then deserializing
   * should produce an object that matches the original schema and contains
   * equivalent data.
   * 
   * This property ensures that:
   * 1. All Context Packs can be serialized to JSON (Requirement 2.9)
   * 2. All Context Packs can be deserialized from JSON (Requirement 2.10)
   * 3. Serialization preserves all data (Requirement 14.6)
   * 4. Deserialization validates structure (Requirement 14.7)
   */
  it('Property 4: Context Pack serialization round-trip preserves data', () => {
    fc.assert(
      fc.property(contextPackArbitrary, (originalPack) => {
        // Step 1: Serialize to JSON
        const json = JSON.stringify(originalPack);
        
        // Step 2: Deserialize from JSON
        const parsed = JSON.parse(json);
        
        // Step 3: Validate against schema
        const validated = ContextPackSchema.parse(parsed);
        
        // Step 4: Verify equivalence
        // The validated object should be deeply equal to the original
        expect(validated).toEqual(originalPack);
        
        // Additional assertions to ensure data integrity
        
        // Verify all required fields are present
        expect(validated.id).toBe(originalPack.id);
        expect(validated.companyName).toBe(originalPack.companyName);
        expect(validated.companyUrl).toBe(originalPack.companyUrl);
        expect(validated.version).toBe(originalPack.version);
        expect(validated.createdAt).toBe(originalPack.createdAt);
        expect(validated.updatedAt).toBe(originalPack.updatedAt);
        
        // Verify nested structures are preserved
        expect(validated.vision).toEqual(originalPack.vision);
        expect(validated.mission).toEqual(originalPack.mission);
        expect(validated.values).toEqual(originalPack.values);
        expect(validated.icp).toEqual(originalPack.icp);
        expect(validated.businessModel).toEqual(originalPack.businessModel);
        expect(validated.product).toEqual(originalPack.product);
        expect(validated.decisionRules).toEqual(originalPack.decisionRules);
        expect(validated.engineeringKPIs).toEqual(originalPack.engineeringKPIs);
        expect(validated.summary).toBe(originalPack.summary);
        
        // Verify confidence scores remain in valid range (0-1)
        expect(validated.vision.confidence.value).toBeGreaterThanOrEqual(0);
        expect(validated.vision.confidence.value).toBeLessThanOrEqual(1);
        expect(validated.mission.confidence.value).toBeGreaterThanOrEqual(0);
        expect(validated.mission.confidence.value).toBeLessThanOrEqual(1);
        
        // Verify arrays maintain their length
        expect(validated.values.length).toBe(originalPack.values.length);
        expect(validated.icp.segments.length).toBe(originalPack.icp.segments.length);
        expect(validated.businessModel.revenueDrivers.length).toBe(originalPack.businessModel.revenueDrivers.length);
        expect(validated.engineeringKPIs.length).toBe(originalPack.engineeringKPIs.length);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional property test: Verify that serialization is idempotent
   * 
   * Serializing twice should produce the same JSON string.
   */
  it('Property 4 (extended): Context Pack serialization is idempotent', () => {
    fc.assert(
      fc.property(contextPackArbitrary, (pack) => {
        const json1 = JSON.stringify(pack);
        const parsed = JSON.parse(json1);
        const json2 = JSON.stringify(parsed);
        
        // Both serializations should produce identical JSON
        expect(json1).toBe(json2);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional property test: Verify that schema validation catches invalid data
   * 
   * If we corrupt the data, schema validation should fail.
   */
  it('Property 4 (extended): Schema validation rejects invalid confidence scores', () => {
    fc.assert(
      fc.property(contextPackArbitrary, (pack) => {
        // Corrupt the confidence score to be out of range
        const corruptedPack = JSON.parse(JSON.stringify(pack));
        corruptedPack.vision.confidence.value = 1.5; // Invalid: > 1
        
        // Schema validation should throw
        expect(() => ContextPackSchema.parse(corruptedPack)).toThrow();
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional property test: Verify that schema validation catches missing required fields
   */
  it('Property 4 (extended): Schema validation rejects missing required fields', () => {
    fc.assert(
      fc.property(contextPackArbitrary, (pack) => {
        // Remove a required field
        const incompletePack = JSON.parse(JSON.stringify(pack));
        delete incompletePack.id;
        
        // Schema validation should throw
        expect(() => ContextPackSchema.parse(incompletePack)).toThrow();
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
