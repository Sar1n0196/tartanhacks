'use client';

import React, { useState } from 'react';
import { ContextPack, ContextField } from '@/lib/types';
import ConfidenceScore from '@/components/shared/ConfidenceScore';
import CitationBadge from '@/components/onboard/CitationBadge';

interface DraftPackViewProps {
  draftPack: ContextPack;
  onProceed: () => void;
  isLoading?: boolean;
}

/**
 * DraftPackView component - Step 3 of the founder flow
 * 
 * Requirements: 11.4
 * 
 * Displays the draft context pack v0 with confidence scores and citations,
 * allowing founders to review extracted information before the interview
 */
export default function DraftPackView({ draftPack, onProceed, isLoading = false }: DraftPackViewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['vision']));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const renderContextField = (field: ContextField, label?: string) => {
    if (!field.content || field.content === 'Information not available') {
      return (
        <div className="p-3 bg-gray-50 rounded border border-gray-200">
          <p className="text-sm text-gray-500 italic">Information not available</p>
        </div>
      );
    }

    return (
      <div className="p-4 bg-white rounded border border-gray-200">
        {label && <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>}
        <p className="text-gray-900 mb-3">{field.content}</p>
        <div className="flex flex-wrap items-center gap-2">
          <ConfidenceScore confidence={field.confidence} />
          {field.citations.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {field.citations.map((citation, idx) => (
                <CitationBadge key={idx} citation={citation} index={idx + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const Section = ({ 
    title, 
    id, 
    children, 
    badge 
  }: { 
    title: string; 
    id: string; 
    children: React.ReactNode;
    badge?: React.ReactNode;
  }) => {
    const isExpanded = expandedSections.has(id);
    
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <svg
              className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          {badge}
        </button>
        {isExpanded && (
          <div className="px-6 py-4 space-y-4">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Draft Context Pack
            </h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              Version 0
            </span>
          </div>
          <p className="text-gray-600">
            Review the information we extracted from {draftPack.companyName}'s public pages.
            We'll ask you questions to fill in gaps and improve confidence scores.
          </p>
        </div>

        {/* Company Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-blue-700 font-medium">Company</p>
              <p className="text-blue-900">{draftPack.companyName}</p>
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium">Website</p>
              <a 
                href={draftPack.companyUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-900 hover:underline"
              >
                {draftPack.companyUrl}
              </a>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4 mb-8">
          {/* Vision, Mission, Values */}
          <Section title="Vision, Mission & Values" id="vision">
            <div className="space-y-4">
              {renderContextField(draftPack.vision, 'Vision')}
              {renderContextField(draftPack.mission, 'Mission')}
              {draftPack.values.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Values</p>
                  <div className="space-y-2">
                    {draftPack.values.map((value, idx) => (
                      <div key={idx}>{renderContextField(value)}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* ICP */}
          <Section title="Ideal Customer Profile" id="icp">
            <div className="space-y-4">
              {draftPack.icp.segments.map((segment, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">{segment.name}</h4>
                  {renderContextField(segment.description, 'Description')}
                  {segment.painPoints.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Pain Points</p>
                      <div className="space-y-2">
                        {segment.painPoints.map((pain, pIdx) => (
                          <div key={pIdx}>{renderContextField(pain)}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {renderContextField(draftPack.icp.evolution, 'ICP Evolution')}
            </div>
          </Section>

          {/* Business Model */}
          <Section title="Business Model" id="business">
            <div className="space-y-4">
              {draftPack.businessModel.revenueDrivers.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Revenue Drivers</p>
                  <div className="space-y-2">
                    {draftPack.businessModel.revenueDrivers.map((driver, idx) => (
                      <div key={idx}>{renderContextField(driver)}</div>
                    ))}
                  </div>
                </div>
              )}
              {renderContextField(draftPack.businessModel.pricingModel, 'Pricing Model')}
              {draftPack.businessModel.keyMetrics.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Key Metrics</p>
                  <div className="space-y-2">
                    {draftPack.businessModel.keyMetrics.map((metric, idx) => (
                      <div key={idx}>{renderContextField(metric)}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Product */}
          <Section title="Product & Jobs-to-be-Done" id="product">
            <div className="space-y-4">
              {draftPack.product.jobsToBeDone.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Jobs-to-be-Done</p>
                  <div className="space-y-2">
                    {draftPack.product.jobsToBeDone.map((job, idx) => (
                      <div key={idx}>{renderContextField(job)}</div>
                    ))}
                  </div>
                </div>
              )}
              {draftPack.product.keyFeatures.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Key Features</p>
                  <div className="space-y-2">
                    {draftPack.product.keyFeatures.map((feature, idx) => (
                      <div key={idx}>{renderContextField(feature)}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Decision Rules */}
          <Section title="Engineering Decision Rules" id="decisions">
            <div className="space-y-4">
              {draftPack.decisionRules.priorities.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Priorities</p>
                  <div className="space-y-2">
                    {draftPack.decisionRules.priorities.map((priority, idx) => (
                      <div key={idx}>{renderContextField(priority)}</div>
                    ))}
                  </div>
                </div>
              )}
              {draftPack.decisionRules.antiPatterns.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Anti-Patterns (What NOT to Build)</p>
                  <div className="space-y-2">
                    {draftPack.decisionRules.antiPatterns.map((pattern, idx) => (
                      <div key={idx}>{renderContextField(pattern)}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Engineering KPIs */}
          <Section title="Engineering KPIs" id="kpis">
            <div className="space-y-2">
              {draftPack.engineeringKPIs.length > 0 ? (
                draftPack.engineeringKPIs.map((kpi, idx) => (
                  <div key={idx}>{renderContextField(kpi)}</div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">No KPIs extracted yet</p>
              )}
            </div>
          </Section>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Next: Targeted Interview</p>
            <p>We'll ask you 5-12 questions to fill knowledge gaps</p>
          </div>
          <button
            onClick={onProceed}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {isLoading && (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            )}
            {isLoading ? 'Starting Interview...' : 'Proceed to Interview'}
          </button>
        </div>
      </div>
    </div>
  );
}
