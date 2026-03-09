import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Play, Eye, Pencil, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { usePosts, useLikes, useToggleLike, useComments, useAddComment, useUpdateComment, useDeleteComment } from '@/hooks/usePosts';
import { usePostViews, useRecordView } from '@/hooks/usePostExtras';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { SparkReaction } from '@/components/SparkReaction';
import { toast } from 'sonner';

const isVideo = (url: string) => /\.(mp4|webm|mov)$/i.test(url);

export default function Discover() {
  const { data: posts, isLoading } = usePosts();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showMuteIcon, setShowMuteIcon] = useState(false);
  const muteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      <div className="h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-muted-foreground">Nenhum vídeo para descobrir</p>
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
            showMuteIcon={showMuteIcon}
            onToggleMute={() => {
              const newMuted = !isMuted;
              setIsMuted(newMuted);
              setShowMuteIcon(true);
              if (muteTimeoutRef.current) clearTimeout(muteTimeoutRef.current);
              muteTimeoutRef.current = setTimeout(() => setShowMuteIcon(false), 1500);
            }}
            onShare={() => handleShare(post.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface DiscoverCardProps {
  post: any;
  isActive: boolean;
  isMuted: boolean;
  showMuteIcon: boolean;
  onToggleMute: () => void;
  onShare: () => void;
}

function DiscoverCard({ post, isActive, isMuted, showMuteIcon, onToggleMute, onShare }: DiscoverCardProps) {
  const { user } = useAuth();
  const { data: likesData } = useLikes(post.id);
  const { data: comments } = useComments(post.id);
  const { data: viewCount } = usePostViews(post.id);
  const toggleLike = useToggleLike();
  const recordView = useRecordView();
  const viewRecorded = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const addComment = useAddComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();

  useEffect(() => {
    if (isActive && !viewRecorded.current) {
      viewRecorded.current = true;
      recordView.mutate({ postId: post.id, userId: user?.id });
    }
  }, [isActive, post.id]);

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
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => {
      if (video.duration) {
        setVideoProgress((video.currentTime / video.duration) * 100);
      }
    };
    video.addEventListener('timeupdate', onTimeUpdate);
    return () => video.removeEventListener('timeupdate', onTimeUpdate);
  }, []);

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
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      // Double tap → like
      if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
      if (!likesData?.isLiked && user) {
        toggleLike.mutate({ postId: post.id, isLiked: false });
      }
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    } else {
      // Single tap → toggle mute (delayed to distinguish from double tap)
      singleTapTimer.current = setTimeout(() => {
        onToggleMute();
      }, 300);
    }
    setLastTap(now);
  };

  return (
    <div
      className="h-screen w-full snap-start relative flex items-center justify-center bg-black"
      onClick={handleTap}
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

      {showMuteIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="w-20 h-20 rounded-full bg-black/60 flex items-center justify-center animate-scale-in">
            {isMuted ? <VolumeX className="w-10 h-10 text-white" /> : <Volume2 className="w-10 h-10 text-white" />}
          </div>
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

        <div className="flex flex-col items-center gap-1">
          <Eye className="w-6 h-6 text-white/70" />
          <span className="text-white text-xs font-semibold">{viewCount ?? 0}</span>
        </div>
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
              <div key={comment.id} className="flex gap-2 group">
                <Avatar className="w-7 h-7 flex-shrink-0">
                  <AvatarImage src={comment.profiles?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">{comment.profiles?.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-white font-semibold text-xs">{comment.profiles?.username}</span>
                    {user?.id === comment.user_id && (
                      <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingCommentId(comment.id); setEditCommentText(comment.content); }} className="text-white/60 hover:text-white">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => { deleteComment.mutate({ commentId: comment.id, postId: post.id }); toast.success('Comentário excluído'); }} className="text-white/60 hover:text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  {editingCommentId === comment.id ? (
                    <form onSubmit={(e) => { e.preventDefault(); if (!editCommentText.trim()) return; updateComment.mutate({ commentId: comment.id, content: editCommentText.trim(), postId: post.id }); setEditingCommentId(null); toast.success('Comentário editado'); }} className="flex gap-1 mt-1">
                      <Input value={editCommentText} onChange={(e) => setEditCommentText(e.target.value)} className="bg-white/10 border-white/20 text-white text-xs h-7" autoFocus />
                      <Button type="submit" size="sm" className="h-7 text-xs">OK</Button>
                      <button type="button" onClick={() => setEditingCommentId(null)} className="text-white/60 text-xs">✕</button>
                    </form>
                  ) : (
                    <span className="text-white/80 text-xs">{comment.content}</span>
                  )}
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
