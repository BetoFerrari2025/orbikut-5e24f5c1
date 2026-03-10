import { useState, useRef, useCallback, useEffect, TouchEvent } from 'react';
import { PostCard } from '@/components/PostCard';
import { PostCardErrorBoundary } from '@/components/PostCardErrorBoundary';
import { StoriesBar } from '@/components/StoriesBar';
import { FriendSuggestions } from '@/components/FriendSuggestions';
import { usePersonalizedFeed } from '@/hooks/usePersonalizedFeed';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import logoImg from '@/assets/logo.png';

const PULL_THRESHOLD = 80;

const Index = () => {
  const { t } = useTranslation();
  const {
  const {
    data: posts,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePersonalizedFeed();
  const queryClient = useQueryClient();

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Pull-to-refresh handlers
  const onTouchStart = useCallback((e: TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartY.current = 0;
    }
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartY.current || isRefreshing) return;
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, 120));
    }
  }, [isRefreshing]);

  const onTouchEnd = useCallback(async () => {
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      await queryClient.invalidateQueries({ queryKey: ['posts-infinite'] });
      await queryClient.invalidateQueries({ queryKey: ['personalized-feed'] });
      await queryClient.invalidateQueries({ queryKey: ['stories'] });
      setIsRefreshing(false);
    }
    setPullDistance(0);
    touchStartY.current = 0;
  }, [pullDistance, isRefreshing, queryClient]);

  const isPulling = pullDistance > 0 || isRefreshing;
  const readyToRefresh = pullDistance >= PULL_THRESHOLD;

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ height: isPulling ? pullDistance : 0 }}
      >
        <Loader2
          className={`w-6 h-6 text-primary transition-transform duration-200 ${
            isRefreshing ? 'animate-spin' : ''
          }`}
          style={{
            transform: `rotate(${Math.min(pullDistance / PULL_THRESHOLD, 1) * 360}deg)`,
            opacity: Math.min(pullDistance / (PULL_THRESHOLD * 0.6), 1),
          }}
        />
        {readyToRefresh && !isRefreshing && (
          <span className="ml-2 text-xs text-muted-foreground">Solte para atualizar</span>
        )}
        {isRefreshing && (
          <span className="ml-2 text-xs text-muted-foreground">Atualizando...</span>
        )}
      </div>

      <main className="max-w-lg mx-auto px-4 md:px-4 py-2 w-full">
        <StoriesBar />

        {isLoading && (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                  <Skeleton className="w-8 h-8 rounded-full bg-muted-foreground/20" />
                  <Skeleton className="h-4 w-24 bg-muted-foreground/20" />
                </div>
                <Skeleton className="aspect-square bg-muted-foreground/20" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-20 bg-muted-foreground/20" />
                  <Skeleton className="h-4 w-full bg-muted-foreground/20" />
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
            <img src={logoImg} alt="Orbikut" className="w-16 h-16 mx-auto mb-4 rounded-2xl object-cover" />
            <h2 className="text-xl font-semibold mb-2">{t('feed.noPostsYet')}</h2>
            <p className="text-muted-foreground">
              {t('feed.beFirst')}
            </p>
          </div>
        )}

        {posts && posts.length > 0 && (
          <div className="space-y-6">
            {posts.map((post, index) => (
              <PostCardErrorBoundary key={post.id} postId={post.id}>
                <>
                  <PostCard post={post} />
                  {index === 2 && <FriendSuggestions />}
                </>
              </PostCardErrorBoundary>
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-1" />

            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            )}

            {!hasNextPage && posts.length > 10 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                Você viu todos os posts 🎉
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
