'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import type React from 'react';
import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Input from '@/components/ui/Input';
import { useLocalization } from '@/contexts/LocalizationContext';

const LoginPage = () => {
  const { t } = useLocalization();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [userName, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [devAccessCode, setDevAccessCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Clear URL error parameters on mount
  useEffect(() => {
    if (searchParams.get('error')) {
      router.replace('/auth/signin');
    }
  }, [searchParams, router]);

  const handleSignIn = async () => {
    const result = await signIn('credentials', {
      userName: userName.trim(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(t('auth.invalidCredentials'));
      return;
    }

    if (result?.ok) {
      window.location.href = '/';
    }
  };

  const handleSignUp = async () => {
    if (!userName.trim() || !email.trim() || !password || !confirmPassword) {
      setError(t('auth.requiredFields'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: userName.trim(),
        email: email.trim(),
        password,
        devAccessCode: devAccessCode.trim(),
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload?.error || t('auth.signUpFailed'));
      return;
    }

    setSuccess(t('auth.signUpSuccess'));
    await handleSignIn();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        await handleSignUp();
      } else {
        await handleSignIn();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueAsGuest = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/guest-session', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        setError(t('auth.continueAsGuestFailed'));
        return;
      }

      router.push('/plp');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form className="flex flex-col gap-4 items-left w-full max-w-md" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-2 bg-gray-100 rounded-xl p-1">
          <Button
            type="button"
            variant={mode === 'signin' ? 'primary' : 'secondary'}
            onClick={() => {
              setMode('signin');
              setError('');
              setSuccess('');
            }}
          >
            {t('auth.signIn')}
          </Button>
          <Button
            type="button"
            variant={mode === 'signup' ? 'primary' : 'secondary'}
            onClick={() => {
              setMode('signup');
              setError('');
              setSuccess('');
            }}
          >
            {t('auth.signUp')}
          </Button>
        </div>

        <Input
          id="username"
          label={t('auth.username')}
          type="text"
          value={userName}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t('auth.username')}
        />

        {mode === 'signup' && (
          <Input
            id="email"
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.email')}
          />
        )}

        <div className="relative">
          <Input
            id="password"
            label={t('auth.password')}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.password')}
            className="pr-10"
          />
          <Button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            variant="ghost"
            className="absolute right-2 top-[60%] -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
          >
            <Icon name={showPassword ? 'eye-open' : 'eye-closed'} size={20} />
          </Button>
        </div>

        {mode === 'signup' && (
          <Input
            id="confirm-password"
            label={t('auth.confirmPassword')}
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t('auth.confirmPassword')}
          />
        )}

        {mode === 'signup' && (
          <Input
            id="dev-access-code"
            label={t('auth.devAccessCode')}
            type="text"
            value={devAccessCode}
            onChange={(e) => setDevAccessCode(e.target.value)}
            placeholder={t('auth.devAccessCodePlaceholder')}
          />
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-xl text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-xl text-sm">
            {success}
          </div>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t('common.loading')
            : mode === 'signup'
              ? t('auth.createAccount')
              : t('auth.signIn')}
        </Button>

        {mode === 'signin' && (
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              onClick={() => signIn('github', { callbackUrl: '/' })}
            >
              {t('auth.signInWithGithub')}
            </Button>

            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              onClick={handleContinueAsGuest}
            >
              {t('auth.continueAsGuest')}
            </Button>

            <Link href="/auth/forgot-password" className="text-sm text-gray-700 underline text-center">
              {t('auth.forgotPassword')}
            </Link>
          </>
        )}
      </form>
    </div>
  );
};

export default LoginPage;
