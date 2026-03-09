import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: 'like' | 'comment' | 'follow';
  post_id: string | null;
  content: string | null;
  read: boolean;
  created_at: string;
  actor?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        queryClient.invalidateQueries({ queryKey: ['unread-count', user.id] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch actor profiles
      const actorIds = [...new Set((data || []).map((n: any) => n.actor_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', actorIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      return (data || []).map((n: any) => ({
        ...n,
        actor: profileMap.get(n.actor_id),
      })) as Notification[];
    },
    enabled: !!user,
  });
}

export function useUnreadCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unread-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase
        .from('notifications')
        .update({ read: true } as any)
        .eq('user_id', user.id)
        .eq('read', false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
}

export function useSendNotification() {
  return useMutation({
    mutationFn: async ({ userId, actorId, type, postId, content }: {
      userId: string;
      actorId: string;
      type: 'like' | 'comment' | 'follow';
      postId?: string;
      content?: string;
    }) => {
      if (userId === actorId) return; // Don't notify self
      await supabase.from('notifications').insert({
        user_id: userId,
        actor_id: actorId,
        type,
        post_id: postId || null,
        content: content || null,
      } as any);
    },
  });
}
