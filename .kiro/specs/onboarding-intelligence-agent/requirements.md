# Requirements Document: Onboarding Intelligence Agent

## Introduction

The Onboarding Intelligence Agent is a web application that helps startup founders create comprehensive context packs for onboarding new engineers. The primary motivation is to enable engineers to make more user-centric decisions when building new features and to deeply understand the business value of the features they are building. The system combines automated web research with structured founder interviews to build a knowledge base that new engineers can query through a chat interface. This enables new hires to quickly understand company vision, business model, customer segments, and engineering priorities, ensuring they can connect their technical work to customer needs and business impact without requiring extensive founder time.

## Glossary

- **Context_Pack**: A structured knowledge artifact containing company vision, mission, values, ICP evolution, business model, revenue drivers, and engineering KPIs
- **Public_Signal_Scan**: The automated process of scraping and analyzing public web pages to extract company information
- **Consultant_Interview**: An adaptive Q&A session where the system asks founders targeted questions to fill knowledge gaps
- **Onboarding_Chat**: The chat interface where new engineers query the Context Pack
- **Confidence_Score**: A numerical value (0-1) indicating the system's certainty about extracted or inferred information
- **Citation**: A reference to the source of information (URL for public scan, section reference for Context Pack)
- **ICP**: Ideal Customer Profile - the target customer segments for the company
- **Decision_Rules**: Guidelines that help engineers understand what to prioritize and what not to build
- **Demo_Mode**: A mode using pre-seeded mock data instead of live web scraping

## Requirements

### Requirement 1: Public Signal Scan

**User Story:** As a founder, I want the system to automatically extract company information from public web pages, so that I don't have to manually input basic information that's already available online.

#### Acceptance Criteria

1. WHEN a founder provides a company URL, THE Public_Signal_Scan SHALL scrape the homepage, about page, careers page, and blog pages
2. WHEN scraping a page, THE Public_Signal_Scan SHALL extract text content using readability extraction or similar parsing
3. WHEN the page limit is reached, THE Public_Signal_Scan SHALL stop scraping additional pages
4. WHEN a scrape fails for any page, THE Public_Signal_Scan SHALL continue processing remaining pages and log the failure
5. WHEN all pages are processed, THE Public_Signal_Scan SHALL generate a Draft Context Pack v0 with vision/mission/values, ICP hypothesis, business model hypothesis, and product hypotheses
6. FOR ALL extracted information, THE Public_Signal_Scan SHALL include a confidence score between 0 and 1
7. FOR ALL extracted information, THE Public_Signal_Scan SHALL include citations referencing the source URL

### Requirement 2: Context Pack Structure

**User Story:** As a founder, I want the Context Pack to have a well-defined structure with confidence scores and citations, so that engineers can trust the information and understand its source.

#### Acceptance Criteria

1. THE Context_Pack SHALL contain a vision/mission/values section with confidence scores and citations
2. THE Context_Pack SHALL contain an ICP evolution section with customer segments, confidence scores, and citations
3. THE Context_Pack SHALL contain a business model section with revenue drivers, confidence scores, and citations
4. THE Context_Pack SHALL contain a product/jobs-to-be-done section with confidence scores and citations
5. THE Context_Pack SHALL contain a Decision Rules section with engineering priorities and anti-patterns
6. THE Context_Pack SHALL contain role-specific KPIs for engineers
7. THE Context_Pack SHALL be stored as structured JSON
8. THE Context_Pack SHALL include a human-readable summary
9. WHEN serializing the Context Pack to JSON, THE System SHALL ensure all required fields are present
10. WHEN deserializing the Context Pack from JSON, THE System SHALL validate the structure matches the expected schema

### Requirement 3: Gap Identification and Question Prioritization

**User Story:** As a founder, I want the system to identify missing information and ask me targeted questions, so that I can efficiently fill knowledge gaps without answering irrelevant questions.

#### Acceptance Criteria

1. WHEN the Draft Context Pack v0 is generated, THE System SHALL analyze all fields to identify missing or low-confidence information
2. WHEN gaps are identified, THE System SHALL rank them by importance for engineer onboarding
3. WHEN generating interview questions, THE System SHALL group them by category (Vision, ICP, Business Model, Engineering KPIs, Decision Rules)
4. THE System SHALL generate between 5 and 12 prioritized questions based on identified gaps
5. WHEN a founder answers a question, THE System SHALL adapt subsequent questions based on the answer
6. WHEN sufficient information is gathered, THE System SHALL stop asking questions even if fewer than 12 questions were asked

### Requirement 4: Consultant Interview Flow

**User Story:** As a founder, I want to participate in a structured interview that adapts to my answers, so that I can efficiently provide the most important context without wasting time on redundant questions.

#### Acceptance Criteria

1. WHEN the Consultant Interview begins, THE System SHALL present questions one at a time
2. WHEN a founder provides an answer, THE System SHALL store the answer with a reference to the question category
3. WHEN a founder provides an answer, THE System SHALL determine the next best question based on remaining gaps
4. WHEN the stopping criteria is met, THE System SHALL conclude the interview
5. THE System SHALL allow the founder to skip questions they cannot answer
6. WHEN a question is skipped, THE System SHALL mark that information as unavailable and continue with remaining questions

### Requirement 5: Context Pack Generation and Merging

**User Story:** As a founder, I want the system to merge public scan results with my interview answers into a final Context Pack, so that engineers have access to comprehensive, accurate company information.

#### Acceptance Criteria

1. WHEN the Consultant Interview is complete, THE System SHALL merge the Draft Context Pack v0 with founder answers
2. WHEN merging information, THE System SHALL prioritize founder answers over public scan results for conflicting information
3. WHEN merging information, THE System SHALL update confidence scores based on source reliability
4. WHEN generating Context Pack v1, THE System SHALL ensure all sections are populated with available information
5. WHEN information is unavailable for a section, THE System SHALL mark it as "Information not available" with confidence score 0
6. THE System SHALL generate both structured JSON and human-readable summary formats
7. THE System SHALL store the final Context Pack for use in the Onboarding Chat

### Requirement 6: Engineer Onboarding Chat Interface

**User Story:** As a new engineer, I want to ask questions about the company through a chat interface, so that I can quickly understand company context without interrupting the founder or team.

#### Acceptance Criteria

1. WHEN an engineer accesses the Onboarding Chat, THE System SHALL display a chat interface
2. WHEN an engineer submits a question, THE System SHALL generate an answer using only information from the Context Pack
3. WHEN answering a question, THE System SHALL include citations referencing the relevant Context Pack sections
4. WHEN the Context Pack lacks information to answer a question, THE System SHALL explicitly state the information is unavailable
5. WHEN providing an answer, THE System SHALL include a "Why this matters" explanation connecting the answer to business impact
6. THE System SHALL maintain conversation history within a chat session
7. THE System SHALL NOT generate answers based on information outside the Context Pack

### Requirement 7: Confidence Scoring and Citation System

**User Story:** As an engineer, I want to see confidence scores and citations for information, so that I can assess the reliability of answers and trace information back to its source.

#### Acceptance Criteria

1. FOR ALL information extracted from public pages, THE System SHALL assign a confidence score between 0 and 1
2. FOR ALL information provided by founders, THE System SHALL assign a confidence score of 0.9 or higher
3. FOR ALL information in the Context Pack, THE System SHALL include citations
4. WHEN citing public scan results, THE System SHALL reference the source URL
5. WHEN citing founder answers, THE System SHALL reference the interview question category
6. WHEN displaying information to engineers, THE System SHALL show confidence scores for key claims
7. WHEN confidence is below 0.5, THE System SHALL flag the information as uncertain

### Requirement 8: Demo Mode with Seed Data

**User Story:** As a user evaluating the system, I want to use demo mode with pre-populated data, so that I can explore functionality without providing real company information or waiting for web scraping.

#### Acceptance Criteria

1. THE System SHALL support a Demo Mode toggle
2. WHEN Demo Mode is enabled, THE System SHALL use pre-seeded mock data instead of live web scraping
3. THE System SHALL include seed data for at least 1 example company
4. WHEN Demo Mode is enabled, THE Public_Signal_Scan SHALL return mock scraping results immediately
5. WHEN Demo Mode is enabled, THE Consultant Interview SHALL use pre-defined questions and mock answers
6. WHEN Demo Mode is disabled, THE System SHALL perform live web scraping and real LLM calls
7. THE System SHALL clearly indicate when Demo Mode is active

### Requirement 9: Multi-Step Prompting System

**User Story:** As a system architect, I want a multi-step prompting system with explicit schemas and validation, so that the system produces reliable, well-structured outputs without hallucination.

#### Acceptance Criteria

1. THE System SHALL use separate prompts for extraction, gap-finding, interviewing, pack-building, and chat responses
2. FOR ALL prompts, THE System SHALL define explicit input and output schemas
3. FOR ALL prompts, THE System SHALL include instructions to avoid hallucination
4. FOR ALL prompts that generate confidence scores, THE System SHALL validate scores are between 0 and 1
5. FOR ALL prompts that generate citations, THE System SHALL validate citations reference actual sources
6. WHEN a prompt output fails schema validation, THE System SHALL log the error and retry with clarified instructions
7. THE Extractor_Prompt SHALL summarize public pages into evidence-backed claims with citations
8. THE Gap_Finder_Prompt SHALL identify missing fields and rank uncertainty
9. THE Interviewer_Prompt SHALL generate the next best question with stopping criteria
10. THE Pack_Builder_Prompt SHALL merge all information into the final structured Context Pack
11. THE Chat_Prompt SHALL answer engineer questions grounded only in the Context Pack with citations

### Requirement 10: Graceful Failure Handling

**User Story:** As a founder, I want the system to handle failures gracefully, so that I can still create a useful Context Pack even when web scraping fails or information is incomplete.

#### Acceptance Criteria

1. WHEN web scraping fails for all pages, THE System SHALL proceed directly to the Consultant Interview
2. WHEN web scraping fails for some pages, THE System SHALL use successfully scraped pages and note failures
3. WHEN the LLM API call fails, THE System SHALL retry up to 3 times with exponential backoff
4. WHEN retries are exhausted, THE System SHALL display a user-friendly error message
5. WHEN information is missing from the Context Pack, THE Onboarding_Chat SHALL acknowledge the gap rather than inventing information
6. WHEN a founder skips multiple questions, THE System SHALL generate a Context Pack with available information only
7. THE System SHALL log all errors for debugging without exposing technical details to users

### Requirement 11: Founder Flow User Interface

**User Story:** As a founder, I want a clean, modern interface that guides me through the context building process, so that I can efficiently create a Context Pack without confusion.

#### Acceptance Criteria

1. THE System SHALL provide a /builder page for the founder flow
2. WHEN a founder visits /builder, THE System SHALL display Step 1 (company URL input)
3. WHEN a founder submits a company URL, THE System SHALL display Step 2 (Public Signal Scan progress)
4. WHEN the Public Signal Scan completes, THE System SHALL display the Draft Context Pack v0 with confidence scores
5. WHEN the founder proceeds, THE System SHALL display Step 3 (Consultant Interview)
6. WHEN the Consultant Interview completes, THE System SHALL display Step 4 (final Context Pack v1)
7. THE System SHALL provide clear visual feedback for each step's progress
8. THE System SHALL use Tailwind CSS for styling with a clean, modern aesthetic

### Requirement 12: Engineer Flow User Interface

**User Story:** As a new engineer, I want a simple chat interface where I can ask questions and receive clear, cited answers, so that I can learn about the company efficiently.

#### Acceptance Criteria

1. THE System SHALL provide an /onboard page for the engineer flow
2. WHEN an engineer visits /onboard, THE System SHALL display a chat interface
3. WHEN an engineer types a message, THE System SHALL display the message in the chat history
4. WHEN the system generates a response, THE System SHALL display it in the chat history with citations
5. WHEN the system includes a "Why this matters" explanation, THE System SHALL visually distinguish it from the main answer
6. THE System SHALL provide a text input field that is always accessible
7. THE System SHALL use Tailwind CSS for styling with a clean, modern aesthetic

### Requirement 13: LLM Integration

**User Story:** As a developer, I want a single wrapper for LLM API calls, so that I can easily switch providers or update API configurations in one place.

#### Acceptance Criteria

1. THE System SHALL use the OPENAI_API_KEY environment variable for authentication
2. THE System SHALL provide a single wrapper module for all LLM API calls
3. THE System SHALL support configuring the LLM model through the wrapper
4. WHEN making an LLM API call, THE System SHALL include appropriate system prompts and user prompts
5. WHEN an API call fails, THE System SHALL return an error that can be handled by the caller
6. THE System SHALL NOT expose API keys in client-side code

### Requirement 14: Data Storage

**User Story:** As a developer, I want simple local storage for Context Packs, so that the system can persist data without complex database setup.

#### Acceptance Criteria

1. THE System SHALL store Context Packs as JSON files or in SQLite
2. WHEN a Context Pack is created, THE System SHALL persist it to storage
3. WHEN an engineer accesses the Onboarding Chat, THE System SHALL load the Context Pack from storage
4. WHEN storage is empty, THE System SHALL handle the missing data gracefully
5. THE System SHALL support storing multiple Context Packs with unique identifiers
6. WHEN serializing a Context Pack, THE System SHALL ensure valid JSON format
7. WHEN deserializing a Context Pack, THE System SHALL validate the structure before use
