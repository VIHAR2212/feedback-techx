'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { DEPARTMENT_OPTIONS } from '@/lib/mock-data';
import { isExpeditionComplete } from '@/lib/expedition-storage';

// Landing page — skeleton form for the Uncharted expedition.
// Asks for Name + Department + Email. Mirrors the original Minecraft
// landing page exactly (so the UserContext shape doesn't change), just
// with Uncharted wording. No portal animation yet.
export default function LandingPage() {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { user, login, logout, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && user) {
      if (isExpeditionComplete(user.email)) {
        router.push('/finish');
      } else {
        router.push('/expedition');
      }
    }
  }, [user, isLoading, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !department) {
      alert('Please fill in all details, including department.');
      return;
    }
    setSubmitting(true);
    login({ name, department, email });
    const complete = isExpeditionComplete(email);
    setTimeout(() => {
      if (complete) {
        router.push('/finish');
      } else {
        router.push('/expedition');
      }
    }, 250);
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm">Loading…</p>
      </main>
    );
  }

  if (user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        <div className="w-full max-w-md rounded-md border-2 border-foreground p-6">
          <h1 className="text-center text-xl font-semibold">Welcome back, explorer</h1>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            You are signed in as <span className="font-mono">{user.name}</span> ({user.email})
          </p>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Department: <span className="font-mono">{user.department}</span>
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => {
                if (isExpeditionComplete(user.email)) router.push('/finish');
                else router.push('/expedition');
              }}
              className="rounded border-2 border-foreground bg-foreground px-4 py-2 text-xs text-background hover:opacity-90"
            >
              Continue Expedition
            </button>
            <button
              onClick={() => router.push('/leaderboard')}
              className="rounded border border-foreground/40 px-4 py-2 text-xs hover:bg-muted"
            >
              Expedition Rankings
            </button>
            <button
              onClick={logout}
              className="rounded border border-foreground/40 px-4 py-2 text-xs text-muted-foreground hover:bg-muted"
            >
              Logout
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-md rounded-md border-2 border-foreground p-6">
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Uncharted Expedition
        </p>
        <h1 className="mt-1 text-center text-2xl font-semibold">Begin your expedition</h1>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Enter your details to receive your expedition credentials.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded border border-foreground/30 bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
              placeholder="Explorer name"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Department</span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
              className="rounded border border-foreground/30 bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
            >
              <option value="" disabled>
                Select department
              </option>
              {DEPARTMENT_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded border border-foreground/30 bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
              placeholder="you@expedition.org"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded border-2 border-foreground bg-foreground px-4 py-2 text-sm text-background hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Preparing…' : 'Begin Expedition'}
          </button>
        </form>
      </div>
    </main>
  );
}
