import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProfileLink {
  id: string;
  user_id: string;
  title: string;
  url: string;
  display_order: number;
  created_at: string;
}

export function useProfileLinks(userId?: string) {
  return useQuery({
    queryKey: ['profile-links', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('profile_links' as any)
        .select('*')
        .eq('user_id', userId)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ProfileLink[];
    },
    enabled: !!userId,
  });
}

export function useAddProfileLink() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ title, url }: { title: string; url: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profile_links' as any)
        .insert({ user_id: user.id, title, url } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-links'] });
    },
  });
}

export function useDeleteProfileLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from('profile_links' as any)
        .delete()
        .eq('id', linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-links'] });
    },
  });
}
