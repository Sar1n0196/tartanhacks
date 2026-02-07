import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createDefaultStorage } from './storage';
import { ContextPack } from './types';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

/**
 * Integration tests for Storage with default configuration
 * Tests the actual data/context-packs directory
 */

const DEFAULT_DATA_DIR = path.join(process.cwd(), 'data', 'context-packs');

// Helper function to create a minimal valid Context Pack
function createMinimalContextPack(): ContextPack {
  const id = `test-${randomUUID()}`;
  return {
    id,
    companyName: 'Integration Test Company',
    companyUrl: 'https://integration-test.com',
    version: 'v1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    vision: {
      content: 'To revolutionize testing',
      confidence: { value: 0.95 },
      citations: [{ type: 'interview', reference: 'vision' }],
    },
    mission: {
      content: 'Build reliable software',
      confidence: { value: 0.95 },
      citations: [{ type: 'interview', reference: 'vision' }],
    },
    values: [
      {
        content: 'Quality first',
        confidence: { value: 0.95 },
        citations: [{ type: 'interview', reference: 'vision' }],
      },
    ],
    icp: {
      segments: [
        {
          name: 'Developers',
          description: {
            content: 'Software developers who value quality',
            confidence: { value: 0.9 },
            citations: [{ type: 'interview', reference: 'icp' }],
          },
          painPoints: [
            {
              content: 'Unreliable tests',
              confidence: { value: 0.9 },
              citations: [{ type: 'interview', reference: 'icp' }],
            },
          ],
        },
      ],
      evolution: {
        content: 'Started with individual developers, expanding to teams',
        confidence: { value: 0.85 },
        citations: [{ type: 'interview', reference: 'icp' }],
      },
    },
    businessModel: {
      revenueDrivers: [
        {
          content: 'Subscription revenue',
          confidence: { value: 0.9 },
          citations: [{ type: 'interview', reference: 'business-model' }],
        },
      ],
      pricingModel: {
        content: 'Tiered pricing based on team size',
        confidence: { value: 0.9 },
        citations: [{ type: 'interview', reference: 'business-model' }],
      },
      keyMetrics: [
        {
          content: 'Monthly recurring revenue',
          confidence: { value: 0.9 },
          citations: [{ type: 'interview', reference: 'business-model' }],
        },
      ],
    },
    product: {
      jobsToBeDone: [
        {
          content: 'Ensure code quality',
          confidence: { value: 0.9 },
          citations: [{ type: 'interview', reference: 'business-model' }],
        },
      ],
      keyFeatures: [
        {
          content: 'Automated testing',
          confidence: { value: 0.9 },
          citations: [{ type: 'interview', reference: 'business-model' }],
        },
      ],
    },
    decisionRules: {
      priorities: [
        {
          content: 'Focus on developer experience',
          confidence: { value: 0.95 },
          citations: [{ type: 'interview', reference: 'decision-rules' }],
        },
      ],
      antiPatterns: [
        {
          content: 'Do not sacrifice quality for speed',
          confidence: { value: 0.95 },
          citations: [{ type: 'interview', reference: 'decision-rules' }],
        },
      ],
    },
    engineeringKPIs: [
      {
        content: 'Test coverage above 80%',
        confidence: { value: 0.9 },
        citations: [{ type: 'interview', reference: 'engineering-kpis' }],
      },
    ],
    summary: 'A company focused on building reliable testing tools for developers, with a subscription-based business model and strong emphasis on quality.',
  };
}

describe('Storage Integration Tests', () => {
  const testPackIds: string[] = [];

  afterEach(async () => {
    // Clean up test packs
    const storage = createDefaultStorage();
    for (const id of testPackIds) {
      try {
        await storage.deleteContextPack(id);
      } catch {
        // Ignore errors during cleanup
      }
    }
    testPackIds.length = 0;
  });

  it('should save and retrieve a Context Pack using default storage', async () => {
    const storage = createDefaultStorage();
    const pack = createMinimalContextPack();
    testPackIds.push(pack.id);

    // Save the pack
    await storage.saveContextPack(pack);

    // Retrieve it
    const retrieved = await storage.getContextPack(pack.id);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(pack.id);
    expect(retrieved?.companyName).toBe(pack.companyName);
    expect(retrieved?.version).toBe('v1');
  });

  it('should persist Context Pack across storage instances', async () => {
    const pack = createMinimalContextPack();
    testPackIds.push(pack.id);

    // Save with first instance
    const storage1 = createDefaultStorage();
    await storage1.saveContextPack(pack);

    // Retrieve with second instance
    const storage2 = createDefaultStorage();
    const retrieved = await storage2.getContextPack(pack.id);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(pack.id);
  });

  it('should list multiple Context Packs', async () => {
    const storage = createDefaultStorage();
    
    const pack1 = createMinimalContextPack();
    const pack2 = createMinimalContextPack();
    testPackIds.push(pack1.id, pack2.id);

    await storage.saveContextPack(pack1);
    await storage.saveContextPack(pack2);

    const allPacks = await storage.listContextPacks();
    
    // Should include at least our test packs (may include others from previous tests)
    const testPacks = allPacks.filter(p => testPackIds.includes(p.id));
    expect(testPacks).toHaveLength(2);
  });

  it('should handle update workflow (v0 -> v1)', async () => {
    const storage = createDefaultStorage();
    
    // Create initial draft pack (v0)
    const draftPack = createMinimalContextPack();
    draftPack.version = 'v0';
    testPackIds.push(draftPack.id);

    await storage.saveContextPack(draftPack);

    // Update to final pack (v1)
    const finalPack = { ...draftPack, version: 'v1' as const };
    await storage.saveContextPack(finalPack);

    // Retrieve and verify
    const retrieved = await storage.getContextPack(draftPack.id);
    expect(retrieved?.version).toBe('v1');
  });

  it('should verify file is actually written to disk', async () => {
    const storage = createDefaultStorage();
    const pack = createMinimalContextPack();
    testPackIds.push(pack.id);

    await storage.saveContextPack(pack);

    // Check file exists on disk
    const filePath = path.join(DEFAULT_DATA_DIR, `${pack.id}.json`);
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);

    // Verify file content is valid JSON
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(fileContent);
    expect(parsed.id).toBe(pack.id);
  });
});
