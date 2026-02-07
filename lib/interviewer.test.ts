import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Interviewer } from './interviewer';
import { LLMWrapper } from './llm-wrapper';
import {
  QuestionGenerationRequest,
  QuestionGenerationResult,
  InterviewSession,
  InterviewAnswer,
  Gap,
} from './types';

/**
 * Unit tests for Interviewer class
 * 
 * Tests:
 * - Question generation with specific gaps
 * - Stopping criteria evaluation
 * - Adaptive question selection based on previous answers
 * - Session state management
 * - Next question retrieval
 */

describe('Interviewer', () => {
  let mockLLM: LLMWrapper;
  let interviewer: Interviewer;

  beforeEach(() => {
    // Create mock LLM wrapper
    mockLLM = {
      completeWithSchema: vi.fn(),
    } as any;

    interviewer = new Interviewer(mockLLM);
  });

  describe('generateQuestions', () => {
    it('should generate questions based on gaps', async () => {
      // Arrange
      const gaps: Gap[] = [
        {
          field: 'icp.segments',
          category: 'icp',
          importance: 9,
          reason: 'No customer segments identified',
          currentConfidence: 0.1,
        },
        {
          field: 'decisionRules.priorities',
          category: 'decision-rules',
          importance: 8,
          reason: 'No engineering priorities defined',
          currentConfidence: 0.2,
        },
      ];

      const request: QuestionGenerationRequest = {
        gaps,
        previousAnswers: [],
        maxQuestions: 10,
      };

      const mockResult: QuestionGenerationResult = {
        questions: [
          {
            id: 'q1',
            category: 'icp',
            question: 'Who are your ideal customers?',
            context: 'Understanding customer segments',
            priority: 9,
          },
          {
            id: 'q2',
            category: 'decision-rules',
            question: 'What should engineers prioritize?',
            context: 'Engineering decision-making',
            priority: 8,
          },
        ],
        shouldStop: false,
        reason: 'More information needed',
      };

      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(mockResult);

      // Act
      const result = await interviewer.generateQuestions(request);

      // Assert
      expect(result.questions).toHaveLength(2);
      expect(result.questions[0].category).toBe('icp');
      expect(result.questions[1].category).toBe('decision-rules');
      expect(result.shouldStop).toBe(false);
      expect(mockLLM.completeWithSchema).toHaveBeenCalledOnce();
    });

    it('should include stopping criteria when sufficient information gathered', async () => {
      // Arrange
      const gaps: Gap[] = [
        {
          field: 'vision',
          category: 'vision',
          importance: 5,
          reason: 'Minor gap in vision statement',
          currentConfidence: 0.7,
        },
      ];

      const previousAnswers: InterviewAnswer[] = [
        {
          questionId: 'q1',
          answer: 'Comprehensive answer about ICP',
          skipped: false,
          answeredAt: new Date().toISOString(),
        },
        {
          questionId: 'q2',
          answer: 'Detailed business model explanation',
          skipped: false,
          answeredAt: new Date().toISOString(),
        },
      ];

      const request: QuestionGenerationRequest = {
        gaps,
        previousAnswers,
        maxQuestions: 10,
      };

      const mockResult: QuestionGenerationResult = {
        questions: [
          {
            id: 'q3',
            category: 'vision',
            question: 'Can you clarify your vision?',
            priority: 5,
          },
        ],
        shouldStop: true,
        reason: 'Most critical gaps addressed',
      };

      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(mockResult);

      // Act
      const result = await interviewer.generateQuestions(request);

      // Assert
      expect(result.shouldStop).toBe(true);
      expect(result.reason).toBe('Most critical gaps addressed');
    });

    it('should generate between 5 and 12 questions', async () => {
      // Arrange
      const gaps: Gap[] = Array.from({ length: 15 }, (_, i) => ({
        field: `field${i}`,
        category: 'icp',
        importance: 7,
        reason: `Gap ${i}`,
        currentConfidence: 0.3,
      }));

      const request: QuestionGenerationRequest = {
        gaps,
        previousAnswers: [],
        maxQuestions: 12,
      };

      const mockResult: QuestionGenerationResult = {
        questions: Array.from({ length: 10 }, (_, i) => ({
          id: `q${i}`,
          category: 'icp',
          question: `Question ${i}`,
          priority: 7,
        })),
        shouldStop: false,
      };

      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(mockResult);

      // Act
      const result = await interviewer.generateQuestions(request);

      // Assert
      expect(result.questions.length).toBeGreaterThanOrEqual(5);
      expect(result.questions.length).toBeLessThanOrEqual(12);
    });

    it('should group questions by category', async () => {
      // Arrange
      const gaps: Gap[] = [
        {
          field: 'vision',
          category: 'vision',
          importance: 8,
          reason: 'Vision unclear',
          currentConfidence: 0.2,
        },
        {
          field: 'icp.segments',
          category: 'icp',
          importance: 9,
          reason: 'No ICP defined',
          currentConfidence: 0.1,
        },
        {
          field: 'businessModel.revenueDrivers',
          category: 'business-model',
          importance: 8,
          reason: 'Revenue model unclear',
          currentConfidence: 0.3,
        },
      ];

      const request: QuestionGenerationRequest = {
        gaps,
        previousAnswers: [],
        maxQuestions: 10,
      };

      const mockResult: QuestionGenerationResult = {
        questions: [
          {
            id: 'q1',
            category: 'vision',
            question: 'What is your vision?',
            priority: 8,
          },
          {
            id: 'q2',
            category: 'icp',
            question: 'Who are your customers?',
            priority: 9,
          },
          {
            id: 'q3',
            category: 'business-model',
            question: 'How do you make money?',
            priority: 8,
          },
        ],
        shouldStop: false,
      };

      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(mockResult);

      // Act
      const result = await interviewer.generateQuestions(request);

      // Assert
      const categories = result.questions.map(q => q.category);
      expect(categories).toContain('vision');
      expect(categories).toContain('icp');
      expect(categories).toContain('business-model');
    });

    it('should adapt questions based on previous answers', async () => {
      // Arrange
      const gaps: Gap[] = [
        {
          field: 'icp.segments',
          category: 'icp',
          importance: 9,
          reason: 'Need more ICP details',
          currentConfidence: 0.4,
        },
      ];

      const previousAnswers: InterviewAnswer[] = [
        {
          questionId: 'q1',
          answer: 'We target small businesses in healthcare',
          skipped: false,
          answeredAt: new Date().toISOString(),
        },
      ];

      const request: QuestionGenerationRequest = {
        gaps,
        previousAnswers,
        maxQuestions: 10,
      };

      const mockResult: QuestionGenerationResult = {
        questions: [
          {
            id: 'q2',
            category: 'icp',
            question: 'What specific pain points do healthcare small businesses face?',
            context: 'Building on previous answer about healthcare focus',
            priority: 9,
          },
        ],
        shouldStop: false,
      };

      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(mockResult);

      // Act
      const result = await interviewer.generateQuestions(request);

      // Assert
      expect(result.questions[0].context).toContain('previous answer');
      expect(mockLLM.completeWithSchema).toHaveBeenCalledWith(
        expect.objectContaining({
          userPrompt: expect.stringContaining('PREVIOUS ANSWERS'),
        }),
        expect.anything()
      );
    });
  });

  describe('getNextQuestion', () => {
    it('should return first question when no answers provided', async () => {
      // Arrange
      const session: InterviewSession = {
        packId: 'pack1',
        questions: [
          {
            id: 'q1',
            category: 'icp',
            question: 'Who are your customers?',
            priority: 9,
          },
          {
            id: 'q2',
            category: 'vision',
            question: 'What is your vision?',
            priority: 8,
          },
        ],
        answers: [],
        currentQuestionIndex: 0,
        completed: false,
      };

      // Act
      const nextQuestion = await interviewer.getNextQuestion(session);

      // Assert
      expect(nextQuestion).not.toBeNull();
      expect(nextQuestion?.id).toBe('q1');
      expect(session.currentQuestionIndex).toBe(0);
    });

    it('should advance to next question after answer provided', async () => {
      // Arrange
      const session: InterviewSession = {
        packId: 'pack1',
        questions: [
          {
            id: 'q1',
            category: 'icp',
            question: 'Who are your customers?',
            priority: 9,
          },
          {
            id: 'q2',
            category: 'vision',
            question: 'What is your vision?',
            priority: 8,
          },
        ],
        answers: [],
        currentQuestionIndex: 0,
        completed: false,
      };

      const answer: InterviewAnswer = {
        questionId: 'q1',
        answer: 'Small businesses in healthcare',
        skipped: false,
        answeredAt: new Date().toISOString(),
      };

      // Act
      const nextQuestion = await interviewer.getNextQuestion(session, answer);

      // Assert
      expect(nextQuestion).not.toBeNull();
      expect(nextQuestion?.id).toBe('q2');
      expect(session.currentQuestionIndex).toBe(1);
      expect(session.answers).toHaveLength(1);
    });

    it('should handle skipped questions', async () => {
      // Arrange
      const session: InterviewSession = {
        packId: 'pack1',
        questions: [
          {
            id: 'q1',
            category: 'icp',
            question: 'Who are your customers?',
            priority: 9,
          },
          {
            id: 'q2',
            category: 'vision',
            question: 'What is your vision?',
            priority: 8,
          },
        ],
        answers: [],
        currentQuestionIndex: 0,
        completed: false,
      };

      const skippedAnswer: InterviewAnswer = {
        questionId: 'q1',
        answer: '',
        skipped: true,
        answeredAt: new Date().toISOString(),
      };

      // Act
      const nextQuestion = await interviewer.getNextQuestion(session, skippedAnswer);

      // Assert
      expect(nextQuestion).not.toBeNull();
      expect(nextQuestion?.id).toBe('q2');
      expect(session.answers[0].skipped).toBe(true);
    });

    it('should return null when all questions answered', async () => {
      // Arrange
      const session: InterviewSession = {
        packId: 'pack1',
        questions: [
          {
            id: 'q1',
            category: 'icp',
            question: 'Who are your customers?',
            priority: 9,
          },
        ],
        answers: [],
        currentQuestionIndex: 0,
        completed: false,
      };

      const answer: InterviewAnswer = {
        questionId: 'q1',
        answer: 'Small businesses',
        skipped: false,
        answeredAt: new Date().toISOString(),
      };

      // Act
      const nextQuestion = await interviewer.getNextQuestion(session, answer);

      // Assert
      expect(nextQuestion).toBeNull();
      expect(session.completed).toBe(true);
    });

    it('should return null when session already completed', async () => {
      // Arrange
      const session: InterviewSession = {
        packId: 'pack1',
        questions: [
          {
            id: 'q1',
            category: 'icp',
            question: 'Who are your customers?',
            priority: 9,
          },
        ],
        answers: [
          {
            questionId: 'q1',
            answer: 'Small businesses',
            skipped: false,
            answeredAt: new Date().toISOString(),
          },
        ],
        currentQuestionIndex: 1,
        completed: true,
      };

      // Act
      const nextQuestion = await interviewer.getNextQuestion(session);

      // Assert
      expect(nextQuestion).toBeNull();
    });

    it('should store answer with question category reference', async () => {
      // Arrange
      const session: InterviewSession = {
        packId: 'pack1',
        questions: [
          {
            id: 'q1',
            category: 'icp',
            question: 'Who are your customers?',
            priority: 9,
          },
        ],
        answers: [],
        currentQuestionIndex: 0,
        completed: false,
      };

      const answer: InterviewAnswer = {
        questionId: 'q1',
        answer: 'Small businesses',
        skipped: false,
        answeredAt: new Date().toISOString(),
      };

      // Act
      await interviewer.getNextQuestion(session, answer);

      // Assert
      expect(session.answers[0].questionId).toBe('q1');
      // The category reference is implicit through the questionId
      // which can be used to look up the question's category
      const question = session.questions.find(q => q.id === answer.questionId);
      expect(question?.category).toBe('icp');
    });
  });

  describe('demo mode', () => {
    it('should return mock questions when demo mode is enabled', async () => {
      const demoInterviewer = new Interviewer(mockLLM, true);

      const request: QuestionGenerationRequest = {
        gaps: [],
        previousAnswers: [],
        maxQuestions: 10,
      };

      const result = await demoInterviewer.generateQuestions(request);

      // Should return mock questions without calling LLM
      expect(result.questions.length).toBeGreaterThan(0);
      expect(result.questions[0]).toHaveProperty('id');
      expect(result.questions[0]).toHaveProperty('category');
      expect(result.questions[0]).toHaveProperty('question');
      expect(mockLLM.completeWithSchema).not.toHaveBeenCalled();
    });

    it('should not make LLM calls in demo mode', async () => {
      const demoInterviewer = new Interviewer(mockLLM, true);

      const request: QuestionGenerationRequest = {
        gaps: [
          {
            field: 'vision',
            category: 'vision',
            importance: 8,
            reason: 'Vision unclear',
            currentConfidence: 0.2,
          },
        ],
        previousAnswers: [],
        maxQuestions: 10,
      };

      await demoInterviewer.generateQuestions(request);

      // LLM should not be called in demo mode
      expect(mockLLM.completeWithSchema).not.toHaveBeenCalled();
    });

    it('should make LLM calls when demo mode is disabled', async () => {
      const liveInterviewer = new Interviewer(mockLLM, false);

      const request: QuestionGenerationRequest = {
        gaps: [
          {
            field: 'vision',
            category: 'vision',
            importance: 8,
            reason: 'Vision unclear',
            currentConfidence: 0.2,
          },
        ],
        previousAnswers: [],
        maxQuestions: 10,
      };

      const mockResult: QuestionGenerationResult = {
        questions: [
          {
            id: 'q1',
            category: 'vision',
            question: 'What is your vision?',
            priority: 8,
          },
        ],
        shouldStop: false,
      };

      vi.mocked(mockLLM.completeWithSchema).mockResolvedValue(mockResult);

      await liveInterviewer.generateQuestions(request);

      // LLM should be called in live mode
      expect(mockLLM.completeWithSchema).toHaveBeenCalled();
    });

    it('should return valid question structure in demo mode', async () => {
      const demoInterviewer = new Interviewer(mockLLM, true);

      const request: QuestionGenerationRequest = {
        gaps: [],
        previousAnswers: [],
        maxQuestions: 10,
      };

      const result = await demoInterviewer.generateQuestions(request);

      // Validate question structure
      result.questions.forEach(question => {
        expect(question).toHaveProperty('id');
        expect(question).toHaveProperty('category');
        expect(question).toHaveProperty('question');
        expect(question).toHaveProperty('priority');
        expect(['vision', 'icp', 'business-model', 'engineering-kpis', 'decision-rules']).toContain(question.category);
      });
    });

    it('should include reason in demo mode result', async () => {
      const demoInterviewer = new Interviewer(mockLLM, true);

      const request: QuestionGenerationRequest = {
        gaps: [],
        previousAnswers: [],
        maxQuestions: 10,
      };

      const result = await demoInterviewer.generateQuestions(request);

      expect(result.reason).toBeDefined();
      expect(result.reason).toContain('Demo mode');
    });
  });
});
