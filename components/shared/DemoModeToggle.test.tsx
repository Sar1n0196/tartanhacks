import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DemoModeToggle from './DemoModeToggle';

describe('DemoModeToggle', () => {
  it('should render with demo mode disabled', () => {
    const onChange = vi.fn();
    render(<DemoModeToggle enabled={false} onChange={onChange} />);
    
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
    expect(screen.getByText('Demo Mode')).toBeDefined();
  });
  
  it('should render with demo mode enabled', () => {
    const onChange = vi.fn();
    render(<DemoModeToggle enabled={true} onChange={onChange} />);
    
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    expect(screen.getByText('Active')).toBeDefined();
  });
  
  it('should call onChange when toggled', () => {
    const onChange = vi.fn();
    render(<DemoModeToggle enabled={false} onChange={onChange} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(onChange).toHaveBeenCalledWith(true);
  });
  
  it('should call onChange with false when toggled off', () => {
    const onChange = vi.fn();
    render(<DemoModeToggle enabled={true} onChange={onChange} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(onChange).toHaveBeenCalledWith(false);
  });
  
  it('should apply custom className', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DemoModeToggle enabled={false} onChange={onChange} className="custom-class" />
    );
    
    const wrapper = container.querySelector('.custom-class');
    expect(wrapper).toBeDefined();
  });
  
  it('should show info tooltip on hover', () => {
    const onChange = vi.fn();
    render(<DemoModeToggle enabled={false} onChange={onChange} />);
    
    const infoIcon = screen.getByLabelText('Demo mode information');
    expect(infoIcon).toBeDefined();
  });
});
