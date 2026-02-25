import { render, screen } from '@testing-library/react';
import Breadcrumb from '../Breadcrumb';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('Breadcrumb', () => {
  it('should render single breadcrumb item', () => {
    const items = [{ label: 'Home', href: '/' }];
    render(<Breadcrumb items={items} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('should render multiple breadcrumb items', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/plp' },
      { label: 'Shirts', href: '/plp?category=shirts' },
    ];
    render(<Breadcrumb items={items} />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Shirts')).toBeInTheDocument();
  });

  it('should render links with correct hrefs for non-last items', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/plp' },
      { label: 'Current' }, // Last item, no link
    ];
    render(<Breadcrumb items={items} />);
    
    const homeLink = screen.getByText('Home').closest('a');
    const productsLink = screen.getByText('Products').closest('a');
    
    expect(homeLink).toHaveAttribute('href', '/');
    expect(productsLink).toHaveAttribute('href', '/plp');
    
    // Last item should not be a link
    const currentLink = screen.getByText('Current').closest('a');
    expect(currentLink).toBeNull();
  });

  it('should render separators between items', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/plp' },
    ];
    const { container } = render(<Breadcrumb items={items} />);
    
    // Should have separator (/) between items
    const separators = container.querySelectorAll('[aria-hidden="true"]');
    expect(separators.length).toBe(1); // One separator between two items
    expect(separators[0].textContent).toBe('/');
  });

  it('should render last item without link', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Current Page' },
    ];
    render(<Breadcrumb items={items} />);
    
    const currentPage = screen.getByText('Current Page');
    expect(currentPage.closest('a')).toBeNull();
  });

  it('should handle empty items array', () => {
    const { container } = render(<Breadcrumb items={[]} />);
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });

  it('should apply aria label for accessibility', () => {
    const items = [{ label: 'Home', href: '/' }];
    const { container } = render(<Breadcrumb items={items} />);
    
    const nav = container.querySelector('nav');
    expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');
  });

  it('should style last item differently', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Current' },
    ];
    render(<Breadcrumb items={items} />);
    
    const currentItem = screen.getByText('Current');
    expect(currentItem).toHaveClass('text-gray-800');
  });
});
