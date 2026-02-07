import { NextRequest, NextResponse } from 'next/server';
import { LLMWrapper } from '@/lib/llm-wrapper';
import { PackBuilder } from '@/lib/pack-builder';
import { createDefaultStorage } from '@/lib/storage';
import { getInterviewSession } from '../interview/route';
import { z } from 'zod';

/**
 * POST /api/pack
 * 
 * Build final Context Pack v1 by merging draft pack with interview answers
 * 
 * Request body:
 * {
 *   packId: string,
 *   sessionId: string
 * }
 * 
 * Flow:
 * 1. Load draft pack v0 from storage
 * 2. Load interview session (questions and answers)
 * 3. Call PackBuilder to merge information
 * 4. Save final pack v1 to storage
 * 5. Return final pack
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const requestSchema = z.object({
      packId: z.string(),
      sessionId: z.string(),
    });
    
    const { packId, sessionId } = requestSchema.parse(body);
    
    // Load draft pack from storage
    const storage = createDefaultStorage();
    const draftPack = await storage.getContextPack(packId);
    
    if (!draftPack) {
      return NextResponse.json(
        { error: `Context pack not found: ${packId}` },
        { status: 404 }
      );
    }
    
    // Load interview session
    const session = getInterviewSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: `Interview session not found: ${sessionId}` },
        { status: 404 }
      );
    }
    
    // Verify session is for this pack
    if (session.packId !== packId) {
      return NextResponse.json(
        { error: `Session ${sessionId} is not for pack ${packId}` },
        { status: 400 }
      );
    }
    
    // Verify session is completed
    if (!session.completed) {
      return NextResponse.json(
        { error: 'Interview session is not completed yet' },
        { status: 400 }
      );
    }
    
    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.' },
        { status: 500 }
      );
    }
    
    // Initialize components
    const llm = new LLMWrapper(apiKey);
    const packBuilder = new PackBuilder(llm);
    
    // Build final pack
    console.log(`Building final pack for ${packId} with ${session.answers.length} answers`);
    const finalPack = await packBuilder.buildFinalPack({
      draftPack,
      interviewAnswers: session.answers,
      questions: session.questions,
    });
    
    // Save final pack to storage
    console.log(`Saving final pack v1: ${finalPack.id}`);
    await storage.saveContextPack(finalPack);
    
    // Return final pack
    return NextResponse.json({
      pack: finalPack,
    });
    
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /api/pack?packId=xxx
 * 
 * Retrieve a Context Pack by ID
 * 
 * Requirements: 5.7, 14.3
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const packId = searchParams.get('packId');
    
    if (!packId) {
      return NextResponse.json(
        { error: 'Missing packId parameter' },
        { status: 400 }
      );
    }
    
    // Load pack from storage
    const storage = createDefaultStorage();
    const pack = await storage.getContextPack(packId);
    
    if (!pack) {
      return NextResponse.json(
        { error: `Context pack not found: ${packId}` },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      pack,
    });
    
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Handle errors and return appropriate responses
 */
function handleError(error: unknown) {
  console.error('Error in /api/pack:', error);
  
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
