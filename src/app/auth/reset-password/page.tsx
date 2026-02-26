'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useLocalization } from '@/contexts/LocalizationContext';

export default function ResetPasswordPage() {
  const { t } = useLocalization();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError(t('auth.resetInvalidToken'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error || t('auth.resetFailed'));
        return;
      }

      setMessage(payload?.message || t('auth.resetSuccess'));
      setPassword('');
      setConfirmPassword('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form className="flex flex-col gap-4 items-left w-full max-w-md" onSubmit={handleSubmit}>
        <h1 className="text-2xl font-semibold text-gray-900">{t('auth.resetPasswordTitle')}</h1>
        <p className="text-sm text-gray-600">{t('auth.resetPasswordDescription')}</p>

        <Input
          id="reset-password"
          label={t('auth.password')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('auth.password')}
        />
        <Input
          id="reset-password-confirm"
          label={t('auth.confirmPassword')}
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t('auth.confirmPassword')}
        />

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-xl text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-xl text-sm">
            {message}
          </div>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('common.loading') : t('auth.resetPasswordButton')}
        </Button>

        <Link href="/auth/signin" className="text-sm text-gray-700 underline">
          {t('auth.backToSignIn')}
        </Link>
      </form>
    </div>
  );
}
