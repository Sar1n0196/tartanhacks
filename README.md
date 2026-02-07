# Onboarding Intelligence Agent

A Next.js web application that helps startup founders create comprehensive context packs for engineer onboarding. The system combines automated web research with structured founder interviews to build a knowledge base that new engineers can query through a chat interface.

## Why This Exists

New engineers often struggle to understand the business context behind their technical work. They need to know:
- Who are the customers and what problems do they face?
- What business value does each feature provide?
- What should be prioritized and what should be avoided?

This tool enables founders to efficiently create a comprehensive knowledge base that answers these questions, allowing engineers to make more user-centric decisions without requiring constant founder time.

## Features

- **Public Signal Scan**: Automatically extract company information from public web pages (homepage, about, careers, blog)
- **Adaptive Interview**: Structured Q&A session that identifies knowledge gaps and asks targeted questions
- **Context Pack Generation**: Merge public data with founder insights into a structured knowledge base
- **Engineer Chat**: Query the context pack through a conversational interface with citations and business context
- **Demo Mode**: Explore functionality with pre-seeded mock data (no API key required)
- **Confidence Scoring**: Every piece of information includes a confidence score (0-1) and source citations
- **Property-Based Testing**: Comprehensive test suite with 27 correctness properties

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS
- **LLM Provider**: OpenAI API (GPT-4 or GPT-3.5-turbo)
- **Validation**: Zod for runtime schema validation
- **Testing**: Vitest + fast-check for property-based testing
- **Scraping**: Cheerio for HTML parsing
- **Storage**: JSON files (simple local storage)

## Getting Started

### Prerequisites

- **Node.js 18+** and npm
- **OpenAI API key** (only required for live mode, not for demo mode)

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd onboarding-intelligence-agent
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
# Create .env.local file
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env.local
```

Replace `your_openai_api_key_here` with your actual OpenAI API key. Get one at [platform.openai.com](https://platform.openai.com/api-keys).

**Note**: If you only want to use demo mode, you can skip setting the API key.

### Running the Application

**Development mode:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Production build:**
```bash
npm run build
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Usage

### Demo Mode (No API Key Required)

Demo mode lets you explore the full functionality without an OpenAI API key or live web scraping:

1. Navigate to [http://localhost:3000](http://localhost:3000)
2. Toggle **"Demo Mode"** in the navigation header
3. Go to `/builder` and select a demo company (e.g., "Acme SaaS")
4. The system will use pre-seeded mock data for all operations
5. Complete the flow to see how context packs are built
6. Try the engineer chat at `/onboard` with the demo context pack

**What happens in demo mode:**
- No HTTP requests to external websites
- No OpenAI API calls
- Instant responses using mock data
- Full UI flow demonstration

### Live Mode (Requires API Key)

Live mode performs real web scraping and LLM-based analysis:

1. Ensure `OPENAI_API_KEY` is set in `.env.local`
2. Toggle **"Demo Mode" OFF** in the navigation header
3. Navigate to `/builder`
4. Enter a real company URL (e.g., `https://stripe.com`)
5. The system will:
   - Scrape the company's public web pages
   - Extract information using GPT-4
   - Identify knowledge gaps
   - Generate targeted interview questions
   - Build a comprehensive context pack

**What happens in live mode:**
- Real HTTP requests to scrape company websites
- OpenAI API calls for extraction, gap analysis, and chat
- Actual processing time (30-60 seconds for full flow)
- Real context packs stored in `data/context-packs/`

### For Founders (Building Context Packs)

**Step 1: URL Input**
1. Navigate to `/builder`
2. Enter your company URL
3. Optionally provide a company name
4. Click "Start Scan"

**Step 2: Public Signal Scan**
- The system scrapes your homepage, about page, careers page, and blog
- Extracts text content and removes navigation/scripts
- Shows progress and any errors

**Step 3: Draft Pack Review**
- Review automatically extracted information
- See confidence scores for each field
- View source citations (URLs)
- Click "Continue to Interview"

**Step 4: Adaptive Interview**
- Answer 5-12 targeted questions based on identified gaps
- Questions are grouped by category (Vision, ICP, Business Model, etc.)
- Skip questions you can't answer
- The system adapts based on your responses

**Step 5: Final Pack**
- Review the complete context pack
- See merged information from public scan + interview
- Founder answers have higher confidence scores (0.9+)
- View human-readable summary
- Context pack is automatically saved

### For Engineers (Onboarding Chat)

**Using the Chat Interface**
1. Navigate to `/onboard`
2. Select a context pack (or use query param: `/onboard?packId=<id>`)
3. Ask questions about the company, customers, or priorities

**Example questions:**
- "Who are our target customers?"
- "What are the main pain points we're solving?"
- "What should I prioritize when building new features?"
- "What are the key business metrics?"
- "What should we avoid building?"

**Chat responses include:**
- Direct answer grounded in the context pack
- Citations referencing specific sections
- "Why this matters" explanation connecting to business impact
- Confidence scores for key claims

**Important**: The chat only uses information from the context pack. If information isn't available, it will explicitly say so rather than making up answers.

## Project Structure

```
/
├── app/                          # Next.js app router
│   ├── page.tsx                 # Landing page
│   ├── layout.tsx               # Root layout with navigation
│   ├── builder/                 # Founder flow
│   │   └── page.tsx            # Multi-step context building UI
│   ├── onboard/                 # Engineer flow
│   │   └── page.tsx            # Chat interface
│   └── api/                     # Server-side API routes
│       ├── scan/route.ts       # POST: Scrape & extract
│       ├── interview/route.ts  # POST: Start/answer interview
│       ├── pack/route.ts       # GET/POST: Retrieve/build packs
│       └── chat/route.ts       # POST: Answer engineer questions
│
├── lib/                          # Core business logic
│   ├── types.ts                 # TypeScript interfaces
│   ├── schemas.ts               # Zod validation schemas
│   ├── scraper.ts               # Web scraping with Cheerio
│   ├── extractor.ts             # LLM-based extraction (Prompt 1)
│   ├── gap-finder.ts            # Gap identification (Prompt 2)
│   ├── interviewer.ts           # Adaptive interview (Prompt 3)
│   ├── pack-builder.ts          # Context pack merging (Prompt 4)
│   ├── chat-engine.ts           # Engineer chat (Prompt 5)
│   ├── llm-wrapper.ts           # OpenAI API wrapper with retry logic
│   ├── storage.ts               # JSON file storage
│   ├── demo-data.ts             # Mock data for demo mode
│   └── test-utils.ts            # Testing utilities
│
├── components/                   # React components
│   ├── builder/                 # Founder flow components
│   │   ├── URLInput.tsx        # Step 1: URL input form
│   │   ├── ScanProgress.tsx    # Step 2: Scraping progress
│   │   ├── DraftPackView.tsx   # Step 3: Draft pack review
│   │   ├── InterviewQuestion.tsx # Step 4: Interview Q&A
│   │   └── FinalPackView.tsx   # Step 5: Final pack display
│   ├── onboard/                 # Engineer flow components
│   │   ├── ChatMessage.tsx     # Chat message display
│   │   ├── ChatInput.tsx       # Chat input field
│   │   └── CitationBadge.tsx   # Citation display
│   └── shared/                  # Shared components
│       ├── ConfidenceScore.tsx # Confidence badge
│       ├── DemoModeToggle.tsx  # Demo mode switch
│       └── Navigation.tsx      # Header navigation
│
├── data/                         # Data storage
│   └── context-packs/           # Stored context packs (JSON)
│
├── .env.local                    # Environment variables (not in git)
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── vitest.config.ts              # Test configuration
└── README.md                     # This file
```

## Architecture Overview

### Multi-Stage Pipeline

The application follows a clear data flow through five stages:

```
1. Public Signal Scan (Scraper)
   ↓ ScrapedPage[]
2. Extraction (Extractor + LLM)
   ↓ Draft Context Pack v0
3. Gap Analysis (GapFinder + LLM)
   ↓ Prioritized Gaps
4. Interview (Interviewer + LLM)
   ↓ Founder Answers
5. Pack Building (PackBuilder + LLM)
   ↓ Final Context Pack v1
```

### LLM Prompting Strategy

The system uses **five specialized prompts** with explicit schemas to prevent hallucination:

1. **Extractor Prompt**: Summarize public pages into evidence-backed claims with citations
2. **Gap Finder Prompt**: Identify missing fields and rank by importance
3. **Interviewer Prompt**: Generate next best question with stopping criteria
4. **Pack Builder Prompt**: Merge all information into final structured pack
5. **Chat Prompt**: Answer questions grounded only in the context pack

Each prompt includes:
- Clear instructions to avoid hallucination
- Explicit input/output schemas (Zod validation)
- Confidence scoring requirements
- Citation requirements
- Retry logic on validation failure

### Error Handling

The system gracefully handles failures at every stage:

- **Scraping failures**: Continue with successful pages, proceed to interview if all fail
- **LLM API errors**: Retry up to 3 times with exponential backoff (1s, 2s, 4s)
- **Schema validation failures**: Retry with clarified prompt
- **Missing information**: Mark as unavailable rather than inventing data
- **Skipped questions**: Generate pack with available information only

### Storage

Context packs are stored as JSON files in `data/context-packs/`:
- Filename: `{companyName}-{timestamp}.json`
- Schema validation on read/write
- Simple file-based storage (suitable for MVP, not production scale)

## Development

### Running Tests

```bash
# Run all tests once
npm run test:run

# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Test Structure

The test suite includes:
- **Unit tests**: Specific examples and edge cases (`.test.ts` files)
- **Property-based tests**: Universal correctness properties (`.property.test.ts` files)
- **Integration tests**: End-to-end flows (`.integration.test.ts` files)

**27 Correctness Properties** validate:
- Scraper page limits and failure resilience
- Confidence score bounds (0-1)
- Citation presence and format
- Gap ranking and question generation
- Merge prioritization and confidence updates
- Chat answer grounding and citation inclusion
- Demo mode bypasses
- Storage persistence round-trips

### Type Checking

```bash
npx tsc --noEmit
```

### Linting

```bash
npm run lint
```

### Adding New Features

1. Define types in `lib/types.ts`
2. Add Zod schemas in `lib/schemas.ts`
3. Implement business logic in `lib/`
4. Create API route in `app/api/`
5. Build UI components in `components/`
6. Write unit and property tests
7. Update this README

## Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Required for live mode (not required for demo mode)
OPENAI_API_KEY=sk-...your-key-here...
```

**Security note**: Never commit `.env.local` to version control. It's already in `.gitignore`.

## API Routes

### POST /api/scan
Scrape company website and extract information.

**Request:**
```json
{
  "companyUrl": "https://example.com",
  "companyName": "Example Inc",
  "demoMode": false
}
```

**Response:**
```json
{
  "packId": "example-inc-1234567890",
  "draftPack": { /* Context Pack v0 */ },
  "scrapedPages": 4,
  "errors": []
}
```

### POST /api/interview
Start interview or submit answer.

**Start interview:**
```json
{
  "action": "start",
  "packId": "example-inc-1234567890"
}
```

**Submit answer:**
```json
{
  "action": "answer",
  "sessionId": "session-123",
  "questionId": "q1",
  "answer": "Our target customers are...",
  "skipped": false
}
```

### POST /api/pack
Build final context pack.

**Request:**
```json
{
  "packId": "example-inc-1234567890",
  "sessionId": "session-123"
}
```

**Response:**
```json
{
  "pack": { /* Context Pack v1 */ }
}
```

### GET /api/pack?id={packId}
Retrieve context pack by ID.

### POST /api/chat
Answer engineer question.

**Request:**
```json
{
  "packId": "example-inc-1234567890",
  "message": "Who are our target customers?",
  "conversationHistory": []
}
```

**Response:**
```json
{
  "message": {
    "role": "assistant",
    "content": "Your target customers are...",
    "citations": [{ "type": "section", "reference": "icp.segments[0]" }],
    "whyItMatters": "Understanding your ICP helps you...",
    "confidence": { "value": 0.95 }
  }
}
```

## Limitations

### Current MVP Limitations

- **Single-user**: No authentication or multi-user support
- **Single-company**: One context pack at a time (no org management)
- **English only**: No multi-language support
- **Manual updates**: Context packs don't auto-update when company info changes
- **Simple storage**: JSON files (not suitable for production scale)
- **Limited scraping**: Max 10 pages, no JavaScript rendering
- **No versioning**: Can't track changes or revert to previous versions
- **No collaboration**: Can't have multiple founders contribute simultaneously

### Known Issues

- Large websites may take 30-60 seconds to scrape
- LLM responses can occasionally fail schema validation (retries usually fix this)
- Confidence scores are estimates, not guarantees
- Citations may be imprecise for complex information
- Demo mode data is limited to 2 example companies

## Future Improvements

### Near-term (Next 3-6 months)

- **Multi-company support**: Manage multiple context packs with org structure
- **Version history**: Track changes and revert to previous versions
- **Real-time collaboration**: Multiple founders can contribute simultaneously
- **Automated updates**: Periodic re-scanning of public pages
- **Better storage**: PostgreSQL or MongoDB for production scale
- **Role-based access**: Control who can edit vs. view context packs

### Long-term (6-12 months)

- **Advanced RAG**: Vector embeddings for better semantic search
- **Integration with Slack/Teams**: Answer questions directly in chat tools
- **Analytics dashboard**: Track which questions engineers ask most
- **Multi-language support**: Support non-English companies
- **Custom fields**: Allow founders to define additional context fields
- **API access**: Programmatic access to context packs
- **Mobile app**: Native iOS/Android apps for on-the-go access

### Research Ideas

- **Automated gap detection**: Use ML to identify missing information without LLM
- **Context pack templates**: Pre-built templates for different industries
- **Integration with CRM**: Auto-populate customer segments from Salesforce/HubSpot
- **Code-to-context linking**: Connect code files to relevant context pack sections
- **Onboarding metrics**: Track engineer understanding over time

## Troubleshooting

### "OpenAI API key not found"
- Ensure `.env.local` exists in the root directory
- Check that `OPENAI_API_KEY` is set correctly
- Restart the dev server after adding the key
- Or use demo mode (no API key required)

### "Failed to scrape pages"
- Check that the company URL is valid and accessible
- Some websites block scrapers (use demo mode instead)
- Check your internet connection
- Try a different company URL

### "Schema validation failed"
- This usually resolves automatically with retries
- If persistent, check the LLM response in logs
- May indicate an issue with the prompt or schema
- Report as a bug if it happens consistently

### Tests failing
- Run `npm install` to ensure all dependencies are installed
- Check that Node.js version is 18+
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npx tsc --noEmit`

### Port already in use
- Kill the process using port 3000: `lsof -ti:3000 | xargs kill -9`
- Or use a different port: `PORT=3001 npm run dev`

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Write tests** for new features (unit + property tests)
3. **Follow TypeScript strict mode** (no `any` types)
4. **Use Zod schemas** for all data validation
5. **Update this README** if adding new features
6. **Run tests** before submitting: `npm run test:run`
7. **Submit a pull request** with a clear description

### Code Style

- Use TypeScript strict mode
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Prefer composition over inheritance

## License

MIT License - see LICENSE file for details

## Support

For questions or issues:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section above

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [OpenAI](https://openai.com/) - LLM provider
- [Zod](https://zod.dev/) - Schema validation
- [Cheerio](https://cheerio.js.org/) - HTML parsing
- [fast-check](https://fast-check.dev/) - Property-based testing
- [Vitest](https://vitest.dev/) - Testing framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
