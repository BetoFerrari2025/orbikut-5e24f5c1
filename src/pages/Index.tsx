import { PostCard } from '@/components/PostCard';
import { StoriesBar } from '@/components/StoriesBar';
import { usePosts } from '@/hooks/usePosts';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';

const Index = () => {
  const { data: posts, isLoading, error } = usePosts();

  return (
    <main className="max-w-lg mx-auto px-4 md:px-4 py-2">
      <StoriesBar />
      {isLoading && (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border-y md:border md:rounded-lg overflow-hidden -mx-4 md:mx-0">
              <div className="flex items-center gap-3 p-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="aspect-square" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-destructive">Erro ao carregar posts</p>
        </div>
      )}

      {posts && posts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-brand flex items-center justify-center glow-primary">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Nenhum post ainda</h2>
          <p className="text-muted-foreground">
            Seja o primeiro a compartilhar uma foto!
          </p>
        </div>
      )}

      {posts && posts.length > 0 && (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  );
};

export default Index;
