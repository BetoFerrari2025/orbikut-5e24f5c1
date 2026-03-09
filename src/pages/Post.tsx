import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PostCard } from '@/components/PostCard';
import { Skeleton } from '@/components/ui/skeleton';

function usePost(postId: string | undefined) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      if (!postId) return null;
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles (id, username, full_name, avatar_url)')
        .eq('id', postId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!postId,
  });
}

export default function Post() {
  const { postId } = useParams<{ postId: string }>();
  const { data: post, isLoading } = usePost(postId);

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      {isLoading ? (
        <Skeleton className="w-full aspect-square rounded-lg" />
      ) : post ? (
        <PostCard post={post} />
      ) : (
        <p className="text-center text-muted-foreground">Post não encontrado</p>
      )}
    </main>
  );
}
