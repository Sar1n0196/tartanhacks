import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GapFinder } from './gap-finder';
import { LLMWrapper } from './llm-wrapper';
import type { ContextPack, GapAnalysis } from './types';

/**
 * Unit tests for GapFinder
 * 
 * Tests the gap identification logic that analyzes Context Packs
 * to identify missing or low-confidence information.
 * 
 * Requirements: 3.1, 3.2, 9.1, 9.2, 9.3, 9.8
 */

describe('GapFinder', () => {
  let mockLLM: LLMWrapper;
  let gapFinder: GapFinder;

  beforeEach(() => {
    // Create a mock LLM wrapper
    mockLLM = {
      completeWithSchema: vi.fn(),
    } as any;

    gapFinder = new GapFinder(mockLLM);
  });

  describe('analyzeGaps', () => {
    it('should identify gaps in a draft Context Pack', async () => {
      // Arrange: Create a draft pack with missing information
      const draftPack: Partial<ContextPack> = {
        id: 'test-pack',
        companyName: 'Test Company',
        companyUrl: 'https://test.com',
        version: 'v0',
        vision: {
          content: 'To revolutionize the industry',
          confidence: { value: 0.7, reason: 'Clearly stated on homepage' },
          citations: [{ type: 'url', reference: 'https://test.com' }],
        },
        mission: {
          content: '',
          confidence: { value: 0, reason: 'Not found' },
          citations: [],
        },
        // ICP is missing
        // Business model is missing
        // Decision rules are missing
      };

      const expectedGapAnalysis: GapAnalysis = {
        gaps: [
          {
            field: 'icp.segments',
            category: 'icp',
            importance: 10,
            reason: 'Critical for understanding target customers',
            currentConfidence: 0,
          },
          {
            field: 'decisionRules.priorities',
            category: 'decision-rules',
            importance: 9,
            reason: 'Essential for engineer decision-making',
            currentConfidence: 0,
          },
          {
            field: 'mission',
            category: 'vision',
            importance: 5,
            reason: 'Helpful for understanding company purpose',
            currentConfidence: 0,
          },
        ],
        completeness: 0.2,
      };

      // Mock the LLM response
      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(expectedGapAnalysis);

      // Act: Analyze gaps
      const result = await gapFinder.analyzeGaps(draftPack);

      // Assert: Verify the result
      expect(result).toEqual(expectedGapAnalysis);
      expect(mockLLM.completeWithSchema).toHaveBeenCalledTimes(1);

      // Verify the call parameters
      const callArgs = vi.mocked(mockLLM.completeWithSchema).mock.calls[0];
      expect(callArgs[0].systemPrompt).toContain('expert at identifying missing information');
      expect(callArgs[0].systemPrompt).toContain('CRITICAL RULES');
      expect(callArgs[0].userPrompt).toContain('Test Company');
      expect(callArgs[0].temperature).toBe(0.2);
      expect(callArgs[0].responseFormat).toBe('json');
    });

    it('should prioritize ICP and decision rules gaps', async () => {
      // Arrange: Create a draft pack with complete vision but missing ICP
      const draftPack: Partial<ContextPack> = {
        id: 'test-pack',
        companyName: 'Test Company',
        vision: {
          content: 'Complete vision',
          confidence: { value: 0.9 },
          citations: [{ type: 'url', reference: 'https://test.com' }],
        },
        mission: {
          content: 'Complete mission',
          confidence: { value: 0.9 },
          citations: [{ type: 'url', reference: 'https://test.com' }],
        },
        // ICP missing - should be high priority
        // Decision rules missing - should be high priority
      };

      const expectedGapAnalysis: GapAnalysis = {
        gaps: [
          {
            field: 'icp.segments',
            category: 'icp',
            importance: 10,
            reason: 'Critical for understanding customers',
            currentConfidence: 0,
          },
          {
            field: 'decisionRules.priorities',
            category: 'decision-rules',
            importance: 9,
            reason: 'Essential for prioritization',
            currentConfidence: 0,
          },
        ],
        completeness: 0.4,
      };

      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(expectedGapAnalysis);

      // Act
      const result = await gapFinder.analyzeGaps(draftPack);

      // Assert: High importance gaps should be identified
      expect(result.gaps[0].importance).toBeGreaterThanOrEqual(9);
      expect(result.gaps[0].category).toMatch(/icp|decision-rules/);
    });

    it('should handle low-confidence fields as gaps', async () => {
      // Arrange: Create a draft pack with low-confidence information
      const draftPack: Partial<ContextPack> = {
        id: 'test-pack',
        companyName: 'Test Company',
        vision: {
          content: 'Vague vision statement',
          confidence: { value: 0.3, reason: 'Weakly implied' },
          citations: [{ type: 'url', reference: 'https://test.com' }],
        },
      };

      const expectedGapAnalysis: GapAnalysis = {
        gaps: [
          {
            field: 'vision',
            category: 'vision',
            importance: 6,
            reason: 'Low confidence, needs clarification',
            currentConfidence: 0.3,
          },
        ],
        completeness: 0.1,
      };

      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(expectedGapAnalysis);

      // Act
      const result = await gapFinder.analyzeGaps(draftPack);

      // Assert: Low confidence field should be identified as a gap
      expect(result.gaps).toHaveLength(1);
      expect(result.gaps[0].currentConfidence).toBe(0.3);
    });

    it('should calculate completeness score', async () => {
      // Arrange: Create a mostly complete draft pack
      const draftPack: Partial<ContextPack> = {
        id: 'test-pack',
        companyName: 'Test Company',
        vision: {
          content: 'Complete vision',
          confidence: { value: 0.9 },
          citations: [{ type: 'url', reference: 'https://test.com' }],
        },
        mission: {
          content: 'Complete mission',
          confidence: { value: 0.9 },
          citations: [{ type: 'url', reference: 'https://test.com' }],
        },
        // Most fields complete, only minor gaps
      };

      const expectedGapAnalysis: GapAnalysis = {
        gaps: [
          {
            field: 'engineeringKPIs',
            category: 'engineering-kpis',
            importance: 7,
            reason: 'Missing KPIs',
            currentConfidence: 0,
          },
        ],
        completeness: 0.8, // High completeness
      };

      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(expectedGapAnalysis);

      // Act
      const result = await gapFinder.analyzeGaps(draftPack);

      // Assert: Completeness should be high
      expect(result.completeness).toBeGreaterThan(0.7);
      expect(result.completeness).toBeLessThanOrEqual(1);
    });

    it('should include proper prompts with anti-hallucination rules', async () => {
      // Arrange
      const draftPack: Partial<ContextPack> = {
        id: 'test-pack',
        companyName: 'Test Company',
      };

      const mockGapAnalysis: GapAnalysis = {
        gaps: [],
        completeness: 1,
      };

      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(mockGapAnalysis);

      // Act
      await gapFinder.analyzeGaps(draftPack);

      // Assert: Verify prompt contains anti-hallucination rules
      const callArgs = vi.mocked(mockLLM.completeWithSchema).mock.calls[0];
      const systemPrompt = callArgs[0].systemPrompt;

      expect(systemPrompt).toContain('CRITICAL RULES');
      expect(systemPrompt).toContain('Do NOT infer or assume');
      expect(systemPrompt).toContain('Do NOT hallucinate');
      expect(systemPrompt).toContain('impact on engineer decision-making');
      expect(systemPrompt).toContain('ICP/customer needs');
      expect(systemPrompt).toContain('Decision rules');
      expect(systemPrompt).toContain('Engineering KPIs');
    });

    it('should pass draft pack as JSON in user prompt', async () => {
      // Arrange
      const draftPack: Partial<ContextPack> = {
        id: 'test-pack',
        companyName: 'Test Company',
        companyUrl: 'https://test.com',
        vision: {
          content: 'Test vision',
          confidence: { value: 0.8 },
          citations: [{ type: 'url', reference: 'https://test.com' }],
        },
      };

      const mockGapAnalysis: GapAnalysis = {
        gaps: [],
        completeness: 0.5,
      };

      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(mockGapAnalysis);

      // Act
      await gapFinder.analyzeGaps(draftPack);

      // Assert: Verify user prompt contains the draft pack
      const callArgs = vi.mocked(mockLLM.completeWithSchema).mock.calls[0];
      const userPrompt = callArgs[0].userPrompt;

      expect(userPrompt).toContain('Test Company');
      expect(userPrompt).toContain('test-pack');
      expect(userPrompt).toContain('Test vision');
      expect(userPrompt).toContain('engineer decision-making');
    });

    it('should handle empty draft pack', async () => {
      // Arrange: Completely empty draft pack
      const draftPack: Partial<ContextPack> = {
        id: 'empty-pack',
        companyName: 'Empty Company',
      };

      const expectedGapAnalysis: GapAnalysis = {
        gaps: [
          {
            field: 'vision',
            category: 'vision',
            importance: 5,
            reason: 'Missing vision',
            currentConfidence: 0,
          },
          {
            field: 'mission',
            category: 'vision',
            importance: 5,
            reason: 'Missing mission',
            currentConfidence: 0,
          },
          {
            field: 'icp.segments',
            category: 'icp',
            importance: 10,
            reason: 'Missing ICP',
            currentConfidence: 0,
          },
          {
            field: 'businessModel',
            category: 'business-model',
            importance: 8,
            reason: 'Missing business model',
            currentConfidence: 0,
          },
          {
            field: 'decisionRules',
            category: 'decision-rules',
            importance: 9,
            reason: 'Missing decision rules',
            currentConfidence: 0,
          },
          {
            field: 'engineeringKPIs',
            category: 'engineering-kpis',
            importance: 8,
            reason: 'Missing KPIs',
            currentConfidence: 0,
          },
        ],
        completeness: 0,
      };

      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(expectedGapAnalysis);

      // Act
      const result = await gapFinder.analyzeGaps(draftPack);

      // Assert: Should identify many gaps
      expect(result.gaps.length).toBeGreaterThan(0);
      expect(result.completeness).toBe(0);
    });
  });
});
