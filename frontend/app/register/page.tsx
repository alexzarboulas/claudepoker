'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/AuthForm';

export default function RegisterPage() {
  const router = useRouter();

  async function handleRegister({ username, email, password }: { username?: string; email: string; password: string }) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      return { error: data.error ?? 'Registration failed' };
    }
    // Auto sign in after register
    await signIn('credentials', { email, password, redirect: false });
    router.push('/lobby');
    return {};
  }

  return <AuthForm mode="register" onSubmit={handleRegister} />;
}
