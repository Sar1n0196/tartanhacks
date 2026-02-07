import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Storage } from './storage';
import { ContextPack } from './types';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

/**
 * Unit tests for Storage class
 * Tests Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7
 */

// Test data directory
const TEST_DATA_DIR = path.join(process.cwd(), 'data', 'test-context-packs');

// Helper function to create a valid test Context Pack
function createTestContextPack(overrides?: Partial<ContextPack>): ContextPack {
  const id = randomUUID();
  return {
    id,
    companyName: 'Test Company',
    companyUrl: 'https://example.com',
    version: 'v0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    vision: {
      content: 'Test vision',
      confidence: { value: 0.8 },
      citations: [{ type: 'url', reference: 'https://example.com' }],
    },
    mission: {
      content: 'Test mission',
      confidence: { value: 0.8 },
      citations: [{ type: 'url', reference: 'https://example.com' }],
    },
    values: [
      {
        content: 'Test value',
        confidence: { value: 0.8 },
        citations: [{ type: 'url', reference: 'https://example.com' }],
      },
    ],
    icp: {
      segments: [
        {
          name: 'Test Segment',
          description: {
            content: 'Test description',
            confidence: { value: 0.8 },
            citations: [{ type: 'url', reference: 'https://example.com' }],
          },
          painPoints: [
            {
              content: 'Test pain point',
              confidence: { value: 0.8 },
              citations: [{ type: 'url', reference: 'https://example.com' }],
            },
          ],
        },
      ],
      evolution: {
        content: 'Test evolution',
        confidence: { value: 0.8 },
        citations: [{ type: 'url', reference: 'https://example.com' }],
      },
    },
    businessModel: {
      revenueDrivers: [
        {
          content: 'Test revenue driver',
          confidence: { value: 0.8 },
          citations: [{ type: 'url', reference: 'https://example.com' }],
        },
      ],
      pricingModel: {
        content: 'Test pricing model',
        confidence: { value: 0.8 },
        citations: [{ type: 'url', reference: 'https://example.com' }],
      },
      keyMetrics: [
        {
          content: 'Test metric',
          confidence: { value: 0.8 },
          citations: [{ type: 'url', reference: 'https://example.com' }],
        },
      ],
    },
    product: {
      jobsToBeDone: [
        {
          content: 'Test job',
          confidence: { value: 0.8 },
          citations: [{ type: 'url', reference: 'https://example.com' }],
        },
      ],
      keyFeatures: [
        {
          content: 'Test feature',
          confidence: { value: 0.8 },
          citations: [{ type: 'url', reference: 'https://example.com' }],
        },
      ],
    },
    decisionRules: {
      priorities: [
        {
          content: 'Test priority',
          confidence: { value: 0.8 },
          citations: [{ type: 'url', reference: 'https://example.com' }],
        },
      ],
      antiPatterns: [
        {
          content: 'Test anti-pattern',
          confidence: { value: 0.8 },
          citations: [{ type: 'url', reference: 'https://example.com' }],
        },
      ],
    },
    engineeringKPIs: [
      {
        content: 'Test KPI',
        confidence: { value: 0.8 },
        citations: [{ type: 'url', reference: 'https://example.com' }],
      },
    ],
    summary: 'Test summary',
    ...overrides,
  };
}

describe('Storage', () => {
  let storage: Storage;

  beforeEach(async () => {
    // Create a fresh test storage instance
    storage = new Storage({ dataDir: TEST_DATA_DIR });
    
    // Clean up test directory if it exists
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch {
      // Ignore if directory doesn't exist
    }
  });

  afterEach(async () => {
    // Clean up test directory after each test
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch {
      // Ignore if directory doesn't exist
    }
  });

  describe('saveContextPack', () => {
    it('should save a valid Context Pack to storage', async () => {
      const pack = createTestContextPack();
      
      await storage.saveContextPack(pack);
      
      // Verify file was created
      const filePath = path.join(TEST_DATA_DIR, `${pack.id}.json`);
      const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
      
      // Verify file content
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(fileContent);
      expect(parsed).toEqual(pack);
    });

    it('should create data directory if it does not exist', async () => {
      const pack = createTestContextPack();
      
      // Directory should not exist yet
      const dirExists = await fs.access(TEST_DATA_DIR).then(() => true).catch(() => false);
      expect(dirExists).toBe(false);
      
      await storage.saveContextPack(pack);
      
      // Directory should now exist
      const dirExistsAfter = await fs.access(TEST_DATA_DIR).then(() => true).catch(() => false);
      expect(dirExistsAfter).toBe(true);
    });

    it('should overwrite existing Context Pack with same ID', async () => {
      const pack = createTestContextPack();
      
      await storage.saveContextPack(pack);
      
      // Modify and save again
      const updatedPack = { ...pack, companyName: 'Updated Company' };
      await storage.saveContextPack(updatedPack);
      
      // Verify updated content
      const retrieved = await storage.getContextPack(pack.id);
      expect(retrieved?.companyName).toBe('Updated Company');
    });

    it('should throw error for invalid Context Pack (missing required fields)', async () => {
      const invalidPack = {
        id: 'test-id',
        // Missing required fields
      } as unknown as ContextPack;
      
      await expect(storage.saveContextPack(invalidPack)).rejects.toThrow('Context Pack validation failed');
    });

    it('should throw error for invalid confidence score (out of bounds)', async () => {
      const pack = createTestContextPack();
      // @ts-expect-error - Testing invalid data
      pack.vision.confidence.value = 1.5; // Invalid: > 1
      
      await expect(storage.saveContextPack(pack)).rejects.toThrow('Context Pack validation failed');
    });
  });

  describe('getContextPack', () => {
    it('should retrieve a saved Context Pack by ID', async () => {
      const pack = createTestContextPack();
      await storage.saveContextPack(pack);
      
      const retrieved = await storage.getContextPack(pack.id);
      
      expect(retrieved).toEqual(pack);
    });

    /**
     * Storage Error Handling Tests
     * Task 2.3: Write unit tests for storage error handling
     * Validates: Requirements 14.4
     */

    it('should return null for non-existent Context Pack (missing file)', async () => {
      // Test: missing file returns null
      const retrieved = await storage.getContextPack('non-existent-id');
      
      expect(retrieved).toBeNull();
    });

    it('should return null for invalid JSON file', async () => {
      // Test: invalid JSON returns null
      const id = 'invalid-json';
      const filePath = path.join(TEST_DATA_DIR, `${id}.json`);
      
      // Create directory and write invalid JSON
      await fs.mkdir(TEST_DATA_DIR, { recursive: true });
      await fs.writeFile(filePath, 'invalid json content', 'utf-8');
      
      const retrieved = await storage.getContextPack(id);
      
      expect(retrieved).toBeNull();
    });

    it('should return null for JSON that fails schema validation', async () => {
      // Test: schema validation failure returns null
      const id = 'invalid-schema';
      const filePath = path.join(TEST_DATA_DIR, `${id}.json`);
      
      // Create directory and write JSON that doesn't match schema
      await fs.mkdir(TEST_DATA_DIR, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify({ id, invalid: 'data' }), 'utf-8');
      
      const retrieved = await storage.getContextPack(id);
      
      expect(retrieved).toBeNull();
    });
  });

  describe('listContextPacks', () => {
    it('should return empty array when no Context Packs exist', async () => {
      const packs = await storage.listContextPacks();
      
      expect(packs).toEqual([]);
    });

    it('should return all saved Context Packs', async () => {
      const pack1 = createTestContextPack();
      const pack2 = createTestContextPack();
      const pack3 = createTestContextPack();
      
      await storage.saveContextPack(pack1);
      await storage.saveContextPack(pack2);
      await storage.saveContextPack(pack3);
      
      const packs = await storage.listContextPacks();
      
      expect(packs).toHaveLength(3);
      expect(packs.map(p => p.id).sort()).toEqual([pack1.id, pack2.id, pack3.id].sort());
    });

    it('should skip invalid JSON files', async () => {
      const validPack = createTestContextPack();
      await storage.saveContextPack(validPack);
      
      // Create an invalid JSON file
      const invalidFilePath = path.join(TEST_DATA_DIR, 'invalid.json');
      await fs.writeFile(invalidFilePath, 'invalid json', 'utf-8');
      
      const packs = await storage.listContextPacks();
      
      // Should only return the valid pack
      expect(packs).toHaveLength(1);
      expect(packs[0].id).toBe(validPack.id);
    });

    it('should skip temporary files', async () => {
      const pack = createTestContextPack();
      await storage.saveContextPack(pack);
      
      // Create a temporary file
      const tempFilePath = path.join(TEST_DATA_DIR, 'temp.json.tmp');
      await fs.writeFile(tempFilePath, JSON.stringify(pack), 'utf-8');
      
      const packs = await storage.listContextPacks();
      
      // Should only return the non-temporary pack
      expect(packs).toHaveLength(1);
      expect(packs[0].id).toBe(pack.id);
    });
  });

  describe('deleteContextPack', () => {
    it('should delete an existing Context Pack', async () => {
      const pack = createTestContextPack();
      await storage.saveContextPack(pack);
      
      // Verify it exists
      let retrieved = await storage.getContextPack(pack.id);
      expect(retrieved).not.toBeNull();
      
      // Delete it
      await storage.deleteContextPack(pack.id);
      
      // Verify it's gone
      retrieved = await storage.getContextPack(pack.id);
      expect(retrieved).toBeNull();
    });

    it('should not throw error when deleting non-existent Context Pack', async () => {
      // Should not throw
      await expect(storage.deleteContextPack('non-existent-id')).resolves.toBeUndefined();
    });

    it('should remove Context Pack from list after deletion', async () => {
      const pack1 = createTestContextPack();
      const pack2 = createTestContextPack();
      
      await storage.saveContextPack(pack1);
      await storage.saveContextPack(pack2);
      
      let packs = await storage.listContextPacks();
      expect(packs).toHaveLength(2);
      
      await storage.deleteContextPack(pack1.id);
      
      packs = await storage.listContextPacks();
      expect(packs).toHaveLength(1);
      expect(packs[0].id).toBe(pack2.id);
    });
  });

  describe('error handling', () => {
    it('should handle permission errors gracefully', async () => {
      // This test is platform-dependent and may not work in all environments
      // Skip if running in CI or without proper permissions
      if (process.env.CI) {
        return;
      }
      
      const pack = createTestContextPack();
      
      // Create a read-only directory
      await fs.mkdir(TEST_DATA_DIR, { recursive: true });
      await fs.chmod(TEST_DATA_DIR, 0o444);
      
      try {
        await expect(storage.saveContextPack(pack)).rejects.toThrow();
      } finally {
        // Restore permissions for cleanup
        await fs.chmod(TEST_DATA_DIR, 0o755);
      }
    });
  });
});
