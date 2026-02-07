import { describe, it, expect } from 'vitest';
import { DemoData } from './demo-data';
import { ContextPackSchema, ScrapeResultSchema } from './schemas';

describe('DemoData', () => {
  describe('getDemoCompanies', () => {
    it('should return at least 1 demo company', () => {
      const companies = DemoData.getDemoCompanies();
      expect(companies.length).toBeGreaterThanOrEqual(1);
    });

    it('should return exactly 2 demo companies', () => {
      const companies = DemoData.getDemoCompanies();
      expect(companies.length).toBe(2);
      expect(companies).toContain('Acme SaaS');
      expect(companies).toContain('TechStart');
    });
  });

  describe('getMockScrapeResult', () => {
    it('should return valid scrape result structure for Acme SaaS', () => {
      const result = DemoData.getMockScrapeResult('https://acmesaas.example.com');
      
      // Validate against schema - this is the key test for valid structure
      const validated = ScrapeResultSchema.parse(result);
      expect(validated).toBeDefined();
      
      // Check structure has required properties
      expect(result).toHaveProperty('pages');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.pages)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should return valid scrape result structure for TechStart', () => {
      const result = DemoData.getMockScrapeResult('https://techstart.example.com');
      
      // Validate against schema - this is the key test for valid structure
      const validated = ScrapeResultSchema.parse(result);
      expect(validated).toBeDefined();
      
      // Check structure has required properties
      expect(result).toHaveProperty('pages');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.pages)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should have valid page structure in scrape results', () => {
      const result = DemoData.getMockScrapeResult('https://acmesaas.example.com');
      
      expect(result.pages.length).toBeGreaterThan(0);
      
      // Check each page has valid structure
      result.pages.forEach(page => {
        expect(page).toHaveProperty('url');
        expect(page).toHaveProperty('title');
        expect(page).toHaveProperty('content');
        expect(page).toHaveProperty('scrapedAt');
        expect(page).toHaveProperty('success');
        expect(typeof page.url).toBe('string');
        expect(typeof page.title).toBe('string');
        expect(typeof page.content).toBe('string');
        expect(typeof page.scrapedAt).toBe('string');
        expect(typeof page.success).toBe('boolean');
      });
    });

    it('should have successful pages with content', () => {
      const result = DemoData.getMockScrapeResult('https://acmesaas.example.com');
      
      result.pages.forEach(page => {
        expect(page.success).toBe(true);
        expect(page.content.length).toBeGreaterThan(0);
        expect(page.title.length).toBeGreaterThan(0);
      });
    });

    it('should have no errors in demo mode', () => {
      const acmeResult = DemoData.getMockScrapeResult('https://acmesaas.example.com');
      const techStartResult = DemoData.getMockScrapeResult('https://techstart.example.com');
      
      expect(acmeResult.errors).toEqual([]);
      expect(techStartResult.errors).toEqual([]);
    });
  });

  describe('getMockContextPack', () => {
    it('should pass schema validation for Acme SaaS', () => {
      const pack = DemoData.getMockContextPack('Acme SaaS');
      
      // This is the critical test - schema validation ensures structure is correct
      const validated = ContextPackSchema.parse(pack);
      expect(validated).toBeDefined();
    });

    it('should pass schema validation for TechStart', () => {
      const pack = DemoData.getMockContextPack('TechStart');
      
      // This is the critical test - schema validation ensures structure is correct
      const validated = ContextPackSchema.parse(pack);
      expect(validated).toBeDefined();
    });

    it('should have all required top-level fields for Acme SaaS', () => {
      const pack = DemoData.getMockContextPack('Acme SaaS');
      
      expect(pack.id).toBe('demo-acme-saas');
      expect(pack.companyName).toBe('Acme SaaS');
      expect(pack.version).toBe('v1');
      expect(pack).toHaveProperty('createdAt');
      expect(pack).toHaveProperty('updatedAt');
      expect(pack).toHaveProperty('vision');
      expect(pack).toHaveProperty('mission');
      expect(pack).toHaveProperty('values');
      expect(pack).toHaveProperty('icp');
      expect(pack).toHaveProperty('businessModel');
      expect(pack).toHaveProperty('product');
      expect(pack).toHaveProperty('decisionRules');
      expect(pack).toHaveProperty('engineeringKPIs');
      expect(pack).toHaveProperty('summary');
    });

    it('should have all required top-level fields for TechStart', () => {
      const pack = DemoData.getMockContextPack('TechStart');
      
      expect(pack.id).toBe('demo-techstart');
      expect(pack.companyName).toBe('TechStart');
      expect(pack.version).toBe('v1');
      expect(pack).toHaveProperty('createdAt');
      expect(pack).toHaveProperty('updatedAt');
      expect(pack).toHaveProperty('vision');
      expect(pack).toHaveProperty('mission');
      expect(pack).toHaveProperty('values');
      expect(pack).toHaveProperty('icp');
      expect(pack).toHaveProperty('businessModel');
      expect(pack).toHaveProperty('product');
      expect(pack).toHaveProperty('decisionRules');
      expect(pack).toHaveProperty('engineeringKPIs');
      expect(pack).toHaveProperty('summary');
    });

    it('should have valid confidence scores in all fields', () => {
      const pack = DemoData.getMockContextPack('Acme SaaS');
      
      // Check vision and mission
      expect(pack.vision.confidence.value).toBeGreaterThanOrEqual(0);
      expect(pack.vision.confidence.value).toBeLessThanOrEqual(1);
      expect(pack.mission.confidence.value).toBeGreaterThanOrEqual(0);
      expect(pack.mission.confidence.value).toBeLessThanOrEqual(1);
      
      // Check values
      pack.values.forEach(value => {
        expect(value.confidence.value).toBeGreaterThanOrEqual(0);
        expect(value.confidence.value).toBeLessThanOrEqual(1);
      });
      
      // Check ICP segments
      pack.icp.segments.forEach(segment => {
        expect(segment.description.confidence.value).toBeGreaterThanOrEqual(0);
        expect(segment.description.confidence.value).toBeLessThanOrEqual(1);
        segment.painPoints.forEach(painPoint => {
          expect(painPoint.confidence.value).toBeGreaterThanOrEqual(0);
          expect(painPoint.confidence.value).toBeLessThanOrEqual(1);
        });
      });
      
      // Check business model
      expect(pack.businessModel.pricingModel.confidence.value).toBeGreaterThanOrEqual(0);
      expect(pack.businessModel.pricingModel.confidence.value).toBeLessThanOrEqual(1);
      
      // Check engineering KPIs
      pack.engineeringKPIs.forEach(kpi => {
        expect(kpi.confidence.value).toBeGreaterThanOrEqual(0);
        expect(kpi.confidence.value).toBeLessThanOrEqual(1);
      });
    });

    it('should have citations for all fields', () => {
      const pack = DemoData.getMockContextPack('Acme SaaS');
      
      // Check vision and mission have citations
      expect(pack.vision.citations.length).toBeGreaterThan(0);
      expect(pack.mission.citations.length).toBeGreaterThan(0);
      
      // Check values have citations
      pack.values.forEach(value => {
        expect(value.citations.length).toBeGreaterThan(0);
      });
      
      // Check ICP has citations
      pack.icp.segments.forEach(segment => {
        expect(segment.description.citations.length).toBeGreaterThan(0);
      });
      
      // Check business model has citations
      expect(pack.businessModel.pricingModel.citations.length).toBeGreaterThan(0);
      
      // Check engineering KPIs have citations
      pack.engineeringKPIs.forEach(kpi => {
        expect(kpi.citations.length).toBeGreaterThan(0);
      });
    });

    it('should have non-empty content in all required fields', () => {
      const pack = DemoData.getMockContextPack('Acme SaaS');
      
      expect(pack.vision.content.length).toBeGreaterThan(0);
      expect(pack.mission.content.length).toBeGreaterThan(0);
      expect(pack.values.length).toBeGreaterThan(0);
      expect(pack.icp.segments.length).toBeGreaterThan(0);
      expect(pack.businessModel.revenueDrivers.length).toBeGreaterThan(0);
      expect(pack.product.jobsToBeDone.length).toBeGreaterThan(0);
      expect(pack.decisionRules.priorities.length).toBeGreaterThan(0);
      expect(pack.decisionRules.antiPatterns.length).toBeGreaterThan(0);
      expect(pack.engineeringKPIs.length).toBeGreaterThan(0);
      expect(pack.summary.length).toBeGreaterThan(0);
    });

    it('should have valid citation types', () => {
      const pack = DemoData.getMockContextPack('Acme SaaS');
      
      const allCitations = [
        ...pack.vision.citations,
        ...pack.mission.citations,
        ...pack.values.flatMap(v => v.citations),
      ];
      
      allCitations.forEach(citation => {
        expect(['url', 'interview', 'section']).toContain(citation.type);
        expect(citation.reference.length).toBeGreaterThan(0);
      });
    });

    it('should have complete ICP structure', () => {
      const pack = DemoData.getMockContextPack('Acme SaaS');
      
      expect(pack.icp.segments.length).toBeGreaterThan(0);
      expect(pack.icp).toHaveProperty('evolution');
      
      pack.icp.segments.forEach(segment => {
        expect(segment).toHaveProperty('name');
        expect(segment).toHaveProperty('description');
        expect(segment).toHaveProperty('painPoints');
        expect(segment.name.length).toBeGreaterThan(0);
        expect(segment.description.content.length).toBeGreaterThan(0);
        expect(Array.isArray(segment.painPoints)).toBe(true);
      });
    });

    it('should have complete business model structure', () => {
      const pack = DemoData.getMockContextPack('Acme SaaS');
      
      expect(pack.businessModel).toHaveProperty('revenueDrivers');
      expect(pack.businessModel).toHaveProperty('pricingModel');
      expect(pack.businessModel).toHaveProperty('keyMetrics');
      
      expect(Array.isArray(pack.businessModel.revenueDrivers)).toBe(true);
      expect(pack.businessModel.revenueDrivers.length).toBeGreaterThan(0);
      expect(pack.businessModel.pricingModel.content.length).toBeGreaterThan(0);
      expect(Array.isArray(pack.businessModel.keyMetrics)).toBe(true);
    });

    it('should have complete product structure', () => {
      const pack = DemoData.getMockContextPack('Acme SaaS');
      
      expect(pack.product).toHaveProperty('jobsToBeDone');
      expect(pack.product).toHaveProperty('keyFeatures');
      
      expect(Array.isArray(pack.product.jobsToBeDone)).toBe(true);
      expect(pack.product.jobsToBeDone.length).toBeGreaterThan(0);
      expect(Array.isArray(pack.product.keyFeatures)).toBe(true);
    });

    it('should have complete decision rules structure', () => {
      const pack = DemoData.getMockContextPack('Acme SaaS');
      
      expect(pack.decisionRules).toHaveProperty('priorities');
      expect(pack.decisionRules).toHaveProperty('antiPatterns');
      
      expect(Array.isArray(pack.decisionRules.priorities)).toBe(true);
      expect(pack.decisionRules.priorities.length).toBeGreaterThan(0);
      expect(Array.isArray(pack.decisionRules.antiPatterns)).toBe(true);
      expect(pack.decisionRules.antiPatterns.length).toBeGreaterThan(0);
    });
  });

  describe('getMockInterviewQuestions', () => {
    it('should return array of interview questions', () => {
      const questions = DemoData.getMockInterviewQuestions();
      
      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThan(0);
    });

    it('should return questions with valid structure', () => {
      const questions = DemoData.getMockInterviewQuestions();
      
      questions.forEach(question => {
        expect(question).toHaveProperty('id');
        expect(question).toHaveProperty('category');
        expect(question).toHaveProperty('question');
        expect(question).toHaveProperty('priority');
        expect(typeof question.id).toBe('string');
        expect(typeof question.category).toBe('string');
        expect(typeof question.question).toBe('string');
        expect(typeof question.priority).toBe('number');
      });
    });

    it('should return questions with valid categories', () => {
      const questions = DemoData.getMockInterviewQuestions();
      const validCategories = ['vision', 'icp', 'business-model', 'engineering-kpis', 'decision-rules'];
      
      questions.forEach(question => {
        expect(validCategories).toContain(question.category);
      });
    });

    it('should return questions with priority between 1 and 10', () => {
      const questions = DemoData.getMockInterviewQuestions();
      
      questions.forEach(question => {
        expect(question.priority).toBeGreaterThanOrEqual(1);
        expect(question.priority).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('getMockInterviewAnswers', () => {
    it('should return array of interview answers', () => {
      const answers = DemoData.getMockInterviewAnswers();
      
      expect(Array.isArray(answers)).toBe(true);
      expect(answers.length).toBeGreaterThan(0);
    });

    it('should return answers with valid structure', () => {
      const answers = DemoData.getMockInterviewAnswers();
      
      answers.forEach(answer => {
        expect(answer).toHaveProperty('questionId');
        expect(answer).toHaveProperty('answer');
        expect(answer).toHaveProperty('skipped');
        expect(answer).toHaveProperty('answeredAt');
        expect(typeof answer.questionId).toBe('string');
        expect(typeof answer.answer).toBe('string');
        expect(typeof answer.skipped).toBe('boolean');
        expect(typeof answer.answeredAt).toBe('string');
      });
    });

    it('should return answers matching mock questions', () => {
      const questions = DemoData.getMockInterviewQuestions();
      const answers = DemoData.getMockInterviewAnswers();
      
      const questionIds = questions.map(q => q.id);
      
      answers.forEach(answer => {
        expect(questionIds).toContain(answer.questionId);
      });
    });

    it('should return non-skipped answers with content', () => {
      const answers = DemoData.getMockInterviewAnswers();
      
      const nonSkippedAnswers = answers.filter(a => !a.skipped);
      
      nonSkippedAnswers.forEach(answer => {
        expect(answer.answer.length).toBeGreaterThan(0);
      });
    });
  });
});
