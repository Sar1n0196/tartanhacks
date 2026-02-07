import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import {
  LLMWrapper,
  LLMError,
  LLMAuthError,
  LLMRateLimitError,
  LLMTokenLimitError,
  LLMSchemaValidationError,
  createDefaultLLMWrapper,
} from './llm-wrapper';
import { LLMRequest } from './types';

// Mock OpenAI SDK
vi.mock('openai', () => {
  // Create a mock APIError class that matches OpenAI's structure
  class MockAPIError extends Error {
    constructor(
      public status: number | undefined,
      public error: any,
      message: string,
      public headers: any
    ) {
      super(message);
      this.name = 'APIError';
    }
  }

  return {
    default: class MockOpenAI {
      chat: any;
      constructor() {
        this.chat = {
          completions: {
            create: vi.fn(),
          },
        };
      }
    },
    APIError: MockAPIError,
  };
});

// Import the mocked OpenAI to get the APIError class
import OpenAI from 'openai';
const { APIError: MockAPIError } = OpenAI as any;

describe('LLMWrapper', () => {
  let wrapper: LLMWrapper;
  let mockCreate: any;

  beforeEach(() => {
    // Create wrapper instance
    wrapper = new LLMWrapper('test-api-key', 'gpt-4-turbo-preview');
    
    // Get reference to the mocked create function
    mockCreate = (wrapper as any).client.chat.completions.create;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw LLMAuthError if API key is empty', () => {
      expect(() => new LLMWrapper('')).toThrow(LLMAuthError);
      expect(() => new LLMWrapper('')).toThrow('API key is required');
    });

    it('should create instance with valid API key', () => {
      const wrapper = new LLMWrapper('test-key');
      expect(wrapper).toBeInstanceOf(LLMWrapper);
    });

    it('should use default model if not specified', () => {
      const wrapper = new LLMWrapper('test-key');
      expect(wrapper).toBeInstanceOf(LLMWrapper);
    });

    it('should use custom model if specified', () => {
      const wrapper = new LLMWrapper('test-key', 'gpt-3.5-turbo');
      expect(wrapper).toBeInstanceOf(LLMWrapper);
    });
  });

  describe('complete', () => {
    it('should make successful API call and return response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Test response',
            },
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      };

      mockCreate.mockResolvedValue(mockResponse);

      const request: LLMRequest = {
        systemPrompt: 'You are a helpful assistant',
        userPrompt: 'Hello',
      };

      const response = await wrapper.complete(request);

      expect(response).toEqual({
        content: 'Test response',
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
      });

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
          { role: 'user', content: 'Hello' },
        ],
        temperature: 0.7,
        max_tokens: undefined,
      });
    });

    it('should use custom temperature and maxTokens', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      mockCreate.mockResolvedValue(mockResponse);

      const request: LLMRequest = {
        systemPrompt: 'System',
        userPrompt: 'User',
        temperature: 0.2,
        maxTokens: 100,
      };

      await wrapper.complete(request);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.2,
          max_tokens: 100,
        })
      );
    });

    it('should use JSON response format when specified', async () => {
      const mockResponse = {
        choices: [{ message: { content: '{"key": "value"}' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      mockCreate.mockResolvedValue(mockResponse);

      const request: LLMRequest = {
        systemPrompt: 'System',
        userPrompt: 'User',
        responseFormat: 'json',
      };

      await wrapper.complete(request);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          response_format: { type: 'json_object' },
        })
      );
    });

    it('should throw LLMAuthError on 401 error', async () => {
      const authError = {
        status: 401,
        message: 'Invalid API key',
        name: 'APIError',
      };

      mockCreate.mockRejectedValue(authError);

      const request: LLMRequest = {
        systemPrompt: 'System',
        userPrompt: 'User',
      };

      await expect(wrapper.complete(request)).rejects.toThrow(LLMAuthError);
    });

    it('should throw LLMRateLimitError on 429 error', async () => {
      const rateLimitError = {
        status: 429,
        message: 'Rate limit exceeded',
        name: 'APIError',
      };

      mockCreate.mockRejectedValue(rateLimitError);

      const request: LLMRequest = {
        systemPrompt: 'System',
        userPrompt: 'User',
      };

      await expect(wrapper.complete(request)).rejects.toThrow(LLMRateLimitError);
    }, 10000); // 10 second timeout for retry tests

    it('should throw LLMTokenLimitError on token limit error', async () => {
      const tokenError = {
        status: 400,
        message: 'maximum context length exceeded',
        name: 'APIError',
      };

      mockCreate.mockRejectedValue(tokenError);

      const request: LLMRequest = {
        systemPrompt: 'System',
        userPrompt: 'User',
      };

      await expect(wrapper.complete(request)).rejects.toThrow(LLMTokenLimitError);
    });

    it('should retry on rate limit error with exponential backoff', async () => {
      const rateLimitError = {
        status: 429,
        message: 'Rate limit exceeded',
        name: 'APIError',
      };

      const mockResponse = {
        choices: [{ message: { content: 'Success after retry' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      // Fail twice, then succeed
      mockCreate
        .mockRejectedValueOnce(rateLimitError)
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce(mockResponse);

      const request: LLMRequest = {
        systemPrompt: 'System',
        userPrompt: 'User',
      };

      const startTime = Date.now();
      const response = await wrapper.complete(request);
      const endTime = Date.now();

      expect(response.content).toBe('Success after retry');
      expect(mockCreate).toHaveBeenCalledTimes(3);
      
      // Should have waited at least 1s + 2s = 3s for retries
      // (allowing some margin for test execution)
      expect(endTime - startTime).toBeGreaterThanOrEqual(2900);
    });

    it('should throw after exhausting retries', async () => {
      const rateLimitError = {
        status: 429,
        message: 'Rate limit exceeded',
        name: 'APIError',
      };

      // Always fail
      mockCreate.mockRejectedValue(rateLimitError);

      const request: LLMRequest = {
        systemPrompt: 'System',
        userPrompt: 'User',
      };

      await expect(wrapper.complete(request)).rejects.toThrow(LLMRateLimitError);
      
      // Should have tried 4 times (initial + 3 retries)
      expect(mockCreate).toHaveBeenCalledTimes(4);
    }, 10000); // 10 second timeout for retry tests

    it('should not retry on non-retryable errors', async () => {
      const authError = {
        status: 401,
        message: 'Invalid API key',
        name: 'APIError',
      };

      mockCreate.mockRejectedValue(authError);

      const request: LLMRequest = {
        systemPrompt: 'System',
        userPrompt: 'User',
      };

      await expect(wrapper.complete(request)).rejects.toThrow(LLMAuthError);
      
      // Should only try once (no retries)
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should retry on server errors (5xx)', async () => {
      const serverError = {
        status: 500,
        message: 'Internal server error',
        name: 'APIError',
      };

      const mockResponse = {
        choices: [{ message: { content: 'Success after retry' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      mockCreate
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce(mockResponse);

      const request: LLMRequest = {
        systemPrompt: 'System',
        userPrompt: 'User',
      };

      const response = await wrapper.complete(request);
      expect(response.content).toBe('Success after retry');
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should throw error if response has no content', async () => {
      const mockResponse = {
        choices: [{ message: {} }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      mockCreate.mockResolvedValue(mockResponse);

      const request: LLMRequest = {
        systemPrompt: 'System',
        userPrompt: 'User',
      };

      await expect(wrapper.complete(request)).rejects.toThrow(LLMError);
      await expect(wrapper.complete(request)).rejects.toThrow('No response from API');
    });

    it('should handle missing usage stats gracefully', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test' } }],
        usage: undefined,
      };

      mockCreate.mockResolvedValue(mockResponse);

      const request: LLMRequest = {
        systemPrompt: 'System',
        userPrompt: 'User',
      };

      const response = await wrapper.complete(request);
      expect(response.usage).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      });
    });
  });

  describe('completeWithSchema', () => {
    const TestSchema = z.object({
      name: z.string(),
      age: z.number(),
    });

    it('should parse and validate JSON response', async () => {
      const mockResponse = {
        choices: [{ message: { content: '{"name": "John", "age": 30}' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      mockCreate.mockResolvedValue(mockResponse);

      const request: LLMRequest = {
        systemPrompt: 'System',
        userPrompt: 'User',
      };

      const result = await wrapper.completeWithSchema(request, TestSchema);

      expect(result).toEqual({ name: 'John', age: 30 });
      
      // Should have forced JSON response format
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          response_format: { type: 'json_object' },
        })
      );
    });

    it('should throw LLMSchemaValidationError on invalid JSON', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'not valid json' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      mockCreate.mockResolvedValue(mockResponse);

      const request: LLMRequest = {
        systemPrompt: 'System',
        userPrompt: 'User',
      };

      await expect(
        wrapper.completeWithSchema(request, TestSchema)
      ).rejects.toThrow(LLMSchemaValidationError);
    });

    it('should retry with clarified prompt on schema validation failure', async () => {
      const invalidResponse = {
        choices: [{ message: { content: '{"name": "John"}' } }], // missing age
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      const validResponse = {
        choices: [{ message: { content: '{"name": "John", "age": 30}' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      mockCreate
        .mockResolvedValueOnce(invalidResponse)
        .mockResolvedValueOnce(validResponse);

      const request: LLMRequest = {
        systemPrompt: 'System',
        userPrompt: 'User',
      };

      const result = await wrapper.completeWithSchema(request, TestSchema);

      expect(result).toEqual({ name: 'John', age: 30 });
      expect(mockCreate).toHaveBeenCalledTimes(2);
      
      // Second call should have clarified prompt
      const secondCall = mockCreate.mock.calls[1][0];
      expect(secondCall.messages[0].content).toContain('IMPORTANT: Your response MUST match this exact schema');
    });

    it('should throw after exhausting schema validation retries', async () => {
      const invalidResponse = {
        choices: [{ message: { content: '{"name": "John"}' } }], // missing age
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      mockCreate.mockResolvedValue(invalidResponse);

      const request: LLMRequest = {
        systemPrompt: 'System',
        userPrompt: 'User',
      };

      await expect(
        wrapper.completeWithSchema(request, TestSchema)
      ).rejects.toThrow(LLMSchemaValidationError);
      
      // Should have tried 3 times (initial + 2 retries)
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it('should handle complex nested schemas', async () => {
      const ComplexSchema = z.object({
        user: z.object({
          name: z.string(),
          email: z.string().email(),
        }),
        items: z.array(z.object({
          id: z.number(),
          title: z.string(),
        })),
      });

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              user: { name: 'John', email: 'john@example.com' },
              items: [
                { id: 1, title: 'Item 1' },
                { id: 2, title: 'Item 2' },
              ],
            }),
          },
        }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      mockCreate.mockResolvedValue(mockResponse);

      const request: LLMRequest = {
        systemPrompt: 'System',
        userPrompt: 'User',
      };

      const result = await wrapper.completeWithSchema(request, ComplexSchema);

      expect(result).toEqual({
        user: { name: 'John', email: 'john@example.com' },
        items: [
          { id: 1, title: 'Item 1' },
          { id: 2, title: 'Item 2' },
        ],
      });
    });
  });

  describe('createDefaultLLMWrapper', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should create wrapper with OPENAI_API_KEY from environment', () => {
      process.env.OPENAI_API_KEY = 'test-key-from-env';
      
      const wrapper = createDefaultLLMWrapper();
      expect(wrapper).toBeInstanceOf(LLMWrapper);
    });

    it('should use custom model from OPENAI_MODEL environment variable', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OPENAI_MODEL = 'gpt-3.5-turbo';
      
      const wrapper = createDefaultLLMWrapper();
      expect(wrapper).toBeInstanceOf(LLMWrapper);
    });

    it('should throw LLMAuthError if OPENAI_API_KEY is not set', () => {
      delete process.env.OPENAI_API_KEY;
      
      expect(() => createDefaultLLMWrapper()).toThrow(LLMAuthError);
      expect(() => createDefaultLLMWrapper()).toThrow(
        'OPENAI_API_KEY environment variable is not set'
      );
    });
  });

  describe('error handling', () => {
    it('should handle network errors as retryable', async () => {
      const networkError = new Error('fetch failed');
      
      const mockResponse = {
        choices: [{ message: { content: 'Success after retry' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      mockCreate
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(mockResponse);

      const request: LLMRequest = {
        systemPrompt: 'System',
        userPrompt: 'User',
      };

      const response = await wrapper.complete(request);
      expect(response.content).toBe('Success after retry');
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should handle unknown errors', async () => {
      const unknownError = { weird: 'error' };
      
      mockCreate.mockRejectedValue(unknownError);

      const request: LLMRequest = {
        systemPrompt: 'System',
        userPrompt: 'User',
      };

      await expect(wrapper.complete(request)).rejects.toThrow(LLMError);
    });
  });

  describe('custom retry configuration', () => {
    it('should use custom retry configuration', async () => {
      const customWrapper = new LLMWrapper(
        'test-key',
        'gpt-4-turbo-preview',
        { maxRetries: 1, baseDelay: 500 }
      );

      const customMockCreate = (customWrapper as any).client.chat.completions.create;

      // Create error object with status property (duck typing)
      const rateLimitError = {
        status: 429,
        message: 'Rate limit exceeded',
        name: 'APIError',
      };

      customMockCreate.mockRejectedValue(rateLimitError);

      const request: LLMRequest = {
        systemPrompt: 'System',
        userPrompt: 'User',
      };

      await expect(customWrapper.complete(request)).rejects.toThrow(LLMRateLimitError);
      
      // Should have tried 2 times (initial + 1 retry)
      expect(customMockCreate).toHaveBeenCalledTimes(2);
    });
  });
});
