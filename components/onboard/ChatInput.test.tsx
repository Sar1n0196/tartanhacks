import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatInput from './ChatInput';

describe('ChatInput', () => {
  it('renders text input and submit button', () => {
    const onSubmit = vi.fn();
    render(<ChatInput onSubmit={onSubmit} />);
    
    expect(screen.getByPlaceholderText(/ask a question/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /send message/i })).toBeTruthy();
  });

  it('calls onSubmit with message when form is submitted', () => {
    const onSubmit = vi.fn();
    render(<ChatInput onSubmit={onSubmit} />);
    
    const input = screen.getByPlaceholderText(/ask a question/i);
    fireEvent.change(input, { target: { value: 'What is the company vision?' } });
    
    const submitButton = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(submitButton);
    
    expect(onSubmit).toHaveBeenCalledWith('What is the company vision?');
  });

  it('clears input after submission', () => {
    const onSubmit = vi.fn();
    render(<ChatInput onSubmit={onSubmit} />);
    
    const input = screen.getByPlaceholderText(/ask a question/i) as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'Test message' } });
    
    const submitButton = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(submitButton);
    
    expect(input.value).toBe('');
  });

  it('does not submit empty or whitespace-only messages', () => {
    const onSubmit = vi.fn();
    render(<ChatInput onSubmit={onSubmit} />);
    
    const input = screen.getByPlaceholderText(/ask a question/i);
    const submitButton = screen.getByRole('button', { name: /send message/i });
    
    // Try submitting empty
    fireEvent.click(submitButton);
    expect(onSubmit).not.toHaveBeenCalled();
    
    // Try submitting whitespace
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(submitButton);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits on Enter key press', () => {
    const onSubmit = vi.fn();
    render(<ChatInput onSubmit={onSubmit} />);
    
    const input = screen.getByPlaceholderText(/ask a question/i);
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });
    
    expect(onSubmit).toHaveBeenCalledWith('Test message');
  });

  it('does not submit on Shift+Enter (allows new line)', () => {
    const onSubmit = vi.fn();
    render(<ChatInput onSubmit={onSubmit} />);
    
    const input = screen.getByPlaceholderText(/ask a question/i);
    fireEvent.change(input, { target: { value: 'Line 1' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables input and button when isLoading is true', () => {
    const onSubmit = vi.fn();
    render(<ChatInput onSubmit={onSubmit} isLoading={true} />);
    
    const input = screen.getByPlaceholderText(/ask a question/i) as HTMLTextAreaElement;
    const submitButton = screen.getByRole('button', { name: /send message/i }) as HTMLButtonElement;
    
    expect(input.disabled).toBe(true);
    expect(submitButton.disabled).toBe(true);
  });

  it('shows loading spinner when isLoading is true', () => {
    const onSubmit = vi.fn();
    render(<ChatInput onSubmit={onSubmit} isLoading={true} />);
    
    // Check for loading spinner (has animate-spin class)
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('shows "Generating response..." text when isLoading is true', () => {
    const onSubmit = vi.fn();
    render(<ChatInput onSubmit={onSubmit} isLoading={true} />);
    
    expect(screen.getByText(/generating response/i)).toBeTruthy();
  });

  it('disables input and button when disabled prop is true', () => {
    const onSubmit = vi.fn();
    render(<ChatInput onSubmit={onSubmit} disabled={true} />);
    
    const input = screen.getByPlaceholderText(/ask a question/i) as HTMLTextAreaElement;
    const submitButton = screen.getByRole('button', { name: /send message/i }) as HTMLButtonElement;
    
    expect(input.disabled).toBe(true);
    expect(submitButton.disabled).toBe(true);
  });

  it('uses custom placeholder when provided', () => {
    const onSubmit = vi.fn();
    render(<ChatInput onSubmit={onSubmit} placeholder="Custom placeholder" />);
    
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeTruthy();
  });

  it('shows character count when typing', () => {
    const onSubmit = vi.fn();
    render(<ChatInput onSubmit={onSubmit} />);
    
    const input = screen.getByPlaceholderText(/ask a question/i);
    fireEvent.change(input, { target: { value: 'Hello' } });
    
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('disables submit button when input is empty', () => {
    const onSubmit = vi.fn();
    render(<ChatInput onSubmit={onSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /send message/i }) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);
  });

  it('enables submit button when input has text', () => {
    const onSubmit = vi.fn();
    render(<ChatInput onSubmit={onSubmit} />);
    
    const input = screen.getByPlaceholderText(/ask a question/i);
    const submitButton = screen.getByRole('button', { name: /send message/i }) as HTMLButtonElement;
    
    expect(submitButton.disabled).toBe(true);
    
    fireEvent.change(input, { target: { value: 'Test' } });
    
    expect(submitButton.disabled).toBe(false);
  });

  it('trims whitespace from submitted message', () => {
    const onSubmit = vi.fn();
    render(<ChatInput onSubmit={onSubmit} />);
    
    const input = screen.getByPlaceholderText(/ask a question/i);
    fireEvent.change(input, { target: { value: '  Test message  ' } });
    
    const submitButton = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(submitButton);
    
    expect(onSubmit).toHaveBeenCalledWith('Test message');
  });
});
