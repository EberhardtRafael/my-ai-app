'use client';

import { createContext, type ReactNode, useContext, useState } from 'react';

type CartContextType = {
  cartItemsCount: number;
  setCartItemsCount: (count: number) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItemsCount, setCartItemsCount] = useState(0);

  return (
    <CartContext.Provider value={{ cartItemsCount, setCartItemsCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
