import { ScrapeResult, ContextPack, ScrapedPage } from './types';

/**
 * Demo data module for the Onboarding Intelligence Agent
 * Provides pre-seeded mock data for demo mode
 * Requirements: 8.1, 8.2, 8.3
 */

/**
 * DemoData class provides mock data for demo mode
 * Includes pre-defined scraped pages and complete Context Packs for 2 example companies
 */
export class DemoData {
  /**
   * Get list of available demo companies
   * Requirements: 8.3
   */
  static getDemoCompanies(): string[] {
    return ['Acme SaaS', 'TechStart'];
  }

  /**
   * Get mock scrape result for a demo company
   * Returns pre-defined scraped pages without making actual HTTP requests
   * Requirements: 8.2, 8.4
   */
  static getMockScrapeResult(companyUrl: string): ScrapeResult {
    const companyName = this.getCompanyNameFromUrl(companyUrl);
    
    if (companyName === 'Acme SaaS') {
      return this.getAcmeScrapeResult();
    } else if (companyName === 'TechStart') {
      return this.getTechStartScrapeResult();
    }
    
    // Default to Acme if unknown
    return this.getAcmeScrapeResult();
  }

  /**
   * Get complete mock Context Pack for a demo company
   * Returns pre-built Context Pack with all required fields
   * Requirements: 8.2, 8.3
   */
  static getMockContextPack(companyName: string): ContextPack {
    if (companyName === 'Acme SaaS') {
      return this.getAcmeContextPack();
    } else if (companyName === 'TechStart') {
      return this.getTechStartContextPack();
    }
    
    // Default to Acme if unknown
    return this.getAcmeContextPack();
  }

  /**
   * Extract company name from URL for demo mode
   */
  private static getCompanyNameFromUrl(url: string): string {
    if (url.includes('acme') || url.includes('demo1')) {
      return 'Acme SaaS';
    } else if (url.includes('techstart') || url.includes('demo2')) {
      return 'TechStart';
    }
    return 'Acme SaaS';
  }

  /**
   * Get Acme SaaS scrape result
   */
  private static getAcmeScrapeResult(): ScrapeResult {
    const timestamp = new Date().toISOString();
    
    const pages: ScrapedPage[] = [
      {
        url: 'https://acmesaas.example.com',
        title: 'Acme SaaS - Project Management for Modern Teams',
        content: `Acme SaaS is a project management platform designed for modern software teams. 
        
        Our mission is to help teams ship faster by eliminating context switching and keeping everyone aligned on what matters most.
        
        We believe that great software is built when engineers understand the "why" behind their work. That's why Acme SaaS connects every task to customer outcomes and business goals.
        
        Our values:
        - Customer obsession: We start with customer needs and work backwards
        - Radical transparency: Everyone has access to the same information
        - Bias for action: We ship fast and iterate based on feedback
        - Technical excellence: We build products we're proud of
        
        Trusted by over 500 fast-growing startups including TechCorp, DataFlow, and CloudScale.`,
        scrapedAt: timestamp,
        success: true,
      },
      {
        url: 'https://acmesaas.example.com/about',
        title: 'About Acme SaaS',
        content: `Founded in 2022, Acme SaaS was born from our founders' frustration with existing project management tools that felt disconnected from actual customer value.
        
        Our vision is to become the operating system for product development - the single source of truth that connects customer feedback, product strategy, and engineering execution.
        
        We serve early-stage startups (10-100 employees) who are moving fast and need to ensure every engineer understands how their work impacts customers and revenue.
        
        Our ideal customers are B2B SaaS companies with product-led growth models who value engineering velocity and customer-centric decision making.`,
        scrapedAt: timestamp,
        success: true,
      },
      {
        url: 'https://acmesaas.example.com/careers',
        title: 'Careers at Acme SaaS',
        content: `Join us in building the future of product development.
        
        We're looking for engineers who:
        - Care deeply about user experience and business impact
        - Want to ship features that directly move revenue metrics
        - Thrive in fast-paced, customer-focused environments
        - Value transparency and data-driven decision making
        
        Our engineering KPIs:
        - Feature adoption rate (% of customers using new features within 30 days)
        - Time to customer value (days from feature start to customer impact)
        - Customer satisfaction score for shipped features
        - Revenue impact per engineering sprint
        
        What NOT to build:
        - Features that don't solve a validated customer pain point
        - Complex solutions when simple ones will do
        - Anything that increases cognitive load for users
        - Features that can't be measured for business impact`,
        scrapedAt: timestamp,
        success: true,
      },
      {
        url: 'https://acmesaas.example.com/blog/our-approach',
        title: 'Our Product Development Approach',
        content: `At Acme SaaS, every feature starts with a customer problem, not a technical solution.
        
        Our product development process:
        1. Identify customer pain points through interviews and usage data
        2. Validate that solving this pain point will drive retention or revenue
        3. Design the simplest solution that delivers value
        4. Ship an MVP and measure adoption
        5. Iterate based on customer feedback and metrics
        
        We measure success by:
        - Customer retention rate (currently 95% monthly)
        - Net revenue retention (currently 120%)
        - Feature adoption within 30 days of launch
        - Customer satisfaction scores
        
        Our business model is subscription-based with three tiers:
        - Starter: $49/month for teams up to 10
        - Growth: $199/month for teams up to 50
        - Enterprise: Custom pricing for larger teams
        
        Revenue drivers:
        - New customer acquisition through product-led growth
        - Expansion revenue as teams grow
        - Feature adoption driving upgrades to higher tiers`,
        scrapedAt: timestamp,
        success: true,
      },
    ];

    return {
      pages,
      errors: [],
    };
  }

  /**
   * Get TechStart scrape result
   */
  private static getTechStartScrapeResult(): ScrapeResult {
    const timestamp = new Date().toISOString();
    
    const pages: ScrapedPage[] = [
      {
        url: 'https://techstart.example.com',
        title: 'TechStart - Developer Tools for AI Applications',
        content: `TechStart provides developer tools and infrastructure for building production-ready AI applications.
        
        Our mission is to make AI development as easy as web development by providing the right abstractions and tooling.
        
        We believe every software team will build AI features in the next 5 years, and they need tools that handle the complexity of LLMs, vector databases, and prompt management.
        
        Our core values:
        - Developer experience first: Make complex things simple
        - Production-ready from day one: No toy examples
        - Open and transparent: Open source core, clear pricing
        - Community-driven: Built with and for developers
        
        Used by over 1,000 developers at companies like AI Labs, DataCorp, and ML Systems.`,
        scrapedAt: timestamp,
        success: true,
      },
      {
        url: 'https://techstart.example.com/about',
        title: 'About TechStart',
        content: `TechStart was founded in 2023 by engineers who struggled to take AI prototypes to production.
        
        Our vision is to become the standard infrastructure layer for AI applications - the Rails or Django of the AI era.
        
        We serve two main customer segments:
        1. Startups building AI-first products (5-50 person teams)
        2. Enterprise engineering teams adding AI features to existing products
        
        Our ideal customers are technical teams who:
        - Need to ship AI features quickly and reliably
        - Care about production reliability and observability
        - Want to avoid vendor lock-in
        - Value developer productivity over everything else
        
        Key customer pain points we solve:
        - Managing prompts and model versions across environments
        - Monitoring LLM costs and performance in production
        - Handling rate limits and fallbacks gracefully
        - Testing and evaluating AI features before deployment`,
        scrapedAt: timestamp,
        success: true,
      },
      {
        url: 'https://techstart.example.com/careers',
        title: 'Join TechStart',
        content: `We're building the infrastructure for the AI era. Join us!
        
        What we look for in engineers:
        - Deep understanding of distributed systems and APIs
        - Passion for developer experience and tooling
        - Experience with production systems at scale
        - Curiosity about AI/ML without needing to be an expert
        
        Engineering priorities:
        - Reliability: 99.9% uptime for core services
        - Performance: Sub-100ms p95 latency for API calls
        - Developer experience: Clear docs, great error messages, fast onboarding
        - Observability: Every feature must be measurable
        
        What we DON'T build:
        - Features that lock customers into our platform
        - Complex abstractions that hide important details
        - Anything that requires reading the source code to understand
        - Features without clear success metrics
        
        Our engineering KPIs:
        - API reliability (uptime and error rates)
        - Time to first successful API call for new users
        - Feature adoption rate among active customers
        - Customer-reported bugs per release`,
        scrapedAt: timestamp,
        success: true,
      },
      {
        url: 'https://techstart.example.com/blog/business-model',
        title: 'How TechStart Makes Money',
        content: `TechStart uses a usage-based pricing model aligned with customer value.
        
        Pricing tiers:
        - Free: Up to 10,000 API calls/month
        - Pro: $99/month + $0.01 per API call
        - Enterprise: Custom pricing with volume discounts and SLAs
        
        Revenue drivers:
        - API usage growth as customers scale their AI features
        - Enterprise contracts with guaranteed minimums
        - Premium features (advanced observability, team collaboration)
        
        Key business metrics:
        - Monthly recurring revenue (MRR)
        - Net dollar retention (target: 130%)
        - Free-to-paid conversion rate (currently 15%)
        - Average revenue per customer
        
        Jobs to be done for customers:
        - Ship AI features to production quickly
        - Monitor and optimize LLM costs
        - Ensure reliability and handle failures gracefully
        - Collaborate on prompts and model configurations
        - Evaluate AI feature quality before deployment
        
        Key product features:
        - Prompt management and versioning
        - LLM observability and cost tracking
        - Fallback and retry logic
        - A/B testing for prompts
        - Team collaboration tools`,
        scrapedAt: timestamp,
        success: true,
      },
    ];

    return {
      pages,
      errors: [],
    };
  }

  /**
   * Get Acme SaaS complete Context Pack
   */
  private static getAcmeContextPack(): ContextPack {
    const timestamp = new Date().toISOString();
    
    return {
      id: 'demo-acme-saas',
      companyName: 'Acme SaaS',
      companyUrl: 'https://acmesaas.example.com',
      version: 'v1',
      createdAt: timestamp,
      updatedAt: timestamp,
      
      vision: {
        content: 'To become the operating system for product development - the single source of truth that connects customer feedback, product strategy, and engineering execution.',
        confidence: { value: 0.95 },
        citations: [
          { type: 'url', reference: 'https://acmesaas.example.com/about' },
          { type: 'interview', reference: 'vision' },
        ],
      },
      
      mission: {
        content: 'Help teams ship faster by eliminating context switching and keeping everyone aligned on what matters most to customers.',
        confidence: { value: 0.95 },
        citations: [
          { type: 'url', reference: 'https://acmesaas.example.com' },
          { type: 'interview', reference: 'vision' },
        ],
      },
      
      values: [
        {
          content: 'Customer obsession: We start with customer needs and work backwards',
          confidence: { value: 0.9 },
          citations: [{ type: 'url', reference: 'https://acmesaas.example.com' }],
        },
        {
          content: 'Radical transparency: Everyone has access to the same information',
          confidence: { value: 0.9 },
          citations: [{ type: 'url', reference: 'https://acmesaas.example.com' }],
        },
        {
          content: 'Bias for action: We ship fast and iterate based on feedback',
          confidence: { value: 0.9 },
          citations: [{ type: 'url', reference: 'https://acmesaas.example.com' }],
        },
        {
          content: 'Technical excellence: We build products we are proud of',
          confidence: { value: 0.9 },
          citations: [{ type: 'url', reference: 'https://acmesaas.example.com' }],
        },
      ],
      
      icp: {
        segments: [
          {
            name: 'Early-stage B2B SaaS startups',
            description: {
              content: 'Startups with 10-100 employees, product-led growth model, moving fast and need to ensure every engineer understands customer impact',
              confidence: { value: 0.95 },
              citations: [
                { type: 'url', reference: 'https://acmesaas.example.com/about' },
                { type: 'interview', reference: 'icp' },
              ],
            },
            painPoints: [
              {
                content: 'Engineers don\'t understand the "why" behind their work',
                confidence: { value: 0.95 },
                citations: [
                  { type: 'url', reference: 'https://acmesaas.example.com' },
                  { type: 'interview', reference: 'icp' },
                ],
              },
              {
                content: 'Context switching between tools slows down shipping velocity',
                confidence: { value: 0.9 },
                citations: [
                  { type: 'url', reference: 'https://acmesaas.example.com' },
                ],
              },
              {
                content: 'Difficult to keep everyone aligned on priorities and customer needs',
                confidence: { value: 0.9 },
                citations: [
                  { type: 'url', reference: 'https://acmesaas.example.com' },
                ],
              },
            ],
          },
        ],
        evolution: {
          content: 'Started with product-led B2B SaaS companies, expanding to any fast-growing startup that values customer-centric engineering',
          confidence: { value: 0.9 },
          citations: [{ type: 'interview', reference: 'icp' }],
        },
      },
      
      businessModel: {
        revenueDrivers: [
          {
            content: 'New customer acquisition through product-led growth',
            confidence: { value: 0.9 },
            citations: [{ type: 'url', reference: 'https://acmesaas.example.com/blog/our-approach' }],
          },
          {
            content: 'Expansion revenue as teams grow and upgrade tiers',
            confidence: { value: 0.9 },
            citations: [{ type: 'url', reference: 'https://acmesaas.example.com/blog/our-approach' }],
          },
          {
            content: 'Feature adoption driving upgrades to higher tiers',
            confidence: { value: 0.9 },
            citations: [{ type: 'url', reference: 'https://acmesaas.example.com/blog/our-approach' }],
          },
        ],
        pricingModel: {
          content: 'Subscription-based with three tiers: Starter ($49/month for up to 10 users), Growth ($199/month for up to 50 users), Enterprise (custom pricing)',
          confidence: { value: 0.95 },
          citations: [{ type: 'url', reference: 'https://acmesaas.example.com/blog/our-approach' }],
        },
        keyMetrics: [
          {
            content: 'Customer retention rate: 95% monthly',
            confidence: { value: 0.9 },
            citations: [{ type: 'url', reference: 'https://acmesaas.example.com/blog/our-approach' }],
          },
          {
            content: 'Net revenue retention: 120%',
            confidence: { value: 0.9 },
            citations: [{ type: 'url', reference: 'https://acmesaas.example.com/blog/our-approach' }],
          },
          {
            content: 'Feature adoption within 30 days of launch',
            confidence: { value: 0.9 },
            citations: [{ type: 'url', reference: 'https://acmesaas.example.com/blog/our-approach' }],
          },
        ],
      },
      
      product: {
        jobsToBeDone: [
          {
            content: 'Help engineers understand how their work impacts customers and revenue',
            confidence: { value: 0.95 },
            citations: [
              { type: 'url', reference: 'https://acmesaas.example.com' },
              { type: 'interview', reference: 'business-model' },
            ],
          },
          {
            content: 'Eliminate context switching by providing single source of truth',
            confidence: { value: 0.9 },
            citations: [{ type: 'url', reference: 'https://acmesaas.example.com' }],
          },
          {
            content: 'Keep teams aligned on priorities and customer needs',
            confidence: { value: 0.9 },
            citations: [{ type: 'url', reference: 'https://acmesaas.example.com' }],
          },
          {
            content: 'Connect every task to customer outcomes and business goals',
            confidence: { value: 0.9 },
            citations: [{ type: 'url', reference: 'https://acmesaas.example.com' }],
          },
        ],
        keyFeatures: [
          {
            content: 'Task management with customer outcome linking',
            confidence: { value: 0.85 },
            citations: [{ type: 'url', reference: 'https://acmesaas.example.com' }],
          },
          {
            content: 'Customer feedback integration',
            confidence: { value: 0.85 },
            citations: [{ type: 'url', reference: 'https://acmesaas.example.com/blog/our-approach' }],
          },
          {
            content: 'Business impact tracking and metrics',
            confidence: { value: 0.85 },
            citations: [{ type: 'url', reference: 'https://acmesaas.example.com/blog/our-approach' }],
          },
        ],
      },
      
      decisionRules: {
        priorities: [
          {
            content: 'Build features that solve validated customer pain points',
            confidence: { value: 0.95 },
            citations: [
              { type: 'url', reference: 'https://acmesaas.example.com/careers' },
              { type: 'interview', reference: 'decision-rules' },
            ],
          },
          {
            content: 'Ship features that directly move revenue metrics',
            confidence: { value: 0.95 },
            citations: [
              { type: 'url', reference: 'https://acmesaas.example.com/careers' },
              { type: 'interview', reference: 'decision-rules' },
            ],
          },
          {
            content: 'Prioritize features with measurable business impact',
            confidence: { value: 0.95 },
            citations: [
              { type: 'url', reference: 'https://acmesaas.example.com/careers' },
              { type: 'interview', reference: 'decision-rules' },
            ],
          },
          {
            content: 'Choose simple solutions over complex ones',
            confidence: { value: 0.9 },
            citations: [{ type: 'url', reference: 'https://acmesaas.example.com/careers' }],
          },
        ],
        antiPatterns: [
          {
            content: 'Do NOT build features without validated customer pain points',
            confidence: { value: 0.95 },
            citations: [{ type: 'url', reference: 'https://acmesaas.example.com/careers' }],
          },
          {
            content: 'Do NOT build complex solutions when simple ones will do',
            confidence: { value: 0.95 },
            citations: [{ type: 'url', reference: 'https://acmesaas.example.com/careers' }],
          },
          {
            content: 'Do NOT build anything that increases cognitive load for users',
            confidence: { value: 0.95 },
            citations: [{ type: 'url', reference: 'https://acmesaas.example.com/careers' }],
          },
          {
            content: 'Do NOT build features that cannot be measured for business impact',
            confidence: { value: 0.95 },
            citations: [{ type: 'url', reference: 'https://acmesaas.example.com/careers' }],
          },
        ],
      },
      
      engineeringKPIs: [
        {
          content: 'Feature adoption rate: % of customers using new features within 30 days',
          confidence: { value: 0.95 },
          citations: [{ type: 'url', reference: 'https://acmesaas.example.com/careers' }],
        },
        {
          content: 'Time to customer value: days from feature start to customer impact',
          confidence: { value: 0.95 },
          citations: [{ type: 'url', reference: 'https://acmesaas.example.com/careers' }],
        },
        {
          content: 'Customer satisfaction score for shipped features',
          confidence: { value: 0.95 },
          citations: [{ type: 'url', reference: 'https://acmesaas.example.com/careers' }],
        },
        {
          content: 'Revenue impact per engineering sprint',
          confidence: { value: 0.95 },
          citations: [{ type: 'url', reference: 'https://acmesaas.example.com/careers' }],
        },
      ],
      
      summary: `Acme SaaS is a project management platform for early-stage B2B SaaS startups (10-100 employees) who need to ship fast while keeping engineers aligned on customer needs and business impact.

The company's mission is to help teams ship faster by eliminating context switching and connecting every task to customer outcomes. Their vision is to become the operating system for product development.

Key customer pain points: Engineers don't understand the "why" behind their work, context switching slows velocity, and it's hard to keep teams aligned on priorities.

Business model: Subscription-based with three tiers ($49-$199/month, plus enterprise). Revenue drivers include new customer acquisition through product-led growth, expansion revenue, and feature adoption driving upgrades. Key metrics: 95% monthly retention, 120% net revenue retention.

Engineering priorities: Build features that solve validated customer pain points, ship features that move revenue metrics, prioritize measurable business impact, and choose simple solutions. Anti-patterns: Don't build without validated pain points, don't over-engineer, don't increase user cognitive load, don't build unmeasurable features.

Engineering KPIs: Feature adoption rate within 30 days, time to customer value, customer satisfaction scores, and revenue impact per sprint.`,
    };
  }

  /**
   * Get TechStart complete Context Pack
   */
  private static getTechStartContextPack(): ContextPack {
    const timestamp = new Date().toISOString();
    
    return {
      id: 'demo-techstart',
      companyName: 'TechStart',
      companyUrl: 'https://techstart.example.com',
      version: 'v1',
      createdAt: timestamp,
      updatedAt: timestamp,
      
      vision: {
        content: 'To become the standard infrastructure layer for AI applications - the Rails or Django of the AI era.',
        confidence: { value: 0.95 },
        citations: [
          { type: 'url', reference: 'https://techstart.example.com/about' },
          { type: 'interview', reference: 'vision' },
        ],
      },
      
      mission: {
        content: 'Make AI development as easy as web development by providing the right abstractions and tooling.',
        confidence: { value: 0.95 },
        citations: [
          { type: 'url', reference: 'https://techstart.example.com' },
          { type: 'interview', reference: 'vision' },
        ],
      },
      
      values: [
        {
          content: 'Developer experience first: Make complex things simple',
          confidence: { value: 0.9 },
          citations: [{ type: 'url', reference: 'https://techstart.example.com' }],
        },
        {
          content: 'Production-ready from day one: No toy examples',
          confidence: { value: 0.9 },
          citations: [{ type: 'url', reference: 'https://techstart.example.com' }],
        },
        {
          content: 'Open and transparent: Open source core, clear pricing',
          confidence: { value: 0.9 },
          citations: [{ type: 'url', reference: 'https://techstart.example.com' }],
        },
        {
          content: 'Community-driven: Built with and for developers',
          confidence: { value: 0.9 },
          citations: [{ type: 'url', reference: 'https://techstart.example.com' }],
        },
      ],
      
      icp: {
        segments: [
          {
            name: 'AI-first startups',
            description: {
              content: 'Startups with 5-50 person teams building AI-first products who need to ship quickly and reliably',
              confidence: { value: 0.95 },
              citations: [
                { type: 'url', reference: 'https://techstart.example.com/about' },
                { type: 'interview', reference: 'icp' },
              ],
            },
            painPoints: [
              {
                content: 'Difficulty managing prompts and model versions across environments',
                confidence: { value: 0.95 },
                citations: [
                  { type: 'url', reference: 'https://techstart.example.com/about' },
                  { type: 'interview', reference: 'icp' },
                ],
              },
              {
                content: 'Lack of visibility into LLM costs and performance in production',
                confidence: { value: 0.95 },
                citations: [
                  { type: 'url', reference: 'https://techstart.example.com/about' },
                ],
              },
              {
                content: 'Challenges handling rate limits and implementing fallbacks',
                confidence: { value: 0.9 },
                citations: [
                  { type: 'url', reference: 'https://techstart.example.com/about' },
                ],
              },
              {
                content: 'Difficulty testing and evaluating AI features before deployment',
                confidence: { value: 0.9 },
                citations: [
                  { type: 'url', reference: 'https://techstart.example.com/about' },
                ],
              },
            ],
          },
          {
            name: 'Enterprise engineering teams',
            description: {
              content: 'Enterprise teams adding AI features to existing products who value reliability and observability',
              confidence: { value: 0.95 },
              citations: [
                { type: 'url', reference: 'https://techstart.example.com/about' },
                { type: 'interview', reference: 'icp' },
              ],
            },
            painPoints: [
              {
                content: 'Need production reliability and observability for AI features',
                confidence: { value: 0.9 },
                citations: [
                  { type: 'url', reference: 'https://techstart.example.com/about' },
                ],
              },
              {
                content: 'Want to avoid vendor lock-in',
                confidence: { value: 0.9 },
                citations: [
                  { type: 'url', reference: 'https://techstart.example.com/about' },
                ],
              },
              {
                content: 'Prioritize developer productivity',
                confidence: { value: 0.9 },
                citations: [
                  { type: 'url', reference: 'https://techstart.example.com/about' },
                ],
              },
            ],
          },
        ],
        evolution: {
          content: 'Started with AI-first startups, expanding to enterprise teams adding AI to existing products',
          confidence: { value: 0.9 },
          citations: [{ type: 'interview', reference: 'icp' }],
        },
      },
      
      businessModel: {
        revenueDrivers: [
          {
            content: 'API usage growth as customers scale their AI features',
            confidence: { value: 0.95 },
            citations: [{ type: 'url', reference: 'https://techstart.example.com/blog/business-model' }],
          },
          {
            content: 'Enterprise contracts with guaranteed minimums',
            confidence: { value: 0.95 },
            citations: [{ type: 'url', reference: 'https://techstart.example.com/blog/business-model' }],
          },
          {
            content: 'Premium features (advanced observability, team collaboration)',
            confidence: { value: 0.9 },
            citations: [{ type: 'url', reference: 'https://techstart.example.com/blog/business-model' }],
          },
        ],
        pricingModel: {
          content: 'Usage-based pricing: Free tier (up to 10,000 API calls/month), Pro ($99/month + $0.01 per call), Enterprise (custom pricing with volume discounts)',
          confidence: { value: 0.95 },
          citations: [{ type: 'url', reference: 'https://techstart.example.com/blog/business-model' }],
        },
        keyMetrics: [
          {
            content: 'Monthly recurring revenue (MRR)',
            confidence: { value: 0.9 },
            citations: [{ type: 'url', reference: 'https://techstart.example.com/blog/business-model' }],
          },
          {
            content: 'Net dollar retention: target 130%',
            confidence: { value: 0.9 },
            citations: [{ type: 'url', reference: 'https://techstart.example.com/blog/business-model' }],
          },
          {
            content: 'Free-to-paid conversion rate: currently 15%',
            confidence: { value: 0.9 },
            citations: [{ type: 'url', reference: 'https://techstart.example.com/blog/business-model' }],
          },
          {
            content: 'Average revenue per customer',
            confidence: { value: 0.9 },
            citations: [{ type: 'url', reference: 'https://techstart.example.com/blog/business-model' }],
          },
        ],
      },
      
      product: {
        jobsToBeDone: [
          {
            content: 'Ship AI features to production quickly and reliably',
            confidence: { value: 0.95 },
            citations: [
              { type: 'url', reference: 'https://techstart.example.com/blog/business-model' },
              { type: 'interview', reference: 'business-model' },
            ],
          },
          {
            content: 'Monitor and optimize LLM costs in production',
            confidence: { value: 0.95 },
            citations: [{ type: 'url', reference: 'https://techstart.example.com/blog/business-model' }],
          },
          {
            content: 'Ensure reliability and handle failures gracefully',
            confidence: { value: 0.95 },
            citations: [{ type: 'url', reference: 'https://techstart.example.com/blog/business-model' }],
          },
          {
            content: 'Collaborate on prompts and model configurations',
            confidence: { value: 0.9 },
            citations: [{ type: 'url', reference: 'https://techstart.example.com/blog/business-model' }],
          },
          {
            content: 'Evaluate AI feature quality before deployment',
            confidence: { value: 0.9 },
            citations: [{ type: 'url', reference: 'https://techstart.example.com/blog/business-model' }],
          },
        ],
        keyFeatures: [
          {
            content: 'Prompt management and versioning',
            confidence: { value: 0.95 },
            citations: [{ type: 'url', reference: 'https://techstart.example.com/blog/business-model' }],
          },
          {
            content: 'LLM observability and cost tracking',
            confidence: { value: 0.95 },
            citations: [{ type: 'url', reference: 'https://techstart.example.com/blog/business-model' }],
          },
          {
            content: 'Fallback and retry logic',
            confidence: { value: 0.9 },
            citations: [{ type: 'url', reference: 'https://techstart.example.com/blog/business-model' }],
          },
          {
            content: 'A/B testing for prompts',
            confidence: { value: 0.9 },
            citations: [{ type: 'url', reference: 'https://techstart.example.com/blog/business-model' }],
          },
          {
            content: 'Team collaboration tools',
            confidence: { value: 0.9 },
            citations: [{ type: 'url', reference: 'https://techstart.example.com/blog/business-model' }],
          },
        ],
      },
      
      decisionRules: {
        priorities: [
          {
            content: 'Prioritize reliability: 99.9% uptime for core services',
            confidence: { value: 0.95 },
            citations: [
              { type: 'url', reference: 'https://techstart.example.com/careers' },
              { type: 'interview', reference: 'decision-rules' },
            ],
          },
          {
            content: 'Optimize for performance: Sub-100ms p95 latency for API calls',
            confidence: { value: 0.95 },
            citations: [
              { type: 'url', reference: 'https://techstart.example.com/careers' },
              { type: 'interview', reference: 'decision-rules' },
            ],
          },
          {
            content: 'Focus on developer experience: Clear docs, great error messages, fast onboarding',
            confidence: { value: 0.95 },
            citations: [
              { type: 'url', reference: 'https://techstart.example.com/careers' },
              { type: 'interview', reference: 'decision-rules' },
            ],
          },
          {
            content: 'Build with observability: Every feature must be measurable',
            confidence: { value: 0.95 },
            citations: [
              { type: 'url', reference: 'https://techstart.example.com/careers' },
              { type: 'interview', reference: 'decision-rules' },
            ],
          },
        ],
        antiPatterns: [
          {
            content: 'Do NOT build features that lock customers into our platform',
            confidence: { value: 0.95 },
            citations: [{ type: 'url', reference: 'https://techstart.example.com/careers' }],
          },
          {
            content: 'Do NOT create complex abstractions that hide important details',
            confidence: { value: 0.95 },
            citations: [{ type: 'url', reference: 'https://techstart.example.com/careers' }],
          },
          {
            content: 'Do NOT build anything that requires reading source code to understand',
            confidence: { value: 0.95 },
            citations: [{ type: 'url', reference: 'https://techstart.example.com/careers' }],
          },
          {
            content: 'Do NOT ship features without clear success metrics',
            confidence: { value: 0.95 },
            citations: [{ type: 'url', reference: 'https://techstart.example.com/careers' }],
          },
        ],
      },
      
      engineeringKPIs: [
        {
          content: 'API reliability: uptime and error rates',
          confidence: { value: 0.95 },
          citations: [{ type: 'url', reference: 'https://techstart.example.com/careers' }],
        },
        {
          content: 'Time to first successful API call for new users',
          confidence: { value: 0.95 },
          citations: [{ type: 'url', reference: 'https://techstart.example.com/careers' }],
        },
        {
          content: 'Feature adoption rate among active customers',
          confidence: { value: 0.95 },
          citations: [{ type: 'url', reference: 'https://techstart.example.com/careers' }],
        },
        {
          content: 'Customer-reported bugs per release',
          confidence: { value: 0.95 },
          citations: [{ type: 'url', reference: 'https://techstart.example.com/careers' }],
        },
      ],
      
      summary: `TechStart provides developer tools and infrastructure for building production-ready AI applications. Founded in 2023, the company serves two main segments: AI-first startups (5-50 person teams) and enterprise engineering teams adding AI features to existing products.

The company's mission is to make AI development as easy as web development by providing the right abstractions and tooling. Their vision is to become the standard infrastructure layer for AI applications - the Rails or Django of the AI era.

Key customer pain points: Managing prompts and model versions across environments, monitoring LLM costs and performance in production, handling rate limits and fallbacks, and testing AI features before deployment.

Business model: Usage-based pricing with free tier (10,000 API calls/month), Pro ($99/month + $0.01 per call), and Enterprise (custom pricing). Revenue drivers include API usage growth, enterprise contracts, and premium features. Key metrics: Target 130% net dollar retention, 15% free-to-paid conversion rate.

Engineering priorities: Reliability (99.9% uptime), performance (sub-100ms p95 latency), developer experience (clear docs, great errors), and observability (every feature measurable). Anti-patterns: Don't lock in customers, don't hide important details with abstractions, don't require reading source code to understand, don't ship without success metrics.

Engineering KPIs: API reliability (uptime and error rates), time to first successful API call, feature adoption rate, and customer-reported bugs per release.`,
    };
  }

  /**
   * Get mock interview questions for demo mode
   * Returns pre-defined questions without making LLM calls
   * Requirements: 8.5
   */
  static getMockInterviewQuestions(): any[] {
    return [
      {
        id: 'demo-q1',
        category: 'vision',
        question: 'What is your long-term vision for the company over the next 5 years?',
        context: 'Understanding the vision helps engineers align their work with long-term goals',
        priority: 9,
      },
      {
        id: 'demo-q2',
        category: 'icp',
        question: 'What are the top 3 pain points your ideal customers face that your product solves?',
        context: 'Engineers need to understand customer problems to build the right solutions',
        priority: 10,
      },
      {
        id: 'demo-q3',
        category: 'business-model',
        question: 'What metrics indicate whether a feature is delivering business value?',
        context: 'Engineers should know how to measure the impact of their work',
        priority: 9,
      },
      {
        id: 'demo-q4',
        category: 'decision-rules',
        question: 'What types of features should engineers avoid building, and why?',
        context: 'Clear anti-patterns help engineers make better decisions',
        priority: 10,
      },
      {
        id: 'demo-q5',
        category: 'engineering-kpis',
        question: 'What engineering metrics matter most to the business?',
        context: 'Engineers need to know what success looks like',
        priority: 8,
      },
    ];
  }

  /**
   * Get mock interview answers for demo mode
   * Returns pre-defined answers without requiring user input
   * Requirements: 8.5
   */
  static getMockInterviewAnswers(): any[] {
    return [
      {
        questionId: 'demo-q1',
        answer: 'We want to be the default choice for product development teams, helping every engineer understand the business impact of their work.',
        skipped: false,
        answeredAt: new Date().toISOString(),
      },
      {
        questionId: 'demo-q2',
        answer: 'Our customers struggle with: 1) Engineers not understanding customer needs, 2) Difficulty measuring feature impact, 3) Misalignment between engineering and business priorities.',
        skipped: false,
        answeredAt: new Date().toISOString(),
      },
      {
        questionId: 'demo-q3',
        answer: 'We track feature adoption rate, customer satisfaction scores, and revenue impact per sprint. Features should show measurable improvement in these metrics.',
        skipped: false,
        answeredAt: new Date().toISOString(),
      },
      {
        questionId: 'demo-q4',
        answer: 'Avoid building features without validated customer pain points, over-engineering simple solutions, and anything that cannot be measured for business impact.',
        skipped: false,
        answeredAt: new Date().toISOString(),
      },
      {
        questionId: 'demo-q5',
        answer: 'Time to customer value, feature adoption rate within 30 days, customer satisfaction scores, and revenue impact per engineering sprint.',
        skipped: false,
        answeredAt: new Date().toISOString(),
      },
    ];
  }
}
