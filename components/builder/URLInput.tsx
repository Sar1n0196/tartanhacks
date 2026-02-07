'use client';

import React, { useState } from 'react';
import DemoModeToggle from '@/components/shared/DemoModeToggle';

interface URLInputProps {
  onSubmit: (companyUrl: string, companyName: string, demoMode: boolean) => void;
  isLoading?: boolean;
}

/**
 * URLInput component - Step 1 of the founder flow
 * 
 * Requirements: 11.1, 11.2
 * 
 * Provides a form for founders to input company URL and optional name,
 * with a demo mode toggle for testing without live scraping
 */
export default function URLInput({ onSubmit, isLoading = false }: URLInputProps) {
  const [companyUrl, setCompanyUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [demoMode, setDemoMode] = useState(false);
  const [errors, setErrors] = useState<{ url?: string; name?: string }>({});

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      setErrors(prev => ({ ...prev, url: 'Company URL is required' }));
      return false;
    }
    
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        setErrors(prev => ({ ...prev, url: 'URL must use http or https protocol' }));
        return false;
      }
      setErrors(prev => ({ ...prev, url: undefined }));
      return true;
    } catch {
      setErrors(prev => ({ ...prev, url: 'Please enter a valid URL (e.g., https://example.com)' }));
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateUrl(companyUrl)) {
      return;
    }
    
    onSubmit(companyUrl.trim(), companyName.trim(), demoMode);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Create Context Pack
          </h2>
          <p className="text-gray-600">
            Start by providing your company URL. We'll scan public pages to build an initial context pack,
            then ask you targeted questions to fill in the gaps.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company URL Input */}
          <div>
            <label htmlFor="company-url" className="block text-sm font-medium text-gray-700 mb-2">
              Company URL <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="company-url"
              value={companyUrl}
              onChange={(e) => setCompanyUrl(e.target.value)}
              onBlur={() => companyUrl && validateUrl(companyUrl)}
              placeholder="https://example.com"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.url ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
              required
            />
            {errors.url && (
              <p className="mt-1 text-sm text-red-600">{errors.url}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              We'll scan your homepage, about page, careers page, and blog
            </p>
          </div>

          {/* Company Name Input (Optional) */}
          <div>
            <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 mb-2">
              Company Name <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              id="company-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Inc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500">
              If not provided, we'll extract it from your website
            </p>
          </div>

          {/* Demo Mode Toggle */}
          <div className="pt-4 border-t border-gray-200">
            <DemoModeToggle
              enabled={demoMode}
              onChange={setDemoMode}
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full px-6 py-3 rounded-lg font-medium text-white transition-colors ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg 
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
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
                  Starting scan...
                </span>
              ) : (
                'Start Scan'
              )}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex">
            <svg 
              className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                clipRule="evenodd" 
              />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">What happens next?</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>We'll scan your public pages to extract company information</li>
                <li>You'll review the draft context pack with confidence scores</li>
                <li>We'll ask you 5-12 targeted questions to fill knowledge gaps</li>
                <li>You'll get a final context pack for engineer onboarding</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
