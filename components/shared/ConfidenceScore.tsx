import React from 'react';
import { ConfidenceScore as ConfidenceScoreType } from '@/lib/types';

interface ConfidenceScoreProps {
  confidence: ConfidenceScoreType;
  showReason?: boolean;
}

/**
 * ConfidenceScore component displays a confidence badge with color-coded styling
 * 
 * Requirements: 7.6, 8.7
 * 
 * Color scheme:
 * - High confidence (≥0.7): Green
 * - Medium confidence (0.5-0.7): Yellow
 * - Low confidence (<0.5): Red/Orange
 */
export default function ConfidenceScore({ confidence, showReason = false }: ConfidenceScoreProps) {
  const { value, reason } = confidence;
  const percentage = Math.round(value * 100);
  
  // Determine badge color based on confidence value
  const getBadgeColor = () => {
    if (value >= 0.7) {
      return 'bg-green-100 text-green-800 border-green-300';
    } else if (value >= 0.5) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    } else {
      return 'bg-orange-100 text-orange-800 border-orange-300';
    }
  };
  
  // Determine label based on confidence value
  const getConfidenceLabel = () => {
    if (value >= 0.7) {
      return 'High';
    } else if (value >= 0.5) {
      return 'Medium';
    } else {
      return 'Low';
    }
  };
  
  return (
    <div className="inline-flex flex-col gap-1">
      <span 
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor()}`}
        title={reason || `Confidence: ${percentage}%`}
      >
        <svg 
          className="w-3 h-3 mr-1" 
          fill="currentColor" 
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path 
            fillRule="evenodd" 
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
            clipRule="evenodd" 
          />
        </svg>
        {getConfidenceLabel()} ({percentage}%)
      </span>
      
      {showReason && reason && (
        <span className="text-xs text-gray-600 italic max-w-xs">
          {reason}
        </span>
      )}
    </div>
  );
}
