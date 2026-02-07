'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import URLInput from '@/components/builder/URLInput';
import ScanProgress from '@/components/builder/ScanProgress';
import DraftPackView from '@/components/builder/DraftPackView';
import InterviewQuestion from '@/components/builder/InterviewQuestion';
import FinalPackView from '@/components/builder/FinalPackView';
import { 
  ContextPack, 
  InterviewQuestion as InterviewQuestionType,
  ScanResponse,
  InterviewStartResponse,
  InterviewAnswerResponse
} from '@/lib/types';

/**
 * Builder page - Founder flow for creating context packs
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8
 * 
 * Multi-step flow:
 * 1. URL Input - Enter company URL and demo mode
 * 2. Scan Progress - Show scraping progress
 * 3. Draft Pack View - Review extracted information
 * 4. Interview - Answer targeted questions
 * 5. Final Pack View - Review complete context pack
 */

type Step = 'input' | 'scanning' | 'draft' | 'interview' | 'final';

interface ScanState {
  scrapedPages: number;
  totalPages: number;
  errors: string[];
  isComplete: boolean;
}

export default function BuilderPage() {
  const router = useRouter();
  
  // Flow state
  const [currentStep, setCurrentStep] = useState<Step>('input');
  const [error, setError] = useState<string | null>(null);
  
  // Scan state
  const [companyUrl, setCompanyUrl] = useState('');
  const [scanState, setScanState] = useState<ScanState>({
    scrapedPages: 0,
    totalPages: 10,
    errors: [],
    isComplete: false
  });
  
  // Pack state
  const [packId, setPackId] = useState<string | null>(null);
  const [draftPack, setDraftPack] = useState<ContextPack | null>(null);
  const [finalPack, setFinalPack] = useState<ContextPack | null>(null);
  
  // Interview state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestionType[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Handle URL submission and start scan
  const handleUrlSubmit = async (url: string, name: string, demoMode: boolean) => {
    setError(null);
    setCompanyUrl(url);
    setCurrentStep('scanning');
    
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyUrl: url,
          companyName: name || undefined,
          demoMode
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Scan failed');
      }

      const data: ScanResponse = await response.json();
      
      // Update scan state
      setScanState({
        scrapedPages: data.scrapedPages,
        totalPages: data.scrapedPages,
        errors: data.errors,
        isComplete: true
      });
      
      setPackId(data.packId);
      setDraftPack(data.draftPack);
      
      // Move to draft view after a brief delay
      setTimeout(() => {
        setCurrentStep('draft');
      }, 1500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during scanning');
      setCurrentStep('input');
    }
  };

  // Step 3: Handle proceeding to interview
  const handleProceedToInterview = async () => {
    if (!packId) {
      setError('No pack ID available');
      return;
    }
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start interview');
      }

      const data: InterviewStartResponse = await response.json();
      
      setSessionId(data.sessionId);
      setQuestions(data.questions);
      setCurrentQuestionIndex(0);
      setCurrentStep('interview');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred starting the interview');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 4: Handle interview answer submission
  const handleAnswerSubmit = async (answer: string, skipped: boolean) => {
    if (!sessionId || !questions[currentQuestionIndex]) {
      setError('Invalid interview state');
      return;
    }
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: questions[currentQuestionIndex].id,
          answer,
          skipped
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit answer');
      }

      const data: InterviewAnswerResponse = await response.json();
      
      if (data.completed && data.finalPack) {
        // Interview complete, show final pack
        setFinalPack(data.finalPack);
        setCurrentStep('final');
      } else if (data.nextQuestion) {
        // Move to next question
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Unexpected state
        throw new Error('Unexpected interview response');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred submitting your answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 5: Handle viewing in chat
  const handleViewChat = () => {
    if (finalPack) {
      router.push(`/onboard?packId=${finalPack.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Error Display */}
      {error && (
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg 
                className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                  clipRule="evenodd" 
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-800 mt-1">{error}</p>
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
        </div>
      )}

      {/* Step Content */}
      {currentStep === 'input' && (
        <URLInput 
          onSubmit={handleUrlSubmit}
          isLoading={false}
        />
      )}

      {currentStep === 'scanning' && (
        <ScanProgress
          companyUrl={companyUrl}
          scrapedPages={scanState.scrapedPages}
          totalPages={scanState.totalPages}
          errors={scanState.errors}
          isComplete={scanState.isComplete}
        />
      )}

      {currentStep === 'draft' && draftPack && (
        <DraftPackView
          draftPack={draftPack}
          onProceed={handleProceedToInterview}
        />
      )}

      {currentStep === 'interview' && questions.length > 0 && questions[currentQuestionIndex] && (
        <InterviewQuestion
          question={questions[currentQuestionIndex]}
          currentIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          onSubmit={handleAnswerSubmit}
          isLoading={isSubmitting}
        />
      )}

      {currentStep === 'final' && finalPack && (
        <FinalPackView
          finalPack={finalPack}
          onViewChat={handleViewChat}
        />
      )}

      {/* Progress Indicator */}
      <div className="max-w-4xl mx-auto mt-8">
        <div className="flex items-center justify-center gap-2">
          {['input', 'scanning', 'draft', 'interview', 'final'].map((step, idx) => {
            const stepIndex = ['input', 'scanning', 'draft', 'interview', 'final'].indexOf(currentStep);
            const isActive = idx === stepIndex;
            const isComplete = idx < stepIndex;
            
            return (
              <React.Fragment key={step}>
                <div 
                  className={`w-2 h-2 rounded-full transition-colors ${
                    isActive ? 'bg-blue-600 w-3 h-3' : 
                    isComplete ? 'bg-green-600' : 
                    'bg-gray-300'
                  }`}
                />
                {idx < 4 && (
                  <div 
                    className={`w-8 h-0.5 ${
                      isComplete ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
