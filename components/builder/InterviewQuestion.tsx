'use client';

import React, { useState } from 'react';
import { InterviewQuestion as InterviewQuestionType } from '@/lib/types';

interface InterviewQuestionProps {
  question: InterviewQuestionType;
  currentIndex: number;
  totalQuestions: number;
  onSubmit: (answer: string, skipped: boolean) => void;
  isLoading?: boolean;
}

/**
 * InterviewQuestion component - Step 4 of the founder flow
 * 
 * Requirements: 11.5
 * 
 * Displays interview questions one at a time with context,
 * allows founders to answer or skip, and shows progress
 */
export default function InterviewQuestion({ 
  question, 
  currentIndex, 
  totalQuestions, 
  onSubmit,
  isLoading = false
}: InterviewQuestionProps) {
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim()) {
      onSubmit(answer.trim(), false);
      setAnswer('');
    }
  };

  const handleSkip = () => {
    onSubmit('', true);
    setAnswer('');
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'vision':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'icp':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'business-model':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'engineering-kpis':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'decision-rules':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getCategoryLabel = (category: string) => {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const progressPercentage = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Targeted Interview
            </h2>
            <span className="text-sm font-medium text-gray-600">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <p className="text-gray-600">
            Help us fill knowledge gaps by answering targeted questions about your company.
            You can skip any question you're not ready to answer.
          </p>
        </div>

        {/* Category Badge */}
        <div className="mb-4">
          <span 
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(question.category)}`}
          >
            <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            {getCategoryLabel(question.category)}
          </span>
        </div>

        {/* Question */}
        <div className="mb-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {question.question}
          </h3>
          
          {question.context && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Context:</span> {question.context}
              </p>
            </div>
          )}
        </div>

        {/* Answer Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
              Your Answer
            </label>
            <textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={6}
              placeholder="Share your insights here..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isLoading}
            />
            <p className="mt-2 text-xs text-gray-500">
              Be specific and detailed - this information will help engineers make better decisions
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={handleSkip}
              disabled={isLoading}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip Question
            </button>
            
            <button
              type="submit"
              disabled={!answer.trim() || isLoading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <svg 
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  Submit Answer
                  <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Tips */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start">
            <svg 
              className="w-5 h-5 text-gray-600 mt-0.5 mr-3 flex-shrink-0" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                clipRule="evenodd" 
              />
            </svg>
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-1">Tips for great answers:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Be specific with examples and metrics when possible</li>
                <li>Focus on information that helps engineers understand customer needs</li>
                <li>Explain the "why" behind decisions and priorities</li>
                <li>It's okay to skip if you need more time to think</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
