import { z } from 'zod';

/**
 * Zod schemas for the Onboarding Intelligence Agent
 * These schemas provide runtime validation and type inference for all data structures
 */

// ============================================================================
// Core Data Schemas
// ============================================================================

/**
 * Citation schema - references the source of information
 * Can be a URL (from public scan), interview category, or section reference
 */
export const CitationSchema = z.object({
  type: z.enum(['url', 'interview', 'section']),
  reference: z.string(),
  text: z.string().optional(),
});

/**
 * Confidence score schema - indicates certainty about information (0-1)
 * Requirements: 1.6, 7.1
 */
export const ConfidenceScoreSchema = z.object({
  value: z.number().min(0).max(1),
  reason: z.string().optional(),
});

/**
 * Context field schema - a piece of information with confidence and citations
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */
export const ContextFieldSchema = z.object({
  content: z.string(),
  confidence: ConfidenceScoreSchema,
  citations: z.array(CitationSchema),
});

/**
 * ICP segment schema - describes a customer segment
 * Requirements: 2.2
 */
export const ICPSegmentSchema = z.object({
  name: z.string(),
  description: ContextFieldSchema,
  painPoints: z.array(ContextFieldSchema),
});

/**
 * Context Pack schema - the complete knowledge artifact for onboarding
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8
 */
export const ContextPackSchema = z.object({
  id: z.string(),
  companyName: z.string(),
  companyUrl: z.string(),
  version: z.enum(['v0', 'v1']),
  createdAt: z.string(),
  updatedAt: z.string(),
  
  // Vision, mission, and values
  vision: ContextFieldSchema,
  mission: ContextFieldSchema,
  values: z.array(ContextFieldSchema),
  
  // Ideal Customer Profile
  icp: z.object({
    segments: z.array(ICPSegmentSchema),
    evolution: ContextFieldSchema,
  }),
  
  // Business model
  businessModel: z.object({
    revenueDrivers: z.array(ContextFieldSchema),
    pricingModel: ContextFieldSchema,
    keyMetrics: z.array(ContextFieldSchema),
  }),
  
  // Product and jobs-to-be-done
  product: z.object({
    jobsToBeDone: z.array(ContextFieldSchema),
    keyFeatures: z.array(ContextFieldSchema),
  }),
  
  // Decision rules for engineers
  decisionRules: z.object({
    priorities: z.array(ContextFieldSchema),
    antiPatterns: z.array(ContextFieldSchema),
  }),
  
  // Engineering KPIs
  engineeringKPIs: z.array(ContextFieldSchema),
  
  // Human-readable summary
  summary: z.string(),
});

// ============================================================================
// Scraping Schemas
// ============================================================================

/**
 * Scraped page schema - result of scraping a single web page
 * Requirements: 1.1, 1.2, 1.4
 */
export const ScrapedPageSchema = z.object({
  url: z.string(),
  title: z.string(),
  content: z.string(),
  scrapedAt: z.string(),
  success: z.boolean(),
  error: z.string().optional(),
});

/**
 * Scrape result schema - collection of scraped pages with errors
 * Requirements: 1.3, 1.4
 */
export const ScrapeResultSchema = z.object({
  pages: z.array(ScrapedPageSchema),
  errors: z.array(z.string()),
});

/**
 * Scrape config schema - configuration for web scraping
 * Requirements: 1.3
 */
export const ScrapeConfigSchema = z.object({
  maxPages: z.number().int().positive(),
  timeout: z.number().int().positive(),
  userAgent: z.string(),
});

// ============================================================================
// Interview Schemas
// ============================================================================

/**
 * Interview question schema - a question to ask the founder
 * Requirements: 3.3, 3.4
 */
export const InterviewQuestionSchema = z.object({
  id: z.string(),
  category: z.enum(['vision', 'icp', 'business-model', 'engineering-kpis', 'decision-rules']),
  question: z.string(),
  context: z.string().optional(),
  priority: z.number().int().min(1).max(10),
});

/**
 * Interview answer schema - founder's response to a question
 * Requirements: 4.2, 4.5
 */
export const InterviewAnswerSchema = z.object({
  questionId: z.string(),
  answer: z.string(),
  skipped: z.boolean(),
  answeredAt: z.string(),
});

/**
 * Interview session schema - tracks the state of an interview
 * Requirements: 4.1, 4.3, 4.4
 */
export const InterviewSessionSchema = z.object({
  packId: z.string(),
  questions: z.array(InterviewQuestionSchema),
  answers: z.array(InterviewAnswerSchema),
  currentQuestionIndex: z.number().int().min(0),
  completed: z.boolean(),
});

// ============================================================================
// Gap Analysis Schemas
// ============================================================================

/**
 * Gap schema - identifies missing or low-confidence information
 * Requirements: 3.1, 3.2
 */
export const GapSchema = z.object({
  field: z.string(),
  category: z.string(),
  importance: z.number().int().min(1).max(10),
  reason: z.string(),
  currentConfidence: z.number().min(0).max(1),
});

/**
 * Gap analysis schema - collection of identified gaps
 * Requirements: 3.1, 3.2
 */
export const GapAnalysisSchema = z.object({
  gaps: z.array(GapSchema),
  completeness: z.number().min(0).max(1),
});

// ============================================================================
// Extraction Schemas
// ============================================================================

/**
 * Extraction result schema - information extracted from public pages
 * Requirements: 1.5, 1.6, 1.7
 */
export const ExtractionResultSchema = z.object({
  vision: ContextFieldSchema,
  mission: ContextFieldSchema,
  values: z.array(ContextFieldSchema),
  icp: z.object({
    segments: z.array(ICPSegmentSchema),
  }),
  businessModel: z.object({
    revenueDrivers: z.array(ContextFieldSchema),
    pricingModel: ContextFieldSchema,
  }),
  product: z.object({
    jobsToBeDone: z.array(ContextFieldSchema),
    keyFeatures: z.array(ContextFieldSchema),
  }),
});

/**
 * Question generation request schema - input for generating interview questions
 * Requirements: 3.3, 3.4, 3.5
 */
export const QuestionGenerationRequestSchema = z.object({
  gaps: z.array(GapSchema),
  previousAnswers: z.array(InterviewAnswerSchema),
  maxQuestions: z.number().int().min(5).max(12),
});

/**
 * Question generation result schema - output from question generation
 * Requirements: 3.4, 3.6
 */
export const QuestionGenerationResultSchema = z.object({
  questions: z.array(InterviewQuestionSchema),
  shouldStop: z.boolean(),
  reason: z.string().optional(),
});

/**
 * Pack build request schema - input for building final context pack
 * Requirements: 5.1, 5.2
 */
export const PackBuildRequestSchema = z.object({
  draftPack: ContextPackSchema.partial(),
  interviewAnswers: z.array(InterviewAnswerSchema),
  questions: z.array(InterviewQuestionSchema),
});

// ============================================================================
// Chat Schemas
// ============================================================================

/**
 * Chat message schema - a message in the onboarding chat
 * Requirements: 6.1, 6.2, 6.3, 6.5
 */
export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  citations: z.array(CitationSchema).optional(),
  whyItMatters: z.string().optional(),
  confidence: ConfidenceScoreSchema.optional(),
  timestamp: z.string(),
});

/**
 * Chat session schema - tracks conversation history
 * Requirements: 6.6
 */
export const ChatSessionSchema = z.object({
  packId: z.string(),
  messages: z.array(ChatMessageSchema),
});

/**
 * Chat request schema - input for chat engine
 * Requirements: 6.2, 6.6
 */
export const ChatRequestSchema = z.object({
  packId: z.string(),
  question: z.string(),
  conversationHistory: z.array(ChatMessageSchema),
});

/**
 * Chat response schema - output from chat engine
 * Requirements: 6.2, 6.3, 6.4, 6.5
 */
export const ChatResponseSchema = z.object({
  answer: z.string(),
  citations: z.array(CitationSchema),
  whyItMatters: z.string(),
  confidence: ConfidenceScoreSchema,
});

// ============================================================================
// LLM Wrapper Schemas
// ============================================================================

/**
 * LLM request schema - input for LLM API calls
 * Requirements: 13.3, 13.4
 */
export const LLMRequestSchema = z.object({
  systemPrompt: z.string(),
  userPrompt: z.string(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  responseFormat: z.enum(['json', 'text']).optional(),
});

/**
 * LLM response schema - output from LLM API calls
 * Requirements: 13.4, 13.5
 */
export const LLMResponseSchema = z.object({
  content: z.string(),
  usage: z.object({
    promptTokens: z.number().int().min(0),
    completionTokens: z.number().int().min(0),
    totalTokens: z.number().int().min(0),
  }),
});

// ============================================================================
// API Request/Response Schemas
// ============================================================================

/**
 * Scan request schema - input for /api/scan endpoint
 * Requirements: 1.1, 8.1
 */
export const ScanRequestSchema = z.object({
  companyUrl: z.string().url(),
  companyName: z.string().optional(),
  demoMode: z.boolean().default(false),
});

/**
 * Scan response schema - output from /api/scan endpoint
 * Requirements: 1.5, 1.6, 1.7
 */
export const ScanResponseSchema = z.object({
  packId: z.string(),
  draftPack: ContextPackSchema,
  scrapedPages: z.number().int().min(0),
  errors: z.array(z.string()),
});

/**
 * Interview start request schema - input for starting interview
 * Requirements: 4.1
 */
export const InterviewStartRequestSchema = z.object({
  packId: z.string(),
});

/**
 * Interview start response schema - output from starting interview
 * Requirements: 3.4, 4.1
 */
export const InterviewStartResponseSchema = z.object({
  sessionId: z.string(),
  questions: z.array(InterviewQuestionSchema),
});

/**
 * Interview answer request schema - input for submitting answer
 * Requirements: 4.2, 4.5
 */
export const InterviewAnswerRequestSchema = z.object({
  sessionId: z.string(),
  questionId: z.string(),
  answer: z.string(),
  skipped: z.boolean().default(false),
});

/**
 * Interview answer response schema - output from submitting answer
 * Requirements: 4.3, 4.4
 */
export const InterviewAnswerResponseSchema = z.object({
  nextQuestion: InterviewQuestionSchema.nullable(),
  completed: z.boolean(),
  finalPack: ContextPackSchema.optional(),
});

/**
 * Storage config schema - configuration for data storage
 * Requirements: 14.1
 */
export const StorageConfigSchema = z.object({
  dataDir: z.string(),
});
