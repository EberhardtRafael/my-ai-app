'use client';

import Link from 'next/link';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useLocalization } from '@/contexts/LocalizationContext';

export default function ForgotPasswordPage() {
  const { t } = useLocalization();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resetLink, setResetLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setResetLink('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error || t('auth.forgotPasswordFailed'));
        return;
      }

      setMessage(payload?.message || t('auth.forgotPasswordSuccess'));
      if (payload?.resetLink) {
        setResetLink(payload.resetLink);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form className="flex flex-col gap-4 items-left w-full max-w-md" onSubmit={handleSubmit}>
        <h1 className="text-2xl font-semibold text-gray-900">{t('auth.forgotPasswordTitle')}</h1>
        <p className="text-sm text-gray-600">{t('auth.forgotPasswordDescription')}</p>

        <Input
          id="forgot-email"
          label={t('auth.email')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('auth.email')}
        />

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-xl text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-xl text-sm">
            {message}
            {resetLink && (
              <div className="mt-2">
                <Link href={resetLink} className="underline font-medium">
                  {t('auth.openResetLink')}
                </Link>
              </div>
            )}
          </div>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('common.loading') : t('auth.sendResetLink')}
        </Button>

        <Link href="/auth/signin" className="text-sm text-gray-700 underline">
          {t('auth.backToSignIn')}
        </Link>
      </form>
    </div>
  );
}
