import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, MoreHorizontal, Bookmark, BookmarkCheck, Eye, Share2, Flag, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLikes, useToggleLike, useComments, useUpdatePost, useDeletePost, useAdminDeletePost } from '@/hooks/usePosts';
import { useSavedPost, useToggleSave, usePostViews, useRecordView } from '@/hooks/usePostExtras';
import { useAuth } from '@/contexts/AuthContext';
import { SparkReaction } from '@/components/SparkReaction';
import { useSendNotification } from '@/hooks/useNotifications';
import { useFollowStatus, useToggleFollow } from '@/hooks/useProfile';
import { CommentsDialog } from '@/components/CommentsDialog';
import { useDwellTracker, useTrackEngagement } from '@/hooks/useEngagement';
import { useAdminUserIds } from '@/hooks/useAdminUsers';
import { useIsAdmin } from '@/hooks/useAdmin';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

function LinkifiedText({ text, allowLinks }: { text: string; allowLinks: boolean }) {
  if (!allowLinks) return <>{text}</>;
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-accent underline hover:opacity-80 break-all">
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

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
  const [isEditing, setIsEditing] = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption ?? '');
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
  const { trackSignal } = useTrackEngagement();
  const { onVisible, onHidden } = useDwellTracker(post.id);
  const { data: adminIds } = useAdminUserIds();
  const isAdminPost = adminIds?.includes(post.profiles.id) ?? false;
  const { data: isAdmin } = useIsAdmin();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();
  const adminDeletePost = useAdminDeletePost();
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for dwell time tracking
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onVisible();
        } else {
          onHidden();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => {
      onHidden(); // flush on unmount
      observer.disconnect();
    };
  }, [onVisible, onHidden]);

  useEffect(() => {
    if (!viewRecorded.current) {
      viewRecorded.current = true;
      recordView.mutate({ postId: post.id, userId: user?.id });
    }
  }, [post.id]);


  const handleLike = () => {
    if (!user) return;
    const isLiked = likesData?.isLiked ?? false;
    toggleLike.mutate({ postId: post.id, isLiked });
    if (!isLiked) {
      sendNotification.mutate({ userId: post.profiles.id, actorId: user.id, type: 'like', postId: post.id });
      trackSignal(post.id, 'like');
    }
  };

  const handleSaveWithTracking = () => {
    if (!user) return;
    const isSaved = savedData?.isSaved ?? false;
    toggleSave.mutate({ postId: post.id, isSaved });
    if (!isSaved) {
      trackSignal(post.id, 'save');
    }
  };

  const handleShareWithTracking = async () => {
    trackSignal(post.id, 'share');
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Orbita', url }); } catch {}
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    }
  };

  const handleCommentOpen = () => {
    trackSignal(post.id, 'comment');
    setShowComments(true);
  };

  if (hidden) return null;

  return (
    <>
      <div ref={cardRef} className="bg-card border-y md:border md:rounded-lg overflow-hidden -mx-4 md:mx-0 w-[calc(100%+2rem)] md:w-full">
        {/* Image or Video with overlay header */}
        <div className="relative aspect-[4/5] bg-muted w-full">
          {/* Overlay Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 bg-gradient-to-b from-black/60 to-transparent">
            <Link to={`/profile/${post.profiles.username}`} className="flex items-center gap-3">
              <Avatar className="w-8 h-8 ring-2 ring-white/30">
                <AvatarImage src={post.profiles.avatar_url ?? undefined} />
                <AvatarFallback className="text-white bg-white/20">{post.profiles.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="font-semibold text-sm text-white drop-shadow-md">{post.profiles.username}</span>
            </Link>
            <div className="flex items-center gap-2">
              {user && !isOwnPost && followStatus && !followStatus.isFollowing && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white font-semibold text-sm h-auto py-1 px-2 hover:bg-white/20"
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
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isOwnPost && (
                    <DropdownMenuItem onClick={() => { setIsEditing(true); setEditCaption(post.caption ?? ''); }} className="gap-2">
                      <Pencil className="w-4 h-4" />
                      Editar legenda
                    </DropdownMenuItem>
                  )}
                  {isOwnPost && (
                    <DropdownMenuItem onClick={() => { if (confirm('Tem certeza que deseja excluir este post?')) { deletePost.mutate(post.id); toast.success('Post excluído!'); } }} className="gap-2 text-destructive focus:text-destructive">
                      <Trash2 className="w-4 h-4" />
                      Excluir post
                    </DropdownMenuItem>
                  )}
                  {!isOwnPost && isAdmin && (
                    <DropdownMenuItem onClick={() => { if (confirm('Excluir este post como administrador?')) { adminDeletePost.mutate(post.id); toast.success('Post excluído pelo admin!'); } }} className="gap-2 text-destructive focus:text-destructive">
                      <Trash2 className="w-4 h-4" />
                      Excluir (Admin)
                    </DropdownMenuItem>
                  )}
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
              loading="lazy"
              decoding="async"
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
              <button onClick={handleCommentOpen}>
                <MessageCircle className="w-6 h-6 text-foreground hover:text-muted-foreground transition-colors" />
              </button>
              <button onClick={handleShareWithTracking}>
                <Share2 className="w-6 h-6 text-foreground hover:text-muted-foreground transition-colors" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="w-4 h-4" /> {viewCount ?? 0}
              </span>
              <button onClick={handleSaveWithTracking} disabled={!user}>
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
          {isEditing ? (
            <form onSubmit={(e) => { e.preventDefault(); updatePost.mutate({ postId: post.id, caption: editCaption }); setIsEditing(false); toast.success('Legenda atualizada!'); }} className="flex gap-2 items-center">
              <Input value={editCaption} onChange={(e) => setEditCaption(e.target.value)} className="text-sm flex-1" autoFocus />
              <Button type="submit" size="sm" disabled={updatePost.isPending}>Salvar</Button>
              <button type="button" onClick={() => setIsEditing(false)} className="text-muted-foreground text-sm">Cancelar</button>
            </form>
          ) : post.caption ? (
            <p className="text-sm text-foreground">
              <Link to={`/profile/${post.profiles.username}`} className="font-semibold mr-2">
                {post.profiles.username}
              </Link>
              <LinkifiedText text={post.caption} allowLinks={isAdminPost} />
            </p>
          ) : null}

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
