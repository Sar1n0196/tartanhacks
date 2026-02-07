import { NextRequest, NextResponse } from 'next/server';
import { LLMWrapper } from '@/lib/llm-wrapper';
import { Interviewer } from '@/lib/interviewer';
import { GapFinder } from '@/lib/gap-finder';
import { createDefaultStorage } from '@/lib/storage';
import {
  InterviewStartRequestSchema,
  InterviewAnswerRequestSchema,
} from '@/lib/schemas';
import type { InterviewSession, InterviewAnswer } from '@/lib/types';
import { z } from 'zod';

/**
 * In-memory storage for interview sessions
 * In a production app, this would be in a database or Redis
 */
const sessions = new Map<string, InterviewSession>();

/**
 * POST /api/interview
 * 
 * Handles two operations:
 * 1. Start interview: { packId: string } -> returns sessionId and questions
 * 2. Submit answer: { sessionId: string, questionId: string, answer: string, skipped: boolean }
 *    -> returns next question or completion status
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Determine which operation based on request body
    if ('packId' in body && !('sessionId' in body)) {
      // Start interview operation
      return await handleStartInterview(body);
    } else if ('sessionId' in body) {
      // Submit answer operation
      return await handleSubmitAnswer(body);
    } else {
      return NextResponse.json(
        { error: 'Invalid request. Must include either packId (to start) or sessionId (to submit answer)' },
        { status: 400 }
      );
    }
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Handle starting a new interview session
 * Requirements: 3.1, 3.2, 3.3, 3.4, 4.1
 */
async function handleStartInterview(body: unknown) {
  try {
    // Validate request
    const validatedRequest = InterviewStartRequestSchema.parse(body);
    const { packId } = validatedRequest;
    
    // Load the draft pack from storage
    const storage = createDefaultStorage();
    const draftPack = await storage.getContextPack(packId);
    
    if (!draftPack) {
      return NextResponse.json(
        { error: `Context pack not found: ${packId}` },
        { status: 404 }
      );
    }
    
    // Check for API key (unless in demo mode)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.' },
        { status: 500 }
      );
    }
    
    // Initialize components
    const llm = new LLMWrapper(apiKey);
    const gapFinder = new GapFinder(llm);
    const interviewer = new Interviewer(llm);
    
    // Step 1: Analyze gaps in the draft pack
    console.log(`Analyzing gaps for pack: ${packId}`);
    const gapAnalysis = await gapFinder.analyzeGaps(draftPack);
    
    // Step 2: Generate interview questions based on gaps
    console.log(`Generating interview questions (${gapAnalysis.gaps.length} gaps identified)`);
    const questionResult = await interviewer.generateQuestions({
      gaps: gapAnalysis.gaps,
      previousAnswers: [],
      maxQuestions: 12,
    });
    
    // Step 3: Create interview session
    const sessionId = generateSessionId(packId);
    const session: InterviewSession = {
      packId,
      questions: questionResult.questions,
      answers: [],
      currentQuestionIndex: 0,
      completed: questionResult.shouldStop, // If LLM says to stop immediately, mark as completed
    };
    
    // Store session in memory
    sessions.set(sessionId, session);
    
    console.log(`Interview session created: ${sessionId} with ${session.questions.length} questions`);
    
    // Return session ID and questions
    return NextResponse.json({
      sessionId,
      questions: session.questions,
    });
    
  } catch (error) {
    console.error('Error starting interview:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'OpenAI API authentication failed. Please check your API key.' },
          { status: 500 }
        );
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'OpenAI API rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: `Failed to start interview: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred while starting interview' },
      { status: 500 }
    );
  }
}

/**
 * Handle submitting an answer to an interview question
 * Requirements: 4.2, 4.3, 4.4, 4.5, 4.6
 */
async function handleSubmitAnswer(body: unknown) {
  try {
    // Validate request
    const validatedRequest = InterviewAnswerRequestSchema.parse(body);
    const { sessionId, questionId, answer, skipped } = validatedRequest;
    
    // Retrieve session from memory
    const session = sessions.get(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: `Interview session not found: ${sessionId}` },
        { status: 404 }
      );
    }
    
    // Verify the question ID matches the current question
    const currentQuestion = session.questions[session.currentQuestionIndex];
    if (!currentQuestion || currentQuestion.id !== questionId) {
      return NextResponse.json(
        { error: `Invalid question ID. Expected ${currentQuestion?.id}, got ${questionId}` },
        { status: 400 }
      );
    }
    
    // Create answer object
    const interviewAnswer: InterviewAnswer = {
      questionId,
      answer: skipped ? '' : answer,
      skipped,
      answeredAt: new Date().toISOString(),
    };
    
    // Add answer to session
    session.answers.push(interviewAnswer);
    session.currentQuestionIndex++;
    
    console.log(`Answer submitted for question ${questionId} (skipped: ${skipped})`);
    
    // Check if interview is complete
    if (session.currentQuestionIndex >= session.questions.length) {
      session.completed = true;
      console.log(`Interview session ${sessionId} completed with ${session.answers.length} answers`);
      
      // Return completion status without next question
      return NextResponse.json({
        nextQuestion: null,
        completed: true,
      });
    }
    
    // Get next question
    const nextQuestion = session.questions[session.currentQuestionIndex];
    
    // Update session in memory
    sessions.set(sessionId, session);
    
    // Return next question
    return NextResponse.json({
      nextQuestion,
      completed: false,
    });
    
  } catch (error) {
    console.error('Error submitting answer:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to submit answer: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred while submitting answer' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/interview?sessionId=xxx
 * 
 * Retrieve interview session state
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId parameter' },
        { status: 400 }
      );
    }
    
    const session = sessions.get(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: `Interview session not found: ${sessionId}` },
        { status: 404 }
      );
    }
    
    return NextResponse.json(session);
    
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Generate a unique session ID
 */
function generateSessionId(packId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `session-${packId}-${timestamp}-${random}`;
}

/**
 * Handle errors and return appropriate responses
 */
function handleError(error: unknown) {
  console.error('Error in /api/interview:', error);
  
  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'Invalid request',
        details: error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
      { status: 400 }
    );
  }
  
  // Handle generic errors
  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
  
  // Unknown error
  return NextResponse.json(
    { error: 'An unexpected error occurred' },
    { status: 500 }
  );
}

/**
 * Export the session storage for use in other routes (e.g., /api/pack)
 */
export function getInterviewSession(sessionId: string): InterviewSession | undefined {
  return sessions.get(sessionId);
}
