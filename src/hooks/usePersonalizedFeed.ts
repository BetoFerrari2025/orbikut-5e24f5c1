import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePosts } from '@/hooks/usePosts';

export function usePersonalizedFeed() {
  const { user } = useAuth();
  const { data: posts, isLoading: postsLoading, error: postsError } = usePosts();

  const { data: ranking } = useQuery({
    queryKey: ['personalized-feed', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('personalized-feed');
      if (error) throw error;
      return data as { post_ids: string[]; topics: string[] };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  // Sort posts by AI ranking if available
  const sortedPosts = posts && ranking?.post_ids?.length
    ? [...posts].sort((a, b) => {
        const indexA = ranking.post_ids.indexOf(a.id);
        const indexB = ranking.post_ids.indexOf(b.id);
        // Posts not in ranking go to the end
        const scoreA = indexA === -1 ? 9999 : indexA;
        const scoreB = indexB === -1 ? 9999 : indexB;
        return scoreA - scoreB;
      })
    : posts;

  return {
    data: sortedPosts,
    isLoading: postsLoading,
    error: postsError,
    topics: ranking?.topics,
  };
}
