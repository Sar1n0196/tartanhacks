import { NextRequest, NextResponse } from 'next/server';
import { LLMWrapper } from '@/lib/llm-wrapper';
import { ChatEngine } from '@/lib/chat-engine';
import { createDefaultStorage } from '@/lib/storage';
import { ChatRequestSchema } from '@/lib/schemas';
import type { ChatMessage } from '@/lib/types';
import { z } from 'zod';

/**
 * POST /api/chat
 * 
 * Answer engineer questions using the Context Pack
 * 
 * Request body:
 * {
 *   packId: string,
 *   message: string,
 *   conversationHistory: ChatMessage[]
 * }
 * 
 * Flow:
 * 1. Validate request
 * 2. Load Context Pack from storage
 * 3. Call ChatEngine to generate response
 * 4. Return chat message with citations and "why this matters"
 * 
 * Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const validatedRequest = ChatRequestSchema.parse(body);
    const { packId, question, conversationHistory } = validatedRequest;
    
    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.' },
        { status: 500 }
      );
    }
    
    // Initialize components
    const storage = createDefaultStorage();
    const llm = new LLMWrapper(apiKey);
    const chatEngine = new ChatEngine(llm, storage);
    
    // Generate response
    console.log(`Answering question for pack ${packId}: ${question.slice(0, 100)}...`);
    const response = await chatEngine.answerQuestion({
      packId,
      question,
      conversationHistory,
    });
    
    // Create chat message from response
    const chatMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: response.answer,
      citations: response.citations,
      whyItMatters: response.whyItMatters,
      confidence: response.confidence,
      timestamp: new Date().toISOString(),
    };
    
    console.log(`Response generated with ${response.citations.length} citations`);
    
    // Return chat message
    return NextResponse.json({
      message: chatMessage,
    });
    
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `msg-${timestamp}-${random}`;
}

/**
 * Handle errors and return appropriate responses
 */
function handleError(error: unknown) {
  console.error('Error in /api/chat:', error);
  
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
    // Handle specific error cases
    if (error.message.includes('Context pack not found')) {
      return NextResponse.json(
        { error: 'Context pack not found. Please create a context pack first using the /builder flow.' },
        { status: 404 }
      );
    }
    
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
