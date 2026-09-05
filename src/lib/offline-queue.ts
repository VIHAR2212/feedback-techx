// Offline feedback submission queue with idempotency and exponential backoff

export type PendingFeedbackPayload = {
  tableId: string;
  rating: number;
  studentEmail: string;
  studentName: string;
  studentDepartment: string;
  comment: string;
  submissionId: string;
};

export type PendingSubmission = {
  id: string; // matches submissionId
  payload: PendingFeedbackPayload;
  createdAt: number;
  attempts: number;
  lastAttemptAt?: number;
};

const QUEUE_STORAGE_KEY = 'techx_pending_feedback_queue';

/**
 * Fetch wrapper with configurable AbortController timeout.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Read the current pending queue from localStorage safely.
 */
export function getPendingQueue(): PendingSubmission[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('[offline-queue] Failed to parse pending queue:', err);
    return [];
  }
}

/**
 * Persist queue to localStorage.
 */
function saveQueue(queue: PendingSubmission[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    window.dispatchEvent(
      new CustomEvent('offlineQueueUpdated', { detail: { count: queue.length } })
    );
  } catch (err) {
    console.error('[offline-queue] Failed to save pending queue:', err);
  }
}

/**
 * Enqueue a submission for sync.
 */
export function enqueueSubmission(
  payload: Omit<PendingFeedbackPayload, 'submissionId'> & { submissionId?: string }
): PendingSubmission {
  const submissionId =
    payload.submissionId ||
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);

  const item: PendingSubmission = {
    id: submissionId,
    payload: {
      ...payload,
      submissionId,
    },
    createdAt: Date.now(),
    attempts: 0,
  };

  const queue = getPendingQueue();
  // Prevent duplicate queuing of the same submission ID
  const existingIdx = queue.findIndex((q) => q.id === submissionId);
  if (existingIdx >= 0) {
    queue[existingIdx] = item;
  } else {
    queue.push(item);
  }

  saveQueue(queue);
  return item;
}

/**
 * Remove an item from the queue by ID upon successful sync.
 */
export function dequeueSubmission(id: string): void {
  const queue = getPendingQueue().filter((item) => item.id !== id);
  saveQueue(queue);
}

let isFlushing = false;

/**
 * Flush queue: processes pending submissions sequentially with exponential backoff.
 * Backoff schedule: 1s, 2s, 4s, 8s, 16s, max 30s.
 */
export async function flushSubmissionQueue(): Promise<{
  synced: number;
  remaining: number;
}> {
  if (isFlushing || typeof window === 'undefined') {
    return { synced: 0, remaining: getPendingQueue().length };
  }

  const queue = getPendingQueue();
  if (queue.length === 0) {
    return { synced: 0, remaining: 0 };
  }

  isFlushing = true;
  let synced = 0;
  const now = Date.now();

  try {
    for (const item of queue) {
      // Calculate exponential backoff delay based on attempts
      const backoffMs = Math.min(1000 * Math.pow(2, item.attempts), 30000);
      if (item.lastAttemptAt && now - item.lastAttemptAt < backoffMs) {
        // Not yet ready for retry according to backoff
        continue;
      }

      item.attempts += 1;
      item.lastAttemptAt = Date.now();

      try {
        const res = await fetchWithTimeout(
          '/api/feedback',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload),
          },
          8000
        );

        // 200, 201, or 409 (already recorded/idempotent) consider successful
        if (res.ok || res.status === 409) {
          dequeueSubmission(item.id);
          synced += 1;
        } else {
          // Server returned an error, update attempt in queue
          const currentQueue = getPendingQueue();
          const target = currentQueue.find((q) => q.id === item.id);
          if (target) {
            target.attempts = item.attempts;
            target.lastAttemptAt = item.lastAttemptAt;
            saveQueue(currentQueue);
          }
        }
      } catch (err) {
        // Network failure or timeout; update attempt state
        console.warn(`[offline-queue] Attempt ${item.attempts} failed for ${item.id}:`, err);
        const currentQueue = getPendingQueue();
        const target = currentQueue.find((q) => q.id === item.id);
        if (target) {
          target.attempts = item.attempts;
          target.lastAttemptAt = item.lastAttemptAt;
          saveQueue(currentQueue);
        }
        // If offline/timeout, break early to avoid pounding an offline connection
        break;
      }
    }
  } finally {
    isFlushing = false;
  }

  return { synced, remaining: getPendingQueue().length };
}

let listenerInitialized = false;

/**
 * Initialize auto-flush listeners on browser 'online' events and periodic checks.
 */
export function startQueueListener(): () => void {
  if (typeof window === 'undefined' || listenerInitialized) {
    return () => {};
  }
  listenerInitialized = true;

  const handleOnline = () => {
    void flushSubmissionQueue();
  };

  window.addEventListener('online', handleOnline);

  // Periodic flush check every 30 seconds
  const intervalId = setInterval(() => {
    if (navigator.onLine && getPendingQueue().length > 0) {
      void flushSubmissionQueue();
    }
  }, 30000);

  return () => {
    window.removeEventListener('online', handleOnline);
    clearInterval(intervalId);
    listenerInitialized = false;
  };
}

export const initOfflineQueueAutoSync = startQueueListener;
