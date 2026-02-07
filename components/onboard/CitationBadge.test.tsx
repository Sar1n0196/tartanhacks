import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CitationBadge from './CitationBadge';
import { Citation } from '@/lib/types';

describe('CitationBadge', () => {
  it('should render URL citation as a link', () => {
    const citation: Citation = {
      type: 'url',
      reference: 'https://example.com/about',
      text: 'About page',
    };
    
    render(<CitationBadge citation={citation} />);
    
    const link = screen.getByRole('link');
    expect(link).toBeDefined();
    expect(link.getAttribute('href')).toBe('https://example.com/about');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(screen.getByText('example.com')).toBeDefined();
  });
  
  it('should render interview citation with formatted category', () => {
    const citation: Citation = {
      type: 'interview',
      reference: 'business-model',
    };
    
    render(<CitationBadge citation={citation} />);
    
    expect(screen.getByText('Business Model')).toBeDefined();
  });
  
  it('should render section citation', () => {
    const citation: Citation = {
      type: 'section',
      reference: 'Vision',
    };
    
    render(<CitationBadge citation={citation} />);
    
    expect(screen.getByText('Vision')).toBeDefined();
  });
  
  it('should display index when provided', () => {
    const citation: Citation = {
      type: 'url',
      reference: 'https://example.com',
    };
    
    render(<CitationBadge citation={citation} index={1} />);
    
    expect(screen.getByText('[1]')).toBeDefined();
  });
  
  it('should not display index when not provided', () => {
    const citation: Citation = {
      type: 'url',
      reference: 'https://example.com',
    };
    
    render(<CitationBadge citation={citation} />);
    
    expect(screen.queryByText(/\[\d+\]/)).toBeNull();
  });
  
  it('should apply correct styling for URL citation', () => {
    const citation: Citation = {
      type: 'url',
      reference: 'https://example.com',
    };
    
    const { container } = render(<CitationBadge citation={citation} />);
    const badge = container.querySelector('a');
    
    expect(badge?.className).toContain('bg-blue-50');
    expect(badge?.className).toContain('text-blue-700');
  });
  
  it('should apply correct styling for interview citation', () => {
    const citation: Citation = {
      type: 'interview',
      reference: 'icp',
    };
    
    const { container } = render(<CitationBadge citation={citation} />);
    const badge = container.querySelector('span');
    
    expect(badge?.className).toContain('bg-purple-50');
    expect(badge?.className).toContain('text-purple-700');
  });
  
  it('should apply correct styling for section citation', () => {
    const citation: Citation = {
      type: 'section',
      reference: 'Mission',
    };
    
    const { container } = render(<CitationBadge citation={citation} />);
    const badge = container.querySelector('span');
    
    expect(badge?.className).toContain('bg-gray-50');
    expect(badge?.className).toContain('text-gray-700');
  });
  
  it('should handle multi-word interview categories', () => {
    const citation: Citation = {
      type: 'interview',
      reference: 'engineering-kpis',
    };
    
    render(<CitationBadge citation={citation} />);
    
    expect(screen.getByText('Engineering Kpis')).toBeDefined();
  });
  
  it('should truncate long URLs', () => {
    const citation: Citation = {
      type: 'url',
      reference: 'https://very-long-domain-name-that-should-be-truncated.com/path/to/page',
    };
    
    const { container } = render(<CitationBadge citation={citation} />);
    const textElement = container.querySelector('.truncate');
    
    expect(textElement).toBeDefined();
    expect(textElement?.className).toContain('max-w-[200px]');
  });
});
