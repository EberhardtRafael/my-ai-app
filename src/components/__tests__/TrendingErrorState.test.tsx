import { render, screen } from '@testing-library/react';
import TrendingErrorState from '../TrendingErrorState';

describe('TrendingErrorState', () => {
  it('should render section title', () => {
    render(<TrendingErrorState hours={48} error="Error message" />);
    expect(screen.getByText('Trending Now')).toBeInTheDocument();
  });

  it('should render subtitle with hours parameter', () => {
    render(<TrendingErrorState hours={24} error="Error message" />);
    expect(screen.getByText('Popular items in the last 24 hours')).toBeInTheDocument();
  });

  it('should render error message', () => {
    render(<TrendingErrorState hours={48} error="Failed to load trending products" />);
    expect(screen.getByText('Failed to load trending products')).toBeInTheDocument();
  });

  it('should display error message with correct styling', () => {
    const { container } = render(
      <TrendingErrorState hours={48} error="Network error occurred" />
    );
    const errorDiv = screen.getByText('Network error occurred');
    expect(errorDiv).toHaveClass('text-red-600');
  });

  it('should render as a section element', () => {
    const { container } = render(<TrendingErrorState hours={48} error="Error" />);
    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
  });

  it('should have consistent padding', () => {
    const { container } = render(<TrendingErrorState hours={48} error="Error" />);
    const section = container.firstChild as HTMLElement;
    expect(section).toHaveClass('py-8');
  });
});
