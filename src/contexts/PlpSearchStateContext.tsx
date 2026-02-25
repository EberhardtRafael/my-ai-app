'use client';

import { createContext, useContext, useMemo, useState } from 'react';

type PlpSearchStateContextValue = {
  hasPendingSearch: boolean;
  setHasPendingSearch: (value: boolean) => void;
};

const PlpSearchStateContext = createContext<PlpSearchStateContextValue | undefined>(undefined);

export function PlpSearchStateProvider({ children }: { children: React.ReactNode }) {
  const [hasPendingSearch, setHasPendingSearch] = useState(false);

  const value = useMemo(() => ({ hasPendingSearch, setHasPendingSearch }), [hasPendingSearch]);

  return <PlpSearchStateContext.Provider value={value}>{children}</PlpSearchStateContext.Provider>;
}

export function usePlpSearchState() {
  const context = useContext(PlpSearchStateContext);
  if (!context) {
    throw new Error('usePlpSearchState must be used within PlpSearchStateProvider');
  }

  return context;
}
