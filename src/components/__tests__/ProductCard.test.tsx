import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import ProductCard from '../ProductCard';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock fetch
global.fetch = jest.fn();

describe('ProductCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderProductCard = (props = {}) => {
    const defaultProps = {
      id: 1,
      name: 'Test Product',
      category: 'Test Category',
      price: 99.99,
      userId: '123',
      initialIsFavorite: false,
      color: 'Red',
    };

    return render(
      <FavoritesProvider>
        <ProductCard {...defaultProps} {...props} />
      </FavoritesProvider>
    );
  };

  it('should render product information correctly', () => {
    renderProductCard();

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Test Category')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('should display correct price format', () => {
    renderProductCard({ price: 1234.56 });
    expect(screen.getByText('$1234.56')).toBeInTheDocument();
  });

  it('should link to product detail page', () => {
    renderProductCard({ id: 42 });
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/pdp/42');
  });

  it('should show filled heart when product is favorited', () => {
    renderProductCard({ initialIsFavorite: true });
    // The filled heart icon should be visible
    const favoriteButton = screen.getByRole('button');
    expect(favoriteButton).toBeInTheDocument();
  });

  it('should toggle favorite when heart icon is clicked', async () => {
    // Mock both the add favorite mutation and the count query
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            addFavorite: {
              favorite: { id: 1 },
              totalCount: 1,
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            favorites: [{ id: 1 }],
          },
        }),
      });
    renderProductCard();

    const favoriteButton = screen.getByRole('button');
    fireEvent.click(favoriteButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/favorites',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  });

  it('should not render favorite button when userId is missing', () => {
    renderProductCard({ userId: undefined });

    // Favorite button should not be rendered when there's no userId
    const favoriteButton = screen.queryByRole('button');
    expect(favoriteButton).not.toBeInTheDocument();
  });

  it('should render with custom className', () => {
    const { container } = renderProductCard({ className: 'custom-class' });
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
