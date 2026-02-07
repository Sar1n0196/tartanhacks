import { LLMWrapper } from './llm-wrapper';
import { Storage } from './storage';
import { ChatRequest, ChatResponse, ChatMessage, ContextPack } from './types';
import { ChatResponseSchema } from './schemas';

/**
 * Chat Engine for answering engineer questions using Context Pack
 * 
 * The ChatEngine provides a grounded chat interface where engineers can ask
 * questions about the company and receive answers based solely on the Context Pack.
 * All answers include citations, confidence scores, and "why this matters" explanations.
 * 
 * Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 9.1, 9.2, 9.3, 9.11
 */
export class ChatEngine {
  constructor(
    private llm: LLMWrapper,
    private storage: Storage
  ) {}

  /**
   * Answer an engineer's question using the Context Pack
   * 
   * This method:
   * 1. Loads the Context Pack from storage
   * 2. Constructs a system prompt with anti-hallucination rules
   * 3. Includes conversation history for context
   * 4. Generates an answer grounded only in the Context Pack
   * 5. Validates the response includes citations and "why this matters"
   * 
   * Requirements:
   * - 6.2: Generate answer using only Context Pack information
   * - 6.3: Include citations referencing Context Pack sections
   * - 6.4: Explicitly state when information is unavailable
   * - 6.5: Include "Why this matters" explanation
   * - 6.6: Maintain conversation history
   * - 6.7: Do NOT generate answers from external information
   * - 9.1: Use separate prompt for chat responses
   * - 9.2: Define explicit input and output schemas
   * - 9.3: Include instructions to avoid hallucination
   * - 9.11: Answer engineer questions grounded only in Context Pack with citations
   * 
   * @param request - Chat request with packId, question, and conversation history
   * @returns Chat response with answer, citations, whyItMatters, and confidence
   * @throws Error if Context Pack not found or LLM call fails
   */
  async answerQuestion(request: ChatRequest): Promise<ChatResponse> {
    // Load Context Pack from storage
    const pack = await this.storage.getContextPack(request.packId);
    
    if (!pack) {
      throw new Error(`Context pack not found: ${request.packId}`);
    }

    // Construct system prompt with anti-hallucination rules
    const systemPrompt = this.buildSystemPrompt();

    // Construct user prompt with Context Pack and question
    const userPrompt = this.buildUserPrompt(pack, request.question, request.conversationHistory);

    // Make LLM call with schema validation
    const response = await this.llm.completeWithSchema(
      {
        systemPrompt,
        userPrompt,
        temperature: 0.3,
        responseFormat: 'json',
      },
      ChatResponseSchema
    );

    return response;
  }

  /**
   * Build the system prompt for the chat engine
   * 
   * The system prompt establishes the rules for answering questions:
   * - Answer ONLY from the Context Pack
   * - Include citations for all claims
   * - Add "Why this matters" explanations
   * - Explicitly state when information is unavailable
   * - Provide confidence scores
   * 
   * Requirements: 6.2, 6.3, 6.4, 6.5, 6.7, 9.3
   * 
   * @returns System prompt string
   * @private
   */
  private buildSystemPrompt(): string {
    return `You are an onboarding assistant helping new engineers understand their company.

CRITICAL RULES:
1. Answer ONLY using information from the provided context pack
2. If information is not in the context pack, explicitly state: "This information is not available in the context pack"
3. Do NOT infer, assume, or use external knowledge
4. Do NOT make up information or fill in gaps with plausible-sounding content
5. Always include citations referencing specific context pack sections
6. Always include a "Why this matters" explanation connecting the answer to business impact or customer value
7. Provide confidence scores based on the underlying data confidence in the context pack
8. Be concise but thorough - aim for clarity over brevity

ANSWER FORMAT:
Your response must be valid JSON matching this structure:
{
  "answer": "Direct answer to the question using only context pack information",
  "citations": [
    {
      "type": "section",
      "reference": "vision" | "mission" | "values" | "icp" | "businessModel" | "product" | "decisionRules" | "engineeringKPIs",
      "text": "Optional: specific text from the context pack that supports this claim"
    }
  ],
  "whyItMatters": "Explanation of how this information connects to business value, customer impact, or engineering decisions. Help the engineer understand why this matters for their work.",
  "confidence": {
    "value": 0.0-1.0,
    "reason": "Optional: explanation of confidence level based on context pack data quality"
  }
}

CITATION GUIDELINES:
- Use "section" type for all citations
- Reference the top-level section name (vision, mission, values, icp, businessModel, product, decisionRules, engineeringKPIs)
- Include specific text from the context pack when possible
- Every factual claim should have at least one citation

WHY IT MATTERS GUIDELINES:
- Connect the answer to customer needs, business value, or engineering priorities
- Help engineers understand how this information affects their decision-making
- Be specific about the impact (e.g., "This helps you prioritize features that solve the most painful customer problems")
- Keep it concise (2-3 sentences)

CONFIDENCE GUIDELINES:
- Base confidence on the underlying context pack field confidence scores
- If multiple fields are referenced, use the lowest confidence score
- If information is unavailable, use confidence 0.0
- If information is from founder interviews, confidence should be 0.9+
- If information is from public scan with low confidence, reflect that in your score

CONVERSATION HISTORY:
- Use conversation history to understand context and follow-up questions
- Maintain consistency with previous answers
- Reference previous answers when relevant

EXAMPLES OF GOOD ANSWERS:
Q: "Who are our target customers?"
A: {
  "answer": "Our target customers are early-stage B2B SaaS founders who are struggling with engineer onboarding. They typically have 2-5 engineers and are experiencing knowledge bottlenecks where founders spend too much time explaining company context.",
  "citations": [
    {"type": "section", "reference": "icp", "text": "early-stage B2B SaaS founders"}
  ],
  "whyItMatters": "Understanding our ICP helps you make user-centric decisions when building features. When you know the customer is a time-constrained founder, you'll prioritize automation and self-service over features that require manual intervention.",
  "confidence": {"value": 0.9, "reason": "Based on founder interview"}
}

Q: "What should I prioritize when building new features?"
A: {
  "answer": "Prioritize features that reduce founder time spent on onboarding and help engineers make autonomous, user-centric decisions. Avoid building features that require extensive founder involvement or don't connect technical work to business value.",
  "citations": [
    {"type": "section", "reference": "decisionRules", "text": "reduce founder time"},
    {"type": "section", "reference": "decisionRules", "text": "autonomous, user-centric decisions"}
  ],
  "whyItMatters": "These priorities ensure your engineering work directly addresses our customers' biggest pain point: founder time constraints. Every feature you build should either save founder time or improve engineer autonomy.",
  "confidence": {"value": 0.95, "reason": "Based on explicit decision rules from founder"}
}

EXAMPLES OF HANDLING UNAVAILABLE INFORMATION:
Q: "What's our pricing model?"
A: {
  "answer": "This information is not available in the context pack.",
  "citations": [],
  "whyItMatters": "Understanding pricing helps you make trade-offs between feature complexity and customer value. Consider asking the founder about pricing strategy.",
  "confidence": {"value": 0.0, "reason": "Information not available in context pack"}
}`;
  }

  /**
   * Build the user prompt with Context Pack and question
   * 
   * The user prompt includes:
   * - The complete Context Pack as JSON
   * - Conversation history for context
   * - The current question
   * 
   * Requirements: 6.2, 6.6
   * 
   * @param pack - The Context Pack to use for answering
   * @param question - The engineer's question
   * @param conversationHistory - Previous messages in the conversation
   * @returns User prompt string
   * @private
   */
  private buildUserPrompt(
    pack: ContextPack,
    question: string,
    conversationHistory: ChatMessage[]
  ): string {
    // Format conversation history
    const historyText = conversationHistory.length > 0
      ? `\n\nCONVERSATION HISTORY:\n${conversationHistory
          .map(m => `${m.role === 'user' ? 'Engineer' : 'Assistant'}: ${m.content}`)
          .join('\n')}`
      : '';

    return `CONTEXT PACK:
${JSON.stringify(pack, null, 2)}
${historyText}

CURRENT QUESTION: ${question}

Answer the question using only the context pack information. Follow the format specified in the system prompt.`;
  }
}

/**
 * Create a default ChatEngine instance
 * 
 * @param llm - LLM wrapper instance
 * @param storage - Storage instance
 * @returns ChatEngine instance
 */
export function createChatEngine(llm: LLMWrapper, storage: Storage): ChatEngine {
  return new ChatEngine(llm, storage);
}
