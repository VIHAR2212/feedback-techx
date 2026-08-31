'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import RouteSelection from '@/components/RouteSelection';

export default function LabsPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  // Redirect to home if user is not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  return (
    <main>
      <RouteSelection />
    </main>
  );
}
