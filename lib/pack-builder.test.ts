import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PackBuilder } from './pack-builder';
import { LLMWrapper } from './llm-wrapper';
import type {
  PackBuildRequest,
  ContextPack,
  InterviewQuestion,
  InterviewAnswer,
} from './types';

/**
 * Unit tests for PackBuilder
 * 
 * Tests:
 * - Basic pack building with draft pack and interview answers
 * - Merging with no conflicts
 * - Merging with conflicts (founder answers should override)
 * - Handling skipped questions
 * - Summary generation
 * - Version and timestamp updates
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

describe('PackBuilder', () => {
  let mockLLM: LLMWrapper;
  let packBuilder: PackBuilder;

  beforeEach(() => {
    // Create mock LLM wrapper
    mockLLM = {
      completeWithSchema: vi.fn(),
    } as any;

    packBuilder = new PackBuilder(mockLLM);
  });

  describe('buildFinalPack', () => {
    it('should merge draft pack with interview answers', async () => {
      // Arrange
      const draftPack: Partial<ContextPack> = {
        id: 'test-pack-1',
        companyName: 'Test Company',
        companyUrl: 'https://test.com',
        version: 'v0',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        vision: {
          content: 'Draft vision from website',
          confidence: { value: 0.6, reason: 'Found on about page' },
          citations: [{ type: 'url', reference: 'https://test.com/about' }],
        },
        mission: {
          content: '',
          confidence: { value: 0, reason: 'Not found' },
          citations: [],
        },
        values: [],
        icp: {
          segments: [],
          evolution: {
            content: '',
            confidence: { value: 0 },
            citations: [],
          },
        },
        businessModel: {
          revenueDrivers: [],
          pricingModel: {
            content: '',
            confidence: { value: 0 },
            citations: [],
          },
          keyMetrics: [],
        },
        product: {
          jobsToBeDone: [],
          keyFeatures: [],
        },
        decisionRules: {
          priorities: [],
          antiPatterns: [],
        },
        engineeringKPIs: [],
        summary: '',
      };

      const questions: InterviewQuestion[] = [
        {
          id: 'q1',
          category: 'vision',
          question: 'What is your company mission?',
          priority: 10,
        },
        {
          id: 'q2',
          category: 'icp',
          question: 'Who are your target customers?',
          priority: 9,
        },
      ];

      const answers: InterviewAnswer[] = [
        {
          questionId: 'q1',
          answer: 'Our mission is to help startups build better products',
          skipped: false,
          answeredAt: '2024-01-01T01:00:00Z',
        },
        {
          questionId: 'q2',
          answer: 'Early-stage B2B SaaS startups with 5-50 employees',
          skipped: false,
          answeredAt: '2024-01-01T01:01:00Z',
        },
      ];

      const request: PackBuildRequest = {
        draftPack,
        interviewAnswers: answers,
        questions,
      };

      const mockFinalPack: ContextPack = {
        id: 'test-pack-1',
        companyName: 'Test Company',
        companyUrl: 'https://test.com',
        version: 'v0', // Will be updated to v1
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z', // Will be updated
        vision: {
          content: 'Draft vision from website',
          confidence: { value: 0.6, reason: 'Found on about page' },
          citations: [{ type: 'url', reference: 'https://test.com/about' }],
        },
        mission: {
          content: 'Our mission is to help startups build better products',
          confidence: { value: 0.95, reason: 'Provided by founder' },
          citations: [{ type: 'interview', reference: 'vision' }],
        },
        values: [],
        icp: {
          segments: [
            {
              name: 'Early-stage B2B SaaS startups',
              description: {
                content: 'Early-stage B2B SaaS startups with 5-50 employees',
                confidence: { value: 0.95, reason: 'Provided by founder' },
                citations: [{ type: 'interview', reference: 'icp' }],
              },
              painPoints: [],
            },
          ],
          evolution: {
            content: 'Information not available',
            confidence: { value: 0 },
            citations: [],
          },
        },
        businessModel: {
          revenueDrivers: [],
          pricingModel: {
            content: 'Information not available',
            confidence: { value: 0 },
            citations: [],
          },
          keyMetrics: [],
        },
        product: {
          jobsToBeDone: [],
          keyFeatures: [],
        },
        decisionRules: {
          priorities: [],
          antiPatterns: [],
        },
        engineeringKPIs: [],
        summary: 'Test Company helps early-stage B2B SaaS startups build better products.',
      };

      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(mockFinalPack);

      // Act
      const result = await packBuilder.buildFinalPack(request);

      // Assert
      expect(mockLLM.completeWithSchema).toHaveBeenCalledWith(
        expect.objectContaining({
          systemPrompt: expect.stringContaining('MERGING RULES'),
          userPrompt: expect.stringContaining('DRAFT CONTEXT PACK'),
          temperature: 0.2,
          responseFormat: 'json',
        }),
        expect.any(Object) // ContextPackSchema
      );

      expect(result.version).toBe('v1');
      expect(result.updatedAt).not.toBe('2024-01-01T00:00:00Z');
      expect(result.mission.content).toBe('Our mission is to help startups build better products');
      expect(result.mission.confidence.value).toBeGreaterThanOrEqual(0.9);
    });

    it('should handle skipped questions by keeping draft pack data', async () => {
      // Arrange
      const draftPack: Partial<ContextPack> = {
        id: 'test-pack-2',
        companyName: 'Test Company',
        companyUrl: 'https://test.com',
        version: 'v0',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        vision: {
          content: 'Draft vision',
          confidence: { value: 0.5 },
          citations: [{ type: 'url', reference: 'https://test.com' }],
        },
        mission: {
          content: '',
          confidence: { value: 0 },
          citations: [],
        },
        values: [],
        icp: {
          segments: [],
          evolution: {
            content: '',
            confidence: { value: 0 },
            citations: [],
          },
        },
        businessModel: {
          revenueDrivers: [],
          pricingModel: {
            content: '',
            confidence: { value: 0 },
            citations: [],
          },
          keyMetrics: [],
        },
        product: {
          jobsToBeDone: [],
          keyFeatures: [],
        },
        decisionRules: {
          priorities: [],
          antiPatterns: [],
        },
        engineeringKPIs: [],
        summary: '',
      };

      const questions: InterviewQuestion[] = [
        {
          id: 'q1',
          category: 'vision',
          question: 'What is your mission?',
          priority: 10,
        },
      ];

      const answers: InterviewAnswer[] = [
        {
          questionId: 'q1',
          answer: '',
          skipped: true,
          answeredAt: '2024-01-01T01:00:00Z',
        },
      ];

      const request: PackBuildRequest = {
        draftPack,
        interviewAnswers: answers,
        questions,
      };

      const mockFinalPack: ContextPack = {
        ...draftPack,
        version: 'v0',
        mission: {
          content: 'Information not available',
          confidence: { value: 0, reason: 'Question was skipped' },
          citations: [],
        },
        summary: 'Test Company draft vision.',
      } as ContextPack;

      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(mockFinalPack);

      // Act
      const result = await packBuilder.buildFinalPack(request);

      // Assert
      expect(result.mission.content).toBe('Information not available');
      expect(result.mission.confidence.value).toBe(0);
    });

    it('should prioritize founder answers over draft pack for conflicts', async () => {
      // Arrange
      const draftPack: Partial<ContextPack> = {
        id: 'test-pack-3',
        companyName: 'Test Company',
        companyUrl: 'https://test.com',
        version: 'v0',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        vision: {
          content: 'Old vision from website',
          confidence: { value: 0.6 },
          citations: [{ type: 'url', reference: 'https://test.com' }],
        },
        mission: {
          content: '',
          confidence: { value: 0 },
          citations: [],
        },
        values: [],
        icp: {
          segments: [],
          evolution: {
            content: '',
            confidence: { value: 0 },
            citations: [],
          },
        },
        businessModel: {
          revenueDrivers: [],
          pricingModel: {
            content: '',
            confidence: { value: 0 },
            citations: [],
          },
          keyMetrics: [],
        },
        product: {
          jobsToBeDone: [],
          keyFeatures: [],
        },
        decisionRules: {
          priorities: [],
          antiPatterns: [],
        },
        engineeringKPIs: [],
        summary: '',
      };

      const questions: InterviewQuestion[] = [
        {
          id: 'q1',
          category: 'vision',
          question: 'What is your company vision?',
          priority: 10,
        },
      ];

      const answers: InterviewAnswer[] = [
        {
          questionId: 'q1',
          answer: 'Updated vision from founder interview',
          skipped: false,
          answeredAt: '2024-01-01T01:00:00Z',
        },
      ];

      const request: PackBuildRequest = {
        draftPack,
        interviewAnswers: answers,
        questions,
      };

      const mockFinalPack: ContextPack = {
        ...draftPack,
        version: 'v0',
        vision: {
          content: 'Updated vision from founder interview',
          confidence: { value: 0.95, reason: 'Provided by founder' },
          citations: [
            { type: 'interview', reference: 'vision' },
            { type: 'url', reference: 'https://test.com' },
          ],
        },
        summary: 'Test Company updated vision.',
      } as ContextPack;

      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(mockFinalPack);

      // Act
      const result = await packBuilder.buildFinalPack(request);

      // Assert
      expect(result.vision.content).toBe('Updated vision from founder interview');
      expect(result.vision.confidence.value).toBeGreaterThanOrEqual(0.9);
      expect(result.vision.citations).toContainEqual({
        type: 'interview',
        reference: 'vision',
      });
    });

    it('should generate a comprehensive summary', async () => {
      // Arrange
      const draftPack: Partial<ContextPack> = {
        id: 'test-pack-4',
        companyName: 'Test Company',
        companyUrl: 'https://test.com',
        version: 'v0',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        vision: {
          content: 'Vision',
          confidence: { value: 0.8 },
          citations: [],
        },
        mission: {
          content: '',
          confidence: { value: 0 },
          citations: [],
        },
        values: [],
        icp: {
          segments: [],
          evolution: {
            content: '',
            confidence: { value: 0 },
            citations: [],
          },
        },
        businessModel: {
          revenueDrivers: [],
          pricingModel: {
            content: '',
            confidence: { value: 0 },
            citations: [],
          },
          keyMetrics: [],
        },
        product: {
          jobsToBeDone: [],
          keyFeatures: [],
        },
        decisionRules: {
          priorities: [],
          antiPatterns: [],
        },
        engineeringKPIs: [],
        summary: '',
      };

      const request: PackBuildRequest = {
        draftPack,
        interviewAnswers: [],
        questions: [],
      };

      const mockFinalPack: ContextPack = {
        ...draftPack,
        version: 'v0',
        summary: 'Test Company is building innovative solutions. Our target customers are early-stage startups. We focus on delivering value through our core product features.',
      } as ContextPack;

      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(mockFinalPack);

      // Act
      const result = await packBuilder.buildFinalPack(request);

      // Assert
      expect(result.summary).toBeTruthy();
      expect(result.summary.length).toBeGreaterThan(50);
    });

    it('should update version to v1 and timestamp', async () => {
      // Arrange
      const draftPack: Partial<ContextPack> = {
        id: 'test-pack-5',
        companyName: 'Test Company',
        companyUrl: 'https://test.com',
        version: 'v0',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        vision: {
          content: '',
          confidence: { value: 0 },
          citations: [],
        },
        mission: {
          content: '',
          confidence: { value: 0 },
          citations: [],
        },
        values: [],
        icp: {
          segments: [],
          evolution: {
            content: '',
            confidence: { value: 0 },
            citations: [],
          },
        },
        businessModel: {
          revenueDrivers: [],
          pricingModel: {
            content: '',
            confidence: { value: 0 },
            citations: [],
          },
          keyMetrics: [],
        },
        product: {
          jobsToBeDone: [],
          keyFeatures: [],
        },
        decisionRules: {
          priorities: [],
          antiPatterns: [],
        },
        engineeringKPIs: [],
        summary: '',
      };

      const request: PackBuildRequest = {
        draftPack,
        interviewAnswers: [],
        questions: [],
      };

      const mockFinalPack: ContextPack = {
        ...draftPack,
        version: 'v0', // Will be updated
        updatedAt: '2024-01-01T00:00:00Z', // Will be updated
        summary: 'Summary',
      } as ContextPack;

      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(mockFinalPack);

      const beforeTime = new Date().toISOString();

      // Act
      const result = await packBuilder.buildFinalPack(request);

      const afterTime = new Date().toISOString();

      // Assert
      expect(result.version).toBe('v1');
      expect(result.updatedAt).not.toBe('2024-01-01T00:00:00Z');
      expect(result.updatedAt >= beforeTime).toBe(true);
      expect(result.updatedAt <= afterTime).toBe(true);
    });

    it('should validate request against schema', async () => {
      // Arrange
      const invalidRequest = {
        draftPack: {},
        interviewAnswers: 'not an array', // Invalid
        questions: [],
      };

      // Act & Assert
      await expect(
        packBuilder.buildFinalPack(invalidRequest as any)
      ).rejects.toThrow();
    });

    it('should include proper prompts for LLM', async () => {
      // Arrange
      const draftPack: Partial<ContextPack> = {
        id: 'test-pack-6',
        companyName: 'Test Company',
        companyUrl: 'https://test.com',
        version: 'v0',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        vision: {
          content: '',
          confidence: { value: 0 },
          citations: [],
        },
        mission: {
          content: '',
          confidence: { value: 0 },
          citations: [],
        },
        values: [],
        icp: {
          segments: [],
          evolution: {
            content: '',
            confidence: { value: 0 },
            citations: [],
          },
        },
        businessModel: {
          revenueDrivers: [],
          pricingModel: {
            content: '',
            confidence: { value: 0 },
            citations: [],
          },
          keyMetrics: [],
        },
        product: {
          jobsToBeDone: [],
          keyFeatures: [],
        },
        decisionRules: {
          priorities: [],
          antiPatterns: [],
        },
        engineeringKPIs: [],
        summary: '',
      };

      const request: PackBuildRequest = {
        draftPack,
        interviewAnswers: [],
        questions: [],
      };

      const mockFinalPack: ContextPack = {
        ...draftPack,
        version: 'v0',
        summary: 'Summary',
      } as ContextPack;

      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(mockFinalPack);

      // Act
      await packBuilder.buildFinalPack(request);

      // Assert
      const call = vi.mocked(mockLLM.completeWithSchema).mock.calls[0];
      const llmRequest = call[0];

      expect(llmRequest.systemPrompt).toContain('MERGING RULES');
      expect(llmRequest.systemPrompt).toContain('PRIORITIZATION');
      expect(llmRequest.systemPrompt).toContain('CONFIDENCE SCORES');
      expect(llmRequest.systemPrompt).toContain('CITATIONS');
      expect(llmRequest.systemPrompt).toContain('UNAVAILABLE INFORMATION');
      expect(llmRequest.systemPrompt).toContain('Do NOT infer, assume, or generate');

      expect(llmRequest.userPrompt).toContain('DRAFT CONTEXT PACK');
      expect(llmRequest.userPrompt).toContain('INTERVIEW Q&A');
      expect(llmRequest.userPrompt).toContain('MERGING INSTRUCTIONS');
    });
  });
});
