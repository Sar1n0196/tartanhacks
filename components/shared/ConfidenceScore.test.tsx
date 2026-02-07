import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConfidenceScore from './ConfidenceScore';
import { ConfidenceScore as ConfidenceScoreType } from '@/lib/types';

describe('ConfidenceScore', () => {
  it('should render high confidence with green badge', () => {
    const confidence: ConfidenceScoreType = {
      value: 0.9,
      reason: 'Strong evidence from founder interview',
    };
    
    render(<ConfidenceScore confidence={confidence} />);
    
    const badge = screen.getByText(/High \(90%\)/);
    expect(badge).toBeDefined();
    expect(badge.className).toContain('bg-green-100');
    expect(badge.className).toContain('text-green-800');
  });
  
  it('should render medium confidence with yellow badge', () => {
    const confidence: ConfidenceScoreType = {
      value: 0.6,
    };
    
    render(<ConfidenceScore confidence={confidence} />);
    
    const badge = screen.getByText(/Medium \(60%\)/);
    expect(badge).toBeDefined();
    expect(badge.className).toContain('bg-yellow-100');
    expect(badge.className).toContain('text-yellow-800');
  });
  
  it('should render low confidence with orange badge', () => {
    const confidence: ConfidenceScoreType = {
      value: 0.3,
    };
    
    render(<ConfidenceScore confidence={confidence} />);
    
    const badge = screen.getByText(/Low \(30%\)/);
    expect(badge).toBeDefined();
    expect(badge.className).toContain('bg-orange-100');
    expect(badge.className).toContain('text-orange-800');
  });
  
  it('should show reason when showReason is true', () => {
    const confidence: ConfidenceScoreType = {
      value: 0.8,
      reason: 'Based on multiple sources',
    };
    
    render(<ConfidenceScore confidence={confidence} showReason={true} />);
    
    expect(screen.getByText('Based on multiple sources')).toBeDefined();
  });
  
  it('should not show reason when showReason is false', () => {
    const confidence: ConfidenceScoreType = {
      value: 0.8,
      reason: 'Based on multiple sources',
    };
    
    render(<ConfidenceScore confidence={confidence} showReason={false} />);
    
    expect(screen.queryByText('Based on multiple sources')).toBeNull();
  });
  
  it('should handle edge case of 0% confidence', () => {
    const confidence: ConfidenceScoreType = {
      value: 0,
    };
    
    render(<ConfidenceScore confidence={confidence} />);
    
    const badge = screen.getByText(/Low \(0%\)/);
    expect(badge).toBeDefined();
  });
  
  it('should handle edge case of 100% confidence', () => {
    const confidence: ConfidenceScoreType = {
      value: 1,
    };
    
    render(<ConfidenceScore confidence={confidence} />);
    
    const badge = screen.getByText(/High \(100%\)/);
    expect(badge).toBeDefined();
  });
});
