import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useSavedPost(postId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['saved', postId, user?.id],
    queryFn: async () => {
      if (!user) return { isSaved: false };
      const { data, error } = await supabase
        .from('saved_posts')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return { isSaved: !!data };
    },
  });
}

export function useToggleSave() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, isSaved }: { postId: string; isSaved: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      if (isSaved) {
        const { error } = await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('saved_posts').insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['saved', postId] });
      queryClient.invalidateQueries({ queryKey: ['savedPosts'] });
    },
  });
}

export function usePostViews(postId: string) {
  return useQuery({
    queryKey: ['views', postId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('post_views')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useRecordView() {
  return useMutation({
    mutationFn: async ({ postId, userId }: { postId: string; userId?: string }) => {
      const { error } = await supabase.from('post_views').insert({
        post_id: postId,
        user_id: userId ?? null,
      });
      if (error) throw error;
    },
  });
}

export function useSavedPosts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['savedPosts'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('saved_posts')
        .select('post_id, created_at, posts:post_id (*, profiles (id, username, full_name, avatar_url))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data?.map((s: any) => s.posts).filter(Boolean) ?? [];
    },
    enabled: !!user,
  });
}
