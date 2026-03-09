import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Story {
  id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  expires_at: string;
  profiles: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export function useStories() {
  return useQuery({
    queryKey: ['stories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stories')
        .select(`*, profiles (id, username, avatar_url)`)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group stories by user
      const grouped = new Map<string, Story[]>();
      for (const story of (data as Story[])) {
        const existing = grouped.get(story.user_id) || [];
        existing.push(story);
        grouped.set(story.user_id, existing);
      }
      return grouped;
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (imageFile: File) => {
      if (!user) throw new Error('Not authenticated');

      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(fileName);

      const { error } = await supabase
        .from('stories')
        .insert({ user_id: user.id, image_url: publicUrl });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}
