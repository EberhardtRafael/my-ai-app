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
import { useLocalization } from '@/contexts/LocalizationContext';
import { formatCardNumber, formatExpiryDate, simulatePayment } from '@/utils/cardUtils';
import { type CartItem, fetchCart } from '@/utils/fetchCart';
import { getEffectiveUserId } from '@/utils/guestSessionClient';
import { checkoutCart } from '@/utils/fetchOrders';

export default function CheckoutPage() {
  const { t } = useLocalization();
  const { data: session } = useSession();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [effectiveUserId, setEffectiveUserId] = useState<string | null>(null);
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
    const resolveUserId = async () => {
      const userId = await getEffectiveUserId(session?.user?.id ?? null);
      setEffectiveUserId(userId);
    };

    resolveUserId();
  }, [session?.user?.id]);

  useEffect(() => {
    if (!effectiveUserId) {
      setLoading(false);
      return;
    }

    loadCart();
  }, [effectiveUserId]);

  const loadCart = async () => {
    if (!effectiveUserId) return;

    const data = await fetchCart(parseInt(effectiveUserId, 10));
    const items = data?.data?.cart?.items || [];
    setCartItems(items);
    setLoading(false);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate shipping info
    if (!fullName || !address || !city || !postalCode || !country || !phone) {
      toast.warning(t('checkout.requiredFieldsTitle'), t('checkout.requiredShippingMessage'));
      return;
    }

    // Validate payment info
    if (!cardNumber || !cardName || !expiryDate || !cvv) {
      toast.warning(t('checkout.requiredFieldsTitle'), t('checkout.requiredPaymentMessage'));
      return;
    }

    const cardNum = cardNumber.replace(/\s/g, '');
    if (cardNum.length !== 16) {
      toast.error(t('checkout.invalidCardTitle'), t('checkout.invalidCardMessage'));
      return;
    }

    if (cvv.length !== 3 && cvv.length !== 4) {
      toast.error(t('checkout.invalidCvvTitle'), t('checkout.invalidCvvMessage'));
      return;
    }

    const [month, year] = expiryDate.split('/');
    if (!month || !year || parseInt(month, 10) < 1 || parseInt(month, 10) > 12) {
      toast.error(t('checkout.invalidExpiryTitle'), t('checkout.invalidExpiryMessage'));
      return;
    }

    setProcessing(true);

    try {
      const result = await simulatePayment(cardNumber);

      if (result.success && effectiveUserId) {
        const userId = parseInt(effectiveUserId, 10);

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

        toast.success(t('checkout.orderPlacedTitle'), t('checkout.orderPlacedMessage'));
        setCartItems([]);
        setCartItemsCount(0);
      } else {
        toast.error(t('checkout.paymentFailedTitle'), result.message);
      }
    } catch (_error) {
      toast.error(t('checkout.paymentErrorTitle'), t('checkout.paymentErrorMessage'));
    } finally {
      setProcessing(false);
    }
  };

  const subtotal: number = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const shipping: number = 0; // Free shipping
  const tax: number = subtotal * 0.1; // 10% tax
  const total: number = subtotal + shipping + tax;

  const showEmptyState = cartItems.length === 0 && !loading;

  return (
    <PageShell
      title={t('checkout.title')}
      loading={loading}
    >
      {showEmptyState ? (
        <EmptyState
          title={t('checkout.emptyTitle')}
          message={t('checkout.emptyMessage')}
          actionLabel={t('checkout.browseProducts')}
          actionHref="/plp"
        />
      ) : (
        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Shipping Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card
                header={
                  <h2 className="text-xl font-bold text-gray-800">
                    {t('checkout.shippingInformation')}
                  </h2>
                }
              >
                <div className="space-y-4">
                  <Input
                    id="fullName"
                    label={t('checkout.fullName')}
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />

                  <Input
                    id="address"
                    label={t('checkout.address')}
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      id="city"
                      label={t('checkout.city')}
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />

                    <Input
                      id="postalCode"
                      label={t('checkout.postalCode')}
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      required
                    />
                  </div>

                  <Input
                    id="country"
                    label={t('checkout.country')}
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                  />

                  <Input
                    id="phone"
                    label={t('checkout.phone')}
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </Card>

              <Card
                header={
                  <h2 className="text-xl font-bold text-gray-800">
                    {t('checkout.paymentInformation')}
                  </h2>
                }
              >
                <div className="space-y-4">
                  <Input
                    id="cardName"
                    label={t('checkout.cardholderName')}
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder={t('checkout.cardholderNamePlaceholder')}
                    required
                  />

                  <Input
                    id="cardNumber"
                    label={t('checkout.cardNumber')}
                    type="text"
                    value={cardNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 16) {
                        setCardNumber(formatCardNumber(value));
                      }
                    }}
                    placeholder={t('checkout.cardNumberPlaceholder')}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      id="expiryDate"
                      label={t('checkout.expiryDate')}
                      type="text"
                      value={expiryDate}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 4) {
                          setExpiryDate(formatExpiryDate(value));
                        }
                      }}
                      placeholder={t('checkout.expiryDatePlaceholder')}
                      required
                    />

                    <Input
                      id="cvv"
                      label={t('checkout.cvv')}
                      type="text"
                      value={cvv}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 4) {
                          setCvv(value);
                        }
                      }}
                      placeholder={t('checkout.cvvPlaceholder')}
                      required
                    />
                  </div>

                  <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                    <p className="font-semibold mb-1">{t('checkout.testCardsTitle')}</p>
                    <p>{t('checkout.testCardSuccess')}</p>
                    <p>{t('checkout.testCardDeclined')}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card
                header={
                  <h2 className="text-xl font-bold text-gray-800">{t('checkout.orderSummary')}</h2>
                }
                footer={
                  <Button type="submit" className="w-full" disabled={processing}>
                    {processing ? t('checkout.processing') : t('checkout.placeOrder')}
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
      )}
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
