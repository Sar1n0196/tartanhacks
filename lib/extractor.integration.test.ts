import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Extractor } from './extractor';
import { LLMWrapper } from './llm-wrapper';
import type { ScrapedPage } from './types';

/**
 * Integration tests for Extractor with LLMWrapper
 * 
 * These tests verify the extractor works correctly with the LLM wrapper,
 * including proper prompt construction and schema validation.
 * 
 * Requirements: 1.5, 1.6, 1.7, 9.1, 9.2, 9.3, 9.7
 */

describe('Extractor Integration', () => {
  let llm: LLMWrapper;
  let extractor: Extractor;

  beforeEach(() => {
    // Create a mock LLM wrapper (not a real one to avoid OpenAI client issues)
    llm = {
      completeWithSchema: vi.fn(),
      complete: vi.fn(),
    } as any;
    extractor = new Extractor(llm);
  });

  it('should construct proper prompts with anti-hallucination rules', async () => {
    // Arrange
    const pages: ScrapedPage[] = [
      {
        url: 'https://example.com',
        title: 'Example Company',
        content: 'We are building the future of work.',
        scrapedAt: new Date().toISOString(),
        success: true,
      },
    ];

    // Mock the OpenAI API call
    const mockResponse = {
      vision: {
        content: 'Building the future of work',
        confidence: { value: 0.8, reason: 'Stated in homepage' },
        citations: [{ type: 'url', reference: 'https://example.com', text: 'building the future of work' }],
      },
      mission: {
        content: '',
        confidence: { value: 0, reason: 'Not found' },
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

    // Spy on the complete method to verify prompt construction
    const completeSpy = vi.spyOn(llm, 'completeWithSchema').mockResolvedValue(mockResponse);

    // Act
    const result = await extractor.extractFromPages(pages);

    // Assert
    expect(completeSpy).toHaveBeenCalledOnce();
    
    const call = completeSpy.mock.calls[0];
    const request = call[0];
    
    // Verify system prompt contains anti-hallucination rules
    expect(request.systemPrompt).toContain('CRITICAL RULES TO PREVENT HALLUCINATION');
    expect(request.systemPrompt).toContain('Only extract information EXPLICITLY STATED');
    expect(request.systemPrompt).toContain('Do NOT infer, assume, or generate');
    expect(request.systemPrompt).toContain('CONFIDENCE SCORING GUIDELINES');
    expect(request.systemPrompt).toContain('CITATION REQUIREMENTS');
    
    // Verify user prompt contains page content
    expect(request.userPrompt).toContain('https://example.com');
    expect(request.userPrompt).toContain('Example Company');
    expect(request.userPrompt).toContain('building the future of work');
    
    // Verify request configuration
    expect(request.temperature).toBe(0.1);
    expect(request.responseFormat).toBe('json');
    
    // Verify result
    expect(result.vision.content).toBe('Building the future of work');
    expect(result.vision.confidence.value).toBe(0.8);
    expect(result.vision.citations).toHaveLength(1);
  });

  it('should handle multiple pages with proper formatting', async () => {
    // Arrange
    const pages: ScrapedPage[] = [
      {
        url: 'https://example.com',
        title: 'Home',
        content: 'Content from homepage',
        scrapedAt: new Date().toISOString(),
        success: true,
      },
      {
        url: 'https://example.com/about',
        title: 'About',
        content: 'Content from about page',
        scrapedAt: new Date().toISOString(),
        success: true,
      },
      {
        url: 'https://example.com/careers',
        title: 'Careers',
        content: 'Content from careers page',
        scrapedAt: new Date().toISOString(),
        success: true,
      },
    ];

    const mockResponse = {
      vision: {
        content: 'Test vision',
        confidence: { value: 0.9 },
        citations: [{ type: 'url', reference: 'https://example.com' }],
      },
      mission: {
        content: 'Test mission',
        confidence: { value: 0.85 },
        citations: [{ type: 'url', reference: 'https://example.com/about' }],
      },
      values: [
        {
          content: 'Innovation',
          confidence: { value: 0.9 },
          citations: [{ type: 'url', reference: 'https://example.com/about' }],
        },
      ],
      icp: { segments: [] },
      businessModel: {
        revenueDrivers: [],
        pricingModel: { content: '', confidence: { value: 0 }, citations: [] },
      },
      product: { jobsToBeDone: [], keyFeatures: [] },
    };

    const completeSpy = vi.spyOn(llm, 'completeWithSchema').mockResolvedValue(mockResponse);

    // Act
    const result = await extractor.extractFromPages(pages);

    // Assert
    const call = completeSpy.mock.calls[0];
    const userPrompt = call[0].userPrompt;
    
    // Verify all pages are included
    expect(userPrompt).toContain('https://example.com');
    expect(userPrompt).toContain('https://example.com/about');
    expect(userPrompt).toContain('https://example.com/careers');
    
    // Verify page separators
    expect(userPrompt).toContain('---');
    
    // Verify result has data from multiple sources
    expect(result.vision.citations[0].reference).toBe('https://example.com');
    expect(result.mission.citations[0].reference).toBe('https://example.com/about');
  });

  it('should validate response against schema', async () => {
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

    // Mock completeWithSchema to throw a validation error
    vi.mocked(llm.completeWithSchema).mockRejectedValue(
      new Error('Schema validation failed')
    );

    // Act & Assert
    await expect(extractor.extractFromPages(pages)).rejects.toThrow('Schema validation failed');
  });

  it('should handle LLM errors gracefully', async () => {
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

    // Mock an LLM error
    vi.spyOn(llm, 'completeWithSchema').mockRejectedValue(
      new Error('API rate limit exceeded')
    );

    // Act & Assert
    await expect(extractor.extractFromPages(pages)).rejects.toThrow('API rate limit exceeded');
  });

  it('should extract comprehensive company information', async () => {
    // Arrange
    const pages: ScrapedPage[] = [
      {
        url: 'https://acme.com',
        title: 'Acme Corp - Innovative Solutions',
        content: `
          Acme Corp is revolutionizing the way businesses operate.
          Our vision is to create a world where every business can thrive.
          Our mission is to provide innovative tools that empower entrepreneurs.
          
          We value: Innovation, Customer Success, and Transparency.
          
          We serve small and medium businesses who struggle with outdated tools.
          Our customers face challenges with manual processes and lack of automation.
          
          We offer a SaaS platform with subscription pricing starting at $99/month.
          Key features include automated workflows, real-time analytics, and integrations.
        `,
        scrapedAt: new Date().toISOString(),
        success: true,
      },
    ];

    const mockResponse = {
      vision: {
        content: 'Create a world where every business can thrive',
        confidence: { value: 0.95, reason: 'Explicitly stated as vision' },
        citations: [{ type: 'url', reference: 'https://acme.com', text: 'vision is to create a world' }],
      },
      mission: {
        content: 'Provide innovative tools that empower entrepreneurs',
        confidence: { value: 0.95, reason: 'Explicitly stated as mission' },
        citations: [{ type: 'url', reference: 'https://acme.com', text: 'mission is to provide' }],
      },
      values: [
        {
          content: 'Innovation',
          confidence: { value: 0.95, reason: 'Listed as core value' },
          citations: [{ type: 'url', reference: 'https://acme.com', text: 'We value: Innovation' }],
        },
        {
          content: 'Customer Success',
          confidence: { value: 0.95, reason: 'Listed as core value' },
          citations: [{ type: 'url', reference: 'https://acme.com', text: 'Customer Success' }],
        },
        {
          content: 'Transparency',
          confidence: { value: 0.95, reason: 'Listed as core value' },
          citations: [{ type: 'url', reference: 'https://acme.com', text: 'Transparency' }],
        },
      ],
      icp: {
        segments: [
          {
            name: 'Small and Medium Businesses',
            description: {
              content: 'Businesses struggling with outdated tools',
              confidence: { value: 0.85, reason: 'Target segment described' },
              citations: [{ type: 'url', reference: 'https://acme.com', text: 'small and medium businesses' }],
            },
            painPoints: [
              {
                content: 'Manual processes',
                confidence: { value: 0.9, reason: 'Explicitly mentioned challenge' },
                citations: [{ type: 'url', reference: 'https://acme.com', text: 'manual processes' }],
              },
              {
                content: 'Lack of automation',
                confidence: { value: 0.9, reason: 'Explicitly mentioned challenge' },
                citations: [{ type: 'url', reference: 'https://acme.com', text: 'lack of automation' }],
              },
            ],
          },
        ],
      },
      businessModel: {
        revenueDrivers: [
          {
            content: 'SaaS subscription revenue',
            confidence: { value: 0.9, reason: 'Pricing model described' },
            citations: [{ type: 'url', reference: 'https://acme.com', text: 'SaaS platform with subscription' }],
          },
        ],
        pricingModel: {
          content: 'Subscription pricing starting at $99/month',
          confidence: { value: 0.95, reason: 'Specific pricing stated' },
          citations: [{ type: 'url', reference: 'https://acme.com', text: 'starting at $99/month' }],
        },
      },
      product: {
        jobsToBeDone: [
          {
            content: 'Automate business workflows',
            confidence: { value: 0.85, reason: 'Implied from features' },
            citations: [{ type: 'url', reference: 'https://acme.com', text: 'automated workflows' }],
          },
        ],
        keyFeatures: [
          {
            content: 'Automated workflows',
            confidence: { value: 0.95, reason: 'Listed as key feature' },
            citations: [{ type: 'url', reference: 'https://acme.com', text: 'automated workflows' }],
          },
          {
            content: 'Real-time analytics',
            confidence: { value: 0.95, reason: 'Listed as key feature' },
            citations: [{ type: 'url', reference: 'https://acme.com', text: 'real-time analytics' }],
          },
          {
            content: 'Integrations',
            confidence: { value: 0.95, reason: 'Listed as key feature' },
            citations: [{ type: 'url', reference: 'https://acme.com', text: 'integrations' }],
          },
        ],
      },
    };

    vi.spyOn(llm, 'completeWithSchema').mockResolvedValue(mockResponse);

    // Act
    const result = await extractor.extractFromPages(pages);

    // Assert - Verify comprehensive extraction
    expect(result.vision.content).toBeTruthy();
    expect(result.mission.content).toBeTruthy();
    expect(result.values).toHaveLength(3);
    expect(result.icp.segments).toHaveLength(1);
    expect(result.icp.segments[0].painPoints).toHaveLength(2);
    expect(result.businessModel.revenueDrivers).toHaveLength(1);
    expect(result.businessModel.pricingModel.content).toBeTruthy();
    expect(result.product.keyFeatures).toHaveLength(3);
    
    // Verify all fields have proper confidence scores
    expect(result.vision.confidence.value).toBeGreaterThan(0);
    expect(result.mission.confidence.value).toBeGreaterThan(0);
    expect(result.values[0].confidence.value).toBeGreaterThan(0);
    
    // Verify all non-empty fields have citations
    expect(result.vision.citations.length).toBeGreaterThan(0);
    expect(result.mission.citations.length).toBeGreaterThan(0);
    expect(result.values[0].citations.length).toBeGreaterThan(0);
  });
});
