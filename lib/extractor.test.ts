import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Extractor } from './extractor';
import { LLMWrapper } from './llm-wrapper';
import type { ScrapedPage, ExtractionResult } from './types';

/**
 * Unit tests for Extractor
 * 
 * Tests:
 * - Extraction with successful pages
 * - Extraction with empty pages
 * - Extraction with failed pages
 * - Confidence scores are within bounds
 * - Citations are present for non-empty fields
 * 
 * Requirements: 1.5, 1.6, 1.7
 */

describe('Extractor', () => {
  let mockLLM: LLMWrapper;
  let extractor: Extractor;

  beforeEach(() => {
    // Create a mock LLM wrapper
    mockLLM = {
      completeWithSchema: vi.fn(),
    } as any;

    extractor = new Extractor(mockLLM);
  });

  describe('extractFromPages', () => {
    it('should extract information from successful pages', async () => {
      // Arrange
      const pages: ScrapedPage[] = [
        {
          url: 'https://example.com',
          title: 'Example Company',
          content: 'We help businesses grow through innovative solutions. Our mission is to empower entrepreneurs.',
          scrapedAt: new Date().toISOString(),
          success: true,
        },
        {
          url: 'https://example.com/about',
          title: 'About Us',
          content: 'Our values: Innovation, Integrity, Customer Focus. We serve small businesses and startups.',
          scrapedAt: new Date().toISOString(),
          success: true,
        },
      ];

      const mockExtraction: ExtractionResult = {
        vision: {
          content: 'Empower entrepreneurs worldwide',
          confidence: { value: 0.8, reason: 'Clearly stated in mission' },
          citations: [{ type: 'url', reference: 'https://example.com', text: 'empower entrepreneurs' }],
        },
        mission: {
          content: 'Help businesses grow through innovative solutions',
          confidence: { value: 0.9, reason: 'Explicitly stated' },
          citations: [{ type: 'url', reference: 'https://example.com', text: 'help businesses grow' }],
        },
        values: [
          {
            content: 'Innovation',
            confidence: { value: 0.95, reason: 'Listed as core value' },
            citations: [{ type: 'url', reference: 'https://example.com/about', text: 'Our values: Innovation' }],
          },
          {
            content: 'Integrity',
            confidence: { value: 0.95, reason: 'Listed as core value' },
            citations: [{ type: 'url', reference: 'https://example.com/about', text: 'Integrity' }],
          },
        ],
        icp: {
          segments: [
            {
              name: 'Small Businesses',
              description: {
                content: 'Small businesses seeking growth',
                confidence: { value: 0.7, reason: 'Mentioned as target' },
                citations: [{ type: 'url', reference: 'https://example.com/about', text: 'small businesses' }],
              },
              painPoints: [],
            },
          ],
        },
        businessModel: {
          revenueDrivers: [],
          pricingModel: {
            content: '',
            confidence: { value: 0, reason: 'Not found' },
            citations: [],
          },
        },
        product: {
          jobsToBeDone: [],
          keyFeatures: [],
        },
      };

      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(mockExtraction);

      // Act
      const result = await extractor.extractFromPages(pages);

      // Assert
      expect(mockLLM.completeWithSchema).toHaveBeenCalledOnce();
      expect(result).toEqual(mockExtraction);

      // Verify the call parameters
      const call = vi.mocked(mockLLM.completeWithSchema).mock.calls[0];
      expect(call[0].systemPrompt).toContain('CRITICAL RULES TO PREVENT HALLUCINATION');
      expect(call[0].userPrompt).toContain('https://example.com');
      expect(call[0].temperature).toBe(0.1);
      expect(call[0].responseFormat).toBe('json');
    });

    it('should return empty extraction when no successful pages', async () => {
      // Arrange
      const pages: ScrapedPage[] = [
        {
          url: 'https://example.com',
          title: '',
          content: '',
          scrapedAt: new Date().toISOString(),
          success: false,
          error: 'Timeout',
        },
      ];

      // Act
      const result = await extractor.extractFromPages(pages);

      // Assert
      expect(mockLLM.completeWithSchema).not.toHaveBeenCalled();
      expect(result.vision.content).toBe('');
      expect(result.vision.confidence.value).toBe(0);
      expect(result.mission.content).toBe('');
      expect(result.values).toEqual([]);
    });

    it('should filter out failed pages and only use successful ones', async () => {
      // Arrange
      const pages: ScrapedPage[] = [
        {
          url: 'https://example.com',
          title: 'Example',
          content: 'Good content',
          scrapedAt: new Date().toISOString(),
          success: true,
        },
        {
          url: 'https://example.com/fail',
          title: '',
          content: '',
          scrapedAt: new Date().toISOString(),
          success: false,
          error: 'Failed',
        },
      ];

      const mockExtraction: ExtractionResult = {
        vision: {
          content: 'Test vision',
          confidence: { value: 0.8 },
          citations: [{ type: 'url', reference: 'https://example.com' }],
        },
        mission: {
          content: '',
          confidence: { value: 0 },
          citations: [],
        },
        values: [],
        icp: { segments: [] },
        businessModel: {
          revenueDrivers: [],
          pricingModel: { content: '', confidence: { value: 0 }, citations: [] },
        },
        product: {
          jobsToBeDone: [],
          keyFeatures: [],
        },
      };

      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(mockExtraction);

      // Act
      const result = await extractor.extractFromPages(pages);

      // Assert
      expect(mockLLM.completeWithSchema).toHaveBeenCalledOnce();
      const call = vi.mocked(mockLLM.completeWithSchema).mock.calls[0];
      expect(call[0].userPrompt).toContain('https://example.com');
      expect(call[0].userPrompt).not.toContain('https://example.com/fail');
    });

    it('should truncate long content to avoid token limits', async () => {
      // Arrange
      const longContent = 'a'.repeat(5000); // 5000 characters
      const pages: ScrapedPage[] = [
        {
          url: 'https://example.com',
          title: 'Example',
          content: longContent,
          scrapedAt: new Date().toISOString(),
          success: true,
        },
      ];

      const mockExtraction: ExtractionResult = {
        vision: {
          content: 'Test',
          confidence: { value: 0.8 },
          citations: [{ type: 'url', reference: 'https://example.com' }],
        },
        mission: { content: '', confidence: { value: 0 }, citations: [] },
        values: [],
        icp: { segments: [] },
        businessModel: {
          revenueDrivers: [],
          pricingModel: { content: '', confidence: { value: 0 }, citations: [] },
        },
        product: { jobsToBeDone: [], keyFeatures: [] },
      };

      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(mockExtraction);

      // Act
      await extractor.extractFromPages(pages);

      // Assert
      const call = vi.mocked(mockLLM.completeWithSchema).mock.calls[0];
      expect(call[0].userPrompt).toContain('...');
      expect(call[0].userPrompt.length).toBeLessThan(longContent.length + 500);
    });

    it('should handle empty content pages', async () => {
      // Arrange
      const pages: ScrapedPage[] = [
        {
          url: 'https://example.com',
          title: 'Example',
          content: '',
          scrapedAt: new Date().toISOString(),
          success: true,
        },
      ];

      // Act
      const result = await extractor.extractFromPages(pages);

      // Assert
      expect(mockLLM.completeWithSchema).not.toHaveBeenCalled();
      expect(result.vision.content).toBe('');
      expect(result.vision.confidence.value).toBe(0);
    });
  });

  describe('confidence scores', () => {
    it('should ensure all confidence scores are between 0 and 1', async () => {
      // Arrange
      const pages: ScrapedPage[] = [
        {
          url: 'https://example.com',
          title: 'Example',
          content: 'Test content',
          scrapedAt: new Date().toISOString(),
          success: true,
        },
      ];

      const mockExtraction: ExtractionResult = {
        vision: {
          content: 'Vision',
          confidence: { value: 0.9 },
          citations: [{ type: 'url', reference: 'https://example.com' }],
        },
        mission: {
          content: 'Mission',
          confidence: { value: 0.85 },
          citations: [{ type: 'url', reference: 'https://example.com' }],
        },
        values: [
          {
            content: 'Value 1',
            confidence: { value: 0.95 },
            citations: [{ type: 'url', reference: 'https://example.com' }],
          },
        ],
        icp: { segments: [] },
        businessModel: {
          revenueDrivers: [],
          pricingModel: { content: '', confidence: { value: 0 }, citations: [] },
        },
        product: { jobsToBeDone: [], keyFeatures: [] },
      };

      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(mockExtraction);

      // Act
      const result = await extractor.extractFromPages(pages);

      // Assert - Zod schema validation ensures this, but we verify
      expect(result.vision.confidence.value).toBeGreaterThanOrEqual(0);
      expect(result.vision.confidence.value).toBeLessThanOrEqual(1);
      expect(result.mission.confidence.value).toBeGreaterThanOrEqual(0);
      expect(result.mission.confidence.value).toBeLessThanOrEqual(1);
      expect(result.values[0].confidence.value).toBeGreaterThanOrEqual(0);
      expect(result.values[0].confidence.value).toBeLessThanOrEqual(1);
    });
  });

  describe('citations', () => {
    it('should include citations for non-empty fields', async () => {
      // Arrange
      const pages: ScrapedPage[] = [
        {
          url: 'https://example.com',
          title: 'Example',
          content: 'Test content',
          scrapedAt: new Date().toISOString(),
          success: true,
        },
      ];

      const mockExtraction: ExtractionResult = {
        vision: {
          content: 'Vision statement',
          confidence: { value: 0.9 },
          citations: [
            {
              type: 'url',
              reference: 'https://example.com',
              text: 'Vision statement from page',
            },
          ],
        },
        mission: {
          content: 'Mission statement',
          confidence: { value: 0.85 },
          citations: [
            {
              type: 'url',
              reference: 'https://example.com',
            },
          ],
        },
        values: [],
        icp: { segments: [] },
        businessModel: {
          revenueDrivers: [],
          pricingModel: { content: '', confidence: { value: 0 }, citations: [] },
        },
        product: { jobsToBeDone: [], keyFeatures: [] },
      };

      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(mockExtraction);

      // Act
      const result = await extractor.extractFromPages(pages);

      // Assert
      expect(result.vision.citations).toHaveLength(1);
      expect(result.vision.citations[0].type).toBe('url');
      expect(result.vision.citations[0].reference).toBe('https://example.com');
      
      expect(result.mission.citations).toHaveLength(1);
      expect(result.mission.citations[0].type).toBe('url');
    });

    it('should allow empty citations for empty fields', async () => {
      // Arrange
      const pages: ScrapedPage[] = [
        {
          url: 'https://example.com',
          title: 'Example',
          content: 'Test content',
          scrapedAt: new Date().toISOString(),
          success: true,
        },
      ];

      const mockExtraction: ExtractionResult = {
        vision: {
          content: '',
          confidence: { value: 0, reason: 'Not found' },
          citations: [],
        },
        mission: {
          content: '',
          confidence: { value: 0 },
          citations: [],
        },
        values: [],
        icp: { segments: [] },
        businessModel: {
          revenueDrivers: [],
          pricingModel: { content: '', confidence: { value: 0 }, citations: [] },
        },
        product: { jobsToBeDone: [], keyFeatures: [] },
      };

      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(mockExtraction);

      // Act
      const result = await extractor.extractFromPages(pages);

      // Assert
      expect(result.vision.citations).toEqual([]);
      expect(result.mission.citations).toEqual([]);
    });
  });
});
