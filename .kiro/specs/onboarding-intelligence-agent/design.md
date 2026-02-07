# Design Document: Onboarding Intelligence Agent

## Overview

The Onboarding Intelligence Agent is a Next.js web application that helps founders create comprehensive context packs for engineer onboarding. The system uses a multi-stage pipeline: (1) automated web scraping to extract public company information, (2) LLM-based analysis to identify knowledge gaps, (3) adaptive founder interviews to fill gaps, (4) context pack generation merging all sources, and (5) a chat interface for engineers to query the context pack.

The architecture follows a clear separation between client UI, server-side API routes, and core business logic. All LLM interactions use structured prompts with explicit schemas to prevent hallucination. The system gracefully handles failures at each stage and supports both live and demo modes.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js App                          │
├─────────────────────────────────────────────────────────────┤
│  Client Layer (React Components)                            │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  /builder        │         │  /onboard        │         │
│  │  (Founder Flow)  │         │  (Engineer Chat) │         │
│  └──────────────────┘         └──────────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  API Layer (Server Routes)                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ /api/scan    │  │ /api/interview│  │ /api/chat    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Scraper     │  │  Interviewer │  │  ChatEngine  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Extractor   │  │  GapFinder   │  │  PackBuilder │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  LLMWrapper  │  │  Storage     │  │  DemoData    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
/
├── app/
│   ├── builder/
│   │   └── page.tsx              # Founder context building UI
│   ├── onboard/
│   │   └── page.tsx              # Engineer chat UI
│   ├── api/
│   │   ├── scan/
│   │   │   └── route.ts          # Public signal scan endpoint
│   │   ├── interview/
│   │   │   └── route.ts          # Consultant interview endpoint
│   │   ├── chat/
│   │   │   └── route.ts          # Engineer chat endpoint
│   │   └── pack/
│   │       └── route.ts          # Context pack CRUD endpoint
│   ├── layout.tsx
│   └── page.tsx                  # Landing page
├── lib/
│   ├── scraper.ts                # Web scraping logic
│   ├── extractor.ts              # LLM-based extraction
│   ├── gap-finder.ts             # Gap identification
│   ├── interviewer.ts            # Adaptive interview logic
│   ├── pack-builder.ts           # Context pack generation
│   ├── chat-engine.ts            # Engineer chat logic
│   ├── llm-wrapper.ts            # OpenAI API wrapper
│   ├── storage.ts                # JSON/SQLite storage
│   ├── demo-data.ts              # Seed data for demo mode
│   ├── types.ts                  # TypeScript types
│   └── schemas.ts                # Zod schemas for validation
├── components/
│   ├── builder/
│   │   ├── URLInput.tsx
│   │   ├── ScanProgress.tsx
│   │   ├── DraftPackView.tsx
│   │   ├── InterviewQuestion.tsx
│   │   └── FinalPackView.tsx
│   ├── onboard/
│   │   ├── ChatMessage.tsx
│   │   ├── ChatInput.tsx
│   │   └── CitationBadge.tsx
│   └── shared/
│       ├── ConfidenceScore.tsx
│       └── DemoModeToggle.tsx
├── data/
│   └── context-packs/            # Stored context packs
├── .env.local
├── package.json
└── README.md
```

### Technology Choices

- **Framework**: Next.js 14+ with App Router for server-side rendering and API routes
- **Language**: TypeScript for type safety across the entire stack
- **Styling**: Tailwind CSS for rapid, consistent UI development
- **LLM Provider**: OpenAI API (GPT-4 or GPT-3.5-turbo)
- **Validation**: Zod for runtime schema validation
- **Scraping**: Native fetch + Cheerio for HTML parsing
- **Storage**: JSON files in `/data/context-packs/` (simplest for MVP)

## Components and Interfaces

### Core Data Types

```typescript
// lib/types.ts

interface Citation {
  type: 'url' | 'interview' | 'section';
  reference: string;
  text?: string;
}

interface ConfidenceScore {
  value: number; // 0-1
  reason?: string;
}

interface ContextField {
  content: string;
  confidence: ConfidenceScore;
  citations: Citation[];
}

interface ContextPack {
  id: string;
  companyName: string;
  companyUrl: string;
  version: 'v0' | 'v1';
  createdAt: string;
  updatedAt: string;
  
  vision: ContextField;
  mission: ContextField;
  values: ContextField[];
  
  icp: {
    segments: Array<{
      name: string;
      description: ContextField;
      painPoints: ContextField[];
    }>;
    evolution: ContextField;
  };
  
  businessModel: {
    revenueDrivers: ContextField[];
    pricingModel: ContextField;
    keyMetrics: ContextField[];
  };
  
  product: {
    jobsToBeDone: ContextField[];
    keyFeatures: ContextField[];
  };
  
  decisionRules: {
    priorities: ContextField[];
    antiPatterns: ContextField[];
  };
  
  engineeringKPIs: ContextField[];
  
  summary: string;
}

interface ScrapedPage {
  url: string;
  title: string;
  content: string;
  scrapedAt: string;
  success: boolean;
  error?: string;
}

interface InterviewQuestion {
  id: string;
  category: 'vision' | 'icp' | 'business-model' | 'engineering-kpis' | 'decision-rules';
  question: string;
  context?: string;
  priority: number; // 1-10
}

interface InterviewAnswer {
  questionId: string;
  answer: string;
  skipped: boolean;
  answeredAt: string;
}

interface InterviewSession {
  packId: string;
  questions: InterviewQuestion[];
  answers: InterviewAnswer[];
  currentQuestionIndex: number;
  completed: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  whyItMatters?: string;
  confidence?: ConfidenceScore;
  timestamp: string;
}

interface ChatSession {
  packId: string;
  messages: ChatMessage[];
}
```

### LLM Wrapper

```typescript
// lib/llm-wrapper.ts

interface LLMRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json' | 'text';
}

interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

class LLMWrapper {
  private apiKey: string;
  private model: string;
  
  constructor(apiKey: string, model: string = 'gpt-4-turbo-preview') {
    this.apiKey = apiKey;
    this.model = model;
  }
  
  async complete(request: LLMRequest): Promise<LLMResponse> {
    // Retry logic with exponential backoff
    // Error handling
    // Response validation
  }
  
  async completeWithSchema<T>(
    request: LLMRequest,
    schema: z.ZodSchema<T>
  ): Promise<T> {
    // Complete + parse JSON + validate against schema
    // Retry on validation failure with clarified prompt
  }
}
```

### Web Scraper

```typescript
// lib/scraper.ts

interface ScrapeConfig {
  maxPages: number;
  timeout: number;
  userAgent: string;
}

interface ScrapeResult {
  pages: ScrapedPage[];
  errors: string[];
}

class Scraper {
  private config: ScrapeConfig;
  
  async scrapeCompany(companyUrl: string): Promise<ScrapeResult> {
    // 1. Discover pages (homepage, /about, /careers, /blog)
    // 2. Fetch each page with timeout
    // 3. Extract readable content using Cheerio
    // 4. Return results with success/failure status
  }
  
  private async scrapePage(url: string): Promise<ScrapedPage> {
    // Fetch + parse + extract text content
  }
  
  private extractReadableContent(html: string): string {
    // Use Cheerio to extract main content
    // Remove scripts, styles, nav, footer
    // Return clean text
  }
}
```

### Extractor (Prompt 1)

```typescript
// lib/extractor.ts

interface ExtractionResult {
  vision: ContextField;
  mission: ContextField;
  values: ContextField[];
  icp: {
    segments: Array<{
      name: string;
      description: ContextField;
      painPoints: ContextField[];
    }>;
  };
  businessModel: {
    revenueDrivers: ContextField[];
    pricingModel: ContextField;
  };
  product: {
    jobsToBeDone: ContextField[];
    keyFeatures: ContextField[];
  };
}

class Extractor {
  constructor(private llm: LLMWrapper) {}
  
  async extractFromPages(pages: ScrapedPage[]): Promise<ExtractionResult> {
    const systemPrompt = `You are an expert business analyst extracting company information from web pages.

CRITICAL RULES:
1. Only extract information explicitly stated in the provided pages
2. Do NOT infer, assume, or hallucinate information
3. For each extracted claim, provide:
   - The exact text content
   - A confidence score (0-1) based on clarity and evidence
   - A citation with the source URL
4. If information is not found, return empty string with confidence 0
5. Use direct quotes when possible

OUTPUT FORMAT: JSON matching the ExtractionResult schema`;

    const userPrompt = `Extract company information from these pages:

${pages.map(p => `URL: ${p.url}\nTitle: ${p.title}\nContent: ${p.content.slice(0, 2000)}\n---`).join('\n')}

Extract: vision, mission, values, ICP segments, business model, and product information.`;

    return await this.llm.completeWithSchema(
      { systemPrompt, userPrompt, temperature: 0.1, responseFormat: 'json' },
      ExtractionResultSchema
    );
  }
}
```

### Gap Finder (Prompt 2)

```typescript
// lib/gap-finder.ts

interface Gap {
  field: string;
  category: string;
  importance: number; // 1-10
  reason: string;
  currentConfidence: number;
}

interface GapAnalysis {
  gaps: Gap[];
  completeness: number; // 0-1
}

class GapFinder {
  constructor(private llm: LLMWrapper) {}
  
  async analyzeGaps(draftPack: Partial<ContextPack>): Promise<GapAnalysis> {
    const systemPrompt = `You are an expert at identifying missing information critical for engineer onboarding.

CRITICAL RULES:
1. Analyze the provided context pack for missing or low-confidence fields
2. Rank gaps by importance for helping engineers make user-centric decisions
3. Focus on information that connects technical work to business value
4. Prioritize: ICP/customer needs, decision rules, engineering KPIs, business model
5. Assign importance scores (1-10) based on impact on engineer decision-making

OUTPUT FORMAT: JSON matching the GapAnalysis schema`;

    const userPrompt = `Analyze this draft context pack and identify critical gaps:

${JSON.stringify(draftPack, null, 2)}

Identify missing or low-confidence fields that would help engineers understand:
- Who the customers are and what they need
- What business value different features provide
- What to prioritize and what to avoid building`;

    return await this.llm.completeWithSchema(
      { systemPrompt, userPrompt, temperature: 0.2, responseFormat: 'json' },
      GapAnalysisSchema
    );
  }
}
```

### Interviewer (Prompt 3)

```typescript
// lib/interviewer.ts

interface QuestionGenerationRequest {
  gaps: Gap[];
  previousAnswers: InterviewAnswer[];
  maxQuestions: number;
}

interface QuestionGenerationResult {
  questions: InterviewQuestion[];
  shouldStop: boolean;
  reason?: string;
}

class Interviewer {
  constructor(private llm: LLMWrapper) {}
  
  async generateQuestions(
    request: QuestionGenerationRequest
  ): Promise<QuestionGenerationResult> {
    const systemPrompt = `You are an expert business consultant conducting an interview to understand a startup.

CRITICAL RULES:
1. Generate 5-12 targeted questions based on identified gaps
2. Group questions by category (vision, icp, business-model, engineering-kpis, decision-rules)
3. Prioritize questions that help engineers understand customer needs and business value
4. Ask specific, actionable questions (not vague or philosophical)
5. Adapt questions based on previous answers
6. Stop early if sufficient information is gathered (shouldStop: true)

QUESTION QUALITY:
- Good: "What are the top 3 pain points your ICP faces that your product solves?"
- Bad: "What is your vision?" (too vague)
- Good: "What metrics indicate whether a feature is delivering business value?"
- Bad: "How do you measure success?" (too broad)

OUTPUT FORMAT: JSON matching the QuestionGenerationResult schema`;

    const userPrompt = `Generate interview questions to fill these gaps:

Gaps: ${JSON.stringify(request.gaps, null, 2)}

Previous answers: ${JSON.stringify(request.previousAnswers, null, 2)}

Generate questions that will help engineers understand what matters to customers and the business.`;

    return await this.llm.completeWithSchema(
      { systemPrompt, userPrompt, temperature: 0.3, responseFormat: 'json' },
      QuestionGenerationResultSchema
    );
  }
  
  async getNextQuestion(
    session: InterviewSession,
    newAnswer?: InterviewAnswer
  ): Promise<InterviewQuestion | null> {
    // If answer provided, add to session
    // Check if should stop (all answered or stopping criteria met)
    // Return next question or null if complete
  }
}
```

### Pack Builder (Prompt 4)

```typescript
// lib/pack-builder.ts

interface PackBuildRequest {
  draftPack: Partial<ContextPack>;
  interviewAnswers: InterviewAnswer[];
  questions: InterviewQuestion[];
}

class PackBuilder {
  constructor(private llm: LLMWrapper) {}
  
  async buildFinalPack(request: PackBuildRequest): Promise<ContextPack> {
    const systemPrompt = `You are an expert at synthesizing company information into a comprehensive context pack.

CRITICAL RULES:
1. Merge draft pack (from public scan) with interview answers
2. Prioritize founder answers over public scan for conflicts
3. Update confidence scores: founder answers = 0.9+, public scan = as-is
4. Add citations: interview answers cite question category, public scan cites URLs
5. Fill all required fields; use "Information not available" with confidence 0 if missing
6. Generate a human-readable summary (2-3 paragraphs)
7. Ensure decision rules clearly state what TO build and what NOT to build
8. Ensure engineering KPIs connect technical work to business outcomes

OUTPUT FORMAT: JSON matching the ContextPack schema`;

    const userPrompt = `Merge this information into a final context pack:

Draft Pack (from public scan):
${JSON.stringify(request.draftPack, null, 2)}

Interview Q&A:
${request.questions.map((q, i) => {
  const answer = request.interviewAnswers.find(a => a.questionId === q.id);
  return `Q: ${q.question}\nA: ${answer?.answer || 'Skipped'}`;
}).join('\n\n')}

Create a comprehensive context pack that helps engineers make user-centric decisions.`;

    const pack = await this.llm.completeWithSchema(
      { systemPrompt, userPrompt, temperature: 0.2, responseFormat: 'json' },
      ContextPackSchema
    );
    
    pack.version = 'v1';
    pack.updatedAt = new Date().toISOString();
    
    return pack;
  }
}
```

### Chat Engine (Prompt 5)

```typescript
// lib/chat-engine.ts

interface ChatRequest {
  packId: string;
  question: string;
  conversationHistory: ChatMessage[];
}

interface ChatResponse {
  answer: string;
  citations: Citation[];
  whyItMatters: string;
  confidence: ConfidenceScore;
}

class ChatEngine {
  constructor(
    private llm: LLMWrapper,
    private storage: Storage
  ) {}
  
  async answerQuestion(request: ChatRequest): Promise<ChatResponse> {
    const pack = await this.storage.getContextPack(request.packId);
    
    if (!pack) {
      throw new Error('Context pack not found');
    }
    
    const systemPrompt = `You are an onboarding assistant helping new engineers understand their company.

CRITICAL RULES:
1. Answer ONLY using information from the provided context pack
2. If information is not in the context pack, explicitly state: "This information is not available in the context pack"
3. Do NOT infer, assume, or use external knowledge
4. Always include citations referencing specific context pack sections
5. Always include a "Why this matters" explanation connecting the answer to business impact
6. Provide confidence scores based on the underlying data confidence
7. Be concise but thorough

ANSWER FORMAT:
- Direct answer to the question
- Citations: [Section: field_name]
- Why this matters: How this connects to business value or customer impact

CONVERSATION HISTORY:
${request.conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}`;

    const userPrompt = `Context Pack:
${JSON.stringify(pack, null, 2)}

Question: ${request.question}

Answer the question using only the context pack information.`;

    const response = await this.llm.completeWithSchema(
      { systemPrompt, userPrompt, temperature: 0.3, responseFormat: 'json' },
      ChatResponseSchema
    );
    
    return response;
  }
}
```

### Storage

```typescript
// lib/storage.ts

interface StorageConfig {
  dataDir: string;
}

class Storage {
  private config: StorageConfig;
  
  constructor(config: StorageConfig) {
    this.config = config;
  }
  
  async saveContextPack(pack: ContextPack): Promise<void> {
    // Validate pack against schema
    // Write to JSON file: {dataDir}/{pack.id}.json
    // Handle write errors
  }
  
  async getContextPack(id: string): Promise<ContextPack | null> {
    // Read from JSON file
    // Parse and validate against schema
    // Return null if not found
  }
  
  async listContextPacks(): Promise<ContextPack[]> {
    // Read all JSON files in dataDir
    // Parse and return array
  }
  
  async deleteContextPack(id: string): Promise<void> {
    // Delete JSON file
  }
}
```

### Demo Data

```typescript
// lib/demo-data.ts

class DemoData {
  static getMockScrapeResult(companyUrl: string): ScrapeResult {
    // Return pre-defined scraped pages for demo companies
  }
  
  static getMockContextPack(companyName: string): ContextPack {
    // Return pre-built context pack for demo companies
  }
  
  static getDemoCompanies(): string[] {
    return ['Acme SaaS', 'TechStart'];
  }
}
```

## Data Models

### Context Pack Schema (Zod)

```typescript
// lib/schemas.ts

import { z } from 'zod';

const CitationSchema = z.object({
  type: z.enum(['url', 'interview', 'section']),
  reference: z.string(),
  text: z.string().optional(),
});

const ConfidenceScoreSchema = z.object({
  value: z.number().min(0).max(1),
  reason: z.string().optional(),
});

const ContextFieldSchema = z.object({
  content: z.string(),
  confidence: ConfidenceScoreSchema,
  citations: z.array(CitationSchema),
});

const ContextPackSchema = z.object({
  id: z.string(),
  companyName: z.string(),
  companyUrl: z.string(),
  version: z.enum(['v0', 'v1']),
  createdAt: z.string(),
  updatedAt: z.string(),
  
  vision: ContextFieldSchema,
  mission: ContextFieldSchema,
  values: z.array(ContextFieldSchema),
  
  icp: z.object({
    segments: z.array(z.object({
      name: z.string(),
      description: ContextFieldSchema,
      painPoints: z.array(ContextFieldSchema),
    })),
    evolution: ContextFieldSchema,
  }),
  
  businessModel: z.object({
    revenueDrivers: z.array(ContextFieldSchema),
    pricingModel: ContextFieldSchema,
    keyMetrics: z.array(ContextFieldSchema),
  }),
  
  product: z.object({
    jobsToBeDone: z.array(ContextFieldSchema),
    keyFeatures: z.array(ContextFieldSchema),
  }),
  
  decisionRules: z.object({
    priorities: z.array(ContextFieldSchema),
    antiPatterns: z.array(ContextFieldSchema),
  }),
  
  engineeringKPIs: z.array(ContextFieldSchema),
  
  summary: z.string(),
});

// Export type from schema
type ContextPack = z.infer<typeof ContextPackSchema>;
```

### API Request/Response Schemas

```typescript
// Scan API
const ScanRequestSchema = z.object({
  companyUrl: z.string().url(),
  companyName: z.string().optional(),
  demoMode: z.boolean().default(false),
});

const ScanResponseSchema = z.object({
  packId: z.string(),
  draftPack: ContextPackSchema,
  scrapedPages: z.number(),
  errors: z.array(z.string()),
});

// Interview API
const InterviewStartRequestSchema = z.object({
  packId: z.string(),
});

const InterviewStartResponseSchema = z.object({
  sessionId: z.string(),
  questions: z.array(InterviewQuestionSchema),
});

const InterviewAnswerRequestSchema = z.object({
  sessionId: z.string(),
  questionId: z.string(),
  answer: z.string(),
  skipped: z.boolean().default(false),
});

const InterviewAnswerResponseSchema = z.object({
  nextQuestion: InterviewQuestionSchema.nullable(),
  completed: z.boolean(),
  finalPack: ContextPackSchema.optional(),
});

// Chat API
const ChatRequestSchema = z.object({
  packId: z.string(),
  message: z.string(),
  conversationHistory: z.array(ChatMessageSchema),
});

const ChatResponseSchema = z.object({
  message: ChatMessageSchema,
});
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Before writing the correctness properties, let me analyze the acceptance criteria for testability:


### Property 1: Scraper Page Limit Invariant
*For any* scrape operation with a configured page limit, the number of pages actually scraped should never exceed the limit, regardless of how many pages are discovered.
**Validates: Requirements 1.3**

### Property 2: Scraper Failure Resilience
*For any* set of pages to scrape, if one or more pages fail to load, the scraper should continue processing the remaining pages and return results for all successful scrapes.
**Validates: Requirements 1.4**

### Property 3: Content Extraction Cleanliness
*For any* HTML input, the extracted text content should not contain script tags, style tags, or navigation elements.
**Validates: Requirements 1.2**

### Property 4: Context Pack Schema Validation Round-Trip
*For any* valid Context Pack object, serializing to JSON then deserializing should produce an object that matches the original schema and contains equivalent data.
**Validates: Requirements 2.9, 2.10, 14.6, 14.7**

### Property 5: Confidence Score Bounds
*For all* fields in a Context Pack (whether from public scan or founder interview), the confidence score value should be between 0 and 1 inclusive.
**Validates: Requirements 1.6, 7.1**

### Property 6: Citation Presence
*For all* non-empty fields in a Context Pack, there should be at least one citation referencing the source of the information.
**Validates: Requirements 1.7, 7.3**

### Property 7: Founder Answer Confidence
*For any* information derived from founder interview answers, the confidence score should be 0.9 or higher.
**Validates: Requirements 7.2**

### Property 8: Citation Format by Source
*For any* citation in a Context Pack, if the source is a public scan, the citation should contain a URL; if the source is a founder interview, the citation should reference a question category.
**Validates: Requirements 7.4, 7.5**

### Property 9: Gap Ranking Order
*For any* set of identified gaps, they should be ordered by importance score in descending order (highest importance first).
**Validates: Requirements 3.2**

### Property 10: Question Count Bounds
*For any* gap analysis result, the number of generated interview questions should be between 5 and 12 inclusive.
**Validates: Requirements 3.4**

### Property 11: Question Category Assignment
*For all* generated interview questions, each question should have a valid category from the set: {vision, icp, business-model, engineering-kpis, decision-rules}.
**Validates: Requirements 3.3**

### Property 12: Answer Storage with Category
*For any* founder answer to an interview question, the stored answer should include a reference to the question's category.
**Validates: Requirements 4.2**

### Property 13: Skip Handling
*For any* interview question that is skipped, the interview should continue to the next question without blocking, and the corresponding Context Pack field should remain at low confidence or be marked unavailable.
**Validates: Requirements 4.5, 4.6**

### Property 14: Merge Prioritization
*For any* Context Pack field that has both public scan data and founder interview data, the final merged pack should use the founder interview data.
**Validates: Requirements 5.2**

### Property 15: Merge Confidence Update
*For any* Context Pack field that is updated with founder interview data during merging, the confidence score should be updated to 0.9 or higher.
**Validates: Requirements 5.3**

### Property 16: Unavailable Field Marking
*For any* Context Pack field where information is not available from either public scan or founder interview, the field should contain "Information not available" and have a confidence score of 0.
**Validates: Requirements 5.5**

### Property 17: Chat Answer Grounding
*For any* engineer question answered by the chat system, all factual claims in the answer should be traceable to specific fields in the Context Pack (no external information).
**Validates: Requirements 6.2, 6.7**

### Property 18: Chat Citation Inclusion
*For any* chat answer generated by the system, the response should include at least one citation referencing a Context Pack section.
**Validates: Requirements 6.3**

### Property 19: Chat Missing Information Acknowledgment
*For any* engineer question about information that is not available in the Context Pack (confidence = 0 or marked unavailable), the answer should explicitly state that the information is unavailable.
**Validates: Requirements 6.4, 10.5**

### Property 20: Chat "Why This Matters" Inclusion
*For any* chat answer generated by the system, the response should include a "Why this matters" explanation section.
**Validates: Requirements 6.5**

### Property 21: Demo Mode Scraping Bypass
*For any* scrape operation when demo mode is enabled, the system should return mock data without making actual HTTP requests to external URLs.
**Validates: Requirements 8.2, 8.4**

### Property 22: Demo Mode Interview Bypass
*For any* interview session when demo mode is enabled, the questions and answers should come from pre-defined mock data without making LLM API calls.
**Validates: Requirements 8.5**

### Property 23: LLM Retry Logic
*For any* LLM API call that fails, the system should retry up to 3 times before returning an error.
**Validates: Requirements 10.3**

### Property 24: Complete Scrape Failure Fallback
*For any* scrape operation where all pages fail to load, the system should still proceed to the interview phase and generate a Context Pack from interview answers only.
**Validates: Requirements 10.1**

### Property 25: Skipped Questions Pack Generation
*For any* interview session where multiple questions are skipped, the system should still generate a valid Context Pack containing only the available information.
**Validates: Requirements 10.6**

### Property 26: Storage Persistence Round-Trip
*For any* Context Pack that is saved to storage, retrieving it by ID should return an equivalent Context Pack object.
**Validates: Requirements 14.2, 14.3**

### Property 27: Low Confidence Uncertainty Flagging
*For any* Context Pack field with a confidence score below 0.5, the field should be flagged as uncertain.
**Validates: Requirements 7.7**

## Error Handling

### Scraping Errors

**Page Load Failures**:
- Individual page failures should not block the entire scan
- Failed pages should be logged with error details
- Successful pages should be processed normally
- If all pages fail, proceed to interview with empty draft pack

**Timeout Handling**:
- Each page fetch should have a configurable timeout (default: 10 seconds)
- Timeout errors should be treated as page load failures
- Partial content from timed-out pages should be discarded

**Invalid URLs**:
- Malformed URLs should be rejected at input validation
- Return user-friendly error message
- Do not attempt to scrape

### LLM API Errors

**Rate Limiting**:
- Implement exponential backoff: 1s, 2s, 4s
- Retry up to 3 times
- After exhausting retries, return error to user

**Invalid API Key**:
- Detect authentication errors
- Return clear error message to user
- Do not retry (will fail again)

**Schema Validation Failures**:
- If LLM response doesn't match expected schema, retry with clarified prompt
- Include schema in retry prompt
- After 2 retries, return error

**Token Limit Exceeded**:
- Truncate input content if too large
- Prioritize most recent/relevant content
- Log truncation for debugging

### Storage Errors

**Write Failures**:
- Catch file system errors (permissions, disk full)
- Return error to user with actionable message
- Do not leave partial/corrupted files

**Read Failures**:
- If Context Pack not found, return null
- If JSON parse fails, log error and return null
- Validate schema after parsing

**Concurrent Access**:
- Use file locking or atomic writes
- Handle race conditions gracefully
- For MVP, assume single-user access

### User Input Errors

**Invalid Company URL**:
- Validate URL format before scraping
- Check for common issues (missing protocol, localhost)
- Return clear validation error

**Empty Interview Answers**:
- Treat empty answers as skipped
- Continue to next question
- Mark field as unavailable

**Missing Context Pack**:
- If engineer tries to chat without a pack, show error
- Provide link to builder flow
- Do not attempt to answer questions

## Testing Strategy

### Dual Testing Approach

The testing strategy combines **unit tests** for specific examples and edge cases with **property-based tests** for universal correctness properties. Both approaches are complementary and necessary for comprehensive coverage.

**Unit Tests** focus on:
- Specific examples that demonstrate correct behavior
- Edge cases (empty inputs, malformed data, boundary conditions)
- Error conditions (API failures, network errors, invalid schemas)
- Integration points between components

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Invariants that must be maintained across operations
- Round-trip properties (serialize/deserialize, merge operations)

### Property-Based Testing Configuration

**Library**: Use `fast-check` for TypeScript property-based testing

**Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `// Feature: onboarding-intelligence-agent, Property {number}: {property_text}`

**Example Property Test Structure**:
```typescript
// Feature: onboarding-intelligence-agent, Property 4: Context Pack Schema Validation Round-Trip
test('Context Pack serialization round-trip preserves data', () => {
  fc.assert(
    fc.property(contextPackArbitrary, (pack) => {
      const json = JSON.stringify(pack);
      const parsed = JSON.parse(json);
      const validated = ContextPackSchema.parse(parsed);
      expect(validated).toEqual(pack);
    }),
    { numRuns: 100 }
  );
});
```

### Test Coverage by Component

**Scraper** (lib/scraper.ts):
- Unit: Test specific URLs, timeout handling, error cases
- Property: Page limit invariant, failure resilience, content cleanliness

**Extractor** (lib/extractor.ts):
- Unit: Test with sample HTML pages, empty content
- Property: Confidence score bounds, citation presence

**Gap Finder** (lib/gap-finder.ts):
- Unit: Test with specific draft packs
- Property: Gap ranking order, completeness scoring

**Interviewer** (lib/interviewer.ts):
- Unit: Test question generation with specific gaps
- Property: Question count bounds, category assignment

**Pack Builder** (lib/pack-builder.ts):
- Unit: Test merge with specific conflicts
- Property: Merge prioritization, confidence updates, unavailable field marking

**Chat Engine** (lib/chat-engine.ts):
- Unit: Test specific questions and answers
- Property: Answer grounding, citation inclusion, missing info acknowledgment

**Storage** (lib/storage.ts):
- Unit: Test file operations, error handling
- Property: Storage persistence round-trip

**LLM Wrapper** (lib/llm-wrapper.ts):
- Unit: Test API call structure, error handling
- Property: Retry logic, schema validation

**Demo Data** (lib/demo-data.ts):
- Unit: Test mock data structure, demo mode toggle
- Property: Demo mode scraping bypass, interview bypass

### Integration Tests

**End-to-End Founder Flow**:
1. Submit company URL
2. Verify draft pack generation
3. Complete interview
4. Verify final pack structure

**End-to-End Engineer Flow**:
1. Load context pack
2. Ask multiple questions
3. Verify answers are grounded in pack
4. Verify citations and "why this matters"

**Demo Mode Flow**:
1. Enable demo mode
2. Run founder flow
3. Verify no external API calls
4. Verify mock data used

### Test Data Generators

For property-based testing, create generators (arbitraries) for:
- Valid Context Packs with random content
- Scraped pages with various HTML structures
- Interview questions and answers
- Gap analyses with various completeness levels
- Chat messages and conversation histories

### Continuous Testing

- Run unit tests on every commit
- Run property tests on every PR
- Run integration tests before deployment
- Monitor test execution time (property tests may be slower)

## Implementation Notes

### Phase 1: Core Infrastructure
1. Set up Next.js project with TypeScript and Tailwind
2. Implement LLM wrapper with retry logic
3. Implement storage layer with JSON files
4. Define all TypeScript types and Zod schemas
5. Create demo data for testing

### Phase 2: Scraping and Extraction
1. Implement web scraper with Cheerio
2. Implement extractor with LLM prompt
3. Add error handling and timeouts
4. Test with real websites

### Phase 3: Interview System
1. Implement gap finder
2. Implement interviewer with adaptive questions
3. Implement pack builder for merging
4. Test interview flow end-to-end

### Phase 4: Chat System
1. Implement chat engine with grounding
2. Add citation generation
3. Add "why this matters" explanations
4. Test with various questions

### Phase 5: UI
1. Build founder flow UI (/builder)
2. Build engineer flow UI (/onboard)
3. Add demo mode toggle
4. Polish styling and UX

### Phase 6: Testing and Polish
1. Write unit tests for all components
2. Write property-based tests for key properties
3. Run integration tests
4. Fix bugs and edge cases
5. Write README and documentation

### Key Design Decisions

**Why JSON storage instead of database?**
- Simplicity for MVP
- Easy to inspect and debug
- No additional dependencies
- Sufficient for single-user scenarios

**Why separate prompts instead of one mega-prompt?**
- Better control over each stage
- Easier to debug and iterate
- Clearer separation of concerns
- Reduces hallucination risk

**Why Zod for validation?**
- Runtime type safety
- Clear error messages
- TypeScript integration
- Schema-driven development

**Why Cheerio instead of Puppeteer?**
- Faster and lighter weight
- No browser overhead
- Sufficient for static content
- Easier to deploy

**Why OpenAI instead of other LLM providers?**
- Best-in-class for structured output
- JSON mode support
- Reliable API
- Easy to swap later via wrapper

### Future Improvements (Out of Scope for MVP)

- Multi-company support with org management
- Real-time collaboration on context packs
- Version history and diff viewing
- Advanced RAG with vector embeddings
- Integration with Slack/Teams for chat
- Analytics dashboard for founder insights
- Automated context pack updates from new content
- Role-based access control
- SSO and team management
- Export to PDF/Markdown
- Custom question templates
- Multi-language support
