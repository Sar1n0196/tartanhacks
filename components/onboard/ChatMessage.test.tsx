import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatMessage from './ChatMessage';
import { ChatMessage as ChatMessageType } from '@/lib/types';

describe('ChatMessage', () => {
  it('should render a user message with correct styling', () => {
    const message: ChatMessageType = {
      id: '1',
      role: 'user',
      content: 'What is the company vision?',
      timestamp: new Date().toISOString(),
    };
    
    render(<ChatMessage message={message} />);
    
    const element = screen.getByText('What is the company vision?');
    expect(element).toBeTruthy();
  });
  
  it('should render an assistant message with content', () => {
    const message: ChatMessageType = {
      id: '2',
      role: 'assistant',
      content: 'Our vision is to revolutionize the industry.',
      timestamp: new Date().toISOString(),
    };
    
    render(<ChatMessage message={message} />);
    
    const element = screen.getByText('Our vision is to revolutionize the industry.');
    expect(element).toBeTruthy();
  });
  
  it('should display citations for assistant messages', () => {
    const message: ChatMessageType = {
      id: '3',
      role: 'assistant',
      content: 'Our vision is to revolutionize the industry.',
      citations: [
        {
          type: 'url',
          reference: 'https://example.com/about',
          text: 'About page',
        },
        {
          type: 'interview',
          reference: 'vision',
          text: 'Vision interview',
        },
      ],
      timestamp: new Date().toISOString(),
    };
    
    render(<ChatMessage message={message} />);
    
    const element = screen.getByText('Sources:');
    expect(element).toBeTruthy();
    // Citations should be rendered (CitationBadge component handles the display)
  });
  
  it('should display "why this matters" section for assistant messages', () => {
    const message: ChatMessageType = {
      id: '4',
      role: 'assistant',
      content: 'Our vision is to revolutionize the industry.',
      whyItMatters: 'Understanding the vision helps you align your work with company goals.',
      timestamp: new Date().toISOString(),
    };
    
    render(<ChatMessage message={message} />);
    
    expect(screen.getByText('Why this matters')).toBeTruthy();
    expect(screen.getByText('Understanding the vision helps you align your work with company goals.')).toBeTruthy();
  });
  
  it('should display confidence score for assistant messages', () => {
    const message: ChatMessageType = {
      id: '5',
      role: 'assistant',
      content: 'Our vision is to revolutionize the industry.',
      confidence: {
        value: 0.85,
        reason: 'Based on founder interview',
      },
      timestamp: new Date().toISOString(),
    };
    
    render(<ChatMessage message={message} />);
    
    expect(screen.getByText('Confidence:')).toBeTruthy();
    // ConfidenceScore component handles the display
  });
  
  it('should display all features together for a complete assistant message', () => {
    const message: ChatMessageType = {
      id: '6',
      role: 'assistant',
      content: 'Our vision is to revolutionize the industry.',
      citations: [
        {
          type: 'url',
          reference: 'https://example.com/about',
        },
      ],
      whyItMatters: 'Understanding the vision helps you align your work with company goals.',
      confidence: {
        value: 0.9,
      },
      timestamp: new Date().toISOString(),
    };
    
    render(<ChatMessage message={message} />);
    
    expect(screen.getByText('Our vision is to revolutionize the industry.')).toBeTruthy();
    expect(screen.getByText('Sources:')).toBeTruthy();
    expect(screen.getByText('Why this matters')).toBeTruthy();
    expect(screen.getByText('Confidence:')).toBeTruthy();
  });
  
  it('should not display citations section when there are no citations', () => {
    const message: ChatMessageType = {
      id: '7',
      role: 'assistant',
      content: 'This information is not available in the context pack.',
      timestamp: new Date().toISOString(),
    };
    
    render(<ChatMessage message={message} />);
    
    expect(screen.queryByText('Sources:')).toBeNull();
  });
  
  it('should not display "why this matters" when not provided', () => {
    const message: ChatMessageType = {
      id: '8',
      role: 'assistant',
      content: 'Our vision is to revolutionize the industry.',
      timestamp: new Date().toISOString(),
    };
    
    render(<ChatMessage message={message} />);
    
    expect(screen.queryByText('Why this matters')).toBeNull();
  });
  
  it('should format timestamp correctly', () => {
    const timestamp = new Date('2024-01-15T14:30:00Z').toISOString();
    const message: ChatMessageType = {
      id: '9',
      role: 'user',
      content: 'Test message',
      timestamp,
    };
    
    render(<ChatMessage message={message} />);
    
    // Timestamp should be displayed (format depends on locale)
    const timeElements = screen.getAllByText(/\d+:\d+/);
    expect(timeElements.length).toBeGreaterThan(0);
  });
  
  it('should handle multiline content with proper whitespace', () => {
    const message: ChatMessageType = {
      id: '10',
      role: 'assistant',
      content: 'Line 1\nLine 2\nLine 3',
      timestamp: new Date().toISOString(),
    };
    
    const { container } = render(<ChatMessage message={message} />);
    
    // Check that the content is rendered with whitespace-pre-wrap class
    const paragraphElement = container.querySelector('p.whitespace-pre-wrap');
    expect(paragraphElement).toBeTruthy();
    expect(paragraphElement?.textContent).toContain('Line 1');
    expect(paragraphElement?.textContent).toContain('Line 2');
    expect(paragraphElement?.textContent).toContain('Line 3');
  });
});
