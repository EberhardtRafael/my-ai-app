export type OrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number;
  quantity: number;
  price: number;
  product_name: string;
  color: string;
  size: string;
};

export type Order = {
  id: number;
  user_id: number;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  full_name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  phone: string;
  card_last4: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
};

export async function fetchOrders(userId: number): Promise<any> {
  const query = `
    query GetOrders($userId: Int!) {
      orders(userId: $userId) {
        id
        userId
        status
        total
        subtotal
        tax
        shipping
        fullName
        address
        city
        postalCode
        country
        phone
        cardLast4
        createdAt
        updatedAt
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
        }
      }
    }
  `;

  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { userId } }),
  });

  return response.json();
}

export async function fetchOrder(orderId: number): Promise<any> {
  const query = `
    query GetOrder($orderId: Int!) {
      order(orderId: $orderId) {
        id
        userId
        status
        total
        subtotal
        tax
        shipping
        fullName
        address
        city
        postalCode
        country
        phone
        cardLast4
        createdAt
        updatedAt
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
        }
      }
    }
  `;

  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { orderId } }),
  });

  return response.json();
}

export async function checkoutCart(checkoutData: {
  userId: number;
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  cardLast4: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}): Promise<any> {
  const mutation = `
    mutation CheckoutCart(
      $userId: Int!
      $fullName: String!
      $address: String!
      $city: String!
      $postalCode: String!
      $country: String!
      $phone: String!
      $cardLast4: String!
      $subtotal: Float!
      $tax: Float!
      $shipping: Float!
      $total: Float!
    ) {
      checkoutCart(
        userId: $userId
        fullName: $fullName
        address: $address
        city: $city
        postalCode: $postalCode
        country: $country
        phone: $phone
        cardLast4: $cardLast4
        subtotal: $subtotal
        tax: $tax
        shipping: $shipping
        total: $total
      ) {
        id
        userId
        status
        total
        createdAt
      }
    }
  `;

  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: mutation, variables: checkoutData }),
  });

  return response.json();
}

export async function createOrder(orderData: {
  userId: number;
  cartItems: any[];
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  cardLast4: string;
}): Promise<any> {
  const mutation = `
    mutation CreateOrder(
      $userId: Int!
      $cartItems: String!
      $total: Float!
      $subtotal: Float!
      $tax: Float!
      $shipping: Float!
      $fullName: String!
      $address: String!
      $city: String!
      $postalCode: String!
      $country: String!
      $phone: String!
      $cardLast4: String!
    ) {
      createOrder(
        userId: $userId
        cartItems: $cartItems
        total: $total
        subtotal: $subtotal
        tax: $tax
        shipping: $shipping
        fullName: $fullName
        address: $address
        city: $city
        postalCode: $postalCode
        country: $country
        phone: $phone
        cardLast4: $cardLast4
      ) {
        id
        userId
        status
        total
        createdAt
      }
    }
  `;

  const variables = {
    ...orderData,
    cartItems: JSON.stringify(orderData.cartItems),
  };

  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: mutation, variables }),
  });

  return response.json();
}
