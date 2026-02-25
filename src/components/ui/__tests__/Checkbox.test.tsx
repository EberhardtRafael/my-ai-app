import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Checkbox from '../Checkbox';

describe('Checkbox', () => {
  const defaultProps = {
    id: 'test-checkbox',
    checked: false,
    onCheckedChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render checkbox button', () => {
    render(<Checkbox {...defaultProps} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('should apply checked state', () => {
    render(<Checkbox {...defaultProps} checked={true} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
  });

  it('should apply unchecked state', () => {
    render(<Checkbox {...defaultProps} checked={false} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });

  it('should call onCheckedChange when clicked', async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();
    render(<Checkbox {...defaultProps} onCheckedChange={onCheckedChange} />);
    
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('should toggle from checked to unchecked', async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();
    render(<Checkbox {...defaultProps} checked={true} onCheckedChange={onCheckedChange} />);
    
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it('should apply custom className', () => {
    render(<Checkbox {...defaultProps} className="custom-class" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('custom-class');
  });

  it('should merge default and custom classes', () => {
    render(<Checkbox {...defaultProps} className="custom-class" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('custom-class');
    // Should also have default styling classes
    expect(checkbox.className).toContain('inline-flex');
  });

  it('should display checkmark when checked', () => {
    const { container } = render(<Checkbox {...defaultProps} checked={true} />);
    // Checkmark is the inner span with rotate-45 class
    const checkmark = container.querySelector('.rotate-45');
    expect(checkmark).toBeInTheDocument();
    expect(checkmark).toHaveClass('opacity-100');
  });

  it('should be keyboard accessible', async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();
    render(<Checkbox {...defaultProps} onCheckedChange={onCheckedChange} />);
    
    const checkbox = screen.getByRole('checkbox');
    checkbox.focus();
    expect(checkbox).toHaveFocus();
    
    // Should activate on Enter key
    await user.keyboard('{Enter}');
    expect(onCheckedChange).toHaveBeenCalled();
  });
});
