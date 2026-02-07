# Implementation Plan: Onboarding Intelligence Agent

## Overview

This implementation plan breaks down the Onboarding Intelligence Agent into incremental, testable steps. The approach follows a bottom-up strategy: build core infrastructure first, then business logic components, then API routes, and finally UI. Each major component includes property-based tests to validate correctness properties from the design document.

The implementation uses Next.js 14+ with TypeScript, Tailwind CSS, OpenAI API, and fast-check for property-based testing.

## Tasks

- [ ] 1. Project setup and core infrastructure
  - [ ] 1.1 Initialize Next.js project with TypeScript and Tailwind CSS
    - Run `npx create-next-app@latest` with TypeScript and Tailwind options
    - Configure `tsconfig.json` for strict type checking
    - Set up project directory structure as per design
    - Create `.env.local` with `OPENAI_API_KEY` placeholder
    - _Requirements: 13.1_
  
  - [ ] 1.2 Install dependencies and configure testing
    - Install: `zod`, `cheerio`, `openai`, `fast-check`, `vitest`, `@testing-library/react`
    - Configure Vitest for unit and property-based testing
    - Create test setup files
    - _Requirements: 9.1, 9.2_
  
  - [ ] 1.3 Define core TypeScript types and Zod schemas
    - Create `lib/types.ts` with all interfaces (Citation, ConfidenceScore, ContextField, ContextPack, etc.)
    - Create `lib/schemas.ts` with Zod schemas for validation
    - Export type inference from schemas
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_
  
  - [ ]* 1.4 Write property test for Context Pack schema round-trip
    - **Property 4: Context Pack Schema Validation Round-Trip**
    - **Validates: Requirements 2.9, 2.10, 14.6, 14.7**
    - Create arbitrary generator for valid Context Packs
    - Test: serialize → deserialize → validate produces equivalent object
    - Run 100 iterations

- [ ] 2. Storage layer implementation
  - [ ] 2.1 Implement JSON file storage
    - Create `lib/storage.ts` with Storage class
    - Implement `saveContextPack()` with file write and validation
    - Implement `getContextPack()` with file read and schema validation
    - Implement `listContextPacks()` and `deleteContextPack()`
    - Handle errors gracefully (file not found, parse errors, permissions)
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_
  
  - [ ]* 2.2 Write property test for storage persistence round-trip
    - **Property 26: Storage Persistence Round-Trip**
    - **Validates: Requirements 14.2, 14.3**
    - Test: save → retrieve produces equivalent Context Pack
    - Run 100 iterations
  
  - [ ]* 2.3 Write unit tests for storage error handling
    - Test missing file returns null
    - Test invalid JSON returns null
    - Test schema validation failure
    - _Requirements: 14.4_

- [ ] 3. LLM wrapper implementation
  - [ ] 3.1 Implement OpenAI API wrapper
    - Create `lib/llm-wrapper.ts` with LLMWrapper class
    - Implement `complete()` method with OpenAI API calls
    - Implement `completeWithSchema()` with JSON parsing and Zod validation
    - Add retry logic with exponential backoff (1s, 2s, 4s)
    - Handle API errors (rate limiting, auth, token limits)
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 10.3_
  
  - [ ]* 3.2 Write property test for LLM retry logic
    - **Property 23: LLM Retry Logic**
    - **Validates: Requirements 10.3**
    - Mock API to fail N times then succeed
    - Test: retries up to 3 times before error
    - Run 100 iterations with different failure counts
  
  - [ ]* 3.3 Write unit tests for LLM error handling
    - Test authentication error (no retry)
    - Test rate limiting (retry with backoff)
    - Test schema validation failure (retry with clarified prompt)
    - Test token limit exceeded
    - _Requirements: 10.3, 10.4_

- [ ] 4. Demo data implementation
  - [ ] 4.1 Create demo data module
    - Create `lib/demo-data.ts` with DemoData class
    - Implement `getMockScrapeResult()` with pre-defined scraped pages for 2 example companies
    - Implement `getMockContextPack()` with complete Context Pack for 2 example companies
    - Implement `getDemoCompanies()` returning list of demo company names
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ]* 4.2 Write unit tests for demo data structure
    - Test mock scrape results have valid structure
    - Test mock context packs pass schema validation
    - Test at least 1 demo company exists
    - _Requirements: 8.3_

- [ ] 5. Checkpoint - Core infrastructure complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Web scraper implementation
  - [ ] 6.1 Implement web scraper with Cheerio
    - Create `lib/scraper.ts` with Scraper class
    - Implement `scrapeCompany()` to discover and scrape pages (homepage, /about, /careers, /blog)
    - Implement `scrapePage()` with fetch, timeout handling, and error catching
    - Implement `extractReadableContent()` using Cheerio to remove scripts/styles/nav
    - Limit to max 10 pages
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ]* 6.2 Write property test for scraper page limit invariant
    - **Property 1: Scraper Page Limit Invariant**
    - **Validates: Requirements 1.3**
    - Test: for any page limit, scraped pages ≤ limit
    - Run 100 iterations with different limits
  
  - [ ]* 6.3 Write property test for scraper failure resilience
    - **Property 2: Scraper Failure Resilience**
    - **Validates: Requirements 1.4**
    - Mock some pages to fail, others to succeed
    - Test: successful pages are returned despite failures
    - Run 100 iterations
  
  - [ ]* 6.4 Write property test for content extraction cleanliness
    - **Property 3: Content Extraction Cleanliness**
    - **Validates: Requirements 1.2**
    - Test: extracted content has no <script>, <style>, <nav> tags
    - Run 100 iterations with random HTML
  
  - [ ]* 6.5 Write unit tests for scraper edge cases
    - Test timeout handling
    - Test invalid URL
    - Test all pages fail (empty result)
    - _Requirements: 1.4, 10.1_

- [ ] 7. Extractor implementation
  - [ ] 7.1 Implement LLM-based extractor
    - Create `lib/extractor.ts` with Extractor class
    - Implement `extractFromPages()` with system and user prompts
    - System prompt: rules against hallucination, require citations and confidence scores
    - Parse LLM response into ExtractionResult with schema validation
    - _Requirements: 1.5, 1.6, 1.7, 9.1, 9.2, 9.3, 9.7_
  
  - [ ]* 7.2 Write property test for confidence score bounds
    - **Property 5: Confidence Score Bounds**
    - **Validates: Requirements 1.6, 7.1**
    - Test: all confidence scores in extraction result are 0-1
    - Run 100 iterations with different page content
  
  - [ ]* 7.3 Write property test for citation presence
    - **Property 6: Citation Presence**
    - **Validates: Requirements 1.7, 7.3**
    - Test: all non-empty fields have at least one citation
    - Run 100 iterations
  
  - [ ]* 7.4 Write unit tests for extractor
    - Test with empty pages (should return low confidence)
    - Test with rich content (should extract information)
    - Test citation format includes URLs
    - _Requirements: 1.5, 1.6, 1.7_

- [ ] 8. Gap finder implementation
  - [ ] 8.1 Implement gap identification logic
    - Create `lib/gap-finder.ts` with GapFinder class
    - Implement `analyzeGaps()` with system and user prompts
    - System prompt: prioritize gaps by importance for engineer decision-making
    - Parse LLM response into GapAnalysis with schema validation
    - _Requirements: 3.1, 3.2, 9.1, 9.2, 9.3, 9.8_
  
  - [ ]* 8.2 Write property test for gap ranking order
    - **Property 9: Gap Ranking Order**
    - **Validates: Requirements 3.2**
    - Test: gaps are ordered by importance (descending)
    - Run 100 iterations with different draft packs
  
  - [ ]* 8.3 Write unit tests for gap finder
    - Test with complete draft pack (few gaps)
    - Test with empty draft pack (many gaps)
    - Test gap importance scoring
    - _Requirements: 3.1, 3.2_

- [ ] 9. Interviewer implementation
  - [ ] 9.1 Implement adaptive interview logic
    - Create `lib/interviewer.ts` with Interviewer class
    - Implement `generateQuestions()` with system and user prompts
    - System prompt: generate 5-12 targeted questions, group by category, include stopping criteria
    - Implement `getNextQuestion()` to manage interview session state
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 9.1, 9.2, 9.3, 9.9_
  
  - [ ]* 9.2 Write property test for question count bounds
    - **Property 10: Question Count Bounds**
    - **Validates: Requirements 3.4**
    - Test: generated questions are between 5-12
    - Run 100 iterations with different gap analyses
  
  - [ ]* 9.3 Write property test for question category assignment
    - **Property 11: Question Category Assignment**
    - **Validates: Requirements 3.3**
    - Test: all questions have valid category
    - Run 100 iterations
  
  - [ ]* 9.4 Write property test for answer storage with category
    - **Property 12: Answer Storage with Category**
    - **Validates: Requirements 4.2**
    - Test: stored answers include question category reference
    - Run 100 iterations
  
  - [ ]* 9.5 Write property test for skip handling
    - **Property 13: Skip Handling**
    - **Validates: Requirements 4.5, 4.6**
    - Test: skipped questions don't block progression
    - Test: skipped fields remain low confidence
    - Run 100 iterations
  
  - [ ]* 9.6 Write unit tests for interviewer
    - Test question generation with specific gaps
    - Test stopping criteria
    - Test adaptive question selection
    - _Requirements: 3.3, 3.4, 3.5, 3.6_

- [ ] 10. Checkpoint - Business logic components complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Pack builder implementation
  - [ ] 11.1 Implement context pack merging logic
    - Create `lib/pack-builder.ts` with PackBuilder class
    - Implement `buildFinalPack()` with system and user prompts
    - System prompt: merge draft + interview, prioritize founder answers, update confidence scores
    - Parse LLM response into final ContextPack with schema validation
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 9.1, 9.2, 9.3, 9.10_
  
  - [ ]* 11.2 Write property test for merge prioritization
    - **Property 14: Merge Prioritization**
    - **Validates: Requirements 5.2**
    - Test: founder answers override public scan for conflicts
    - Run 100 iterations with conflicting data
  
  - [ ]* 11.3 Write property test for merge confidence update
    - **Property 15: Merge Confidence Update**
    - **Validates: Requirements 5.3**
    - Test: founder data has confidence ≥ 0.9 after merge
    - Run 100 iterations
  
  - [ ]* 11.4 Write property test for founder answer confidence
    - **Property 7: Founder Answer Confidence**
    - **Validates: Requirements 7.2**
    - Test: all founder-sourced fields have confidence ≥ 0.9
    - Run 100 iterations
  
  - [ ]* 11.5 Write property test for unavailable field marking
    - **Property 16: Unavailable Field Marking**
    - **Validates: Requirements 5.5**
    - Test: missing fields marked "Information not available" with confidence 0
    - Run 100 iterations
  
  - [ ]* 11.6 Write property test for citation format by source
    - **Property 8: Citation Format by Source**
    - **Validates: Requirements 7.4, 7.5**
    - Test: public scan citations have URLs, interview citations have categories
    - Run 100 iterations
  
  - [ ]* 11.7 Write property test for low confidence uncertainty flagging
    - **Property 27: Low Confidence Uncertainty Flagging**
    - **Validates: Requirements 7.7**
    - Test: fields with confidence < 0.5 are flagged as uncertain
    - Run 100 iterations
  
  - [ ]* 11.8 Write unit tests for pack builder
    - Test merge with no conflicts
    - Test merge with all conflicts
    - Test with skipped questions
    - Test summary generation
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 12. Chat engine implementation
  - [ ] 12.1 Implement engineer chat logic
    - Create `lib/chat-engine.ts` with ChatEngine class
    - Implement `answerQuestion()` with system and user prompts
    - System prompt: answer only from context pack, include citations, add "why this matters"
    - Parse LLM response into ChatResponse with schema validation
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 9.1, 9.2, 9.3, 9.11_
  
  - [ ]* 12.2 Write property test for chat answer grounding
    - **Property 17: Chat Answer Grounding**
    - **Validates: Requirements 6.2, 6.7**
    - Test: all facts in answer are traceable to context pack
    - Run 100 iterations with different questions
  
  - [ ]* 12.3 Write property test for chat citation inclusion
    - **Property 18: Chat Citation Inclusion**
    - **Validates: Requirements 6.3**
    - Test: all answers include at least one citation
    - Run 100 iterations
  
  - [ ]* 12.4 Write property test for chat missing information acknowledgment
    - **Property 19: Chat Missing Information Acknowledgment**
    - **Validates: Requirements 6.4, 10.5**
    - Test: questions about unavailable info get explicit acknowledgment
    - Run 100 iterations
  
  - [ ]* 12.5 Write property test for "why this matters" inclusion
    - **Property 20: Chat "Why This Matters" Inclusion**
    - **Validates: Requirements 6.5**
    - Test: all answers include "why this matters" section
    - Run 100 iterations
  
  - [ ]* 12.6 Write unit tests for chat engine
    - Test with specific questions
    - Test with conversation history
    - Test with missing context pack
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 13. Demo mode integration
  - [ ] 13.1 Add demo mode toggle to components
    - Update Scraper to check demo mode flag
    - Update Interviewer to check demo mode flag
    - If demo mode enabled, use DemoData instead of real operations
    - _Requirements: 8.1, 8.2, 8.4, 8.5, 8.6_
  
  - [ ]* 13.2 Write property test for demo mode scraping bypass
    - **Property 21: Demo Mode Scraping Bypass**
    - **Validates: Requirements 8.2, 8.4**
    - Test: demo mode returns mock data without HTTP requests
    - Run 100 iterations
  
  - [ ]* 13.3 Write property test for demo mode interview bypass
    - **Property 22: Demo Mode Interview Bypass**
    - **Validates: Requirements 8.5**
    - Test: demo mode uses pre-defined questions/answers without LLM calls
    - Run 100 iterations
  
  - [ ]* 13.4 Write unit tests for demo mode
    - Test demo mode toggle
    - Test live mode performs real operations
    - _Requirements: 8.1, 8.6_

- [ ] 14. Failure handling integration
  - [ ] 14.1 Add complete scrape failure fallback
    - Update scan flow to check if all pages failed
    - If all failed, proceed to interview with empty draft pack
    - _Requirements: 10.1_
  
  - [ ]* 14.2 Write property test for complete scrape failure fallback
    - **Property 24: Complete Scrape Failure Fallback**
    - **Validates: Requirements 10.1**
    - Test: all scrape failures still proceed to interview
    - Run 100 iterations
  
  - [ ]* 14.3 Write property test for skipped questions pack generation
    - **Property 25: Skipped Questions Pack Generation**
    - **Validates: Requirements 10.6**
    - Test: multiple skipped questions still produce valid pack
    - Run 100 iterations

- [ ] 15. Checkpoint - All business logic complete with tests
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. API routes implementation
  - [ ] 16.1 Implement /api/scan route
    - Create `app/api/scan/route.ts`
    - Accept POST with company URL and demo mode flag
    - Call Scraper → Extractor → create draft pack v0
    - Save draft pack to storage
    - Return pack ID and draft pack
    - Handle errors gracefully
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  
  - [ ] 16.2 Implement /api/interview route
    - Create `app/api/interview/route.ts`
    - Accept POST to start interview (packId)
    - Accept POST to submit answer (sessionId, questionId, answer, skipped)
    - Call GapFinder → Interviewer → manage session state
    - Return next question or completion status
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [ ] 16.3 Implement /api/pack route
    - Create `app/api/pack/route.ts`
    - Accept POST to build final pack (packId, interview answers)
    - Call PackBuilder → save final pack v1
    - Return final pack
    - Accept GET to retrieve pack by ID
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [ ] 16.4 Implement /api/chat route
    - Create `app/api/chat/route.ts`
    - Accept POST with packId, message, conversation history
    - Call ChatEngine → generate response
    - Return chat message with citations and "why this matters"
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  
  - [ ]* 16.5 Write integration tests for API routes
    - Test end-to-end founder flow (scan → interview → pack)
    - Test end-to-end engineer flow (chat with pack)
    - Test demo mode flow
    - _Requirements: 1.1-14.7_

- [ ] 17. Shared UI components
  - [ ] 17.1 Create shared components
    - Create `components/shared/ConfidenceScore.tsx` to display confidence badges
    - Create `components/shared/DemoModeToggle.tsx` for demo mode switch
    - Style with Tailwind CSS
    - _Requirements: 7.6, 8.7_
  
  - [ ] 17.2 Create citation components
    - Create `components/onboard/CitationBadge.tsx` to display citations
    - Show URL or category based on citation type
    - Style with Tailwind CSS
    - _Requirements: 6.3, 7.4, 7.5_

- [ ] 18. Founder flow UI (/builder)
  - [ ] 18.1 Create URL input step
    - Create `components/builder/URLInput.tsx`
    - Form with company URL and optional name inputs
    - Demo mode toggle
    - Submit button to start scan
    - _Requirements: 11.1, 11.2_
  
  - [ ] 18.2 Create scan progress step
    - Create `components/builder/ScanProgress.tsx`
    - Show loading state during scraping
    - Display scraped page count
    - Show errors if any pages failed
    - _Requirements: 11.3_
  
  - [ ] 18.3 Create draft pack view step
    - Create `components/builder/DraftPackView.tsx`
    - Display draft pack v0 sections with confidence scores
    - Show citations for each field
    - Button to proceed to interview
    - _Requirements: 11.4_
  
  - [ ] 18.4 Create interview question step
    - Create `components/builder/InterviewQuestion.tsx`
    - Display current question with context
    - Text area for answer
    - Skip button
    - Submit button to proceed to next question
    - Progress indicator (question X of Y)
    - _Requirements: 11.5_
  
  - [ ] 18.5 Create final pack view step
    - Create `components/builder/FinalPackView.tsx`
    - Display final pack v1 with all sections
    - Show confidence scores and citations
    - Display human-readable summary
    - Button to view in engineer chat
    - _Requirements: 11.6_
  
  - [ ] 18.6 Wire up /builder page
    - Create `app/builder/page.tsx`
    - Manage multi-step flow state
    - Call API routes for each step
    - Handle errors and loading states
    - Style with Tailwind CSS
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

- [ ] 19. Engineer flow UI (/onboard)
  - [ ] 19.1 Create chat message component
    - Create `components/onboard/ChatMessage.tsx`
    - Display user and assistant messages differently
    - Show citations for assistant messages
    - Show "why this matters" section
    - Show confidence scores
    - _Requirements: 12.2, 12.3, 12.4, 12.5_
  
  - [ ] 19.2 Create chat input component
    - Create `components/onboard/ChatInput.tsx`
    - Text input for questions
    - Submit button
    - Loading state during response generation
    - _Requirements: 12.6_
  
  - [ ] 19.3 Wire up /onboard page
    - Create `app/onboard/page.tsx`
    - Load context pack from storage (use query param for packId)
    - Display chat interface with message history
    - Call /api/chat for each question
    - Handle missing pack error
    - Style with Tailwind CSS
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [ ] 20. Landing page and navigation
  - [ ] 20.1 Create landing page
    - Create `app/page.tsx`
    - Explain the app purpose
    - Links to /builder (for founders) and /onboard (for engineers)
    - Demo mode explanation
    - Style with Tailwind CSS
  
  - [ ] 20.2 Create layout with navigation
    - Update `app/layout.tsx`
    - Add navigation header with links
    - Add demo mode toggle in header
    - Style with Tailwind CSS

- [ ] 21. Documentation and polish
  - [ ] 21.1 Write comprehensive README
    - Setup instructions (install dependencies, set OPENAI_API_KEY)
    - How to run in development mode
    - How to use demo mode
    - How to use live mode
    - Architecture overview
    - Limitations and future improvements
    - _Requirements: All_
  
  - [ ] 21.2 Add error boundaries and loading states
    - Add React error boundaries to catch UI errors
    - Add loading spinners for async operations
    - Add toast notifications for errors
    - _Requirements: 10.4, 10.7_
  
  - [ ] 21.3 Polish UI styling
    - Ensure consistent spacing and typography
    - Add hover states and transitions
    - Ensure responsive design for mobile
    - Test accessibility (keyboard navigation, screen readers)
    - _Requirements: 11.8, 12.7_

- [ ] 22. Final checkpoint - Complete application
  - Ensure all tests pass, ask the user if questions arise.
  - Test end-to-end flows manually
  - Verify demo mode works without API key
  - Verify live mode works with API key

## Notes

- Tasks marked with `*` are optional property-based and unit tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at major milestones
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples, edge cases, and error conditions
- The implementation follows a bottom-up approach: infrastructure → business logic → API → UI
- Demo mode allows testing without OpenAI API key or live web scraping
- All LLM prompts include anti-hallucination rules and schema validation
