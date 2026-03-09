import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ─── Likes ───
export function useStoryLikes(storyId: string) {
  return useQuery({
    queryKey: ['story-likes', storyId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('story_likes')
        .select('*', { count: 'exact', head: true })
        .eq('story_id', storyId);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useHasLikedStory(storyId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['story-liked', storyId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from('story_likes')
        .select('id')
        .eq('story_id', storyId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
  });
}

export function useToggleStoryLike() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (storyId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('story_likes')
        .select('id')
        .eq('story_id', storyId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase.from('story_likes').delete().eq('id', existing.id);
      } else {
        await supabase.from('story_likes').insert({ story_id: storyId, user_id: user.id });
      }
    },
    onSuccess: (_, storyId) => {
      queryClient.invalidateQueries({ queryKey: ['story-likes', storyId] });
      queryClient.invalidateQueries({ queryKey: ['story-liked', storyId] });
    },
  });
}

// ─── Comments ───
export function useStoryComments(storyId: string) {
  return useQuery({
    queryKey: ['story-comments', storyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('story_comments')
        .select('*, profiles (id, username, avatar_url)')
        .eq('story_id', storyId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddStoryComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ storyId, content }: { storyId: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('story_comments')
        .insert({ story_id: storyId, user_id: user.id, content });
      if (error) throw error;
    },
    onSuccess: (_, { storyId }) => {
      queryClient.invalidateQueries({ queryKey: ['story-comments', storyId] });
    },
  });
}

// ─── Caption ───
export function useUpdateStoryCaption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storyId, caption }: { storyId: string; caption: string }) => {
      const { error } = await supabase
        .from('stories')
        .update({ caption })
        .eq('id', storyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

// ─── Music URL ───
export function useUpdateStoryMusic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storyId, musicUrl }: { storyId: string; musicUrl: string }) => {
      const { error } = await supabase
        .from('stories')
        .update({ music_url: musicUrl })
        .eq('id', storyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}
