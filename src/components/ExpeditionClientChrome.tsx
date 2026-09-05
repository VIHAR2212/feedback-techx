'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import VolumeControl from '@/components/VolumeControl';
import CompletionChecker from '@/components/CompletionChecker';
import ExpeditionBottomDock from '@/components/ExpeditionBottomDock';
import FlyingCoinsOverlay from '@/components/FlyingCoinsOverlay';

export default function ExpeditionClientChrome() {
  const pathname = usePathname();

  // If navigating admin routes or API routes, don't mount decorative expedition components
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <VolumeControl />
      <CompletionChecker />
      <ExpeditionBottomDock />
      <FlyingCoinsOverlay />
    </>
  );
}
