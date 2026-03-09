import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, MoreHorizontal, Bookmark, BookmarkCheck, Eye, Share2, Flag, EyeOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLikes, useToggleLike, useComments } from '@/hooks/usePosts';
import { useSavedPost, useToggleSave, usePostViews, useRecordView } from '@/hooks/usePostExtras';
import { useAuth } from '@/contexts/AuthContext';
import { SparkReaction } from '@/components/SparkReaction';
import { useSendNotification } from '@/hooks/useNotifications';
import { useFollowStatus, useToggleFollow } from '@/hooks/useProfile';
import { CommentsDialog } from '@/components/CommentsDialog';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface PostCardProps {
  post: {
    id: string;
    image_url: string;
    caption: string | null;
    created_at: string;
    profiles: {
      id: string;
      username: string;
      full_name: string | null;
      avatar_url: string | null;
    };
  };
}

export function PostCard({ post }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { user } = useAuth();
  const { data: likesData } = useLikes(post.id);
  const { data: comments } = useComments(post.id);
  const { data: savedData } = useSavedPost(post.id);
  const { data: viewCount } = usePostViews(post.id);
  const toggleLike = useToggleLike();
  const toggleSave = useToggleSave();
  const recordView = useRecordView();
  const sendNotification = useSendNotification();
  const { data: followStatus } = useFollowStatus(post.profiles.id);
  const toggleFollow = useToggleFollow();
  const viewRecorded = useRef(false);
  const isOwnPost = user?.id === post.profiles.id;

  useEffect(() => {
    if (!viewRecorded.current) {
      viewRecorded.current = true;
      recordView.mutate({ postId: post.id, userId: user?.id });
    }
  }, [post.id]);

  const handleSave = () => {
    if (!user) return;
    toggleSave.mutate({ postId: post.id, isSaved: savedData?.isSaved ?? false });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Orbita', url }); } catch {}
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    }
  };

  const handleLike = () => {
    if (!user) return;
    const isLiked = likesData?.isLiked ?? false;
    toggleLike.mutate({ postId: post.id, isLiked });
    if (!isLiked) {
      sendNotification.mutate({ userId: post.profiles.id, actorId: user.id, type: 'like', postId: post.id });
    }
  };

  if (hidden) return null;

  return (
    <>
      <div className="bg-card border-y md:border md:rounded-lg overflow-hidden -mx-4 md:mx-0">
        {/* Header */}
        <div className="flex items-center justify-between p-3">
          <Link to={`/profile/${post.profiles.username}`} className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={post.profiles.avatar_url ?? undefined} />
              <AvatarFallback>{post.profiles.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-semibold text-sm text-foreground">{post.profiles.username}</span>
          </Link>
          <div className="flex items-center gap-2">
            {user && !isOwnPost && followStatus && !followStatus.isFollowing && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary font-semibold text-sm h-auto py-1 px-2"
                disabled={toggleFollow.isPending}
                onClick={() => {
                  toggleFollow.mutate({ targetUserId: post.profiles.id, isFollowing: false });
                  sendNotification.mutate({ userId: post.profiles.id, actorId: user.id, type: 'follow' });
                }}
              >
                Seguir
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setHidden(true)} className="gap-2">
                  <EyeOff className="w-4 h-4" />
                  Ocultar post
                </DropdownMenuItem>
                {!isOwnPost && (
                  <DropdownMenuItem onClick={() => toast.success('Denúncia enviada. Obrigado!')} className="gap-2 text-destructive focus:text-destructive">
                    <Flag className="w-4 h-4" />
                    Denunciar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Image or Video */}
        <div className="aspect-square bg-muted">
          {/\.(mp4|webm|mov)$/i.test(post.image_url) ? (
            <video
              src={post.image_url}
              className="w-full h-full object-cover"
              controls
              playsInline
              muted
              loop
            />
          ) : (
            <img
              src={post.image_url}
              alt={post.caption ?? 'Post image'}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Actions */}
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SparkReaction
                isLiked={likesData?.isLiked ?? false}
                onLike={handleLike}
                disabled={!user}
                iconClassName="text-foreground"
              />
              <button onClick={() => setShowComments(true)}>
                <MessageCircle className="w-6 h-6 text-foreground hover:text-muted-foreground transition-colors" />
              </button>
              <button onClick={handleShare}>
                <Share2 className="w-6 h-6 text-foreground hover:text-muted-foreground transition-colors" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="w-4 h-4" /> {viewCount ?? 0}
              </span>
              <button onClick={handleSave} disabled={!user}>
                {savedData?.isSaved ? (
                  <BookmarkCheck className="w-6 h-6 text-primary fill-primary" />
                ) : (
                  <Bookmark className="w-6 h-6 text-foreground hover:text-muted-foreground transition-colors" />
                )}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            <p className="font-semibold text-sm text-foreground">{likesData?.count ?? 0} curtidas</p>
          </div>

          {/* Caption */}
          {post.caption && (
            <p className="text-sm text-foreground">
              <Link to={`/profile/${post.profiles.username}`} className="font-semibold mr-2">
                {post.profiles.username}
              </Link>
              {post.caption}
            </p>
          )}

          {/* Comments preview */}
          {comments && comments.length > 0 && (
            <button
              onClick={() => setShowComments(true)}
              className="text-sm text-muted-foreground"
            >
              Ver todos os {comments.length} comentários
            </button>
          )}

          {/* Timestamp */}
          <p className="text-xs text-muted-foreground uppercase">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Comments Dialog */}
      <CommentsDialog
        postId={post.id}
        postOwnerId={post.profiles.id}
        open={showComments}
        onOpenChange={setShowComments}
      />
    </>
  );
}
