'use client';

import React, { useState } from 'react';
import { ContextPack, ContextField } from '@/lib/types';
import ConfidenceScore from '@/components/shared/ConfidenceScore';
import CitationBadge from '@/components/onboard/CitationBadge';

interface FinalPackViewProps {
  finalPack: ContextPack;
  onViewChat: () => void;
}

/**
 * FinalPackView component - Step 5 of the founder flow
 * 
 * Requirements: 11.6
 * 
 * Displays the final context pack v1 with all sections, confidence scores,
 * citations, and human-readable summary
 */
export default function FinalPackView({ finalPack, onViewChat }: FinalPackViewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['summary', 'vision'])
  );

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
        <p className="text-gray-900 mb-3 whitespace-pre-wrap">{field.content}</p>
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
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Final Context Pack
            </h2>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Version 1 - Complete
            </span>
          </div>
          <p className="text-gray-600">
            Your context pack is ready! Engineers can now use this to understand your company
            and make user-centric decisions.
          </p>
        </div>

        {/* Company Info */}
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-green-700 font-medium">Company</p>
              <p className="text-green-900">{finalPack.companyName}</p>
            </div>
            <div>
              <p className="text-sm text-green-700 font-medium">Website</p>
              <a 
                href={finalPack.companyUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-900 hover:underline"
              >
                {finalPack.companyUrl}
              </a>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <Section title="Executive Summary" id="summary">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
              {finalPack.summary}
            </p>
          </div>
        </Section>

        {/* Sections */}
        <div className="space-y-4 mt-4 mb-8">
          {/* Vision, Mission, Values */}
          <Section title="Vision, Mission & Values" id="vision">
            <div className="space-y-4">
              {renderContextField(finalPack.vision, 'Vision')}
              {renderContextField(finalPack.mission, 'Mission')}
              {finalPack.values.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Values</p>
                  <div className="space-y-2">
                    {finalPack.values.map((value, idx) => (
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
              {finalPack.icp.segments.map((segment, idx) => (
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
              {renderContextField(finalPack.icp.evolution, 'ICP Evolution')}
            </div>
          </Section>

          {/* Business Model */}
          <Section title="Business Model" id="business">
            <div className="space-y-4">
              {finalPack.businessModel.revenueDrivers.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Revenue Drivers</p>
                  <div className="space-y-2">
                    {finalPack.businessModel.revenueDrivers.map((driver, idx) => (
                      <div key={idx}>{renderContextField(driver)}</div>
                    ))}
                  </div>
                </div>
              )}
              {renderContextField(finalPack.businessModel.pricingModel, 'Pricing Model')}
              {finalPack.businessModel.keyMetrics.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Key Metrics</p>
                  <div className="space-y-2">
                    {finalPack.businessModel.keyMetrics.map((metric, idx) => (
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
              {finalPack.product.jobsToBeDone.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Jobs-to-be-Done</p>
                  <div className="space-y-2">
                    {finalPack.product.jobsToBeDone.map((job, idx) => (
                      <div key={idx}>{renderContextField(job)}</div>
                    ))}
                  </div>
                </div>
              )}
              {finalPack.product.keyFeatures.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Key Features</p>
                  <div className="space-y-2">
                    {finalPack.product.keyFeatures.map((feature, idx) => (
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
              {finalPack.decisionRules.priorities.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Priorities (What TO Build)</p>
                  <div className="space-y-2">
                    {finalPack.decisionRules.priorities.map((priority, idx) => (
                      <div key={idx}>{renderContextField(priority)}</div>
                    ))}
                  </div>
                </div>
              )}
              {finalPack.decisionRules.antiPatterns.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Anti-Patterns (What NOT to Build)</p>
                  <div className="space-y-2">
                    {finalPack.decisionRules.antiPatterns.map((pattern, idx) => (
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
              {finalPack.engineeringKPIs.length > 0 ? (
                finalPack.engineeringKPIs.map((kpi, idx) => (
                  <div key={idx}>{renderContextField(kpi)}</div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">No KPIs defined</p>
              )}
            </div>
          </Section>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 pt-6 border-t border-gray-200">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start">
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
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Context Pack Ready for Engineers
                </p>
                <p className="text-sm text-blue-800">
                  New engineers can now chat with this context pack to understand your company,
                  customer needs, and make informed technical decisions.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onViewChat}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            View in Engineer Chat
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Pack ID: <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">{finalPack.id}</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
