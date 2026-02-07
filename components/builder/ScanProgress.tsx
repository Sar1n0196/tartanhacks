'use client';

interface ScanProgressProps {
  companyUrl: string;
  scrapedPages: number;
  totalPages?: number;
  errors: string[];
  isComplete: boolean;
}

/**
 * ScanProgress component - Step 2 of the founder flow
 * 
 * Requirements: 11.3
 * 
 * Displays loading state during web scraping, shows progress,
 * and displays any errors that occurred during the scan
 */
export default function ScanProgress({ 
  companyUrl, 
  scrapedPages, 
  totalPages,
  errors, 
  isComplete 
}: ScanProgressProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isComplete ? 'Scan Complete' : 'Scanning Company Pages'}
          </h2>
          <p className="text-gray-600">
            {isComplete 
              ? "We've extracted information from your public pages"
              : 'Analyzing your website to build an initial context pack'
            }
          </p>
        </div>

        {/* Company URL Display */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Scanning</p>
          <p className="text-gray-900 font-medium break-all">{companyUrl}</p>
        </div>

        {/* Progress Indicator */}
        {!isComplete && (
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <svg 
                className="animate-spin h-12 w-12 text-blue-600" 
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
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: totalPages ? `${(scrapedPages / totalPages) * 100}%` : '50%' 
                }}
              />
            </div>
          </div>
        )}

        {/* Scraped Pages Count */}
        <div className="mb-6">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <svg 
                className={`w-6 h-6 mr-3 ${isComplete ? 'text-green-600' : 'text-blue-600'}`}
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                {isComplete ? (
                  <path 
                    fillRule="evenodd" 
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                    clipRule="evenodd" 
                  />
                ) : (
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                )}
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Pages Scraped
                </p>
                <p className="text-xs text-gray-600">
                  {isComplete ? 'Extraction complete' : 'Processing...'}
                </p>
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {scrapedPages}
              {totalPages && <span className="text-gray-400 text-lg">/{totalPages}</span>}
            </div>
          </div>
        </div>

        {/* Errors Display */}
        {errors.length > 0 && (
          <div className="mb-6">
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-start">
                <svg 
                  className="w-5 h-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
                    clipRule="evenodd" 
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-900 mb-2">
                    Some pages could not be scraped ({errors.length} {errors.length === 1 ? 'error' : 'errors'})
                  </p>
                  <ul className="text-sm text-orange-800 space-y-1">
                    {errors.slice(0, 3).map((error, index) => (
                      <li key={index} className="truncate">• {error}</li>
                    ))}
                    {errors.length > 3 && (
                      <li className="text-orange-700 italic">
                        ... and {errors.length - 3} more
                      </li>
                    )}
                  </ul>
                  <p className="text-xs text-orange-700 mt-2">
                    Don't worry - we'll ask you questions to fill in any missing information
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {isComplete && errors.length === 0 && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center">
              <svg 
                className="w-5 h-5 text-green-600 mr-3" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                  clipRule="evenodd" 
                />
              </svg>
              <p className="text-sm font-medium text-green-900">
                Successfully scraped all pages
              </p>
            </div>
          </div>
        )}

        {/* Loading Status Messages */}
        {!isComplete && (
          <div className="mt-6 space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse" />
              Extracting company vision and mission...
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse" />
              Identifying customer segments...
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse" />
              Analyzing business model...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
