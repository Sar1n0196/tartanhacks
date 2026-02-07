import * as cheerio from 'cheerio';
import type { ScrapeConfig, ScrapeResult, ScrapedPage } from './types';
import { DemoData } from './demo-data';

/**
 * Check if all pages in a scrape result failed
 * Used to determine if the system should proceed directly to interview
 * 
 * Requirements: 10.1
 * 
 * Usage in scan flow:
 * ```typescript
 * const scrapeResult = await scraper.scrapeCompany(companyUrl);
 * 
 * if (allPagesFailed(scrapeResult)) {
 *   // All pages failed - proceed directly to interview with empty draft pack
 *   const emptyDraftPack = await extractor.extractFromPages(scrapeResult.pages);
 *   // emptyDraftPack will have all fields with confidence 0
 *   // Continue to interview phase to gather information from founder
 * } else {
 *   // Some pages succeeded - proceed with normal extraction
 *   const draftPack = await extractor.extractFromPages(scrapeResult.pages);
 *   // Continue to interview phase to fill gaps
 * }
 * ```
 * 
 * @param result - The scrape result to check
 * @returns true if all pages failed or no pages were scraped, false otherwise
 */
export function allPagesFailed(result: ScrapeResult): boolean {
  // If no pages were scraped, consider it a complete failure
  if (result.pages.length === 0) {
    return true;
  }
  
  // Check if all pages have success: false
  return result.pages.every(page => !page.success);
}

/**
 * Web scraper for extracting company information from public pages
 * Uses native fetch for HTTP requests and Cheerio for HTML parsing
 * 
 * Requirements:
 * - 1.1: Scrape homepage, about, careers, and blog pages
 * - 1.2: Extract text content using readability extraction
 * - 1.3: Limit to max pages (default 10)
 * - 1.4: Continue processing remaining pages if some fail
 * - 8.1, 8.2, 8.4: Support demo mode with mock data
 * - 10.1: Support complete scrape failure detection
 */
export class Scraper {
  private config: ScrapeConfig;
  private demoMode: boolean;

  constructor(config?: Partial<ScrapeConfig>, demoMode: boolean = false) {
    this.config = {
      maxPages: config?.maxPages ?? 10,
      timeout: config?.timeout ?? 10000, // 10 seconds default
      userAgent: config?.userAgent ?? 'Mozilla/5.0 (compatible; OnboardingIntelligenceBot/1.0)',
    };
    this.demoMode = demoMode;
  }

  /**
   * Scrape company pages starting from the company URL
   * Discovers and scrapes: homepage, /about, /careers, /blog
   * 
   * If demo mode is enabled, returns mock data without making HTTP requests
   * 
   * @param companyUrl - The company's website URL
   * @returns ScrapeResult with successful pages and errors
   * 
   * Requirements: 1.1, 1.3, 1.4, 8.2, 8.4
   */
  async scrapeCompany(companyUrl: string): Promise<ScrapeResult> {
    // If demo mode is enabled, return mock data immediately
    if (this.demoMode) {
      return DemoData.getMockScrapeResult(companyUrl);
    }
    const errors: string[] = [];
    const pages: ScrapedPage[] = [];

    // Normalize the URL
    const baseUrl = this.normalizeUrl(companyUrl);

    // Discover pages to scrape
    const urlsToScrape = this.discoverPages(baseUrl);

    // Limit to maxPages
    const limitedUrls = urlsToScrape.slice(0, this.config.maxPages);

    // Scrape each page
    for (const url of limitedUrls) {
      try {
        const page = await this.scrapePage(url);
        pages.push(page);
        
        if (!page.success && page.error) {
          errors.push(`Failed to scrape ${url}: ${page.error}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to scrape ${url}: ${errorMessage}`);
        
        // Add a failed page entry
        pages.push({
          url,
          title: '',
          content: '',
          scrapedAt: new Date().toISOString(),
          success: false,
          error: errorMessage,
        });
      }
    }

    return {
      pages,
      errors,
    };
  }

  /**
   * Scrape a single page with timeout handling and error catching
   * 
   * @param url - The URL to scrape
   * @returns ScrapedPage with content or error
   * 
   * Requirements: 1.2, 1.4
   */
  private async scrapePage(url: string): Promise<ScrapedPage> {
    const scrapedAt = new Date().toISOString();

    try {
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      // Fetch the page
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': this.config.userAgent,
        },
      });

      clearTimeout(timeoutId);

      // Check if response is OK
      if (!response.ok) {
        return {
          url,
          title: '',
          content: '',
          scrapedAt,
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      // Get the HTML content
      const html = await response.text();

      // Extract readable content
      const { title, content } = this.extractReadableContent(html);

      console.log(`Scraped ${url}: title="${title}", content length=${content.length}`);

      return {
        url,
        title,
        content,
        scrapedAt,
        success: true,
      };
    } catch (error) {
      if (error instanceof Error) {
        // Handle timeout errors
        if (error.name === 'AbortError') {
          return {
            url,
            title: '',
            content: '',
            scrapedAt,
            success: false,
            error: `Timeout after ${this.config.timeout}ms`,
          };
        }

        return {
          url,
          title: '',
          content: '',
          scrapedAt,
          success: false,
          error: error.message,
        };
      }

      return {
        url,
        title: '',
        content: '',
        scrapedAt,
        success: false,
        error: 'Unknown error',
      };
    }
  }

  /**
   * Extract readable content from HTML using Cheerio
   * Removes scripts, styles, navigation, and other non-content elements
   * 
   * @param html - The HTML content to parse
   * @returns Object with title and cleaned text content
   * 
   * Requirements: 1.2
   */
  private extractReadableContent(html: string): { title: string; content: string } {
    const $ = cheerio.load(html);

    // Extract title
    const title = $('title').text().trim() || $('h1').first().text().trim() || '';

    // Remove non-content elements
    $('script').remove();
    $('style').remove();
    $('nav').remove();
    $('header').remove();
    $('footer').remove();
    $('iframe').remove();
    $('noscript').remove();
    $('.navigation').remove();
    $('.nav').remove();
    $('.menu').remove();
    $('.sidebar').remove();
    $('.advertisement').remove();
    $('.ad').remove();
    $('.cookie-banner').remove();
    $('.cookie-notice').remove();

    // Try to find main content area
    let contentElement = $('main');
    if (contentElement.length === 0) {
      contentElement = $('article');
    }
    if (contentElement.length === 0) {
      contentElement = $('.content');
    }
    if (contentElement.length === 0) {
      contentElement = $('#content');
    }
    if (contentElement.length === 0) {
      // Fall back to body
      contentElement = $('body');
    }

    // Extract text content
    let content = contentElement.text();

    // Clean up whitespace
    content = content
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();

    return {
      title,
      content,
    };
  }

  /**
   * Normalize a URL to ensure it has a protocol and no trailing slash
   * 
   * @param url - The URL to normalize
   * @returns Normalized URL
   */
  private normalizeUrl(url: string): string {
    let normalized = url.trim();

    // Add https:// if no protocol
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = `https://${normalized}`;
    }

    // Remove trailing slash
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  }

  /**
   * Discover pages to scrape from a base URL
   * Returns: homepage, /about, /careers, /blog
   * 
   * @param baseUrl - The base company URL
   * @returns Array of URLs to scrape
   * 
   * Requirements: 1.1
   */
  private discoverPages(baseUrl: string): string[] {
    const pages = [
      baseUrl, // Homepage
      `${baseUrl}/about`,
      `${baseUrl}/about-us`,
      `${baseUrl}/careers`,
      `${baseUrl}/jobs`,
      `${baseUrl}/blog`,
      `${baseUrl}/news`,
      `${baseUrl}/company`,
      `${baseUrl}/team`,
      `${baseUrl}/mission`,
    ];

    return pages;
  }
}
