import { renderHook, act } from '@testing-library/react';
import { PlpSearchStateProvider, usePlpSearchState } from '../PlpSearchStateContext';

describe('PlpSearchStateContext', () => {
  it('should provide default state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PlpSearchStateProvider>{children}</PlpSearchStateProvider>
    );

    const { result } = renderHook(() => usePlpSearchState(), { wrapper });

    expect(result.current.hasPendingSearch).toBe(false);
    expect(typeof result.current.setHasPendingSearch).toBe('function');
  });

  it('should update pending search state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PlpSearchStateProvider>{children}</PlpSearchStateProvider>
    );

    const { result } = renderHook(() => usePlpSearchState(), { wrapper });

    act(() => {
      result.current.setHasPendingSearch(true);
    });

    expect(result.current.hasPendingSearch).toBe(true);
  });

  it('should toggle pending search state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PlpSearchStateProvider>{children}</PlpSearchStateProvider>
    );

    const { result } = renderHook(() => usePlpSearchState(), { wrapper });

    act(() => {
      result.current.setHasPendingSearch(true);
    });
    expect(result.current.hasPendingSearch).toBe(true);

    act(() => {
      result.current.setHasPendingSearch(false);
    });
    expect(result.current.hasPendingSearch).toBe(false);
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      renderHook(() => usePlpSearchState());
    }).toThrow('usePlpSearchState must be used within PlpSearchStateProvider');

    console.error = originalError;
  });

  it('should update state value', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PlpSearchStateProvider>{children}</PlpSearchStateProvider>
    );

    const { result, rerender } = renderHook(() => usePlpSearchState(), { wrapper });

    act(() => {
      result.current.setHasPendingSearch(true);
    });

    expect(result.current.hasPendingSearch).toBe(true);
    
    act(() => {
      result.current.setHasPendingSearch(false);
    });
    
    expect(result.current.hasPendingSearch).toBe(false);
  });

  it('should maintain stable function reference', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PlpSearchStateProvider>{children}</PlpSearchStateProvider>
    );

    const { result, rerender } = renderHook(() => usePlpSearchState(), { wrapper });
    const initialSetter = result.current.setHasPendingSearch;

    // Trigger re-render
    act(() => {
      result.current.setHasPendingSearch(true);
    });
    rerender();

    // Function reference should remain the same
    expect(result.current.setHasPendingSearch).toBe(initialSetter);
  });
});
