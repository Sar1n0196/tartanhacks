import { z } from 'zod';
import {
  CitationSchema,
  ConfidenceScoreSchema,
  ContextFieldSchema,
  ICPSegmentSchema,
  ContextPackSchema,
  ScrapedPageSchema,
  ScrapeResultSchema,
  ScrapeConfigSchema,
  InterviewQuestionSchema,
  InterviewAnswerSchema,
  InterviewSessionSchema,
  GapSchema,
  GapAnalysisSchema,
  ExtractionResultSchema,
  QuestionGenerationRequestSchema,
  QuestionGenerationResultSchema,
  PackBuildRequestSchema,
  ChatMessageSchema,
  ChatSessionSchema,
  ChatRequestSchema,
  ChatResponseSchema,
  LLMRequestSchema,
  LLMResponseSchema,
  ScanRequestSchema,
  ScanResponseSchema,
  InterviewStartRequestSchema,
  InterviewStartResponseSchema,
  InterviewAnswerRequestSchema,
  InterviewAnswerResponseSchema,
  StorageConfigSchema,
} from './schemas';

/**
 * TypeScript types for the Onboarding Intelligence Agent
 * All types are inferred from Zod schemas to ensure runtime and compile-time type safety
 */

// ============================================================================
// Core Data Types
// ============================================================================

/**
 * Citation - references the source of information
 * Can be a URL (from public scan), interview category, or section reference
 */
export type Citation = z.infer<typeof CitationSchema>;

/**
 * Confidence score - indicates certainty about information (0-1)
 * Requirements: 1.6, 7.1
 */
export type ConfidenceScore = z.infer<typeof ConfidenceScoreSchema>;

/**
 * Context field - a piece of information with confidence and citations
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */
export type ContextField = z.infer<typeof ContextFieldSchema>;

/**
 * ICP segment - describes a customer segment
 * Requirements: 2.2
 */
export type ICPSegment = z.infer<typeof ICPSegmentSchema>;

/**
 * Context Pack - the complete knowledge artifact for onboarding
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8
 */
export type ContextPack = z.infer<typeof ContextPackSchema>;

// ============================================================================
// Scraping Types
// ============================================================================

/**
 * Scraped page - result of scraping a single web page
 * Requirements: 1.1, 1.2, 1.4
 */
export type ScrapedPage = z.infer<typeof ScrapedPageSchema>;

/**
 * Scrape result - collection of scraped pages with errors
 * Requirements: 1.3, 1.4
 */
export type ScrapeResult = z.infer<typeof ScrapeResultSchema>;

/**
 * Scrape config - configuration for web scraping
 * Requirements: 1.3
 */
export type ScrapeConfig = z.infer<typeof ScrapeConfigSchema>;

// ============================================================================
// Interview Types
// ============================================================================

/**
 * Interview question - a question to ask the founder
 * Requirements: 3.3, 3.4
 */
export type InterviewQuestion = z.infer<typeof InterviewQuestionSchema>;

/**
 * Interview answer - founder's response to a question
 * Requirements: 4.2, 4.5
 */
export type InterviewAnswer = z.infer<typeof InterviewAnswerSchema>;

/**
 * Interview session - tracks the state of an interview
 * Requirements: 4.1, 4.3, 4.4
 */
export type InterviewSession = z.infer<typeof InterviewSessionSchema>;

// ============================================================================
// Gap Analysis Types
// ============================================================================

/**
 * Gap - identifies missing or low-confidence information
 * Requirements: 3.1, 3.2
 */
export type Gap = z.infer<typeof GapSchema>;

/**
 * Gap analysis - collection of identified gaps
 * Requirements: 3.1, 3.2
 */
export type GapAnalysis = z.infer<typeof GapAnalysisSchema>;

// ============================================================================
// Extraction Types
// ============================================================================

/**
 * Extraction result - information extracted from public pages
 * Requirements: 1.5, 1.6, 1.7
 */
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

/**
 * Question generation request - input for generating interview questions
 * Requirements: 3.3, 3.4, 3.5
 */
export type QuestionGenerationRequest = z.infer<typeof QuestionGenerationRequestSchema>;

/**
 * Question generation result - output from question generation
 * Requirements: 3.4, 3.6
 */
export type QuestionGenerationResult = z.infer<typeof QuestionGenerationResultSchema>;

/**
 * Pack build request - input for building final context pack
 * Requirements: 5.1, 5.2
 */
export type PackBuildRequest = z.infer<typeof PackBuildRequestSchema>;

// ============================================================================
// Chat Types
// ============================================================================

/**
 * Chat message - a message in the onboarding chat
 * Requirements: 6.1, 6.2, 6.3, 6.5
 */
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

/**
 * Chat session - tracks conversation history
 * Requirements: 6.6
 */
export type ChatSession = z.infer<typeof ChatSessionSchema>;

/**
 * Chat request - input for chat engine
 * Requirements: 6.2, 6.6
 */
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/**
 * Chat response - output from chat engine
 * Requirements: 6.2, 6.3, 6.4, 6.5
 */
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

// ============================================================================
// LLM Wrapper Types
// ============================================================================

/**
 * LLM request - input for LLM API calls
 * Requirements: 13.3, 13.4
 */
export type LLMRequest = z.infer<typeof LLMRequestSchema>;

/**
 * LLM response - output from LLM API calls
 * Requirements: 13.4, 13.5
 */
export type LLMResponse = z.infer<typeof LLMResponseSchema>;

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Scan request - input for /api/scan endpoint
 * Requirements: 1.1, 8.1
 */
export type ScanRequest = z.infer<typeof ScanRequestSchema>;

/**
 * Scan response - output from /api/scan endpoint
 * Requirements: 1.5, 1.6, 1.7
 */
export type ScanResponse = z.infer<typeof ScanResponseSchema>;

/**
 * Interview start request - input for starting interview
 * Requirements: 4.1
 */
export type InterviewStartRequest = z.infer<typeof InterviewStartRequestSchema>;

/**
 * Interview start response - output from starting interview
 * Requirements: 3.4, 4.1
 */
export type InterviewStartResponse = z.infer<typeof InterviewStartResponseSchema>;

/**
 * Interview answer request - input for submitting answer
 * Requirements: 4.2, 4.5
 */
export type InterviewAnswerRequest = z.infer<typeof InterviewAnswerRequestSchema>;

/**
 * Interview answer response - output from submitting answer
 * Requirements: 4.3, 4.4
 */
export type InterviewAnswerResponse = z.infer<typeof InterviewAnswerResponseSchema>;

/**
 * Storage config - configuration for data storage
 * Requirements: 14.1
 */
export type StorageConfig = z.infer<typeof StorageConfigSchema>;
