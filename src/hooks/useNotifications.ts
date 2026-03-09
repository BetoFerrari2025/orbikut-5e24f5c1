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

// Request browser push notification permission
async function showBrowserNotification(title: string, body: string, url?: string) {
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
  
  if (Notification.permission === 'granted') {
    // Try service worker notification first for better experience
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: { url: url || '/notifications' },
      } as NotificationOptions);
    } else {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  }
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Request notification permission on mount
  useEffect(() => {
    if (user && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [user]);

  // Realtime subscription with push notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, async (payload) => {
        queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        queryClient.invalidateQueries({ queryKey: ['unread-count', user.id] });

        // Show browser push notification
        const n = payload.new as any;
        const typeLabels: Record<string, string> = {
          like: 'curtiu seu post',
          comment: 'comentou no seu post',
          follow: 'começou a te seguir',
        };

        // Fetch actor name
        const { data: actor } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', n.actor_id)
          .single();

        const actorName = actor?.username || 'Alguém';
        const body = `${actorName} ${typeLabels[n.type] || 'interagiu com você'}`;
        const url = n.post_id ? `/post/${n.post_id}` : '/notifications';

        showBrowserNotification('Orbita', body, url);
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

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user) return;
      await supabase.from('notifications').delete().eq('id', notificationId).eq('user_id', user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
}

export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase.from('notifications').delete().eq('user_id', user.id);
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
      if (userId === actorId) return;
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
