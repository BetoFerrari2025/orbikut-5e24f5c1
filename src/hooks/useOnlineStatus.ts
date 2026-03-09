import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const UPDATE_INTERVAL = 60_000; // 1 minute

export function useUpdateOnlineStatus() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const update = () => {
      supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() } as any)
        .eq('id', user.id)
        .then(() => {});
    };

    update(); // immediately on mount
    const interval = setInterval(update, UPDATE_INTERVAL);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') update();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user?.id]);
}

export function isUserOnline(lastSeen: string | null | undefined): boolean {
  if (!lastSeen) return false;
  const diff = Date.now() - new Date(lastSeen).getTime();
  return diff < 2 * 60_000; // 2 minutes threshold
}
