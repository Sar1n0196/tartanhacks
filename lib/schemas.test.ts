import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  CitationSchema,
  ConfidenceScoreSchema,
  ContextFieldSchema,
  ContextPackSchema,
  ScrapedPageSchema,
  InterviewQuestionSchema,
  InterviewAnswerSchema,
  GapSchema,
  ChatMessageSchema,
} from './schemas';

describe('Schema Validation', () => {
  describe('CitationSchema', () => {
    it('should validate a valid URL citation', () => {
      const citation = {
        type: 'url' as const,
        reference: 'https://example.com',
        text: 'Example text',
      };
      expect(() => CitationSchema.parse(citation)).not.toThrow();
    });

    it('should validate a valid interview citation', () => {
      const citation = {
        type: 'interview' as const,
        reference: 'vision',
      };
      expect(() => CitationSchema.parse(citation)).not.toThrow();
    });

    it('should reject invalid citation type', () => {
      const citation = {
        type: 'invalid',
        reference: 'test',
      };
      expect(() => CitationSchema.parse(citation)).toThrow();
    });
  });

  describe('ConfidenceScoreSchema', () => {
    it('should validate confidence score of 0', () => {
      const score = { value: 0 };
      expect(() => ConfidenceScoreSchema.parse(score)).not.toThrow();
    });

    it('should validate confidence score of 1', () => {
      const score = { value: 1 };
      expect(() => ConfidenceScoreSchema.parse(score)).not.toThrow();
    });

    it('should validate confidence score with reason', () => {
      const score = { value: 0.8, reason: 'High quality source' };
      expect(() => ConfidenceScoreSchema.parse(score)).not.toThrow();
    });

    it('should reject confidence score below 0', () => {
      const score = { value: -0.1 };
      expect(() => ConfidenceScoreSchema.parse(score)).toThrow();
    });

    it('should reject confidence score above 1', () => {
      const score = { value: 1.1 };
      expect(() => ConfidenceScoreSchema.parse(score)).toThrow();
    });
  });

  describe('ContextFieldSchema', () => {
    it('should validate a valid context field', () => {
      const field = {
        content: 'Test content',
        confidence: { value: 0.9 },
        citations: [
          { type: 'url' as const, reference: 'https://example.com' },
        ],
      };
      expect(() => ContextFieldSchema.parse(field)).not.toThrow();
    });

    it('should validate context field with empty citations', () => {
      const field = {
        content: 'Test content',
        confidence: { value: 0.5 },
        citations: [],
      };
      expect(() => ContextFieldSchema.parse(field)).not.toThrow();
    });
  });

  describe('InterviewQuestionSchema', () => {
    it('should validate a valid interview question', () => {
      const question = {
        id: 'q1',
        category: 'vision' as const,
        question: 'What is your company vision?',
        priority: 5,
      };
      expect(() => InterviewQuestionSchema.parse(question)).not.toThrow();
    });

    it('should reject priority below 1', () => {
      const question = {
        id: 'q1',
        category: 'vision' as const,
        question: 'What is your company vision?',
        priority: 0,
      };
      expect(() => InterviewQuestionSchema.parse(question)).toThrow();
    });

    it('should reject priority above 10', () => {
      const question = {
        id: 'q1',
        category: 'vision' as const,
        question: 'What is your company vision?',
        priority: 11,
      };
      expect(() => InterviewQuestionSchema.parse(question)).toThrow();
    });

    it('should reject invalid category', () => {
      const question = {
        id: 'q1',
        category: 'invalid',
        question: 'What is your company vision?',
        priority: 5,
      };
      expect(() => InterviewQuestionSchema.parse(question)).toThrow();
    });
  });

  describe('GapSchema', () => {
    it('should validate a valid gap', () => {
      const gap = {
        field: 'vision',
        category: 'vision',
        importance: 8,
        reason: 'Critical for onboarding',
        currentConfidence: 0.3,
      };
      expect(() => GapSchema.parse(gap)).not.toThrow();
    });

    it('should reject importance below 1', () => {
      const gap = {
        field: 'vision',
        category: 'vision',
        importance: 0,
        reason: 'Critical for onboarding',
        currentConfidence: 0.3,
      };
      expect(() => GapSchema.parse(gap)).toThrow();
    });

    it('should reject importance above 10', () => {
      const gap = {
        field: 'vision',
        category: 'vision',
        importance: 11,
        reason: 'Critical for onboarding',
        currentConfidence: 0.3,
      };
      expect(() => GapSchema.parse(gap)).toThrow();
    });
  });

  describe('ChatMessageSchema', () => {
    it('should validate a user message', () => {
      const message = {
        id: 'm1',
        role: 'user' as const,
        content: 'What is the company vision?',
        timestamp: new Date().toISOString(),
      };
      expect(() => ChatMessageSchema.parse(message)).not.toThrow();
    });

    it('should validate an assistant message with citations', () => {
      const message = {
        id: 'm2',
        role: 'assistant' as const,
        content: 'The company vision is...',
        citations: [
          { type: 'section' as const, reference: 'vision' },
        ],
        whyItMatters: 'This helps you understand...',
        confidence: { value: 0.95 },
        timestamp: new Date().toISOString(),
      };
      expect(() => ChatMessageSchema.parse(message)).not.toThrow();
    });
  });

  describe('ContextPackSchema', () => {
    it('should validate a minimal context pack', () => {
      const pack = {
        id: 'pack1',
        companyName: 'Test Company',
        companyUrl: 'https://example.com',
        version: 'v0' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        vision: {
          content: 'Our vision',
          confidence: { value: 0.8 },
          citations: [{ type: 'url' as const, reference: 'https://example.com' }],
        },
        mission: {
          content: 'Our mission',
          confidence: { value: 0.8 },
          citations: [{ type: 'url' as const, reference: 'https://example.com' }],
        },
        values: [],
        icp: {
          segments: [],
          evolution: {
            content: 'ICP evolution',
            confidence: { value: 0.5 },
            citations: [],
          },
        },
        businessModel: {
          revenueDrivers: [],
          pricingModel: {
            content: 'Pricing model',
            confidence: { value: 0.6 },
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
        summary: 'Company summary',
      };
      expect(() => ContextPackSchema.parse(pack)).not.toThrow();
    });

    it('should reject context pack with invalid version', () => {
      const pack = {
        id: 'pack1',
        companyName: 'Test Company',
        companyUrl: 'https://example.com',
        version: 'v2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        vision: {
          content: 'Our vision',
          confidence: { value: 0.8 },
          citations: [],
        },
        mission: {
          content: 'Our mission',
          confidence: { value: 0.8 },
          citations: [],
        },
        values: [],
        icp: {
          segments: [],
          evolution: {
            content: 'ICP evolution',
            confidence: { value: 0.5 },
            citations: [],
          },
        },
        businessModel: {
          revenueDrivers: [],
          pricingModel: {
            content: 'Pricing model',
            confidence: { value: 0.6 },
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
        summary: 'Company summary',
      };
      expect(() => ContextPackSchema.parse(pack)).toThrow();
    });
  });
});
