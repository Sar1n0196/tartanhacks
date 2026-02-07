'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatMessage from '@/components/onboard/ChatMessage';
import ChatInput from '@/components/onboard/ChatInput';
import { ChatMessage as ChatMessageType, ContextPack } from '@/lib/types';

/**
 * Onboard page - Engineer chat interface for querying context packs
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7
 * 
 * Features:
 * - Load context pack from storage using packId query param
 * - Display chat interface with message history
 * - Call /api/chat for each question
 * - Handle missing pack error
 * - Auto-scroll to latest message
 */

function OnboardPageContent() {
  const searchParams = useSearchParams();
  const packId = searchParams.get('packId');
  
  // State
  const [contextPack, setContextPack] = useState<ContextPack | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPack, setIsLoadingPack] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Load context pack on mount
  useEffect(() => {
    const loadContextPack = async () => {
      if (!packId) {
        setError('No context pack ID provided. Please create a context pack first using the /builder flow.');
        setIsLoadingPack(false);
        return;
      }

      try {
        const response = await fetch(`/api/pack?packId=${packId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load context pack');
        }

        const data = await response.json();
        setContextPack(data.pack);
        
        // Add welcome message
        const welcomeMessage: ChatMessageType = {
          id: 'welcome',
          role: 'assistant',
          content: `Welcome! I'm here to help you understand ${data.pack.companyName}. Ask me anything about the company's vision, customers, business model, or engineering priorities.`,
          timestamp: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load context pack');
      } finally {
        setIsLoadingPack(false);
      }
    };

    loadContextPack();
  }, [packId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle message submission
  const handleSubmit = async (message: string) => {
    if (!packId || !contextPack) {
      setError('Context pack not loaded');
      return;
    }

    setError(null);
    setIsLoading(true);

    // Add user message to chat
    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Call chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId,
          question: message,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      
      // Add assistant message to chat
      setMessages(prev => [...prev, data.message]);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      
      // Add error message to chat
      const errorMessage: ChatMessageType = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your question. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoadingPack) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading context pack...</p>
        </div>
      </div>
    );
  }

  // Error state (no pack ID or failed to load)
  if (error && !contextPack) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <svg 
              className="w-16 h-16 text-red-500 mx-auto mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Context Pack Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <a
              href="/builder"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Create Context Pack
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Main chat interface
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {contextPack?.companyName || 'Company'} Onboarding
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Ask questions to understand the company context
              </p>
            </div>
            <a
              href="/builder"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Create New Pack
            </a>
          </div>
        </div>
      </header>

      {/* Error Banner (for chat errors, not pack loading errors) */}
      {error && contextPack && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg 
                className="w-5 h-5 text-red-600" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                  clipRule="evenodd" 
                />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path 
                  fillRule="evenodd" 
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                  clipRule="evenodd" 
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No messages yet. Start by asking a question!</p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Input - Fixed at bottom */}
      <ChatInput
        onSubmit={handleSubmit}
        isLoading={isLoading}
        disabled={!contextPack}
        placeholder="Ask about vision, customers, business model, or engineering priorities..."
      />
    </div>
  );
}


export default function OnboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <OnboardPageContent />
    </Suspense>
  );
}
