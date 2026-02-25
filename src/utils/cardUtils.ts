export function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\s/g, '');
  const chunks = cleaned.match(/.{1,4}/g);
  return chunks ? chunks.join(' ') : cleaned;
}

export function formatExpiryDate(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length >= 2) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
  }
  return cleaned;
}

export async function simulatePayment(
  cardNumber: string
): Promise<{ success: boolean; message: string }> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Simple validation for demo
  const cardNum = cardNumber.replace(/\s/g, '');

  // Simulate failure for certain card numbers
  if (cardNum.startsWith('4000')) {
    return { success: false, message: 'Payment declined. Please try another card.' };
  }

  return { success: true, message: 'Payment processed successfully!' };
}
