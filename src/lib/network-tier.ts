// Network tier detection utility for adaptive loading
// Distinguishes network capability from device capability.

export type NetworkTier = 'fast' | 'moderate' | 'slow';
export type DeviceTier = 'high' | 'medium' | 'low';

export function isSaveDataEnabled(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & {
    connection?: {
      saveData?: boolean;
    };
  };
  return Boolean(nav.connection?.saveData);
}

export function getNetworkTier(): NetworkTier {
  if (typeof navigator === 'undefined') {
    return 'moderate';
  }

  const nav = navigator as Navigator & {
    connection?: {
      effectiveType?: string;
      saveData?: boolean;
      downlink?: number;
      rtt?: number;
    };
  };

  const connection = nav.connection;

  // 1. Data-saver takes precedence
  if (connection?.saveData) {
    return 'slow';
  }

  const effectiveType = connection?.effectiveType;

  // 2. Slow network types
  if (
    effectiveType === 'slow-2g' ||
    effectiveType === '2g' ||
    effectiveType === '3g'
  ) {
    return 'slow';
  }

  // 3. High latency check (> 700ms even on 4G indicates severe congestion or satellite)
  if (
    effectiveType === '4g' &&
    typeof connection?.rtt === 'number' &&
    connection.rtt > 700
  ) {
    return 'slow';
  }

  // 4. Moderate latency check
  if (typeof connection?.rtt === 'number' && connection.rtt > 400) {
    return 'moderate';
  }

  // 5. Bandwidth checks
  if (typeof connection?.downlink === 'number' && connection.downlink < 1.5) {
    return 'slow';
  }

  if (typeof connection?.downlink === 'number' && connection.downlink < 5) {
    return 'moderate';
  }

  return 'fast';
}

export function getDeviceTier(): DeviceTier {
  if (typeof navigator === 'undefined') return 'medium';

  const nav = navigator as Navigator & {
    deviceMemory?: number;
  };

  const cores = nav.hardwareConcurrency || 4;
  const memory = nav.deviceMemory || 4;

  if (cores <= 2 || memory <= 2) {
    return 'low';
  }
  if (cores <= 4 || memory <= 4) {
    return 'medium';
  }
  return 'high';
}

/**
 * Combined capability evaluation:
 * A slow network drops even high-end hardware into low-network mode.
 */
export function isLowCapability(): boolean {
  if (getNetworkTier() === 'slow') return true;
  if (getDeviceTier() === 'low') return true;
  return false;
}

export function subscribeToNetworkChanges(
  callback: (tier: NetworkTier) => void
): () => void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return () => {};
  }

  const nav = navigator as Navigator & {
    connection?: EventTarget & {
      effectiveType?: string;
      saveData?: boolean;
      downlink?: number;
      rtt?: number;
    };
  };

  const handleChange = () => {
    callback(getNetworkTier());
  };

  const connection = nav.connection;
  if (connection && 'addEventListener' in connection) {
    connection.addEventListener('change', handleChange);
  }

  window.addEventListener('online', handleChange);
  window.addEventListener('offline', handleChange);

  return () => {
    if (connection && 'removeEventListener' in connection) {
      connection.removeEventListener('change', handleChange);
    }
    window.removeEventListener('online', handleChange);
    window.removeEventListener('offline', handleChange);
  };
}
