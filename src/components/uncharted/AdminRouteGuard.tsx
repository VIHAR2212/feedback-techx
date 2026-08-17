'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

// Identical behaviour to the original AdminRouteGuard — kept verbatim so
// the existing admin pages port without modification.
export default function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const { isAdmin, isLoading } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/admin/login');
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <p className="mb-4 text-sm">Checking admin access…</p>
          <div
            className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-foreground"
            aria-hidden
          />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm">Redirecting to admin login…</p>
      </div>
    );
  }

  return <>{children}</>;
}
