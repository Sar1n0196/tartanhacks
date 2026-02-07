import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Scraper, allPagesFailed } from './scraper';
import type { ScrapedPage } from './types';

/**
 * Unit tests for Scraper class
 * Tests Requirements: 1.1, 1.2, 1.3, 1.4
 */

describe('Scraper', () => {
  let scraper: Scraper;

  beforeEach(() => {
    scraper = new Scraper();
  });

  describe('constructor', () => {
    it('should use default config when no config provided', () => {
      const defaultScraper = new Scraper();
      expect(defaultScraper).toBeDefined();
    });

    it('should accept custom config', () => {
      const customScraper = new Scraper({
        maxPages: 5,
        timeout: 5000,
        userAgent: 'CustomBot/1.0',
      });
      expect(customScraper).toBeDefined();
    });
  });

  describe('extractReadableContent', () => {
    it('should extract title from HTML', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Test Company</title></head>
          <body>
            <main>
              <h1>Welcome</h1>
              <p>This is test content.</p>
            </main>
          </body>
        </html>
      `;

      const result = (scraper as any).extractReadableContent(html);
      expect(result.title).toBe('Test Company');
    });

    it('should extract content from main element', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <nav>Navigation</nav>
            <main>
              <h1>Main Content</h1>
              <p>This is the main content.</p>
            </main>
            <footer>Footer</footer>
          </body>
        </html>
      `;

      const result = (scraper as any).extractReadableContent(html);
      expect(result.content).toContain('Main Content');
      expect(result.content).toContain('main content');
      expect(result.content).not.toContain('Navigation');
      expect(result.content).not.toContain('Footer');
    });

    it('should remove script tags', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <main>
              <p>Content</p>
              <script>alert('test');</script>
            </main>
          </body>
        </html>
      `;

      const result = (scraper as any).extractReadableContent(html);
      expect(result.content).toContain('Content');
      expect(result.content).not.toContain('alert');
      expect(result.content).not.toContain('script');
    });

    it('should remove style tags', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head><style>body { color: red; }</style></head>
          <body>
            <main>
              <p>Content</p>
            </main>
          </body>
        </html>
      `;

      const result = (scraper as any).extractReadableContent(html);
      expect(result.content).toContain('Content');
      expect(result.content).not.toContain('color: red');
    });

    it('should remove navigation elements', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <nav>
              <a href="/">Home</a>
              <a href="/about">About</a>
            </nav>
            <main>
              <p>Main content</p>
            </main>
          </body>
        </html>
      `;

      const result = (scraper as any).extractReadableContent(html);
      expect(result.content).toContain('Main content');
      expect(result.content).not.toContain('Home');
      expect(result.content).not.toContain('About');
    });

    it('should clean up whitespace', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <main>
              <p>Line 1</p>
              
              
              <p>Line 2</p>
            </main>
          </body>
        </html>
      `;

      const result = (scraper as any).extractReadableContent(html);
      // Should not have excessive whitespace
      expect(result.content).not.toMatch(/\s{3,}/);
    });

    it('should fall back to h1 for title if no title tag', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <main>
              <h1>Page Heading</h1>
              <p>Content</p>
            </main>
          </body>
        </html>
      `;

      const result = (scraper as any).extractReadableContent(html);
      expect(result.title).toBe('Page Heading');
    });
  });

  describe('normalizeUrl', () => {
    it('should add https:// if no protocol', () => {
      const result = (scraper as any).normalizeUrl('example.com');
      expect(result).toBe('https://example.com');
    });

    it('should keep existing https:// protocol', () => {
      const result = (scraper as any).normalizeUrl('https://example.com');
      expect(result).toBe('https://example.com');
    });

    it('should keep existing http:// protocol', () => {
      const result = (scraper as any).normalizeUrl('http://example.com');
      expect(result).toBe('http://example.com');
    });

    it('should remove trailing slash', () => {
      const result = (scraper as any).normalizeUrl('https://example.com/');
      expect(result).toBe('https://example.com');
    });

    it('should trim whitespace', () => {
      const result = (scraper as any).normalizeUrl('  https://example.com  ');
      expect(result).toBe('https://example.com');
    });
  });

  describe('discoverPages', () => {
    it('should return array of URLs to scrape', () => {
      const baseUrl = 'https://example.com';
      const pages = (scraper as any).discoverPages(baseUrl);

      expect(pages).toBeInstanceOf(Array);
      expect(pages.length).toBeGreaterThan(0);
      expect(pages).toContain('https://example.com');
      expect(pages).toContain('https://example.com/about');
      expect(pages).toContain('https://example.com/careers');
      expect(pages).toContain('https://example.com/blog');
    });

    it('should include common page variations', () => {
      const baseUrl = 'https://example.com';
      const pages = (scraper as any).discoverPages(baseUrl);

      // Should include variations
      expect(pages.some((p: string) => p.includes('/about'))).toBe(true);
      expect(pages.some((p: string) => p.includes('/careers') || p.includes('/jobs'))).toBe(true);
      expect(pages.some((p: string) => p.includes('/blog') || p.includes('/news'))).toBe(true);
    });
  });

  describe('scrapeCompany', () => {
    it('should respect maxPages limit', async () => {
      const limitedScraper = new Scraper({ maxPages: 3, timeout: 1000 });

      // Mock fetch to return simple HTML
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<html><body><main>Test</main></body></html>',
      } as Response);

      const result = await limitedScraper.scrapeCompany('https://example.com');

      // Should only scrape up to maxPages
      expect(result.pages.length).toBeLessThanOrEqual(3);
    });

    it('should continue processing if some pages fail', async () => {
      // Mock fetch to fail for some URLs
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/about')) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          text: async () => '<html><body><main>Test</main></body></html>',
        } as Response);
      });

      const result = await scraper.scrapeCompany('https://example.com');

      // Should have both successful and failed pages
      const successfulPages = result.pages.filter(p => p.success);
      const failedPages = result.pages.filter(p => !p.success);

      expect(successfulPages.length).toBeGreaterThan(0);
      expect(failedPages.length).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should normalize company URL', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<html><body><main>Test</main></body></html>',
      } as Response);

      // Test with URL without protocol
      await scraper.scrapeCompany('example.com');

      // First call should be to normalized URL
      expect(global.fetch).toHaveBeenCalled();
      const firstCall = (global.fetch as any).mock.calls[0][0];
      expect(firstCall).toMatch(/^https:\/\//);
    });

    it('should return errors for failed pages', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await scraper.scrapeCompany('https://example.com');

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Network error');
    });
  });

  describe('scrapePage', () => {
    it('should handle HTTP errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const result = await (scraper as any).scrapePage('https://example.com/notfound');

      expect(result.success).toBe(false);
      expect(result.error).toContain('404');
    });

    it('should handle timeout errors', async () => {
      const timeoutScraper = new Scraper({ timeout: 100 });

      // Mock fetch to simulate abort signal
      global.fetch = vi.fn().mockImplementation((url: string, options: any) => {
        return new Promise((resolve, reject) => {
          // Simulate timeout by checking if signal is aborted
          const checkAbort = () => {
            if (options?.signal?.aborted) {
              const error = new Error('The operation was aborted');
              error.name = 'AbortError';
              reject(error);
            } else {
              setTimeout(checkAbort, 10);
            }
          };
          checkAbort();
        });
      });

      const result = await (timeoutScraper as any).scrapePage('https://example.com');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Timeout');
    });

    it('should include scraped timestamp', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<html><body><main>Test</main></body></html>',
      } as Response);

      const result = await (scraper as any).scrapePage('https://example.com');

      expect(result.scrapedAt).toBeDefined();
      expect(new Date(result.scrapedAt).getTime()).toBeGreaterThan(0);
    });

    it('should extract title and content from successful scrape', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Test Page</title></head>
          <body>
            <main>
              <h1>Welcome</h1>
              <p>This is test content.</p>
            </main>
          </body>
        </html>
      `;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => html,
      } as Response);

      const result = await (scraper as any).scrapePage('https://example.com');

      expect(result.success).toBe(true);
      expect(result.title).toBe('Test Page');
      expect(result.content).toContain('Welcome');
      expect(result.content).toContain('test content');
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await scraper.scrapeCompany('https://example.com');

      // Should not throw, should return result with errors
      expect(result).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle malformed HTML gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<html><body><p>Unclosed paragraph',
      } as Response);

      const result = await (scraper as any).scrapePage('https://example.com');

      // Cheerio should handle malformed HTML
      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
    });

    it('should handle empty HTML gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '',
      } as Response);

      const result = await (scraper as any).scrapePage('https://example.com');

      expect(result.success).toBe(true);
      expect(result.content).toBe('');
    });
  });

  describe('demo mode', () => {
    beforeEach(() => {
      // Clear all mocks before each demo mode test
      vi.clearAllMocks();
      vi.restoreAllMocks();
    });

    it('should return mock data when demo mode is enabled', async () => {
      const demoScraper = new Scraper({}, true);

      const result = await demoScraper.scrapeCompany('https://acmesaas.example.com');

      // Should return mock data without making HTTP requests
      expect(result.pages.length).toBeGreaterThan(0);
      expect(result.pages[0].success).toBe(true);
      expect(result.pages[0].content).toBeTruthy();
      expect(result.errors).toEqual([]);
    });

    it('should not make HTTP requests in demo mode', async () => {
      const demoScraper = new Scraper({}, true);
      const fetchSpy = vi.spyOn(global, 'fetch');

      await demoScraper.scrapeCompany('https://acmesaas.example.com');

      // Fetch should not be called in demo mode
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should make HTTP requests when demo mode is disabled', async () => {
      const liveScraper = new Scraper({}, false);
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<html><body>Test</body></html>',
      } as Response);

      await liveScraper.scrapeCompany('https://example.com');

      // Fetch should be called in live mode
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should return valid scrape result structure in demo mode', async () => {
      const demoScraper = new Scraper({}, true);

      const result = await demoScraper.scrapeCompany('https://techstart.example.com');

      // Validate structure
      expect(result).toHaveProperty('pages');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.pages)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      
      // Validate page structure
      result.pages.forEach(page => {
        expect(page).toHaveProperty('url');
        expect(page).toHaveProperty('title');
        expect(page).toHaveProperty('content');
        expect(page).toHaveProperty('scrapedAt');
        expect(page).toHaveProperty('success');
      });
    });

    it('should handle complete scrape failure when all pages fail', async () => {
      // Mock fetch to fail for all URLs
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await scraper.scrapeCompany('https://example.com');

      // All pages should have failed
      expect(result.pages.length).toBeGreaterThan(0);
      expect(result.pages.every(p => !p.success)).toBe(true);
      
      // Should have errors for all pages
      expect(result.errors.length).toBeGreaterThan(0);
      
      // All pages should have error messages
      result.pages.forEach(page => {
        expect(page.success).toBe(false);
        expect(page.error).toBeDefined();
      });
    });
  });

  describe('allPagesFailed', () => {
    it('should return true when all pages failed', () => {
      const result = {
        pages: [
          { url: 'https://example.com', title: '', content: '', scrapedAt: new Date().toISOString(), success: false, error: 'Failed' },
          { url: 'https://example.com/about', title: '', content: '', scrapedAt: new Date().toISOString(), success: false, error: 'Failed' },
        ],
        errors: ['Failed to scrape https://example.com: Failed', 'Failed to scrape https://example.com/about: Failed'],
      };

      expect(allPagesFailed(result)).toBe(true);
    });

    it('should return false when some pages succeeded', () => {
      const result = {
        pages: [
          { url: 'https://example.com', title: 'Test', content: 'Content', scrapedAt: new Date().toISOString(), success: true },
          { url: 'https://example.com/about', title: '', content: '', scrapedAt: new Date().toISOString(), success: false, error: 'Failed' },
        ],
        errors: ['Failed to scrape https://example.com/about: Failed'],
      };

      expect(allPagesFailed(result)).toBe(false);
    });

    it('should return false when all pages succeeded', () => {
      const result = {
        pages: [
          { url: 'https://example.com', title: 'Test', content: 'Content', scrapedAt: new Date().toISOString(), success: true },
          { url: 'https://example.com/about', title: 'About', content: 'About content', scrapedAt: new Date().toISOString(), success: true },
        ],
        errors: [],
      };

      expect(allPagesFailed(result)).toBe(false);
    });

    it('should return true when no pages were scraped', () => {
      const result = {
        pages: [],
        errors: [],
      };

      expect(allPagesFailed(result)).toBe(true);
    });
  });
});
