'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import LabMapView from '@/components/LabMapView';

export default function LabProductsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const labId = (params.labId as string) || 'a';

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0d0a08' }}>
      <LabMapView labId={labId} />
    </main>
  );
}