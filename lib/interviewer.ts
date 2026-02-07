import { LLMWrapper } from './llm-wrapper';
import { DemoData } from './demo-data';
import {
  QuestionGenerationRequest,
  QuestionGenerationResult,
  InterviewSession,
  InterviewAnswer,
  InterviewQuestion,
} from './types';
import {
  QuestionGenerationRequestSchema,
  QuestionGenerationResultSchema,
} from './schemas';

/**
 * Interviewer - Adaptive interview logic for founder Q&A
 * 
 * Generates targeted questions based on identified gaps and adapts
 * subsequent questions based on founder answers. Implements stopping
 * criteria to avoid asking unnecessary questions.
 * 
 * Requirements: 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 8.5, 9.1, 9.2, 9.3, 9.9
 */
export class Interviewer {
  private demoMode: boolean;

  constructor(private llm: LLMWrapper, demoMode: boolean = false) {
    this.demoMode = demoMode;
  }

  /**
   * Generate interview questions based on identified gaps
   * 
   * Uses LLM to generate 5-12 targeted questions grouped by category.
   * Questions are prioritized based on importance for engineer onboarding.
   * Includes stopping criteria to determine when sufficient information is gathered.
   * 
   * If demo mode is enabled, returns pre-defined questions without making LLM calls.
   * 
   * Requirements:
   * - 3.3: Group questions by category
   * - 3.4: Generate 5-12 questions based on gaps
   * - 3.5: Adapt questions based on previous answers
   * - 3.6: Include stopping criteria
   * - 8.5: Use pre-defined questions in demo mode
   * - 9.1: Use separate prompt for interviewing
   * - 9.2: Define explicit input/output schemas
   * - 9.3: Include instructions to avoid hallucination
   * - 9.9: Generate next best question with stopping criteria
   * 
   * @param request - Question generation request with gaps and previous answers
   * @returns Question generation result with questions and stopping criteria
   */
  async generateQuestions(
    request: QuestionGenerationRequest
  ): Promise<QuestionGenerationResult> {
    // If demo mode is enabled, return mock questions immediately
    if (this.demoMode) {
      const mockQuestions = DemoData.getMockInterviewQuestions();
      return {
        questions: mockQuestions,
        shouldStop: false,
        reason: 'Demo mode: using pre-defined questions',
      };
    }
    // Validate request
    const validatedRequest = QuestionGenerationRequestSchema.parse(request);

    const systemPrompt = `You are an expert business consultant conducting an interview to understand a startup.

CRITICAL RULES:
1. Generate between 5 and 12 targeted questions based on identified gaps
2. Group questions by category: vision, icp, business-model, engineering-kpis, decision-rules
3. Prioritize questions that help engineers understand customer needs and business value
4. Ask specific, actionable questions (not vague or philosophical)
5. Adapt questions based on previous answers to avoid redundancy
6. Stop early if sufficient information is gathered (set shouldStop: true)
7. Do NOT infer, assume, or hallucinate information
8. Each question must have a unique ID, category, question text, optional context, and priority (1-10)

QUESTION QUALITY GUIDELINES:
- GOOD: "What are the top 3 pain points your ICP faces that your product solves?"
- BAD: "What is your vision?" (too vague)
- GOOD: "What metrics indicate whether a feature is delivering business value?"
- BAD: "How do you measure success?" (too broad)
- GOOD: "What types of features should engineers avoid building, and why?"
- BAD: "What are your priorities?" (too general)

STOPPING CRITERIA:
- If most high-importance gaps (importance >= 8) are addressed by previous answers, set shouldStop: true
- If previous answers provide comprehensive information across all categories, set shouldStop: true
- If fewer than 5 meaningful gaps remain, set shouldStop: true
- Otherwise, set shouldStop: false

CATEGORY GUIDELINES:
- vision: Questions about company vision, mission, values, long-term goals
- icp: Questions about ideal customer profile, customer segments, pain points, customer evolution
- business-model: Questions about revenue drivers, pricing model, key business metrics
- engineering-kpis: Questions about engineering metrics, technical priorities, quality standards
- decision-rules: Questions about what to build/not build, prioritization criteria, anti-patterns

OUTPUT FORMAT: JSON matching this schema:
{
  "questions": [
    {
      "id": "unique-id",
      "category": "vision" | "icp" | "business-model" | "engineering-kpis" | "decision-rules",
      "question": "specific question text",
      "context": "optional context about why this question matters",
      "priority": 1-10 (10 = highest priority)
    }
  ],
  "shouldStop": boolean,
  "reason": "optional explanation for stopping or continuing"
}`;

    const userPrompt = this.buildUserPrompt(validatedRequest);

    // Call LLM with schema validation
    const result = await this.llm.completeWithSchema(
      {
        systemPrompt,
        userPrompt,
        temperature: 0.3, // Lower temperature for more focused questions
        responseFormat: 'json',
      },
      QuestionGenerationResultSchema
    );

    return result;
  }

  /**
   * Get the next question in an interview session
   * 
   * Manages interview session state by:
   * 1. Adding new answer to session (if provided)
   * 2. Checking if interview is complete
   * 3. Returning next question or null if complete
   * 
   * Requirements:
   * - 4.1: Present questions one at a time
   * - 4.2: Store answer with question category reference
   * - 4.3: Determine next best question based on remaining gaps
   * - 4.4: Conclude interview when stopping criteria met
   * 
   * @param session - Current interview session state
   * @param newAnswer - Optional new answer to add to session
   * @returns Next question or null if interview is complete
   */
  async getNextQuestion(
    session: InterviewSession,
    newAnswer?: InterviewAnswer
  ): Promise<InterviewQuestion | null> {
    // Add new answer to session if provided
    if (newAnswer) {
      session.answers.push(newAnswer);
      session.currentQuestionIndex++;
    }

    // Check if interview is complete
    if (session.completed) {
      return null;
    }

    // Check if all questions have been answered
    if (session.currentQuestionIndex >= session.questions.length) {
      session.completed = true;
      return null;
    }

    // Return next question
    const nextQuestion = session.questions[session.currentQuestionIndex];
    return nextQuestion;
  }

  /**
   * Build user prompt for question generation
   * 
   * @param request - Question generation request
   * @returns Formatted user prompt
   */
  private buildUserPrompt(request: QuestionGenerationRequest): string {
    const gapsSection = this.formatGaps(request.gaps);
    const answersSection = this.formatPreviousAnswers(request.previousAnswers);

    return `Generate interview questions to fill these gaps:

${gapsSection}

${answersSection}

Maximum questions to generate: ${request.maxQuestions}

Generate questions that will help engineers understand:
1. Who the customers are and what they need (ICP)
2. What business value different features provide (business model)
3. What to prioritize and what to avoid building (decision rules)
4. What metrics indicate success (engineering KPIs)
5. The company's long-term direction (vision)

Remember to:
- Ask specific, actionable questions
- Avoid redundancy with previous answers
- Prioritize high-importance gaps
- Include stopping criteria assessment`;
  }

  /**
   * Format gaps for user prompt
   * 
   * @param gaps - Array of identified gaps
   * @returns Formatted gaps string
   */
  private formatGaps(gaps: any[]): string {
    if (gaps.length === 0) {
      return 'No gaps identified - all information is complete.';
    }

    const sortedGaps = [...gaps].sort((a, b) => b.importance - a.importance);
    
    return `IDENTIFIED GAPS (sorted by importance):
${sortedGaps.map((gap, index) => `
${index + 1}. Field: ${gap.field}
   Category: ${gap.category}
   Importance: ${gap.importance}/10
   Current Confidence: ${gap.currentConfidence.toFixed(2)}
   Reason: ${gap.reason}
`).join('')}`;
  }

  /**
   * Format previous answers for user prompt
   * 
   * @param answers - Array of previous answers
   * @returns Formatted answers string
   */
  private formatPreviousAnswers(answers: InterviewAnswer[]): string {
    if (answers.length === 0) {
      return 'PREVIOUS ANSWERS: None - this is the first question generation.';
    }

    return `PREVIOUS ANSWERS (${answers.length} total):
${answers.map((answer, index) => `
${index + 1}. Question ID: ${answer.questionId}
   Skipped: ${answer.skipped}
   Answer: ${answer.skipped ? '[SKIPPED]' : answer.answer.slice(0, 200)}${answer.answer.length > 200 ? '...' : ''}
   Answered At: ${answer.answeredAt}
`).join('')}

NOTE: Consider these answers when generating new questions to avoid redundancy.`;
  }
}

/**
 * Create a default Interviewer instance
 * 
 * @param llm - LLM wrapper instance
 * @param demoMode - Whether to use demo mode (default: false)
 * @returns Interviewer instance
 */
export function createInterviewer(llm: LLMWrapper, demoMode: boolean = false): Interviewer {
  return new Interviewer(llm, demoMode);
}
