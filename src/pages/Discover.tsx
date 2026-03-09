import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Play } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { usePosts, useLikes, useToggleLike, useComments, useAddComment } from '@/hooks/usePosts';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { SparkReaction } from '@/components/SparkReaction';
import { BottomNav } from '@/components/BottomNav';
import { toast } from 'sonner';

const isVideo = (url: string) => /\.(mp4|webm|mov)$/i.test(url);

export default function Discover() {
  const { data: posts, isLoading } = usePosts();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const videoPosts = useMemo(() => posts?.filter(p => isVideo(p.image_url)) ?? [], [posts]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || !videoPosts.length) return;
    const scrollTop = containerRef.current.scrollTop;
    const height = window.innerHeight;
    const newIndex = Math.round(scrollTop / height);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < videoPosts.length) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, videoPosts]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleShare = async (postId?: string) => {
    const url = postId ? `${window.location.origin}/post/${postId}` : window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Orbik', text: 'Confira esse vídeo no Orbik!', url });
      } catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (videoPosts.length === 0) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center pb-16">
        <p className="text-muted-foreground">Nenhum vídeo para descobrir</p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="h-screen bg-black overflow-hidden">
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {videoPosts.map((post, index) => (
          <DiscoverCard
            key={post.id}
            post={post}
            isActive={index === currentIndex}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
            onShare={() => handleShare(post.id)}
          />
        ))}
      </div>
      <BottomNav />
    </div>
  );
}

interface DiscoverCardProps {
  post: any;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onShare: () => void;
}

function DiscoverCard({ post, isActive, isMuted, onToggleMute, onShare }: DiscoverCardProps) {
  const { user } = useAuth();
  const { data: likesData } = useLikes(post.id);
  const { data: comments } = useComments(post.id);
  const toggleLike = useToggleLike();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const addComment = useAddComment();

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleLike = () => {
    if (!user) return;
    toggleLike.mutate({ postId: post.id, isLiked: likesData?.isLiked ?? false });
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const [lastTap, setLastTap] = useState(0);
  const [showHeart, setShowHeart] = useState(false);

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      if (!likesData?.isLiked && user) {
        toggleLike.mutate({ postId: post.id, isLiked: false });
      }
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    }
    setLastTap(now);
  };

  return (
    <div
      className="h-screen w-full snap-start relative flex items-center justify-center bg-black"
      onClick={handleDoubleTap}
    >
      <video
        ref={videoRef}
        src={post.image_url}
        className="h-full w-full object-cover"
        loop
        playsInline
        muted={isMuted}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Heart className="w-24 h-24 fill-primary text-primary animate-scale-in" />
        </div>
      )}

      {!isPlaying && (
        <button
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center">
            <Play className="w-10 h-10 text-white ml-1" />
          </div>
        </button>
      )}

      <button
        onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center z-10"
      >
        {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
      </button>

      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-6 z-10">
        <Link to={`/profile/${post.profiles.username}`}>
          <Avatar className="w-12 h-12 border-2 border-white">
            <AvatarImage src={post.profiles.avatar_url ?? undefined} />
            <AvatarFallback>{post.profiles.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex flex-col items-center gap-1">
          <SparkReaction isLiked={likesData?.isLiked ?? false} onLike={handleLike} disabled={!user} iconClassName="text-white" />
          <span className="text-white text-xs font-semibold">{likesData?.count ?? 0}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }} className="w-10 h-10 flex items-center justify-center">
            <MessageCircle className="w-7 h-7 text-white" />
          </button>
          <span className="text-white text-xs font-semibold">{comments?.length ?? 0}</span>
        </div>

        <button onClick={(e) => { e.stopPropagation(); onShare(); }} className="w-10 h-10 flex items-center justify-center">
          <Share2 className="w-7 h-7 text-white" />
        </button>
      </div>

      <div className="absolute left-4 right-20 bottom-24 z-10">
        <Link to={`/profile/${post.profiles.username}`}>
          <span className="text-white font-bold text-base">@{post.profiles.username}</span>
        </Link>
        {post.caption && <p className="text-white text-sm mt-2 line-clamp-3">{post.caption}</p>}
      </div>

      {showComments && (
        <div className="absolute bottom-20 left-0 right-0 z-20 bg-black/80 backdrop-blur-sm max-h-[50vh] flex flex-col rounded-t-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-white/20">
            <span className="text-white font-semibold">Comentários ({comments?.length ?? 0})</span>
            <button onClick={() => setShowComments(false)} className="text-white text-sm">Fechar</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {comments && comments.length > 0 ? comments.map((comment: any) => (
              <div key={comment.id} className="flex gap-2">
                <Avatar className="w-7 h-7 flex-shrink-0">
                  <AvatarImage src={comment.profiles?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">{comment.profiles?.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <span className="text-white font-semibold text-xs mr-2">{comment.profiles?.username}</span>
                  <span className="text-white/80 text-xs">{comment.content}</span>
                </div>
              </div>
            )) : (
              <p className="text-white/50 text-sm text-center">Nenhum comentário ainda</p>
            )}
          </div>
          {user && (
            <form onSubmit={(e) => { e.preventDefault(); if (!newComment.trim()) return; addComment.mutate({ postId: post.id, content: newComment }); setNewComment(''); }} className="p-3 border-t border-white/20 flex gap-2">
              <Input placeholder="Adicione um comentário..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="bg-white/10 border-white/20 text-white placeholder:text-white/50" />
              <Button type="submit" size="sm" disabled={!newComment.trim()} className="text-white">Enviar</Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
