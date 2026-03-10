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
  const allPosts = (infiniteData?.pages?.flatMap((page) => page?.posts ?? []) ?? [])
    .filter((p) => p.profiles?.username);

  // Sort: recent posts (last 2 hours) stay on top chronologically,
  // older posts get sorted by AI ranking if available
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  const now = Date.now();

  const sortedPosts = allPosts.length > 0
    ? [...allPosts].sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        const isRecentA = now - timeA < TWO_HOURS;
        const isRecentB = now - timeB < TWO_HOURS;

        // Recent posts always come first, sorted newest-first
        if (isRecentA && !isRecentB) return -1;
        if (!isRecentA && isRecentB) return 1;
        if (isRecentA && isRecentB) return timeB - timeA;

        // For older posts, use AI ranking if available
        if (ranking?.post_ids?.length) {
          const indexA = ranking.post_ids.indexOf(a.id);
          const indexB = ranking.post_ids.indexOf(b.id);
          const scoreA = indexA === -1 ? 9999 : indexA;
          const scoreB = indexB === -1 ? 9999 : indexB;
          return scoreA - scoreB;
        }

        // Fallback: chronological
        return timeB - timeA;
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
