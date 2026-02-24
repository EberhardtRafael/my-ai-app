'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/Input';
import OrderSummary from '@/components/ui/OrderSummary';
import PageShell from '@/components/ui/PageShell';
import Toast from '@/components/ui/Toast';
import { useToast } from '@/components/ui/useToast';
import { useCart } from '@/contexts/CartContext';
import { type CartItem, fetchCart } from '@/utils/fetchCart';
import { checkoutCart } from '@/utils/fetchOrders';

export default function CheckoutPage() {
  const { data: session } = useSession();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { setCartItemsCount } = useCart();
  const toast = useToast();

  // Shipping form state
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');

  // Payment form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    loadCart();
  }, [session]);

  const loadCart = async () => {
    if (!session?.user?.id) return;

    const data = await fetchCart(parseInt(session.user.id, 10));
    const items = data?.data?.cart?.items || [];
    setCartItems(items);
    setLoading(false);
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(' ') : cleaned;
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const simulatePayment = async (): Promise<{ success: boolean; message: string }> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simple validation for demo
    const cardNum = cardNumber.replace(/\s/g, '');

    // Simulate failure for certain card numbers
    if (cardNum.startsWith('4000')) {
      return { success: false, message: 'Payment declined. Please try another card.' };
    }

    return { success: true, message: 'Payment processed successfully!' };
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate shipping info
    if (!fullName || !address || !city || !postalCode || !country || !phone) {
      toast.warning('Required Fields', 'Please fill in all shipping information');
      return;
    }

    // Validate payment info
    if (!cardNumber || !cardName || !expiryDate || !cvv) {
      toast.warning('Required Fields', 'Please fill in all payment information');
      return;
    }

    const cardNum = cardNumber.replace(/\s/g, '');
    if (cardNum.length !== 16) {
      toast.error('Invalid Card', 'Card number must be 16 digits');
      return;
    }

    if (cvv.length !== 3 && cvv.length !== 4) {
      toast.error('Invalid CVV', 'CVV must be 3 or 4 digits');
      return;
    }

    const [month, year] = expiryDate.split('/');
    if (!month || !year || parseInt(month, 10) < 1 || parseInt(month, 10) > 12) {
      toast.error('Invalid Expiry', 'Please enter a valid expiry date');
      return;
    }

    setProcessing(true);

    try {
      const result = await simulatePayment();

      if (result.success && session?.user?.id) {
        const userId = parseInt(session.user.id, 10);

        // Checkout the cart (converts cart order to pending order)
        await checkoutCart({
          userId,
          fullName,
          address,
          city,
          postalCode,
          country,
          phone,
          cardLast4: cardNumber.replace(/\s/g, '').slice(-4),
          subtotal,
          tax,
          shipping,
          total,
        });

        toast.success('Order Placed', 'Your order has been placed successfully!');
        setCartItems([]);
        setCartItemsCount(0);
      } else {
        toast.error('Payment Failed', result.message);
      }
    } catch (_error) {
      toast.error('Payment Error', 'An error occurred while processing your payment');
    } finally {
      setProcessing(false);
    }
  };

  if (cartItems.length === 0 && !loading && session?.user) {
    return (
      <PageShell title="Checkout" requireAuth isAuthenticated={!!session?.user} loading={loading}>
        <EmptyState
          title="Your cart is empty"
          message="Add items to your cart before checking out."
          actionLabel="Browse Products"
          actionHref="/plp"
        />
      </PageShell>
    );
  }

  const subtotal: number = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const shipping: number = 0; // Free shipping
  const tax: number = subtotal * 0.1; // 10% tax
  const total: number = subtotal + shipping + tax;

  return (
    <PageShell title="Checkout" requireAuth isAuthenticated={!!session?.user} loading={loading}>
      <form onSubmit={handlePlaceOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shipping Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card
              header={<h2 className="text-xl font-bold text-gray-800">Shipping Information</h2>}
            >
              <div className="space-y-4">
                <Input
                  id="fullName"
                  label="Full Name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />

                <Input
                  id="address"
                  label="Address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    id="city"
                    label="City"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />

                  <Input
                    id="postalCode"
                    label="Postal Code"
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    required
                  />
                </div>

                <Input
                  id="country"
                  label="Country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                />

                <Input
                  id="phone"
                  label="Phone Number"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </Card>

            <Card header={<h2 className="text-xl font-bold text-gray-800">Payment Information</h2>}>
              <div className="space-y-4">
                <Input
                  id="cardName"
                  label="Cardholder Name"
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="John Doe"
                  required
                />

                <Input
                  id="cardNumber"
                  label="Card Number"
                  type="text"
                  value={cardNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 16) {
                      setCardNumber(formatCardNumber(value));
                    }
                  }}
                  placeholder="1234 5678 9012 3456"
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    id="expiryDate"
                    label="Expiry Date"
                    type="text"
                    value={expiryDate}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 4) {
                        setExpiryDate(formatExpiryDate(value));
                      }
                    }}
                    placeholder="MM/YY"
                    required
                  />

                  <Input
                    id="cvv"
                    label="CVV"
                    type="text"
                    value={cvv}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 4) {
                        setCvv(value);
                      }
                    }}
                    placeholder="123"
                    required
                  />
                </div>

                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                  <p className="font-semibold mb-1">Test Cards:</p>
                  <p>• 4242 4242 4242 4242 - Success</p>
                  <p>• 4000 0000 0000 0000 - Declined</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card
              header={<h2 className="text-xl font-bold text-gray-800">Order Summary</h2>}
              footer={
                <Button type="submit" className="w-full" disabled={processing}>
                  {processing ? 'Processing...' : 'Place Order'}
                </Button>
              }
              className="sticky top-6"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.product.name} x {item.quantity}
                      </span>
                      <span className="text-gray-800">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-300 pt-2">
                  <OrderSummary subtotal={subtotal} shipping={shipping} tax={tax} />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </form>
      {toast.toasts.map((t) => (
        <Toast
          key={t.id}
          title={t.title}
          message={t.message}
          type={t.type}
          duration={t.duration}
          action={t.action}
          onClose={() => toast.removeToast(t.id)}
        />
      ))}
    </PageShell>
  );
}
