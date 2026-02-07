import { LLMWrapper } from './llm-wrapper';
import {
  PackBuildRequest,
  ContextPack,
  InterviewAnswer,
  InterviewQuestion,
} from './types';
import {
  PackBuildRequestSchema,
  ContextPackSchema,
} from './schemas';

/**
 * PackBuilder - Merges draft context pack with interview answers
 * 
 * Combines information from:
 * 1. Draft Context Pack v0 (from public signal scan)
 * 2. Founder interview answers
 * 
 * Merging rules:
 * - Prioritize founder answers over public scan data
 * - Update confidence scores (founder answers = 0.9+)
 * - Add appropriate citations (URLs for public scan, categories for interviews)
 * - Mark unavailable information explicitly
 * - Generate human-readable summary
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 9.1, 9.2, 9.3, 9.10
 */
export class PackBuilder {
  constructor(private llm: LLMWrapper) {}

  /**
   * Build final context pack by merging draft pack with interview answers
   * 
   * This method:
   * 1. Validates the build request
   * 2. Constructs system prompt with merging rules
   * 3. Constructs user prompt with draft pack and interview Q&A
   * 4. Calls LLM with JSON response format
   * 5. Validates response against ContextPack schema
   * 6. Updates version and timestamp
   * 
   * Requirements:
   * - 5.1: Merge draft pack with founder answers
   * - 5.2: Prioritize founder answers over public scan
   * - 5.3: Update confidence scores based on source
   * - 5.4: Ensure all sections are populated
   * - 5.5: Mark unavailable information explicitly
   * - 5.6: Generate structured JSON and human-readable summary
   * - 5.7: Store final context pack
   * - 9.1: Use separate prompt for pack building
   * - 9.2: Define explicit input/output schemas
   * - 9.3: Include instructions to avoid hallucination
   * - 9.10: Merge all information into final structured pack
   * 
   * @param request - Pack build request with draft pack and interview data
   * @returns Final Context Pack v1
   */
  async buildFinalPack(request: PackBuildRequest): Promise<ContextPack> {
    // Validate request
    const validatedRequest = PackBuildRequestSchema.parse(request);

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(validatedRequest);

    // Call LLM with schema validation
    const pack = await this.llm.completeWithSchema(
      {
        systemPrompt,
        userPrompt,
        temperature: 0.2, // Low temperature for accurate merging
        responseFormat: 'json',
      },
      ContextPackSchema
    );

    // Update version and timestamp
    pack.version = 'v1';
    pack.updatedAt = new Date().toISOString();

    return pack;
  }

  /**
   * Build the system prompt with merging rules
   * 
   * Requirements: 5.2, 5.3, 5.5, 9.3, 9.10
   * 
   * @returns System prompt string
   */
  private buildSystemPrompt(): string {
    return `You are an expert at synthesizing company information into a comprehensive context pack for engineer onboarding.

CRITICAL RULES TO PREVENT HALLUCINATION:
1. Only use information from the provided draft pack and interview answers
2. Do NOT infer, assume, or generate information not present in the inputs
3. Do NOT use external knowledge about the company
4. Merge information accurately without adding new claims
5. When in doubt, preserve the original information

MERGING RULES:
1. PRIORITIZATION: Founder interview answers ALWAYS override public scan data for conflicts
2. CONFIDENCE SCORES:
   - Founder interview answers: Set confidence to 0.9 or higher
   - Public scan data (unchanged): Keep original confidence scores
   - Missing information: Set confidence to 0.0
3. CITATIONS:
   - Founder interview answers: Use citation type "interview" with category reference
   - Public scan data: Preserve existing "url" citations
   - Combined information: Include both citation types
4. UNAVAILABLE INFORMATION:
   - If a field has no data from either source, set content to "Information not available"
   - Set confidence to 0.0 with reason "Not provided in public scan or interview"
   - Use empty citations array

FIELD POPULATION REQUIREMENTS:
- ALL required fields must be present in the output
- Empty arrays are acceptable for list fields if no information is available
- Single fields (vision, mission, etc.) must have content (use "Information not available" if needed)
- Ensure decision rules clearly state what TO build and what NOT to build
- Ensure engineering KPIs connect technical work to business outcomes

SUMMARY GENERATION:
- Generate a comprehensive 2-3 paragraph human-readable summary
- Cover: company vision, target customers, business model, and engineering priorities
- Write in clear, professional language suitable for new engineers
- Focus on information that helps engineers make user-centric decisions

OUTPUT FORMAT:
Return a complete ContextPack JSON object with ALL required fields:
{
  "id": "string (preserve from draft pack)",
  "companyName": "string",
  "companyUrl": "string",
  "version": "v1",
  "createdAt": "string (preserve from draft pack)",
  "updatedAt": "string (current timestamp)",
  "vision": {
    "content": "string",
    "confidence": { "value": 0.0-1.0, "reason": "optional" },
    "citations": [{ "type": "url|interview|section", "reference": "string", "text": "optional" }]
  },
  "mission": { ... same structure ... },
  "values": [ { ... same structure ... } ],
  "icp": {
    "segments": [
      {
        "name": "string",
        "description": { ... same structure ... },
        "painPoints": [ { ... same structure ... } ]
      }
    ],
    "evolution": { ... same structure ... }
  },
  "businessModel": {
    "revenueDrivers": [ { ... same structure ... } ],
    "pricingModel": { ... same structure ... },
    "keyMetrics": [ { ... same structure ... } ]
  },
  "product": {
    "jobsToBeDone": [ { ... same structure ... } ],
    "keyFeatures": [ { ... same structure ... } ]
  },
  "decisionRules": {
    "priorities": [ { ... same structure ... } ],
    "antiPatterns": [ { ... same structure ... } ]
  },
  "engineeringKPIs": [ { ... same structure ... } ],
  "summary": "string (2-3 paragraphs)"
}

QUALITY CHECKS:
- Verify all confidence scores are between 0.0 and 1.0
- Verify all citations have valid type and reference
- Verify founder-sourced information has confidence >= 0.9
- Verify unavailable fields have confidence = 0.0
- Verify summary is comprehensive and helpful for engineers`;
  }

  /**
   * Build the user prompt with draft pack and interview data
   * 
   * Requirements: 5.1, 5.2, 9.10
   * 
   * @param request - Validated pack build request
   * @returns User prompt string
   */
  private buildUserPrompt(request: PackBuildRequest): string {
    const draftPackSection = this.formatDraftPack(request.draftPack);
    const interviewSection = this.formatInterview(
      request.questions,
      request.interviewAnswers
    );

    return `Merge the following information into a final context pack:

${draftPackSection}

${interviewSection}

MERGING INSTRUCTIONS:
1. Start with the draft pack structure
2. For each interview answer:
   - Identify which field(s) it relates to based on the question category
   - Update those fields with the founder's answer
   - Set confidence to 0.9+ for founder-provided information
   - Add citation with type "interview" and reference to the question category
3. For fields with no interview answer:
   - Keep the draft pack information if available
   - Use "Information not available" with confidence 0.0 if not available
4. Generate a comprehensive summary that helps engineers understand:
   - What the company is building and why
   - Who the customers are and what they need
   - How to prioritize work and make decisions
   - What metrics indicate success

Create a complete context pack that enables engineers to make user-centric decisions.`;
  }

  /**
   * Format draft pack for user prompt
   * 
   * @param draftPack - Partial context pack from public scan
   * @returns Formatted draft pack string
   */
  private formatDraftPack(draftPack: Partial<ContextPack>): string {
    return `DRAFT CONTEXT PACK (from public signal scan):
${JSON.stringify(draftPack, null, 2)}

NOTE: This draft pack may have:
- Low confidence scores for uncertain information
- Missing fields (not all information found on public pages)
- URL citations referencing source web pages`;
  }

  /**
   * Format interview questions and answers for user prompt
   * 
   * @param questions - Interview questions
   * @param answers - Founder's answers
   * @returns Formatted interview string
   */
  private formatInterview(
    questions: InterviewQuestion[],
    answers: InterviewAnswer[]
  ): string {
    if (questions.length === 0 || answers.length === 0) {
      return `INTERVIEW Q&A: No interview was conducted.

NOTE: Use only the draft pack information.`;
    }

    // Create a map of question ID to question for easy lookup
    const questionMap = new Map(questions.map(q => [q.id, q]));

    // Format each Q&A pair
    const qaPairs = answers.map((answer, index) => {
      const question = questionMap.get(answer.questionId);
      if (!question) {
        return `${index + 1}. [Question not found for answer ID: ${answer.questionId}]`;
      }

      return `${index + 1}. CATEGORY: ${question.category}
   PRIORITY: ${question.priority}/10
   QUESTION: ${question.question}
   ${question.context ? `CONTEXT: ${question.context}\n   ` : ''}ANSWER: ${answer.skipped ? '[SKIPPED - No information provided]' : answer.answer}
   ANSWERED AT: ${answer.answeredAt}`;
    }).join('\n\n');

    return `INTERVIEW Q&A (${answers.length} questions):

${qaPairs}

NOTE: These are founder's direct answers. They should:
- Override any conflicting information from the draft pack
- Have high confidence scores (0.9+)
- Be cited with type "interview" and the question category as reference
- Skipped questions mean no information was provided by the founder`;
  }
}

/**
 * Create a default PackBuilder instance
 * 
 * @param llm - LLM wrapper instance
 * @returns PackBuilder instance
 */
export function createPackBuilder(llm: LLMWrapper): PackBuilder {
  return new PackBuilder(llm);
}
