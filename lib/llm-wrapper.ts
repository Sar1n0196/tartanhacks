import OpenAI from 'openai';
import { z } from 'zod';
import { LLMRequest, LLMResponse } from './types';
import { LLMRequestSchema, LLMResponseSchema } from './schemas';

/**
 * LLM Wrapper for OpenAI API
 * 
 * Provides a unified interface for making LLM API calls with:
 * - Retry logic with exponential backoff
 * - Error handling for rate limiting, auth, and token limits
 * - Schema validation for structured outputs
 * - Support for both text and JSON response formats
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 10.3
 */

/**
 * Error types for LLM API calls
 */
export class LLMError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export class LLMAuthError extends LLMError {
  constructor(message: string = 'Invalid API key') {
    super(message, 'AUTH_ERROR', false);
    this.name = 'LLMAuthError';
  }
}

export class LLMRateLimitError extends LLMError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_ERROR', true);
    this.name = 'LLMRateLimitError';
  }
}

export class LLMTokenLimitError extends LLMError {
  constructor(message: string = 'Token limit exceeded') {
    super(message, 'TOKEN_LIMIT_ERROR', false);
    this.name = 'LLMTokenLimitError';
  }
}

export class LLMSchemaValidationError extends LLMError {
  constructor(message: string, public readonly validationErrors: z.ZodError) {
    super(message, 'SCHEMA_VALIDATION_ERROR', true);
    this.name = 'LLMSchemaValidationError';
  }
}

/**
 * Configuration for retry logic
 */
interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // in milliseconds
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
};

/**
 * LLMWrapper class - handles all OpenAI API interactions
 * 
 * Requirements:
 * - 13.1: Use OPENAI_API_KEY environment variable
 * - 13.2: Single wrapper module for all LLM calls
 * - 13.3: Support configurable model
 * - 13.4: Include system and user prompts
 * - 13.5: Return errors that can be handled by caller
 * - 10.3: Retry up to 3 times with exponential backoff
 */
export class LLMWrapper {
  private client: OpenAI;
  private model: string;
  private retryConfig: RetryConfig;

  /**
   * Create a new LLM wrapper instance
   * 
   * @param apiKey - OpenAI API key (from OPENAI_API_KEY env var)
   * @param model - Model to use (default: gpt-4-turbo-preview)
   * @param retryConfig - Configuration for retry logic
   */
  constructor(
    apiKey: string,
    model: string = 'gpt-4-turbo-preview',
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ) {
    if (!apiKey) {
      throw new LLMAuthError('API key is required');
    }

    this.client = new OpenAI({ apiKey });
    this.model = model;
    this.retryConfig = retryConfig;
  }

  /**
   * Make a completion request to the OpenAI API
   * 
   * Implements exponential backoff retry logic:
   * - Attempt 1: immediate
   * - Attempt 2: wait 1s
   * - Attempt 3: wait 2s
   * - Attempt 4: wait 4s
   * 
   * Requirements: 13.4, 13.5, 10.3
   * 
   * @param request - LLM request with prompts and configuration
   * @returns LLM response with content and usage stats
   * @throws LLMError - Various error types based on failure mode
   */
  async complete(request: LLMRequest): Promise<LLMResponse> {
    // Validate request
    const validatedRequest = LLMRequestSchema.parse(request);

    let lastError: Error | null = null;
    
    // Retry loop with exponential backoff
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        // Wait before retry (except first attempt)
        if (attempt > 0) {
          const delay = this.retryConfig.baseDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }

        // Make API call
        const response = await this.makeAPICall(validatedRequest);
        
        // Validate and return response
        return LLMResponseSchema.parse(response);
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable
        const llmError = this.handleError(error);
        
        // Don't retry non-retryable errors
        if (!llmError.retryable) {
          throw llmError;
        }
        
        // Don't retry if we've exhausted attempts
        if (attempt === this.retryConfig.maxRetries) {
          throw llmError;
        }
        
        // Log retry attempt
        console.warn(
          `LLM API call failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}): ${llmError.message}`
        );
      }
    }

    // Should never reach here, but TypeScript needs this
    throw lastError || new LLMError('Unknown error', 'UNKNOWN_ERROR');
  }

  /**
   * Make a completion request with schema validation
   * 
   * This method:
   * 1. Makes the API call with JSON response format
   * 2. Parses the JSON response
   * 3. Validates against the provided Zod schema
   * 4. Retries with clarified prompt if validation fails
   * 
   * Requirements: 9.2, 9.6, 10.3
   * 
   * @param request - LLM request (responseFormat will be set to 'json')
   * @param schema - Zod schema to validate response against
   * @returns Validated response matching the schema
   * @throws LLMSchemaValidationError - If validation fails after retries
   */
  async completeWithSchema<T>(
    request: LLMRequest,
    schema: z.ZodSchema<T>
  ): Promise<T> {
    // Force JSON response format
    const jsonRequest: LLMRequest = {
      ...request,
      responseFormat: 'json',
    };

    let lastValidationError: z.ZodError | null = null;
    const maxSchemaRetries = 2;

    for (let attempt = 0; attempt <= maxSchemaRetries; attempt++) {
      try {
        // Make API call
        const response = await this.complete(jsonRequest);
        
        // Parse JSON
        let parsed: unknown;
        try {
          parsed = JSON.parse(response.content);
        } catch (parseError) {
          throw new LLMSchemaValidationError(
            'Failed to parse JSON response',
            new z.ZodError([{
              code: 'custom',
              path: [],
              message: `Invalid JSON: ${(parseError as Error).message}`,
            }])
          );
        }

        // Validate against schema
        return schema.parse(parsed);
      } catch (error) {
        if (error instanceof z.ZodError) {
          lastValidationError = error;
          
          // Don't retry if we've exhausted attempts
          if (attempt === maxSchemaRetries) {
            throw new LLMSchemaValidationError(
              `Schema validation failed after ${maxSchemaRetries + 1} attempts`,
              error
            );
          }

          // Retry with clarified prompt
          const schemaDescription = this.getSchemaDescription(schema);
          jsonRequest.systemPrompt = `${jsonRequest.systemPrompt}\n\nIMPORTANT: Your response MUST match this exact schema:\n${schemaDescription}\n\nPrevious validation errors:\n${this.formatZodError(error)}`;
          
          console.warn(
            `Schema validation failed (attempt ${attempt + 1}/${maxSchemaRetries + 1}), retrying with clarified prompt`
          );
        } else {
          // Re-throw non-validation errors
          throw error;
        }
      }
    }

    // Should never reach here, but TypeScript needs this
    throw new LLMSchemaValidationError(
      'Schema validation failed',
      lastValidationError || new z.ZodError([])
    );
  }

  /**
   * Make the actual API call to OpenAI
   * 
   * @param request - Validated LLM request
   * @returns Raw LLM response
   */
  private async makeAPICall(request: LLMRequest): Promise<LLMResponse> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: request.systemPrompt },
      { role: 'user', content: request.userPrompt },
    ];

    const params: OpenAI.Chat.ChatCompletionCreateParams = {
      model: this.model,
      messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens,
    };

    // Add response format if JSON is requested
    if (request.responseFormat === 'json') {
      params.response_format = { type: 'json_object' };
    }

    const completion = await this.client.chat.completions.create(params);

    const choice = completion.choices[0];
    if (!choice || !choice.message.content) {
      throw new LLMError('No response from API', 'NO_RESPONSE');
    }

    return {
      content: choice.message.content,
      usage: {
        promptTokens: completion.usage?.prompt_tokens ?? 0,
        completionTokens: completion.usage?.completion_tokens ?? 0,
        totalTokens: completion.usage?.total_tokens ?? 0,
      },
    };
  }

  /**
   * Handle errors from OpenAI API and convert to typed errors
   * 
   * Requirements: 10.3, 10.4, 13.5
   * 
   * @param error - Raw error from API
   * @returns Typed LLM error
   */
  private handleError(error: unknown): LLMError {
    // Handle OpenAI SDK errors (check for status property instead of instanceof)
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as { status?: number; message: string };
      
      // Authentication errors (401)
      if (apiError.status === 401) {
        return new LLMAuthError(apiError.message);
      }

      // Rate limiting errors (429)
      if (apiError.status === 429) {
        return new LLMRateLimitError(apiError.message);
      }

      // Token limit errors (400 with specific message)
      if (apiError.status === 400 && apiError.message.includes('maximum context length')) {
        return new LLMTokenLimitError(apiError.message);
      }

      // Server errors (5xx) are retryable
      if (apiError.status && apiError.status >= 500) {
        return new LLMError(
          `Server error: ${apiError.message}`,
          'SERVER_ERROR',
          true
        );
      }

      // Other API errors
      return new LLMError(
        apiError.message,
        'API_ERROR',
        false
      );
    }

    // Handle network errors (retryable)
    if (error instanceof Error && error.message.includes('fetch')) {
      return new LLMError(
        `Network error: ${error.message}`,
        'NETWORK_ERROR',
        true
      );
    }

    // Handle schema validation errors
    if (error instanceof LLMSchemaValidationError) {
      return error;
    }

    // Unknown errors
    return new LLMError(
      error instanceof Error ? error.message : 'Unknown error',
      'UNKNOWN_ERROR',
      false
    );
  }

  /**
   * Sleep for specified milliseconds
   * 
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get a human-readable description of a Zod schema
   * 
   * @param schema - Zod schema
   * @returns String description
   */
  private getSchemaDescription(schema: z.ZodSchema): string {
    try {
      // Try to get schema description from Zod
      const description = (schema as any)._def?.description;
      if (description) {
        return description;
      }

      // Fallback: return schema type
      return `Schema type: ${(schema as any)._def?.typeName || 'unknown'}`;
    } catch {
      return 'Schema description unavailable';
    }
  }

  /**
   * Format Zod validation errors for display
   * 
   * @param error - Zod error
   * @returns Formatted error string
   */
  private formatZodError(error: z.ZodError): string {
    if (!error.issues || error.issues.length === 0) {
      return 'Unknown validation error';
    }
    
    return error.issues
      .map(err => `- ${err.path.join('.')}: ${err.message}`)
      .join('\n');
  }
}

/**
 * Create a default LLM wrapper instance using environment variables
 * 
 * Requirements: 13.1, 13.6
 * 
 * @returns LLM wrapper instance
 * @throws LLMAuthError if OPENAI_API_KEY is not set
 */
export function createDefaultLLMWrapper(): LLMWrapper {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new LLMAuthError(
      'OPENAI_API_KEY environment variable is not set'
    );
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';

  return new LLMWrapper(apiKey, model);
}
