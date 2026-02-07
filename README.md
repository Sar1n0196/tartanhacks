# Onboarding Intelligence Agent

A Next.js web application that helps startup founders create comprehensive context packs for engineer onboarding. The system combines automated web research with structured founder interviews to build a knowledge base that new engineers can query through a chat interface.

## Features

- **Public Signal Scan**: Automatically extract company information from public web pages
- **Adaptive Interview**: Structured Q&A session to fill knowledge gaps
- **Context Pack Generation**: Merge public data with founder insights
- **Engineer Chat**: Query the context pack through a conversational interface
- **Demo Mode**: Explore functionality with pre-seeded mock data

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS
- **LLM Provider**: OpenAI API (GPT-4 or GPT-3.5-turbo)
- **Validation**: Zod for runtime schema validation
- **Storage**: JSON files (simple local storage)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key (for live mode)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd onboarding-intelligence-agent
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the example env file
cp .env.local.example .env.local

# Edit .env.local and add your OpenAI API key
OPENAI_API_KEY=your_openai_api_key_here
```

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

### Demo Mode

To explore the application without an API key:
1. Toggle "Demo Mode" in the UI
2. Use pre-seeded mock data instead of live web scraping
3. No OpenAI API calls will be made

## Project Structure

```
/
├── app/                    # Next.js app router pages
│   ├── builder/           # Founder context building UI
│   ├── onboard/           # Engineer chat UI
│   └── api/               # API routes
├── lib/                   # Core business logic
│   ├── scraper.ts         # Web scraping
│   ├── extractor.ts       # LLM-based extraction
│   ├── gap-finder.ts      # Gap identification
│   ├── interviewer.ts     # Adaptive interview
│   ├── pack-builder.ts    # Context pack generation
│   ├── chat-engine.ts     # Engineer chat
│   ├── llm-wrapper.ts     # OpenAI API wrapper
│   ├── storage.ts         # JSON storage
│   ├── demo-data.ts       # Mock data
│   ├── types.ts           # TypeScript types
│   └── schemas.ts         # Zod schemas
├── components/            # React components
│   ├── builder/          # Founder flow components
│   ├── onboard/          # Engineer flow components
│   └── shared/           # Shared components
└── data/                 # Stored context packs
    └── context-packs/
```

## Usage

### For Founders (Context Building)

1. Navigate to `/builder`
2. Enter your company URL
3. Review the automatically extracted information
4. Answer targeted questions to fill knowledge gaps
5. Review and finalize the context pack

### For Engineers (Onboarding)

1. Navigate to `/onboard`
2. Ask questions about the company, customers, or priorities
3. Receive answers with citations and business context
4. Understand how your work connects to customer needs

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run property-based tests
npm run test:pbt
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Architecture

The application follows a multi-stage pipeline:

1. **Public Signal Scan**: Scrape company web pages
2. **Extraction**: Use LLM to extract structured information
3. **Gap Analysis**: Identify missing or low-confidence information
4. **Interview**: Ask founder targeted questions
5. **Pack Building**: Merge all sources into final context pack
6. **Chat**: Answer engineer questions grounded in the context pack

All LLM interactions use structured prompts with explicit schemas to prevent hallucination.

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required for live mode)

## Limitations

- Single-user/single-company for MVP
- JSON file storage (not suitable for production scale)
- English language only
- Requires manual context pack updates

## Future Improvements

- Multi-company support with org management
- Real-time collaboration
- Version history and diff viewing
- Advanced RAG with vector embeddings
- Integration with Slack/Teams
- Analytics dashboard
- Automated context pack updates
- Role-based access control
- Multi-language support

## License

MIT

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.
