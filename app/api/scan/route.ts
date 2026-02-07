import { NextRequest, NextResponse } from 'next/server';
import { Scraper, allPagesFailed } from '@/lib/scraper';
import { Extractor } from '@/lib/extractor';
import { LLMWrapper } from '@/lib/llm-wrapper';
import { createDefaultStorage } from '@/lib/storage';
import { DemoData } from '@/lib/demo-data';
import { ScanRequestSchema } from '@/lib/schemas';
import type { ContextPack, ExtractionResult } from '@/lib/types';
import { z } from 'zod';

/**
 * POST /api/scan
 * 
 * Scan a company's public web pages and create a draft Context Pack v0
 * 
 * Flow:
 * 1. Validate request (company URL, optional name, demo mode flag)
 * 2. If demo mode: return mock data immediately
 * 3. If live mode:
 *    a. Scrape company pages (homepage, about, careers, blog)
 *    b. Extract information using LLM
 *    c. Create draft pack v0 with extracted data
 * 4. Save draft pack to storage
 * 5. Return pack ID and draft pack
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 8.1, 8.2, 8.4, 10.1
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedRequest = ScanRequestSchema.parse(body);
    
    const { companyUrl, companyName, demoMode } = validatedRequest;
    
    // If demo mode is enabled, return mock data immediately
    if (demoMode) {
      return handleDemoMode(companyUrl, companyName);
    }
    
    // Live mode: perform actual scraping and extraction
    return await handleLiveMode(companyUrl, companyName);
    
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Handle demo mode - return mock data without scraping or LLM calls
 * Requirements: 8.2, 8.4
 */
function handleDemoMode(companyUrl: string, companyName?: string) {
  try {
    // Get mock scrape result
    const scrapeResult = DemoData.getMockScrapeResult(companyUrl);
    
    // Determine company name from URL or use provided name
    const resolvedCompanyName = companyName || extractCompanyNameFromUrl(companyUrl);
    
    // Get mock context pack
    const draftPack = DemoData.getMockContextPack(resolvedCompanyName);
    
    // Override version to v0 for draft pack
    draftPack.version = 'v0';
    draftPack.companyUrl = companyUrl;
    if (companyName) {
      draftPack.companyName = companyName;
    }
    
    // Save draft pack to storage
    const storage = createDefaultStorage();
    storage.saveContextPack(draftPack).catch(err => {
      console.error('Failed to save demo draft pack:', err);
    });
    
    return NextResponse.json({
      packId: draftPack.id,
      draftPack,
      scrapedPages: scrapeResult.pages.length,
      errors: scrapeResult.errors,
    });
    
  } catch (error) {
    console.error('Error in demo mode:', error);
    return NextResponse.json(
      { error: 'Failed to generate demo data' },
      { status: 500 }
    );
  }
}

/**
 * Handle live mode - perform actual scraping and extraction
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 10.1
 */
async function handleLiveMode(companyUrl: string, companyName?: string) {
  try {
    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable or use demo mode.' },
        { status: 500 }
      );
    }
    
    // Initialize components
    const scraper = new Scraper();
    const llm = new LLMWrapper(apiKey);
    const extractor = new Extractor(llm);
    const storage = createDefaultStorage();
    
    // Step 1: Scrape company pages
    console.log(`Scraping company pages for: ${companyUrl}`);
    const scrapeResult = await scraper.scrapeCompany(companyUrl);
    
    // Check if all pages failed (Requirement 10.1)
    if (allPagesFailed(scrapeResult)) {
      console.warn('All pages failed to scrape. Proceeding with empty draft pack.');
    }
    
    // Step 2: Extract information from scraped pages
    console.log(`Extracting information from ${scrapeResult.pages.length} pages`);
    const extractionResult = await extractor.extractFromPages(scrapeResult.pages);
    
    // Check if extraction returned empty results (e.g., SPA with no server-rendered content)
    const hasAnyContent = extractionResult.vision.content || 
                          extractionResult.mission.content || 
                          extractionResult.values.length > 0 ||
                          extractionResult.icp.segments.length > 0;
    
    if (!hasAnyContent && scrapeResult.pages.length > 0) {
      console.warn('No content extracted from pages. This may be a JavaScript-heavy SPA.');
      // Add a helpful error message
      scrapeResult.errors.push(
        'Unable to extract content from the website. This may be because the site uses JavaScript to render content. ' +
        'Try using Demo Mode to see how the system works, or provide a different website URL.'
      );
    }
    
    // Step 3: Create draft pack v0
    const draftPack = createDraftPack(
      companyUrl,
      companyName || extractCompanyNameFromUrl(companyUrl),
      extractionResult
    );
    
    // Step 4: Save draft pack to storage
    console.log(`Saving draft pack with ID: ${draftPack.id}`);
    await storage.saveContextPack(draftPack);
    
    // Step 5: Return response
    return NextResponse.json({
      packId: draftPack.id,
      draftPack,
      scrapedPages: scrapeResult.pages.filter(p => p.success).length,
      errors: scrapeResult.errors,
    });
    
  } catch (error) {
    console.error('Error in live mode:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'OpenAI API authentication failed. Please check your API key.' },
          { status: 500 }
        );
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'OpenAI API rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: `Failed to scan company: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred during scanning' },
      { status: 500 }
    );
  }
}

/**
 * Create a draft Context Pack v0 from extraction results
 * Requirements: 1.5, 1.6, 1.7
 */
function createDraftPack(
  companyUrl: string,
  companyName: string,
  extraction: ExtractionResult
): ContextPack {
  const timestamp = new Date().toISOString();
  const packId = generatePackId(companyName);
  
  // Create empty fields for sections not in extraction result
  const emptyField = {
    content: '',
    confidence: { value: 0, reason: 'Not extracted from public pages' },
    citations: [],
  };
  
  return {
    id: packId,
    companyName,
    companyUrl,
    version: 'v0',
    createdAt: timestamp,
    updatedAt: timestamp,
    
    // From extraction
    vision: extraction.vision,
    mission: extraction.mission,
    values: extraction.values,
    
    icp: {
      segments: extraction.icp.segments,
      evolution: emptyField, // Not extracted from public pages
    },
    
    businessModel: {
      revenueDrivers: extraction.businessModel.revenueDrivers,
      pricingModel: extraction.businessModel.pricingModel,
      keyMetrics: [], // Not typically on public pages
    },
    
    product: {
      jobsToBeDone: extraction.product.jobsToBeDone,
      keyFeatures: extraction.product.keyFeatures,
    },
    
    // These sections require founder input
    decisionRules: {
      priorities: [],
      antiPatterns: [],
    },
    
    engineeringKPIs: [],
    
    // Generate a basic summary
    summary: generateSummary(companyName, extraction),
  };
}

/**
 * Generate a pack ID from company name
 */
function generatePackId(companyName: string): string {
  const normalized = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  const timestamp = Date.now();
  return `${normalized}-${timestamp}`;
}

/**
 * Extract company name from URL
 */
function extractCompanyNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const hostname = urlObj.hostname.replace(/^www\./, '');
    const parts = hostname.split('.');
    
    // Take the first part (domain name without TLD)
    const name = parts[0];
    
    // Capitalize first letter
    if (name) {
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return 'Unknown Company';
  } catch {
    return 'Unknown Company';
  }
}

/**
 * Generate a basic summary from extraction results
 */
function generateSummary(companyName: string, extraction: ExtractionResult): string {
  const parts: string[] = [];
  
  parts.push(`${companyName} - Draft Context Pack v0`);
  parts.push('');
  
  if (extraction.mission.content) {
    parts.push(`Mission: ${extraction.mission.content}`);
  }
  
  if (extraction.vision.content) {
    parts.push(`Vision: ${extraction.vision.content}`);
  }
  
  if (extraction.icp.segments.length > 0) {
    parts.push('');
    parts.push('Target Customers:');
    extraction.icp.segments.forEach(segment => {
      parts.push(`- ${segment.name}: ${segment.description.content}`);
    });
  }
  
  if (extraction.product.jobsToBeDone.length > 0) {
    parts.push('');
    parts.push('Jobs to be Done:');
    extraction.product.jobsToBeDone.forEach(job => {
      parts.push(`- ${job.content}`);
    });
  }
  
  parts.push('');
  parts.push('Note: This is a draft pack (v0) based on public information. Complete the interview to create the final pack (v1) with founder insights.');
  
  return parts.join('\n');
}

/**
 * Handle errors and return appropriate responses
 */
function handleError(error: unknown) {
  console.error('Error in /api/scan:', error);
  
  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'Invalid request',
        details: error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
      { status: 400 }
    );
  }
  
  // Handle generic errors
  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
  
  // Unknown error
  return NextResponse.json(
    { error: 'An unexpected error occurred' },
    { status: 500 }
  );
}
