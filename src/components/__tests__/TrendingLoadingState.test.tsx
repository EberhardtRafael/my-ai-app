import { render, screen } from '@testing-library/react';
import TrendingLoadingState from '../TrendingLoadingState';

describe('TrendingLoadingState', () => {
  it('should render section title', () => {
    render(<TrendingLoadingState hours={48} />);
    expect(screen.getByText('Trending Now')).toBeInTheDocument();
  });

  it('should render subtitle with hours parameter', () => {
    render(<TrendingLoadingState hours={24} />);
    expect(screen.getByText('Popular items in the last 24 hours')).toBeInTheDocument();
  });

  it('should render subtitle with different hours', () => {
    render(<TrendingLoadingState hours={72} />);
    expect(screen.getByText('Popular items in the last 72 hours')).toBeInTheDocument();
  });

  it('should render spinner', () => {
    const { container } = render(<TrendingLoadingState hours={48} />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should render as a section element', () => {
    const { container } = render(<TrendingLoadingState hours={48} />);
    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
  });

  it('should have consistent padding', () => {
    const { container } = render(<TrendingLoadingState hours={48} />);
    const section = container.firstChild as HTMLElement;
    expect(section).toHaveClass('py-8');
  });
});
