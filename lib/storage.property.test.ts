/**
 * Property-Based Tests for Storage Persistence
 * 
 * These tests validate universal properties that should hold for all valid inputs.
 * Using fast-check for property-based testing with 100 iterations per test.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { Storage } from './storage';
import { contextPackArbitrary } from './test-utils';
import { promises as fs } from 'fs';
import path from 'path';

// Test data directory for property tests
const PROPERTY_TEST_DATA_DIR = path.join(process.cwd(), 'data', 'property-test-context-packs');

describe('Storage Property-Based Tests', () => {
  let storage: Storage;

  beforeEach(async () => {
    // Create a fresh test storage instance
    storage = new Storage({ dataDir: PROPERTY_TEST_DATA_DIR });
    
    // Clean up test directory if it exists
    try {
      await fs.rm(PROPERTY_TEST_DATA_DIR, { recursive: true, force: true });
    } catch {
      // Ignore if directory doesn't exist
    }
  });

  afterEach(async () => {
    // Clean up test directory after each test
    try {
      await fs.rm(PROPERTY_TEST_DATA_DIR, { recursive: true, force: true });
    } catch {
      // Ignore if directory doesn't exist
    }
  });

  /**
   * Property 26: Storage Persistence Round-Trip
   * 
   * **Validates: Requirements 14.2, 14.3**
   * 
   * For any Context Pack that is saved to storage, retrieving it by ID should
   * return an equivalent Context Pack object.
   * 
   * This property ensures that:
   * 1. All Context Packs can be persisted to storage (Requirement 14.2)
   * 2. All Context Packs can be retrieved from storage (Requirement 14.3)
   * 3. Storage preserves all data without corruption
   * 4. The round-trip operation is lossless
   * 
   * The test performs the following operations:
   * - Generate a random valid Context Pack
   * - Save it to storage
   * - Retrieve it by ID
   * - Verify the retrieved pack is equivalent to the original
   */
  it('Property 26: Storage persistence round-trip produces equivalent Context Pack', async () => {
    await fc.assert(
      fc.asyncProperty(contextPackArbitrary, async (originalPack) => {
        // Step 1: Save the Context Pack to storage
        await storage.saveContextPack(originalPack);
        
        // Step 2: Retrieve the Context Pack from storage
        const retrievedPack = await storage.getContextPack(originalPack.id);
        
        // Step 3: Verify the pack was retrieved successfully
        expect(retrievedPack).not.toBeNull();
        
        // Step 4: Verify complete equivalence
        expect(retrievedPack).toEqual(originalPack);
        
        // Additional assertions to ensure data integrity
        
        // Verify all top-level fields are preserved
        expect(retrievedPack!.id).toBe(originalPack.id);
        expect(retrievedPack!.companyName).toBe(originalPack.companyName);
        expect(retrievedPack!.companyUrl).toBe(originalPack.companyUrl);
        expect(retrievedPack!.version).toBe(originalPack.version);
        expect(retrievedPack!.createdAt).toBe(originalPack.createdAt);
        expect(retrievedPack!.updatedAt).toBe(originalPack.updatedAt);
        expect(retrievedPack!.summary).toBe(originalPack.summary);
        
        // Verify nested structures are preserved
        expect(retrievedPack!.vision).toEqual(originalPack.vision);
        expect(retrievedPack!.mission).toEqual(originalPack.mission);
        expect(retrievedPack!.values).toEqual(originalPack.values);
        expect(retrievedPack!.icp).toEqual(originalPack.icp);
        expect(retrievedPack!.businessModel).toEqual(originalPack.businessModel);
        expect(retrievedPack!.product).toEqual(originalPack.product);
        expect(retrievedPack!.decisionRules).toEqual(originalPack.decisionRules);
        expect(retrievedPack!.engineeringKPIs).toEqual(originalPack.engineeringKPIs);
        
        // Verify confidence scores remain in valid range (0-1)
        expect(retrievedPack!.vision.confidence.value).toBeGreaterThanOrEqual(0);
        expect(retrievedPack!.vision.confidence.value).toBeLessThanOrEqual(1);
        expect(retrievedPack!.mission.confidence.value).toBeGreaterThanOrEqual(0);
        expect(retrievedPack!.mission.confidence.value).toBeLessThanOrEqual(1);
        
        // Verify arrays maintain their length
        expect(retrievedPack!.values.length).toBe(originalPack.values.length);
        expect(retrievedPack!.icp.segments.length).toBe(originalPack.icp.segments.length);
        expect(retrievedPack!.businessModel.revenueDrivers.length).toBe(originalPack.businessModel.revenueDrivers.length);
        expect(retrievedPack!.businessModel.keyMetrics.length).toBe(originalPack.businessModel.keyMetrics.length);
        expect(retrievedPack!.product.jobsToBeDone.length).toBe(originalPack.product.jobsToBeDone.length);
        expect(retrievedPack!.product.keyFeatures.length).toBe(originalPack.product.keyFeatures.length);
        expect(retrievedPack!.decisionRules.priorities.length).toBe(originalPack.decisionRules.priorities.length);
        expect(retrievedPack!.decisionRules.antiPatterns.length).toBe(originalPack.decisionRules.antiPatterns.length);
        expect(retrievedPack!.engineeringKPIs.length).toBe(originalPack.engineeringKPIs.length);
        
        // Verify citations are preserved
        expect(retrievedPack!.vision.citations.length).toBe(originalPack.vision.citations.length);
        if (originalPack.vision.citations.length > 0) {
          expect(retrievedPack!.vision.citations[0]).toEqual(originalPack.vision.citations[0]);
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test: Verify that multiple save operations are idempotent
   * 
   * Saving the same Context Pack multiple times should not corrupt the data.
   */
  it('Property 26 (extended): Multiple saves are idempotent', async () => {
    await fc.assert(
      fc.asyncProperty(contextPackArbitrary, async (pack) => {
        // Save the pack multiple times
        await storage.saveContextPack(pack);
        await storage.saveContextPack(pack);
        await storage.saveContextPack(pack);
        
        // Retrieve it
        const retrieved = await storage.getContextPack(pack.id);
        
        // Should still be equivalent to the original
        expect(retrieved).toEqual(pack);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test: Verify that storage handles updates correctly
   * 
   * Saving a modified version of a Context Pack should overwrite the previous version.
   */
  it('Property 26 (extended): Storage handles updates correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        contextPackArbitrary,
        fc.string({ minLength: 1 }),
        async (originalPack, newCompanyName) => {
          // Save the original pack
          await storage.saveContextPack(originalPack);
          
          // Create an updated version
          const updatedPack = { ...originalPack, companyName: newCompanyName };
          
          // Save the updated version
          await storage.saveContextPack(updatedPack);
          
          // Retrieve it
          const retrieved = await storage.getContextPack(originalPack.id);
          
          // Should match the updated version, not the original
          expect(retrieved).toEqual(updatedPack);
          expect(retrieved!.companyName).toBe(newCompanyName);
          expect(retrieved!.companyName).not.toBe(originalPack.companyName);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test: Verify that storage isolates different Context Packs
   * 
   * Saving multiple Context Packs should not cause interference between them.
   */
  it('Property 26 (extended): Storage isolates different Context Packs', async () => {
    await fc.assert(
      fc.asyncProperty(
        contextPackArbitrary,
        contextPackArbitrary,
        async (pack1, pack2) => {
          // Ensure packs have different IDs
          fc.pre(pack1.id !== pack2.id);
          
          // Save both packs
          await storage.saveContextPack(pack1);
          await storage.saveContextPack(pack2);
          
          // Retrieve both packs
          const retrieved1 = await storage.getContextPack(pack1.id);
          const retrieved2 = await storage.getContextPack(pack2.id);
          
          // Each should match its original
          expect(retrieved1).toEqual(pack1);
          expect(retrieved2).toEqual(pack2);
          
          // They should not be equal to each other
          expect(retrieved1).not.toEqual(retrieved2);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test: Verify that deletion works correctly
   * 
   * After deleting a Context Pack, it should no longer be retrievable.
   */
  it('Property 26 (extended): Deletion removes Context Pack from storage', async () => {
    await fc.assert(
      fc.asyncProperty(contextPackArbitrary, async (pack) => {
        // Save the pack
        await storage.saveContextPack(pack);
        
        // Verify it exists
        const beforeDelete = await storage.getContextPack(pack.id);
        expect(beforeDelete).not.toBeNull();
        
        // Delete it
        await storage.deleteContextPack(pack.id);
        
        // Verify it no longer exists
        const afterDelete = await storage.getContextPack(pack.id);
        expect(afterDelete).toBeNull();
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test: Verify that file system representation is valid JSON
   * 
   * The saved file should be valid JSON that can be parsed independently.
   */
  it('Property 26 (extended): Saved files are valid JSON', async () => {
    await fc.assert(
      fc.asyncProperty(contextPackArbitrary, async (pack) => {
        // Save the pack
        await storage.saveContextPack(pack);
        
        // Read the file directly from the file system
        const filePath = path.join(PROPERTY_TEST_DATA_DIR, `${pack.id}.json`);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        
        // Should be valid JSON
        let parsed;
        expect(() => {
          parsed = JSON.parse(fileContent);
        }).not.toThrow();
        
        // Parsed content should match the original pack
        expect(parsed).toEqual(pack);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
