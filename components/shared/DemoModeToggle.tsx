'use client';

interface DemoModeToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  className?: string;
}

/**
 * DemoModeToggle component provides a switch to toggle demo mode
 * 
 * Requirements: 7.6, 8.7
 * 
 * When enabled, the system uses pre-seeded mock data instead of live web scraping
 */
export default function DemoModeToggle({ enabled, onChange, className = '' }: DemoModeToggleProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <label htmlFor="demo-mode-toggle" className="flex items-center cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            id="demo-mode-toggle"
            className="sr-only"
            checked={enabled}
            onChange={(e) => onChange(e.target.checked)}
          />
          <div 
            className={`block w-14 h-8 rounded-full transition-colors ${
              enabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          />
          <div 
            className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
              enabled ? 'transform translate-x-6' : ''
            }`}
          />
        </div>
        <div className="ml-3 flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            Demo Mode
          </span>
          {enabled && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              Active
            </span>
          )}
        </div>
      </label>
      
      {/* Info tooltip */}
      <div className="group relative">
        <svg 
          className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" 
          fill="currentColor" 
          viewBox="0 0 20 20"
          aria-label="Demo mode information"
        >
          <path 
            fillRule="evenodd" 
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
            clipRule="evenodd" 
          />
        </svg>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-64 z-10">
          When enabled, uses pre-populated mock data instead of live web scraping. Perfect for exploring the system without providing real company information.
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      </div>
    </div>
  );
}
