import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useInfinitePosts, PostWithProfile } from '@/hooks/usePosts';

export function usePersonalizedFeed() {
  const { user } = useAuth();
  const {
    data: infiniteData,
    isLoading: postsLoading,
    error: postsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfinitePosts();

  const { data: ranking } = useQuery({
    queryKey: ['personalized-feed', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('personalized-feed');
      if (error) {
        console.warn('Personalized feed unavailable, falling back to chronological:', error.message);
        return { post_ids: [], topics: [] };
      }
      return data as { post_ids: string[]; topics: string[] };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Flatten pages into single array
  const allPosts = infiniteData?.pages?.flatMap((page) => page?.posts ?? []) ?? [];

  // Sort posts by AI ranking if available (only first page for ranking relevance)
  const sortedPosts = allPosts.length > 0 && ranking?.post_ids?.length
    ? [...allPosts].sort((a, b) => {
        const indexA = ranking.post_ids.indexOf(a.id);
        const indexB = ranking.post_ids.indexOf(b.id);
        const scoreA = indexA === -1 ? 9999 : indexA;
        const scoreB = indexB === -1 ? 9999 : indexB;
        return scoreA - scoreB;
      })
    : allPosts;

  return {
    data: sortedPosts.length > 0 ? sortedPosts : (postsLoading ? undefined : []),
    isLoading: postsLoading,
    error: postsError,
    topics: ranking?.topics,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
