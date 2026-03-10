import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function usePresenceCount(page: string) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const channel = supabase.channel(`presence:${page}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setCount(Object.keys(state).length);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [page]);

  return count;
}
