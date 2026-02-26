export type CartItem = {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number;
  quantity: number;
  price: number;
  product_name: string;
  color: string;
  size: string;
  added_at: string;
  product: {
    id: number;
    name: string;
    category: string;
    price: number;
  };
  variant: {
    id: number;
    color: string;
    size: string;
    sku: string;
    stock: number;
  };
};

export async function fetchCart(userId: number): Promise<any> {
  const query = `
    query GetCart($userId: Int!) {
      cart(userId: $userId) {
        id
        userId
        status
        items {
          id
          orderId
          productId
          variantId
          quantity
          price
          productName
          color
          size
          addedAt
          product {
            id
            name
            category
            price
          }
          variant {
            id
            color
            size
            sku
            stock
          }
        }
      }
    }
  `;

  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { userId } }),
  });

  return response.json();
}

export async function addToCart(
  userId: number,
  productId: number,
  variantId: number,
  quantity: number = 1
): Promise<any> {
  const mutation = `
    mutation AddToCart($userId: Int!, $productId: Int!, $variantId: Int!, $quantity: Int!) {
      addToCart(userId: $userId, productId: $productId, variantId: $variantId, quantity: $quantity) {
        id
        quantity
      }
    }
  `;

  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: mutation,
      variables: { userId, productId, variantId, quantity },
    }),
  });

  return response.json();
}

export async function updateCartItem(userId: number, itemId: number, quantity: number): Promise<any> {
  const mutation = `
    mutation UpdateCartItem($userId: Int!, $itemId: Int!, $quantity: Int!) {
      updateCartItem(userId: $userId, itemId: $itemId, quantity: $quantity) {
        id
        quantity
      }
    }
  `;

  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: mutation, variables: { userId, itemId, quantity } }),
  });

  return response.json();
}

export async function removeFromCart(userId: number, itemId: number): Promise<any> {
  const mutation = `
    mutation RemoveFromCart($userId: Int!, $itemId: Int!) {
      removeFromCart(userId: $userId, itemId: $itemId)
    }
  `;

  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: mutation, variables: { userId, itemId } }),
  });

  return response.json();
}

export async function clearCart(userId: number): Promise<any> {
  const mutation = `
    mutation ClearCart($userId: Int!) {
      clearCart(userId: $userId)
    }
  `;

  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: mutation, variables: { userId } }),
  });

  return response.json();
}
