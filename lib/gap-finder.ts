import { LLMWrapper } from './llm-wrapper';
import { GapAnalysis, ContextPack } from './types';
import { GapAnalysisSchema } from './schemas';

/**
 * Gap Finder - identifies missing or low-confidence information in a Context Pack
 * 
 * The Gap Finder analyzes a draft Context Pack (v0) to identify fields that are:
 * - Missing (empty or "Information not available")
 * - Low confidence (confidence score < 0.5)
 * - Critical for engineer onboarding
 * 
 * It ranks gaps by importance for helping engineers make user-centric decisions,
 * prioritizing information that connects technical work to business value.
 * 
 * Requirements: 3.1, 3.2, 9.1, 9.2, 9.3, 9.8
 */

/**
 * GapFinder class - analyzes Context Packs to identify knowledge gaps
 * 
 * Requirements:
 * - 3.1: Analyze all fields to identify missing or low-confidence information
 * - 3.2: Rank gaps by importance for engineer onboarding
 * - 9.1: Use separate prompts for gap-finding
 * - 9.2: Define explicit input and output schemas
 * - 9.3: Include instructions to avoid hallucination
 * - 9.8: Gap_Finder_Prompt identifies missing fields and ranks uncertainty
 */
export class GapFinder {
  /**
   * Create a new GapFinder instance
   * 
   * @param llm - LLM wrapper for making API calls
   */
  constructor(private llm: LLMWrapper) {}

  /**
   * Analyze a draft Context Pack to identify knowledge gaps
   * 
   * This method:
   * 1. Examines all fields in the Context Pack
   * 2. Identifies missing or low-confidence information
   * 3. Ranks gaps by importance for engineer decision-making
   * 4. Returns a structured gap analysis with completeness score
   * 
   * Priority ranking focuses on:
   * - ICP/customer needs (highest priority)
   * - Decision rules and engineering priorities
   * - Business model and revenue drivers
   * - Engineering KPIs
   * - Vision/mission/values (lower priority if basic info exists)
   * 
   * Requirements: 3.1, 3.2, 9.1, 9.2, 9.3, 9.8
   * 
   * @param draftPack - Partial Context Pack (typically v0 from public scan)
   * @returns Gap analysis with ranked gaps and completeness score
   * @throws LLMError - If API call fails after retries
   * @throws LLMSchemaValidationError - If response doesn't match schema
   */
  async analyzeGaps(draftPack: Partial<ContextPack>): Promise<GapAnalysis> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(draftPack);

    const gapAnalysis = await this.llm.completeWithSchema(
      {
        systemPrompt,
        userPrompt,
        temperature: 0.2, // Low temperature for consistent analysis
        responseFormat: 'json',
      },
      GapAnalysisSchema
    );

    return gapAnalysis;
  }

  /**
   * Build the system prompt for gap identification
   * 
   * The system prompt:
   * - Defines the role as an expert at identifying missing information
   * - Provides critical rules to prevent hallucination
   * - Explains the ranking criteria (importance for engineer decision-making)
   * - Specifies the output format (JSON matching GapAnalysis schema)
   * 
   * Requirements: 9.1, 9.3, 9.8
   * 
   * @returns System prompt string
   */
  private buildSystemPrompt(): string {
    return `You are an expert at identifying missing information critical for engineer onboarding.

Your goal is to analyze a draft Context Pack and identify gaps that would prevent new engineers from:
1. Understanding who the customers are and what they need
2. Making user-centric decisions when building features
3. Connecting their technical work to business value
4. Knowing what to prioritize and what to avoid building

CRITICAL RULES:
1. Analyze the provided Context Pack for missing or low-confidence fields
2. Rank gaps by importance for helping engineers make user-centric decisions
3. Focus on information that connects technical work to business value
4. Do NOT infer or assume information - only identify what is missing or uncertain
5. Do NOT hallucinate gaps - only report actual missing or low-confidence fields
6. Assign importance scores (1-10) based on impact on engineer decision-making

IMPORTANCE RANKING CRITERIA:
- 9-10: Critical for user-centric decisions (ICP segments, customer pain points, decision rules)
- 7-8: Important for business context (business model, revenue drivers, engineering KPIs)
- 5-6: Helpful for understanding (product features, jobs-to-be-done)
- 3-4: Nice to have (values, mission details)
- 1-2: Low priority (minor details, already covered elsewhere)

PRIORITIZE THESE AREAS (in order):
1. ICP/customer needs - Who are the customers? What problems do they have?
2. Decision rules - What should engineers prioritize? What should they avoid?
3. Engineering KPIs - How is technical work measured against business outcomes?
4. Business model - How does the company make money? What drives revenue?
5. Product/jobs-to-be-done - What value does the product provide?
6. Vision/mission/values - Why does the company exist? (lower priority if basics exist)

CONFIDENCE THRESHOLDS:
- Missing field (empty or "Information not available"): Always a gap
- Confidence < 0.3: High priority gap
- Confidence 0.3-0.5: Medium priority gap
- Confidence > 0.5: Not a gap (sufficient information)

OUTPUT FORMAT:
Return a JSON object matching this schema:
{
  "gaps": [
    {
      "field": "string (field path, e.g., 'icp.segments', 'decisionRules.priorities')",
      "category": "string (vision, icp, business-model, engineering-kpis, decision-rules)",
      "importance": number (1-10, based on criteria above),
      "reason": "string (why this gap matters for engineer decision-making)",
      "currentConfidence": number (0-1, current confidence score of the field)
    }
  ],
  "completeness": number (0-1, overall completeness score for the Context Pack)
}

COMPLETENESS CALCULATION:
- Count total critical fields (vision, mission, icp.segments, businessModel, decisionRules, engineeringKPIs)
- Calculate: (fields with confidence > 0.5) / (total critical fields)
- Return as a number between 0 and 1

Remember: Your analysis helps founders understand what information is most critical for engineer onboarding. Focus on gaps that would prevent engineers from making good decisions.`;
  }

  /**
   * Build the user prompt with the draft Context Pack
   * 
   * The user prompt:
   * - Provides the draft Context Pack as JSON
   * - Asks for gap identification
   * - Reminds the LLM to focus on engineer decision-making
   * 
   * Requirements: 9.1, 9.8
   * 
   * @param draftPack - Partial Context Pack to analyze
   * @returns User prompt string
   */
  private buildUserPrompt(draftPack: Partial<ContextPack>): string {
    return `Analyze this draft Context Pack and identify critical gaps:

${JSON.stringify(draftPack, null, 2)}

Identify missing or low-confidence fields that would help engineers understand:
- Who the customers are and what they need
- What business value different features provide
- What to prioritize and what to avoid building
- How their technical work connects to business outcomes

Focus on gaps that matter most for engineer decision-making. Rank them by importance.`;
  }
}

/**
 * Create a default GapFinder instance using environment variables
 * 
 * Requirements: 13.1
 * 
 * @returns GapFinder instance
 * @throws LLMAuthError if OPENAI_API_KEY is not set
 */
export function createDefaultGapFinder(): GapFinder {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
  const llm = new LLMWrapper(apiKey, model);

  return new GapFinder(llm);
}
