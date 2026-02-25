'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import type React from 'react';
import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Input from '@/components/ui/Input';

const LoginPage = () => {
  const signInText = 'Sign In';
  const [userName, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Clear URL error parameters on mount
  useEffect(() => {
    if (searchParams.get('error')) {
      router.replace('/auth/signin');
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    const result = await signIn('credentials', {
      userName: userName.trim(), // Trim spaces from username
      password,
      redirect: false, // Don't redirect automatically so we can handle errors
    });

    if (result?.error) {
      setError('Invalid username or password');
    } else if (result?.ok) {
      // Redirect on success
      window.location.href = '/';
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form className="flex flex-col gap-4 items-left" onSubmit={handleSubmit}>
        <Input
          id="username"
          label="Username"
          type="text"
          value={userName}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />
        <div className="relative">
          <Input
            id="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
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
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-xl text-sm">
            {error}
          </div>
        )}
        <Button type="submit">{signInText}</Button>
      </form>
    </div>
  );
};

export default LoginPage;
