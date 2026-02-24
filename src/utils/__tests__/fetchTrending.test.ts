import { fetchTrending } from '../fetchTrending';

// Mock fetch globally
global.fetch = jest.fn();

describe('fetchTrending', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch trending products with default parameters', async () => {
    const mockProducts = [
      {
        id: 1,
        name: 'Trending Product 1',
        category: 'electronics',
        price: 99.99,
        variants: [{ id: 1, sku: 'TEST-001', color: 'black', size: 'M', stock: 10 }],
      },
      {
        id: 2,
        name: 'Trending Product 2',
        category: 'clothing',
        price: 49.99,
        variants: [{ id: 2, sku: 'TEST-002', color: 'white', size: 'L', stock: 5 }],
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          trending: mockProducts,
        },
      }),
    });

    const result = await fetchTrending();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    expect(callArgs[0]).toBe('/api/products');
    expect(callArgs[1].method).toBe('POST');
    expect(callArgs[1].headers).toEqual({ 'Content-Type': 'application/json' });
    
    const body = JSON.parse(callArgs[1].body);
    expect(body.query).toContain('trending');
    expect(body.variables).toEqual({ hours: 48, limit: 10 });

    expect(result).toEqual(mockProducts);
  });

  it('should fetch trending products with custom parameters', async () => {
    const mockProducts = [
      {
        id: 3,
        name: 'Hot Product',
        category: 'accessories',
        price: 29.99,
        variants: [],
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          trending: mockProducts,
        },
      }),
    });

    const result = await fetchTrending(24, 5);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    expect(callArgs[0]).toBe('/api/products');
    expect(callArgs[1].method).toBe('POST');
    
    const body = JSON.parse(callArgs[1].body);
    expect(body.query).toContain('trending');
    expect(body.variables).toEqual({ hours: 24, limit: 5 });

    expect(result).toEqual(mockProducts);
  });

  it('should handle empty trending products', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          trending: [],
        },
      }),
    });

    const result = await fetchTrending();

    expect(result).toEqual([]);
  });

  it('should throw error when fetch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
    });

    await expect(fetchTrending()).rejects.toThrow('Failed to fetch trending products: Internal Server Error');
  });

  it('should throw error when GraphQL returns errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        error: 'GraphQL error occurred',
      }),
    });

    await expect(fetchTrending()).rejects.toThrow('GraphQL error occurred');
  });

  it('should handle network errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchTrending()).rejects.toThrow('Network error');
  });
});
