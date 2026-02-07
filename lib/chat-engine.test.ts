import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatEngine } from './chat-engine';
import { LLMWrapper } from './llm-wrapper';
import { Storage } from './storage';
import { ChatRequest, ChatResponse, ContextPack } from './types';

/**
 * Unit tests for ChatEngine
 * 
 * Tests cover:
 * - Basic question answering with valid Context Pack
 * - Error handling for missing Context Pack
 * - Citation inclusion in responses
 * - "Why this matters" inclusion in responses
 * - Conversation history handling
 * 
 * Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */

describe('ChatEngine', () => {
  let mockLLM: LLMWrapper;
  let mockStorage: Storage;
  let chatEngine: ChatEngine;

  // Sample Context Pack for testing
  const samplePack: ContextPack = {
    id: 'test-pack-1',
    companyName: 'Test Company',
    companyUrl: 'https://test.com',
    version: 'v1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    vision: {
      content: 'To revolutionize engineer onboarding',
      confidence: { value: 0.9 },
      citations: [{ type: 'interview', reference: 'vision' }],
    },
    mission: {
      content: 'Help founders onboard engineers efficiently',
      confidence: { value: 0.9 },
      citations: [{ type: 'interview', reference: 'vision' }],
    },
    values: [
      {
        content: 'Customer-centric decision making',
        confidence: { value: 0.9 },
        citations: [{ type: 'interview', reference: 'vision' }],
      },
    ],
    icp: {
      segments: [
        {
          name: 'Early-stage B2B SaaS founders',
          description: {
            content: 'Founders with 2-5 engineers experiencing knowledge bottlenecks',
            confidence: { value: 0.9 },
            citations: [{ type: 'interview', reference: 'icp' }],
          },
          painPoints: [
            {
              content: 'Too much time spent explaining company context',
              confidence: { value: 0.9 },
              citations: [{ type: 'interview', reference: 'icp' }],
            },
          ],
        },
      ],
      evolution: {
        content: 'Started with solo founders, expanding to small teams',
        confidence: { value: 0.8 },
        citations: [{ type: 'interview', reference: 'icp' }],
      },
    },
    businessModel: {
      revenueDrivers: [
        {
          content: 'Subscription revenue from SaaS product',
          confidence: { value: 0.7 },
          citations: [{ type: 'url', reference: 'https://test.com/pricing' }],
        },
      ],
      pricingModel: {
        content: 'Information not available',
        confidence: { value: 0.0 },
        citations: [],
      },
      keyMetrics: [
        {
          content: 'Monthly recurring revenue (MRR)',
          confidence: { value: 0.8 },
          citations: [{ type: 'interview', reference: 'business-model' }],
        },
      ],
    },
    product: {
      jobsToBeDone: [
        {
          content: 'Reduce founder time spent on engineer onboarding',
          confidence: { value: 0.95 },
          citations: [{ type: 'interview', reference: 'business-model' }],
        },
      ],
      keyFeatures: [
        {
          content: 'Automated context pack generation',
          confidence: { value: 0.9 },
          citations: [{ type: 'interview', reference: 'business-model' }],
        },
      ],
    },
    decisionRules: {
      priorities: [
        {
          content: 'Prioritize features that reduce founder time',
          confidence: { value: 0.95 },
          citations: [{ type: 'interview', reference: 'decision-rules' }],
        },
      ],
      antiPatterns: [
        {
          content: 'Avoid features requiring extensive founder involvement',
          confidence: { value: 0.95 },
          citations: [{ type: 'interview', reference: 'decision-rules' }],
        },
      ],
    },
    engineeringKPIs: [
      {
        content: 'Time to first meaningful contribution for new engineers',
        confidence: { value: 0.9 },
        citations: [{ type: 'interview', reference: 'engineering-kpis' }],
      },
    ],
    summary: 'Test Company helps founders onboard engineers efficiently through automated context generation.',
  };

  beforeEach(() => {
    // Create mock LLM wrapper
    mockLLM = {
      completeWithSchema: vi.fn(),
    } as any;

    // Create mock Storage
    mockStorage = {
      getContextPack: vi.fn(),
    } as any;

    // Create ChatEngine instance
    chatEngine = new ChatEngine(mockLLM, mockStorage);
  });

  describe('answerQuestion', () => {
    it('should answer a question using the Context Pack', async () => {
      // Arrange
      const request: ChatRequest = {
        packId: 'test-pack-1',
        question: 'Who are our target customers?',
        conversationHistory: [],
      };

      const expectedResponse: ChatResponse = {
        answer: 'Our target customers are early-stage B2B SaaS founders with 2-5 engineers experiencing knowledge bottlenecks.',
        citations: [
          { type: 'section', reference: 'icp', text: 'Early-stage B2B SaaS founders' },
        ],
        whyItMatters: 'Understanding our ICP helps you make user-centric decisions when building features.',
        confidence: { value: 0.9, reason: 'Based on founder interview' },
      };

      vi.mocked(mockStorage.getContextPack).mockResolvedValue(samplePack);
      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(expectedResponse);

      // Act
      const response = await chatEngine.answerQuestion(request);

      // Assert
      expect(mockStorage.getContextPack).toHaveBeenCalledWith('test-pack-1');
      expect(mockLLM.completeWithSchema).toHaveBeenCalled();
      expect(response).toEqual(expectedResponse);
      expect(response.citations.length).toBeGreaterThan(0);
      expect(response.whyItMatters).toBeTruthy();
      expect(response.confidence.value).toBeGreaterThanOrEqual(0);
      expect(response.confidence.value).toBeLessThanOrEqual(1);
    });

    it('should throw error when Context Pack is not found', async () => {
      // Arrange
      const request: ChatRequest = {
        packId: 'non-existent-pack',
        question: 'Who are our target customers?',
        conversationHistory: [],
      };

      vi.mocked(mockStorage.getContextPack).mockResolvedValue(null);

      // Act & Assert
      await expect(chatEngine.answerQuestion(request)).rejects.toThrow(
        'Context pack not found: non-existent-pack'
      );
      expect(mockLLM.completeWithSchema).not.toHaveBeenCalled();
    });

    it('should include conversation history in the prompt', async () => {
      // Arrange
      const request: ChatRequest = {
        packId: 'test-pack-1',
        question: 'What about pricing?',
        conversationHistory: [
          {
            id: '1',
            role: 'user',
            content: 'Who are our target customers?',
            timestamp: '2024-01-01T00:00:00Z',
          },
          {
            id: '2',
            role: 'assistant',
            content: 'Our target customers are early-stage B2B SaaS founders.',
            citations: [{ type: 'section', reference: 'icp' }],
            whyItMatters: 'Understanding our ICP helps you make user-centric decisions.',
            confidence: { value: 0.9 },
            timestamp: '2024-01-01T00:00:01Z',
          },
        ],
      };

      const expectedResponse: ChatResponse = {
        answer: 'This information is not available in the context pack.',
        citations: [],
        whyItMatters: 'Understanding pricing helps you make trade-offs between feature complexity and customer value.',
        confidence: { value: 0.0, reason: 'Information not available in context pack' },
      };

      vi.mocked(mockStorage.getContextPack).mockResolvedValue(samplePack);
      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(expectedResponse);

      // Act
      const response = await chatEngine.answerQuestion(request);

      // Assert
      expect(mockLLM.completeWithSchema).toHaveBeenCalled();
      const callArgs = vi.mocked(mockLLM.completeWithSchema).mock.calls[0];
      const userPrompt = callArgs[0].userPrompt;
      
      // Verify conversation history is included in prompt
      expect(userPrompt).toContain('CONVERSATION HISTORY');
      expect(userPrompt).toContain('Who are our target customers?');
      expect(userPrompt).toContain('Our target customers are early-stage B2B SaaS founders.');
      
      // Verify response handles unavailable information
      expect(response.answer).toContain('not available');
      expect(response.confidence.value).toBe(0.0);
    });

    it('should include citations in the response', async () => {
      // Arrange
      const request: ChatRequest = {
        packId: 'test-pack-1',
        question: 'What should I prioritize?',
        conversationHistory: [],
      };

      const expectedResponse: ChatResponse = {
        answer: 'Prioritize features that reduce founder time and avoid features requiring extensive founder involvement.',
        citations: [
          { type: 'section', reference: 'decisionRules', text: 'reduce founder time' },
          { type: 'section', reference: 'decisionRules', text: 'extensive founder involvement' },
        ],
        whyItMatters: 'These priorities ensure your engineering work directly addresses customer pain points.',
        confidence: { value: 0.95, reason: 'Based on explicit decision rules from founder' },
      };

      vi.mocked(mockStorage.getContextPack).mockResolvedValue(samplePack);
      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(expectedResponse);

      // Act
      const response = await chatEngine.answerQuestion(request);

      // Assert
      expect(response.citations).toBeDefined();
      expect(response.citations.length).toBeGreaterThan(0);
      expect(response.citations[0].type).toBe('section');
      expect(response.citations[0].reference).toBeTruthy();
    });

    it('should include "why this matters" explanation', async () => {
      // Arrange
      const request: ChatRequest = {
        packId: 'test-pack-1',
        question: 'What is our vision?',
        conversationHistory: [],
      };

      const expectedResponse: ChatResponse = {
        answer: 'Our vision is to revolutionize engineer onboarding.',
        citations: [
          { type: 'section', reference: 'vision', text: 'revolutionize engineer onboarding' },
        ],
        whyItMatters: 'Understanding the vision helps you align your technical decisions with the company\'s long-term goals.',
        confidence: { value: 0.9, reason: 'Based on founder interview' },
      };

      vi.mocked(mockStorage.getContextPack).mockResolvedValue(samplePack);
      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(expectedResponse);

      // Act
      const response = await chatEngine.answerQuestion(request);

      // Assert
      expect(response.whyItMatters).toBeDefined();
      expect(response.whyItMatters.length).toBeGreaterThan(0);
      // Verify it contains meaningful explanation text
      const hasRelevantContent = 
        response.whyItMatters.includes('helps') ||
        response.whyItMatters.includes('matters') ||
        response.whyItMatters.includes('important') ||
        response.whyItMatters.includes('understand');
      expect(hasRelevantContent).toBe(true);
    });

    it('should pass correct temperature and format to LLM', async () => {
      // Arrange
      const request: ChatRequest = {
        packId: 'test-pack-1',
        question: 'Test question',
        conversationHistory: [],
      };

      const expectedResponse: ChatResponse = {
        answer: 'Test answer',
        citations: [{ type: 'section', reference: 'vision' }],
        whyItMatters: 'Test explanation',
        confidence: { value: 0.9 },
      };

      vi.mocked(mockStorage.getContextPack).mockResolvedValue(samplePack);
      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(expectedResponse);

      // Act
      await chatEngine.answerQuestion(request);

      // Assert
      expect(mockLLM.completeWithSchema).toHaveBeenCalled();
      const callArgs = vi.mocked(mockLLM.completeWithSchema).mock.calls[0];
      expect(callArgs[0].temperature).toBe(0.3);
      expect(callArgs[0].responseFormat).toBe('json');
    });

    it('should include Context Pack in user prompt', async () => {
      // Arrange
      const request: ChatRequest = {
        packId: 'test-pack-1',
        question: 'Test question',
        conversationHistory: [],
      };

      const expectedResponse: ChatResponse = {
        answer: 'Test answer',
        citations: [{ type: 'section', reference: 'vision' }],
        whyItMatters: 'Test explanation',
        confidence: { value: 0.9 },
      };

      vi.mocked(mockStorage.getContextPack).mockResolvedValue(samplePack);
      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(expectedResponse);

      // Act
      await chatEngine.answerQuestion(request);

      // Assert
      const callArgs = vi.mocked(mockLLM.completeWithSchema).mock.calls[0];
      const userPrompt = callArgs[0].userPrompt;
      
      expect(userPrompt).toContain('CONTEXT PACK');
      expect(userPrompt).toContain('Test Company');
      expect(userPrompt).toContain('CURRENT QUESTION');
      expect(userPrompt).toContain('Test question');
    });

    it('should include anti-hallucination rules in system prompt', async () => {
      // Arrange
      const request: ChatRequest = {
        packId: 'test-pack-1',
        question: 'Test question',
        conversationHistory: [],
      };

      const expectedResponse: ChatResponse = {
        answer: 'Test answer',
        citations: [{ type: 'section', reference: 'vision' }],
        whyItMatters: 'Test explanation',
        confidence: { value: 0.9 },
      };

      vi.mocked(mockStorage.getContextPack).mockResolvedValue(samplePack);
      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(expectedResponse);

      // Act
      await chatEngine.answerQuestion(request);

      // Assert
      const callArgs = vi.mocked(mockLLM.completeWithSchema).mock.calls[0];
      const systemPrompt = callArgs[0].systemPrompt;
      
      expect(systemPrompt).toContain('ONLY using information from the provided context pack');
      expect(systemPrompt).toContain('Do NOT infer, assume, or use external knowledge');
      expect(systemPrompt).toContain('citations');
      expect(systemPrompt).toContain('Why this matters');
      expect(systemPrompt).toContain('confidence');
    });
  });
});
