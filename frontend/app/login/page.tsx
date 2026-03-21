'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/AuthForm';

export default function LoginPage() {
  const router = useRouter();

  async function handleLogin({ email, password }: { email: string; password: string }) {
    const res = await signIn('credentials', { email, password, redirect: false });
    if (res?.error) return { error: 'Invalid email or password' };
    router.push('/lobby');
    return {};
  }

  return <AuthForm mode="login" onSubmit={handleLogin} />;
}
