import { LLMWrapper } from './llm-wrapper';
import type { ScrapedPage, ExtractionResult } from './types';
import { ExtractionResultSchema } from './schemas';

/**
 * Extractor - LLM-based extraction of company information from scraped pages
 * 
 * Uses structured prompts with anti-hallucination rules to extract:
 * - Vision, mission, and values
 * - ICP (Ideal Customer Profile) segments
 * - Business model and revenue drivers
 * - Product features and jobs-to-be-done
 * 
 * All extracted information includes:
 * - Confidence scores (0-1)
 * - Citations referencing source URLs
 * 
 * Requirements:
 * - 1.5: Generate Draft Context Pack v0 with extracted information
 * - 1.6: Include confidence scores for all information
 * - 1.7: Include citations for all information
 * - 9.1: Use separate prompts for extraction
 * - 9.2: Define explicit input and output schemas
 * - 9.3: Include instructions to avoid hallucination
 * - 9.7: Extractor prompt summarizes pages into evidence-backed claims
 */
export class Extractor {
  constructor(private llm: LLMWrapper) {}

  /**
   * Extract company information from scraped pages
   * 
   * This method:
   * 1. Filters out failed scrapes
   * 2. Constructs a system prompt with anti-hallucination rules
   * 3. Constructs a user prompt with page content
   * 4. Calls LLM with JSON response format
   * 5. Validates response against ExtractionResult schema
   * 
   * Requirements: 1.5, 1.6, 1.7, 9.1, 9.2, 9.3, 9.7
   * 
   * @param pages - Array of scraped pages (may include failures)
   * @returns ExtractionResult with structured company information
   */
  async extractFromPages(pages: ScrapedPage[]): Promise<ExtractionResult> {
    // Filter to only successful scrapes
    const successfulPages = pages.filter(p => p.success && p.content.length > 0);

    console.log(`Extractor: Total pages: ${pages.length}, Successful pages: ${successfulPages.length}`);
    if (successfulPages.length > 0) {
      console.log(`First successful page content length: ${successfulPages[0].content.length}`);
      console.log(`First successful page URL: ${successfulPages[0].url}`);
    }

    // If no successful pages, return empty extraction with low confidence
    if (successfulPages.length === 0) {
      console.log('Extractor: No successful pages, returning empty extraction');
      return this.createEmptyExtraction();
    }

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(successfulPages);

    // Call LLM with schema validation
    const result = await this.llm.completeWithSchema(
      {
        systemPrompt,
        userPrompt,
        temperature: 0.1, // Low temperature for factual extraction
        responseFormat: 'json',
      },
      ExtractionResultSchema
    );

    return result;
  }

  /**
   * Build the system prompt with anti-hallucination rules
   * 
   * Requirements: 9.3, 9.7
   * 
   * @returns System prompt string
   */
  private buildSystemPrompt(): string {
    return `You are an expert business analyst extracting company information from web pages.

CRITICAL RULES TO PREVENT HALLUCINATION:
1. Only extract information EXPLICITLY STATED in the provided pages
2. Do NOT infer, assume, or generate information not present in the text
3. Do NOT use external knowledge about the company
4. If information is not found, return empty string with confidence 0
5. Use direct quotes from the source when possible

CONFIDENCE SCORING GUIDELINES:
- 0.9-1.0: Information is explicitly and clearly stated with specific details
- 0.7-0.8: Information is stated but somewhat vague or general
- 0.5-0.6: Information is implied or partially stated
- 0.3-0.4: Information is weakly suggested
- 0.0-0.2: Information is not found or highly uncertain

CITATION REQUIREMENTS:
- For each extracted claim, provide a citation with:
  - type: "url"
  - reference: the source URL
  - text: (optional) the relevant excerpt from the page
- Every non-empty field MUST have at least one citation
- Citations must reference actual URLs from the provided pages

OUTPUT FORMAT:
Return a JSON object matching this structure:
{
  "vision": {
    "content": "string (the vision statement)",
    "confidence": { "value": 0.0-1.0, "reason": "why this confidence score" },
    "citations": [{ "type": "url", "reference": "source URL", "text": "relevant excerpt" }]
  },
  "mission": { ... same structure ... },
  "values": [ { ... same structure ... } ],
  "icp": {
    "segments": [
      {
        "name": "segment name",
        "description": { ... same structure ... },
        "painPoints": [ { ... same structure ... } ]
      }
    ]
  },
  "businessModel": {
    "revenueDrivers": [ { ... same structure ... } ],
    "pricingModel": { ... same structure ... }
  },
  "product": {
    "jobsToBeDone": [ { ... same structure ... } ],
    "keyFeatures": [ { ... same structure ... } ]
  }
}

EXTRACTION GUIDELINES:
- Vision: The company's long-term aspirational goal or future state
- Mission: The company's purpose or reason for existing
- Values: Core principles or beliefs that guide the company
- ICP Segments: Target customer groups with their characteristics
- Pain Points: Problems or challenges the customers face
- Revenue Drivers: How the company makes money
- Pricing Model: How the company charges customers
- Jobs-to-be-Done: What customers are trying to accomplish
- Key Features: Main product capabilities or offerings

Remember: Evidence-backed claims only. No hallucination. Always cite sources.`;
  }

  /**
   * Build the user prompt with page content
   * 
   * Requirements: 9.7
   * 
   * @param pages - Successful scraped pages
   * @returns User prompt string
   */
  private buildUserPrompt(pages: ScrapedPage[]): string {
    // Limit content length per page to avoid token limits
    const MAX_CONTENT_LENGTH = 2000;

    const pageContents = pages.map(page => {
      const truncatedContent = page.content.length > MAX_CONTENT_LENGTH
        ? page.content.slice(0, MAX_CONTENT_LENGTH) + '...'
        : page.content;

      return `URL: ${page.url}
Title: ${page.title}
Content: ${truncatedContent}
---`;
    }).join('\n\n');

    return `Extract company information from these pages:

${pageContents}

Extract the following information:
1. Vision statement
2. Mission statement
3. Company values (list)
4. ICP (Ideal Customer Profile) segments with descriptions and pain points
5. Business model: revenue drivers and pricing model
6. Product: jobs-to-be-done and key features

For each piece of information:
- Provide the extracted content
- Assign a confidence score (0-1) based on how clearly it's stated
- Include citations with the source URL and relevant text excerpt
- If not found, use empty string with confidence 0

Return the result as JSON matching the required schema.`;
  }

  /**
   * Create an empty extraction result with low confidence
   * Used when no pages were successfully scraped
   * 
   * Requirements: 1.6, 1.7
   * 
   * @returns Empty ExtractionResult
   */
  private createEmptyExtraction(): ExtractionResult {
    const emptyField = {
      content: '',
      confidence: { value: 0, reason: 'No pages were successfully scraped' },
      citations: [],
    };

    return {
      vision: emptyField,
      mission: emptyField,
      values: [],
      icp: {
        segments: [],
      },
      businessModel: {
        revenueDrivers: [],
        pricingModel: emptyField,
      },
      product: {
        jobsToBeDone: [],
        keyFeatures: [],
      },
    };
  }
}
