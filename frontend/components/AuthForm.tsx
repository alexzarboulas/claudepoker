'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import styles from './AuthForm.module.css';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (data: { username?: string; email: string; password: string }) => Promise<{ error?: string }>;
}

export default function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await onSubmit({ username: mode === 'register' ? username : undefined, email, password });
      if (result?.error) setError(result.error);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.logo}>♠ PokerIQ</div>
        <h1 className={styles.title}>{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === 'register' && (
            <div className={styles.field}>
              <label className={styles.label}>Username</label>
              <input
                className={styles.input}
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="your_handle"
                required
                minLength={3}
                maxLength={20}
              />
            </div>
          )}
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <p className={styles.switchLink}>
          {mode === 'login' ? (
            <>Don&apos;t have an account? <Link href="/register">Register</Link></>
          ) : (
            <>Already have an account? <Link href="/login">Sign in</Link></>
          )}
        </p>
      </div>
    </div>
  );
}
