# API Routes Implementation Summary

This document summarizes the implementation of three API routes for the Onboarding Intelligence Agent.

## Implemented Routes

### 1. `/api/interview` - Interview Management Route

**File:** `app/api/interview/route.ts`

**Endpoints:**

#### POST /api/interview (Start Interview)
- **Request:** `{ packId: string }`
- **Response:** `{ sessionId: string, questions: InterviewQuestion[] }`
- **Flow:**
  1. Loads draft Context Pack v0 from storage
  2. Uses GapFinder to analyze gaps in the pack
  3. Uses Interviewer to generate 5-12 targeted questions
  4. Creates interview session and stores in memory
  5. Returns session ID and questions

#### POST /api/interview (Submit Answer)
- **Request:** `{ sessionId: string, questionId: string, answer: string, skipped: boolean }`
- **Response:** `{ nextQuestion: InterviewQuestion | null, completed: boolean }`
- **Flow:**
  1. Retrieves interview session from memory
  2. Validates question ID matches current question
  3. Stores answer in session
  4. Advances to next question or marks as completed
  5. Returns next question or completion status

#### GET /api/interview?sessionId=xxx
- **Response:** Complete interview session state
- **Purpose:** Retrieve session state for debugging or resuming

**Requirements Satisfied:** 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6

**Key Features:**
- In-memory session storage (Map-based)
- Validates question order and session state
- Supports skipping questions
- Handles both starting and answering in same endpoint
- Proper error handling for missing packs/sessions

---

### 2. `/api/pack` - Context Pack Management Route

**File:** `app/api/pack/route.ts`

**Endpoints:**

#### POST /api/pack
- **Request:** `{ packId: string, sessionId: string }`
- **Response:** `{ pack: ContextPack }`
- **Flow:**
  1. Loads draft Context Pack v0 from storage
  2. Retrieves completed interview session
  3. Validates session is completed and matches pack
  4. Uses PackBuilder to merge draft pack with interview answers
  5. Saves final Context Pack v1 to storage
  6. Returns final pack

#### GET /api/pack?packId=xxx
- **Response:** `{ pack: ContextPack }`
- **Purpose:** Retrieve any Context Pack by ID (v0 or v1)

**Requirements Satisfied:** 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7

**Key Features:**
- Merges public scan data with founder interview answers
- Prioritizes founder answers over public scan (confidence 0.9+)
- Marks unavailable information explicitly
- Generates human-readable summary
- Validates session completion before building

---

### 3. `/api/chat` - Engineer Chat Route

**File:** `app/api/chat/route.ts`

**Endpoints:**

#### POST /api/chat
- **Request:** `{ packId: string, question: string, conversationHistory: ChatMessage[] }`
- **Response:** `{ message: ChatMessage }`
- **Flow:**
  1. Validates request and loads Context Pack
  2. Uses ChatEngine to generate grounded answer
  3. Creates ChatMessage with citations and "why this matters"
  4. Returns complete chat message

**Requirements Satisfied:** 6.2, 6.3, 6.4, 6.5, 6.6, 6.7

**Key Features:**
- Answers grounded only in Context Pack (no hallucination)
- Includes citations referencing Context Pack sections
- Provides "Why this matters" explanations
- Maintains conversation history
- Explicitly states when information is unavailable
- Includes confidence scores

---

## Common Features Across All Routes

### Error Handling
All routes include comprehensive error handling:
- **Zod validation errors:** Returns 400 with field-level details
- **Missing resources:** Returns 404 with clear messages
- **API key errors:** Returns 500 with authentication guidance
- **Rate limiting:** Returns 429 with retry guidance
- **Generic errors:** Returns 500 with error message

### Validation
- All request bodies validated using Zod schemas
- Type-safe throughout with TypeScript
- Schema validation for LLM responses

### Logging
- Console logs for debugging and monitoring
- Tracks key operations (scraping, question generation, pack building)
- Logs errors with context

### API Key Management
- Checks for `OPENAI_API_KEY` environment variable
- Returns helpful error messages if missing
- Never exposes API key in responses

---

## Session Management

The interview route uses in-memory session storage:
```typescript
const sessions = new Map<string, InterviewSession>();
```

**Session ID Format:** `session-{packId}-{timestamp}-{random}`

**Session Lifecycle:**
1. Created when interview starts
2. Updated as answers are submitted
3. Marked completed when all questions answered
4. Retrieved by pack route to build final pack

**Note:** In production, sessions should be stored in Redis or a database for persistence and scalability.

---

## Integration with Business Logic

### Interview Route
- **GapFinder:** Analyzes draft pack to identify missing information
- **Interviewer:** Generates adaptive questions based on gaps
- **Storage:** Loads draft packs, stores sessions

### Pack Route
- **PackBuilder:** Merges draft pack with interview answers
- **Storage:** Loads draft packs, saves final packs
- **Interview Sessions:** Retrieves completed sessions

### Chat Route
- **ChatEngine:** Generates grounded answers from Context Pack
- **Storage:** Loads Context Packs for answering questions
- **LLMWrapper:** Makes API calls with anti-hallucination prompts

---

## Testing Recommendations

### Unit Tests
1. Test request validation (valid/invalid inputs)
2. Test error handling (missing resources, API failures)
3. Test session management (create, update, retrieve)
4. Test pack building (merge logic, confidence updates)
5. Test chat responses (grounding, citations, unavailable info)

### Integration Tests
1. End-to-end founder flow: scan → interview → pack
2. End-to-end engineer flow: load pack → chat
3. Error scenarios: missing API key, invalid sessions
4. Demo mode flow (if implemented)

### Manual Testing
1. Start interview with valid pack ID
2. Submit answers (some skipped, some answered)
3. Build final pack after completing interview
4. Retrieve pack by ID
5. Ask questions in chat interface
6. Test error cases (invalid IDs, incomplete sessions)

---

## Next Steps

After implementing these routes, the next tasks are:

1. **Task 16.5:** Write integration tests for API routes
2. **Task 17:** Implement shared UI components (ConfidenceScore, CitationBadge, etc.)
3. **Task 18:** Build founder flow UI (/builder page)
4. **Task 19:** Build engineer flow UI (/onboard page)

The API routes are now complete and ready to be consumed by the frontend!
