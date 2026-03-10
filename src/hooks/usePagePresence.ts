import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function usePagePresence(page: string) {
  const { user } = useAuth();

  useEffect(() => {
    const channel = supabase.channel(`presence:${page}`, {
      config: { presence: { key: user?.id ?? `anon-${Math.random().toString(36).slice(2)}` } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {})
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ page, user_id: user?.id ?? null, joined_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [page, user?.id]);
}
