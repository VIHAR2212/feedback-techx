'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import FinalCertificate from '@/components/FinalCertificate';

export default function FinishPage() {
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0d0a08' }}>
      <FinalCertificate />
    </main>
  );
}
