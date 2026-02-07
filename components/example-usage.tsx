'use client';

/**
 * Example usage of the shared and onboard components
 * This file demonstrates how to use ConfidenceScore, DemoModeToggle, and CitationBadge together
 */

import { useState } from 'react';
import ConfidenceScore from './shared/ConfidenceScore';
import DemoModeToggle from './shared/DemoModeToggle';
import CitationBadge from './onboard/CitationBadge';

export default function ExampleUsage() {
  const [demoMode, setDemoMode] = useState(false);
  
  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header with demo mode toggle */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Component Examples</h1>
        <DemoModeToggle enabled={demoMode} onChange={setDemoMode} />
      </div>
      
      {/* ConfidenceScore Examples */}
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Confidence Score Examples</h2>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 w-32">High (90%):</span>
            <ConfidenceScore 
              confidence={{ value: 0.9, reason: 'Strong evidence from founder interview' }}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 w-32">Medium (60%):</span>
            <ConfidenceScore 
              confidence={{ value: 0.6, reason: 'Inferred from public pages' }}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 w-32">Low (30%):</span>
            <ConfidenceScore 
              confidence={{ value: 0.3, reason: 'Limited information available' }}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 w-32">With reason:</span>
            <ConfidenceScore 
              confidence={{ value: 0.85, reason: 'Based on multiple sources' }}
              showReason={true}
            />
          </div>
        </div>
      </section>
      
      {/* CitationBadge Examples */}
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Citation Badge Examples</h2>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-sm text-gray-600 w-32 pt-1">URL Citation:</span>
            <div className="flex flex-wrap gap-2">
              <CitationBadge 
                citation={{ 
                  type: 'url', 
                  reference: 'https://example.com/about',
                  text: 'About page'
                }}
                index={1}
              />
              <CitationBadge 
                citation={{ 
                  type: 'url', 
                  reference: 'https://example.com/blog/post',
                  text: 'Blog post'
                }}
                index={2}
              />
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-sm text-gray-600 w-32 pt-1">Interview:</span>
            <div className="flex flex-wrap gap-2">
              <CitationBadge 
                citation={{ 
                  type: 'interview', 
                  reference: 'vision'
                }}
              />
              <CitationBadge 
                citation={{ 
                  type: 'interview', 
                  reference: 'business-model'
                }}
              />
              <CitationBadge 
                citation={{ 
                  type: 'interview', 
                  reference: 'engineering-kpis'
                }}
              />
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-sm text-gray-600 w-32 pt-1">Section:</span>
            <div className="flex flex-wrap gap-2">
              <CitationBadge 
                citation={{ 
                  type: 'section', 
                  reference: 'Vision'
                }}
              />
              <CitationBadge 
                citation={{ 
                  type: 'section', 
                  reference: 'Mission'
                }}
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Combined Example */}
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Combined Example</h2>
        
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-medium text-gray-900">Company Vision</h3>
              <ConfidenceScore 
                confidence={{ value: 0.85, reason: 'From founder interview' }}
              />
            </div>
            
            <p className="text-gray-700 mb-3">
              To revolutionize how engineers understand business context and make 
              user-centric decisions by providing comprehensive onboarding knowledge packs.
            </p>
            
            <div className="flex flex-wrap gap-2">
              <CitationBadge 
                citation={{ 
                  type: 'url', 
                  reference: 'https://company.com/about' 
                }}
                index={1}
              />
              <CitationBadge 
                citation={{ 
                  type: 'interview', 
                  reference: 'vision' 
                }}
                index={2}
              />
            </div>
          </div>
          
          <div className="border-l-4 border-green-500 pl-4">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-medium text-gray-900">Target Customer</h3>
              <ConfidenceScore 
                confidence={{ value: 0.92, reason: 'Detailed founder input' }}
              />
            </div>
            
            <p className="text-gray-700 mb-3">
              Early-stage startup founders who need to onboard engineers quickly 
              while ensuring they understand customer needs and business priorities.
            </p>
            
            <div className="flex flex-wrap gap-2">
              <CitationBadge 
                citation={{ 
                  type: 'interview', 
                  reference: 'icp' 
                }}
                index={1}
              />
              <CitationBadge 
                citation={{ 
                  type: 'section', 
                  reference: 'ICP Segments' 
                }}
                index={2}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
