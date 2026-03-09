import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUserHighlights(userId: string | undefined) {
  return useQuery({
    queryKey: ['highlights', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('story_highlights' as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!userId,
  });
}

export function useHighlightStories(highlightId: string | undefined) {
  return useQuery({
    queryKey: ['highlight-stories', highlightId],
    queryFn: async () => {
      if (!highlightId) return [];
      const { data, error } = await supabase
        .from('story_highlight_items' as any)
        .select('*, stories:story_id (id, image_url, caption, music_url, created_at, user_id, expires_at, profiles:user_id (id, username, avatar_url))')
        .eq('highlight_id', highlightId)
        .order('added_at', { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!highlightId,
  });
}

export function useCreateHighlight() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, storyId }: { name: string; storyId: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Get story cover
      const { data: story } = await supabase
        .from('stories')
        .select('image_url')
        .eq('id', storyId)
        .single();

      const { data: highlight, error } = await supabase
        .from('story_highlights' as any)
        .insert({ user_id: user.id, name, cover_url: story?.image_url ?? null })
        .select()
        .single();
      if (error) throw error;

      // Add the story to the highlight
      const { error: itemError } = await supabase
        .from('story_highlight_items' as any)
        .insert({ highlight_id: (highlight as any).id, story_id: storyId });
      if (itemError) throw itemError;

      return highlight;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['highlights'] });
    },
  });
}

export function useAddToHighlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ highlightId, storyId }: { highlightId: string; storyId: string }) => {
      const { error } = await supabase
        .from('story_highlight_items' as any)
        .insert({ highlight_id: highlightId, story_id: storyId });
      if (error) throw error;
    },
    onSuccess: (_, { highlightId }) => {
      queryClient.invalidateQueries({ queryKey: ['highlight-stories', highlightId] });
      queryClient.invalidateQueries({ queryKey: ['highlights'] });
    },
  });
}

export function useDeleteHighlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (highlightId: string) => {
      const { error } = await supabase
        .from('story_highlights' as any)
        .delete()
        .eq('id', highlightId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['highlights'] });
    },
  });
}

export function useUpdateHighlightName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ highlightId, name }: { highlightId: string; name: string }) => {
      const { error } = await supabase
        .from('story_highlights' as any)
        .update({ name })
        .eq('id', highlightId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['highlights'] });
    },
  });
}
