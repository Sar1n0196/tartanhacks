import { ChatMessage as ChatMessageType } from '@/lib/types';
import CitationBadge from './CitationBadge';
import ConfidenceScore from '../shared/ConfidenceScore';

interface ChatMessageProps {
  message: ChatMessageType;
}

/**
 * ChatMessage component displays user and assistant messages in the chat interface
 * 
 * Features:
 * - Different styling for user vs assistant messages
 * - Citations for assistant messages
 * - "Why this matters" section for assistant messages
 * - Confidence scores for assistant messages
 * 
 * Requirements: 12.2, 12.3, 12.4, 12.5
 */
export default function ChatMessage({ message }: ChatMessageProps) {
  const { role, content, citations, whyItMatters, confidence, timestamp } = message;
  
  const isUser = role === 'user';
  const isAssistant = role === 'assistant';
  
  // Format timestamp for display
  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return '';
    }
  };
  
  if (isUser) {
    // User message - right-aligned, blue background
    return (
      <div className="flex justify-end mb-4">
        <div className="flex flex-col items-end max-w-[80%]">
          <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
            <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
          </div>
          <span className="text-xs text-gray-500 mt-1 px-2">
            {formatTimestamp(timestamp)}
          </span>
        </div>
      </div>
    );
  }
  
  if (isAssistant) {
    // Assistant message - left-aligned, gray background with additional info
    return (
      <div className="flex justify-start mb-4">
        <div className="flex flex-col items-start max-w-[85%]">
          {/* Main message content */}
          <div className="bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {content}
            </p>
            
            {/* Citations section */}
            {citations && citations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-gray-600 flex-shrink-0">
                    Sources:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {citations.map((citation, index) => (
                      <CitationBadge 
                        key={`${citation.type}-${citation.reference}-${index}`}
                        citation={citation} 
                        index={index + 1}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Confidence score */}
            {confidence && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600">
                    Confidence:
                  </span>
                  <ConfidenceScore confidence={confidence} showReason={false} />
                </div>
              </div>
            )}
          </div>
          
          {/* "Why this matters" section - displayed below the main message */}
          {whyItMatters && (
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 w-full">
              <div className="flex items-start gap-2">
                <svg 
                  className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                    clipRule="evenodd" 
                  />
                </svg>
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-blue-900 mb-1">
                    Why this matters
                  </h4>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    {whyItMatters}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Timestamp */}
          <span className="text-xs text-gray-500 mt-1 px-2">
            {formatTimestamp(timestamp)}
          </span>
        </div>
      </div>
    );
  }
  
  // Fallback for unknown role
  return null;
}
