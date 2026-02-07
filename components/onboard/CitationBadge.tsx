import { Citation } from '@/lib/types';

interface CitationBadgeProps {
  citation: Citation;
  index?: number;
}

/**
 * CitationBadge component displays a citation with appropriate styling
 * Shows URL for public scan citations or category for interview citations
 * 
 * Requirements: 6.3, 7.4, 7.5
 */
export default function CitationBadge({ citation, index }: CitationBadgeProps) {
  const { type, reference, text } = citation;
  
  // Determine badge styling based on citation type
  const getBadgeStyle = () => {
    switch (type) {
      case 'url':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case 'interview':
        return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
      case 'section':
        return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
    }
  };
  
  // Get icon based on citation type
  const getIcon = () => {
    switch (type) {
      case 'url':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
          </svg>
        );
      case 'interview':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
        );
      case 'section':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
    }
  };
  
  // Format the display text based on citation type
  const getDisplayText = () => {
    if (type === 'url') {
      try {
        const url = new URL(reference);
        return url.hostname.replace('www.', '');
      } catch {
        return reference;
      }
    } else if (type === 'interview') {
      // Format category name (e.g., 'business-model' -> 'Business Model')
      return reference
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } else {
      return reference;
    }
  };
  
  const displayText = getDisplayText();
  const showIndex = index !== undefined;
  
  // For URL citations, make it a clickable link
  if (type === 'url') {
    return (
      <a
        href={reference}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-colors ${getBadgeStyle()}`}
        title={text || reference}
      >
        {showIndex && <span className="font-semibold">[{index}]</span>}
        {getIcon()}
        <span className="max-w-[200px] truncate">{displayText}</span>
        <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
        </svg>
      </a>
    );
  }
  
  // For non-URL citations, just display as a badge
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getBadgeStyle()}`}
      title={text || reference}
    >
      {showIndex && <span className="font-semibold">[{index}]</span>}
      {getIcon()}
      <span className="max-w-[200px] truncate">{displayText}</span>
    </span>
  );
}
