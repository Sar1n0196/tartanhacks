import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Scraper, allPagesFailed } from './scraper';
import { Extractor } from './extractor';
import type { LLMWrapper } from './llm-wrapper';

/**
 * Integration tests for Scraper + Extractor flow
 * Tests the complete scrape failure fallback scenario
 * 
 * Requirements: 10.1
 */
describe('Scraper + Extractor Integration', () => {
  let scraper: Scraper;
  let extractor: Extractor;
  let mockLLM: LLMWrapper;

  beforeEach(() => {
    scraper = new Scraper();
    
    // Mock LLMWrapper
    mockLLM = {
      complete: vi.fn(),
      completeWithSchema: vi.fn(),
    } as any;
    
    extractor = new Extractor(mockLLM);
  });

  describe('complete scrape failure fallback', () => {
    it('should proceed to interview with empty draft pack when all pages fail', async () => {
      // Arrange: Mock fetch to fail for all URLs
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      // Act: Scrape company
      const scrapeResult = await scraper.scrapeCompany('https://example.com');

      // Assert: All pages failed
      expect(allPagesFailed(scrapeResult)).toBe(true);
      expect(scrapeResult.pages.length).toBeGreaterThan(0);
      expect(scrapeResult.pages.every(p => !p.success)).toBe(true);

      // Act: Extract from failed pages
      const draftPack = await extractor.extractFromPages(scrapeResult.pages);

      // Assert: Draft pack is empty with confidence 0
      expect(draftPack.vision.content).toBe('');
      expect(draftPack.vision.confidence.value).toBe(0);
      expect(draftPack.mission.content).toBe('');
      expect(draftPack.mission.confidence.value).toBe(0);
      expect(draftPack.values).toEqual([]);
      expect(draftPack.icp.segments).toEqual([]);
      expect(draftPack.businessModel.revenueDrivers).toEqual([]);
      expect(draftPack.businessModel.pricingModel.content).toBe('');
      expect(draftPack.product.jobsToBeDone).toEqual([]);
      expect(draftPack.product.keyFeatures).toEqual([]);

      // This empty draft pack should be used to proceed to interview
      // The interview will gather all information from the founder
    });

    it('should proceed normally when some pages succeed', async () => {
      // Arrange: Mock fetch to succeed for some URLs
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/about')) {
          return Promise.reject(new Error('Not found'));
        }
        return Promise.resolve({
          ok: true,
          text: async () => '<html><body><main><h1>Test Company</h1><p>We help businesses grow.</p></main></body></html>',
        } as Response);
      });

      // Act: Scrape company
      const scrapeResult = await scraper.scrapeCompany('https://example.com');

      // Assert: Not all pages failed
      expect(allPagesFailed(scrapeResult)).toBe(false);
      expect(scrapeResult.pages.some(p => p.success)).toBe(true);

      // The normal flow would continue with extraction from successful pages
      // and then proceed to interview to fill gaps
    });

    it('should handle demo mode with complete failure gracefully', async () => {
      // Arrange: Use demo mode
      const demoScraper = new Scraper({}, true);

      // Act: Scrape company in demo mode
      const scrapeResult = await demoScraper.scrapeCompany('https://example.com');

      // Assert: Demo mode returns successful mock data
      expect(allPagesFailed(scrapeResult)).toBe(false);
      expect(scrapeResult.pages.some(p => p.success)).toBe(true);
      expect(scrapeResult.pages.some(p => p.content.length > 0)).toBe(true);
    });
  });

  describe('scan flow decision logic', () => {
    it('should demonstrate the recommended scan flow pattern', async () => {
      // This test demonstrates how the scan flow should use allPagesFailed
      
      // Mock fetch to fail for all URLs
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      // Step 1: Scrape company
      const scrapeResult = await scraper.scrapeCompany('https://example.com');

      // Step 2: Check if all pages failed
      if (allPagesFailed(scrapeResult)) {
        // All pages failed - proceed directly to interview with empty draft pack
        const emptyDraftPack = await extractor.extractFromPages(scrapeResult.pages);
        
        // Verify empty draft pack
        expect(emptyDraftPack.vision.confidence.value).toBe(0);
        expect(emptyDraftPack.mission.confidence.value).toBe(0);
        
        // Continue to interview phase to gather information from founder
        // The interview will be responsible for filling all the gaps
        // since no information was extracted from public pages
      } else {
        // Some pages succeeded - proceed with normal extraction
        const draftPack = await extractor.extractFromPages(scrapeResult.pages);
        
        // Continue to interview phase to fill gaps
        // The interview will focus on missing or low-confidence information
      }

      // This pattern ensures the system gracefully handles complete scrape failures
      // by proceeding to the interview phase regardless of scraping success
    });
  });
});
