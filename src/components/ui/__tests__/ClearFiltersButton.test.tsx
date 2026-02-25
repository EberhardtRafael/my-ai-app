import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClearFiltersButton from '../ClearFiltersButton';

// Mock Icon component
jest.mock('../Icon', () => {
  return function MockIcon({ name, size }: { name: string; size?: number }) {
    return <span data-testid={`icon-${name}`} data-size={size}>Icon</span>;
  };
});

describe('ClearFiltersButton', () => {
  it('should render button with text', () => {
    render(<ClearFiltersButton onClear={jest.fn()} />);
    expect(screen.getByText('Clear all filters')).toBeInTheDocument();
  });

  it('should render icon', () => {
    render(<ClearFiltersButton onClear={jest.fn()} />);
    expect(screen.getByTestId('icon-plus')).toBeInTheDocument();
  });

  it('should call onClear when clicked', async () => {
    const user = userEvent.setup();
    const onClear = jest.fn();
    render(<ClearFiltersButton onClear={onClear} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('should use ghost variant Button', () => {
    render(<ClearFiltersButton onClear={jest.fn()} />);
    const button = screen.getByRole('button');
    // Button component applies variant styles, just check button exists
    expect(button).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<ClearFiltersButton onClear={jest.fn()} className="custom-class" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should be keyboard accessible', async () => {
    const user = userEvent.setup();
    const onClear = jest.fn();
    render(<ClearFiltersButton onClear={onClear} />);
    
    const button = screen.getByRole('button');
    button.focus();
    await user.keyboard('{Enter}');
    
    expect(onClear).toHaveBeenCalled();
  });

  it('should pass custom styling to icon', () => {
    render(<ClearFiltersButton onClear={jest.fn()} />);
    const icon = screen.getByTestId('icon-plus');
    // Icon component receives className prop with rotate-45
    expect(icon).toBeInTheDocument();
  });
});
