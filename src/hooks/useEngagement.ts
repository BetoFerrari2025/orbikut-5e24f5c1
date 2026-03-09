import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useTrackEngagement() {
  const { user } = useAuth();
  const tracked = useRef<Set<string>>(new Set());

  const trackSignal = useCallback(
    async (postId: string, signalType: string, dwellSeconds?: number) => {
      if (!user) return;

      // For dwell signals, deduplicate per session
      if (signalType === 'dwell') {
        const key = `${postId}-dwell`;
        if (tracked.current.has(key)) return;
        tracked.current.add(key);
      }

      try {
        await supabase.from('engagement_signals' as any).insert({
          user_id: user.id,
          post_id: postId,
          signal_type: signalType,
          dwell_seconds: dwellSeconds ?? 0,
        });
      } catch {
        // Silent fail - engagement tracking shouldn't break UX
      }
    },
    [user]
  );

  return { trackSignal };
}

export function useDwellTracker(postId: string) {
  const { trackSignal } = useTrackEngagement();
  const startTime = useRef<number | null>(null);
  const hasSent = useRef(false);

  const onVisible = useCallback(() => {
    if (!startTime.current) {
      startTime.current = Date.now();
    }
  }, []);

  const onHidden = useCallback(() => {
    if (startTime.current && !hasSent.current) {
      const seconds = (Date.now() - startTime.current) / 1000;
      if (seconds >= 3) {
        hasSent.current = true;
        trackSignal(postId, 'dwell', seconds);
      }
      startTime.current = null;
    }
  }, [postId, trackSignal]);

  return { onVisible, onHidden };
}
