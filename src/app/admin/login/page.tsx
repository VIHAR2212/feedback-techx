'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAdmin, isLoading: authLoading } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && isAdmin) {
      router.push('/admin/dashboard');
    }
  }, [isAdmin, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const success = await login(username, password);
      if (success) router.push('/admin/dashboard');
      else setError('Invalid credentials');
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm">Redirecting to dashboard…</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground">
      <div className="w-full max-w-sm rounded-md border-2 border-foreground p-6">
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Uncharted Expedition
        </p>
        <h1 className="mt-1 text-center text-xl font-semibold">Admin Login</h1>
        {error && (
          <p className="mt-3 rounded border border-dashed border-foreground/40 bg-muted/30 p-2 text-center text-xs">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
              className="rounded border border-foreground/30 bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
              placeholder="vcet-nsdc"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="rounded border border-foreground/30 bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
              placeholder="••••••••"
            />
          </label>
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 rounded border-2 border-foreground bg-foreground px-4 py-2 text-sm text-background hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? 'Logging in…' : 'Login'}
          </button>
        </form>
        <p className="mt-4 text-center text-[10px] text-muted-foreground">
          Default: <span className="font-mono">vcet-nsdc</span> / <span className="font-mono">AIDS@2025</span>
        </p>
      </div>
    </main>
  );
}
