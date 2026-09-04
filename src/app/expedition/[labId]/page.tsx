'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function LabProductsRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const labId = params?.labId as string;

  useEffect(() => {
    router.replace(labId ? `/labs/${labId}` : '/labs');
  }, [labId, router]);

  return null;
}
