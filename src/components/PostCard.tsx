import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, MoreHorizontal, Bookmark, BookmarkCheck, Eye, Share2, Flag, EyeOff, Pencil, Trash2, ExternalLink } from 'lucide-react';
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
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

function SafeCaption({ text, allowLinks }: { text: string; allowLinks: boolean }) {
  try {
    if (!allowLinks) return <>{text}</>;
    const cleanText = text.replace(/(https?:\/\/[^\s]+)/g, '').trim();
    return <>{cleanText || text}</>;
  } catch {
    return <>{text}</>;
  }
}

interface PostCardProps {
  post: {
    id: string;
    image_url: string | null;
    caption: string | null;
    link_url: string | null;
    link_label: string | null;
    created_at: string;
    profiles: {
      id: string;
      username: string;
      full_name: string | null;
      avatar_url: string | null;
    };
  };
}

function FeedVideo({ src, cardRef }: { src: string; cardRef: React.RefObject<HTMLDivElement | null> }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fadeRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    const el = cardRef.current;
    const video = videoRef.current;
    if (!el || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (fadeRef.current) clearInterval(fadeRef.current);

        if (entry.isIntersecting) {
          video.volume = 0;
          video.play().catch(() => {});
          let vol = 0;
          fadeRef.current = setInterval(() => {
            vol = Math.min(vol + 0.1, 1);
            if (videoRef.current) videoRef.current.volume = vol;
            if (vol >= 1 && fadeRef.current) clearInterval(fadeRef.current);
          }, 30);
        } else {
          let vol = video.volume;
          fadeRef.current = setInterval(() => {
            vol = Math.max(vol - 0.15, 0);
            if (videoRef.current) videoRef.current.volume = vol;
            if (vol <= 0) {
              if (fadeRef.current) clearInterval(fadeRef.current);
              if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
              }
            }
          }, 30);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => {
      if (fadeRef.current) clearInterval(fadeRef.current);
      observer.disconnect();
    };
  }, [cardRef]);

  return (
    <video
      ref={videoRef}
      src={src}
      className="w-full h-full object-cover"
      controls
      playsInline
      muted
      loop
    />
  );
}

export function PostCard({ post }: PostCardProps) {
  const { t, i18n } = useTranslation();
  const profile = post.profiles;
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
  const { data: followStatus } = useFollowStatus(profile?.id ?? '');
  const toggleFollow = useToggleFollow();
  const viewRecorded = useRef(false);
  const isOwnPost = user?.id === profile?.id;
  const { trackSignal } = useTrackEngagement();
  const { onVisible, onHidden } = useDwellTracker(post.id);
  const { data: adminIds } = useAdminUserIds();
  const isAdminPost = adminIds?.includes(profile?.id ?? '') ?? false;
  const { data: isAdmin } = useIsAdmin();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();
  const adminDeletePost = useAdminDeletePost();
  const cardRef = useRef<HTMLDivElement>(null);

  // Get date-fns locale dynamically
  const getDateLocale = () => {
    const lang = i18n.language?.substring(0, 2);
    // Return undefined to use default (English) for non-PT languages
    // date-fns will handle formatting
    return undefined;
  };

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { entry.isIntersecting ? onVisible() : onHidden(); },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => { onHidden(); observer.disconnect(); };
  }, [onVisible, onHidden]);

  useEffect(() => {
    if (!viewRecorded.current) {
      viewRecorded.current = true;
      recordView.mutate({ postId: post.id, userId: user?.id });
    }
  }, [post.id]);

  if (!profile?.username) {
    console.warn('[PostCard] Missing profile data for post', post.id);
    return null;
  }

  const handleLike = () => {
    if (!user) return;
    const isLiked = likesData?.isLiked ?? false;
    toggleLike.mutate({ postId: post.id, isLiked });
    if (!isLiked) {
      sendNotification.mutate({ userId: profile.id, actorId: user.id, type: 'like', postId: post.id });
      trackSignal(post.id, 'like');
    }
  };

  const handleSaveWithTracking = () => {
    if (!user) return;
    const isSaved = savedData?.isSaved ?? false;
    toggleSave.mutate({ postId: post.id, isSaved });
    if (!isSaved) trackSignal(post.id, 'save');
  };

  const handleShareWithTracking = async () => {
    trackSignal(post.id, 'share');
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Orbikut', url }); } catch {}
    } else {
      navigator.clipboard.writeText(url);
      toast.success(t('feed.linkCopied'));
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
        <div className="relative aspect-[4/5] bg-muted w-full">
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 bg-gradient-to-b from-black/60 to-transparent">
            <Link to={`/profile/${profile.username}`} className="flex items-center gap-3">
              <Avatar className="w-8 h-8 ring-2 ring-white/30">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-white bg-white/20">{profile.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="font-semibold text-sm text-white drop-shadow-md">{profile.username}</span>
            </Link>
            <div className="flex items-center gap-2">
              {user && !isOwnPost && followStatus && !followStatus.isFollowing && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white font-semibold text-sm h-auto py-1 px-2 hover:bg-white/20"
                  disabled={toggleFollow.isPending}
                  onClick={() => {
                    toggleFollow.mutate({ targetUserId: profile.id, isFollowing: false });
                    sendNotification.mutate({ userId: profile.id, actorId: user.id, type: 'follow' });
                  }}
                >
                  {t('post.follow')}
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
                      {t('post.editCaption')}
                    </DropdownMenuItem>
                  )}
                  {isOwnPost && (
                    <DropdownMenuItem onClick={() => { if (confirm(t('post.deletePostConfirm'))) { deletePost.mutate(post.id); toast.success(t('post.postDeleted')); } }} className="gap-2 text-destructive focus:text-destructive">
                      <Trash2 className="w-4 h-4" />
                      {t('post.deletePost')}
                    </DropdownMenuItem>
                  )}
                  {!isOwnPost && isAdmin && (
                    <DropdownMenuItem onClick={() => { if (confirm(t('post.adminDeleteConfirm'))) { adminDeletePost.mutate(post.id); toast.success(t('post.adminDeleteDone')); } }} className="gap-2 text-destructive focus:text-destructive">
                      <Trash2 className="w-4 h-4" />
                      {t('post.adminDelete')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setHidden(true)} className="gap-2">
                    <EyeOff className="w-4 h-4" />
                    {t('post.hidePost')}
                  </DropdownMenuItem>
                  {!isOwnPost && (
                    <DropdownMenuItem onClick={() => toast.success(t('post.reportDone'))} className="gap-2 text-destructive focus:text-destructive">
                      <Flag className="w-4 h-4" />
                      {t('post.report')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {/\.(mp4|webm|mov)$/i.test(post.image_url) ? (
            <FeedVideo src={post.image_url} cardRef={cardRef} />
          ) : (
            <img src={post.image_url} alt={post.caption ?? 'Post image'} className="w-full h-full object-cover" loading="lazy" decoding="async" />
          )}
          {(() => {
            const linkUrl = post.link_url || (isAdminPost && post.caption ? post.caption.match(/(https?:\/\/[^\s]+)/)?.[0] : null);
            const linkLabel = post.link_label || t('post.learnMore');
            if (!linkUrl) return null;
            const handleLinkClick = () => {
              import('@/integrations/supabase/client').then(({ supabase }) => {
                supabase.from('link_clicks').insert({ post_id: post.id, user_id: user?.id ?? null } as any).then(() => {});
              });
            };
            return (
              <a href={linkUrl} target="_blank" rel="noopener noreferrer" onClick={handleLinkClick} className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-sm text-black font-semibold text-sm px-5 py-2.5 rounded-full shadow-lg hover:bg-white transition-all hover:scale-105">
                <ExternalLink className="w-4 h-4" />
                {linkLabel}
              </a>
            );
          })()}
        </div>

        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SparkReaction isLiked={likesData?.isLiked ?? false} onLike={handleLike} disabled={!user} iconClassName="text-foreground" />
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

          <div className="flex items-center gap-3">
            <p className="font-semibold text-sm text-foreground">{likesData?.count ?? 0} {t('post.likes')}</p>
          </div>

          {isEditing ? (
            <form onSubmit={(e) => { e.preventDefault(); updatePost.mutate({ postId: post.id, caption: editCaption }); setIsEditing(false); toast.success(t('post.captionUpdated')); }} className="flex gap-2 items-center">
              <Input value={editCaption} onChange={(e) => setEditCaption(e.target.value)} className="text-sm flex-1" autoFocus />
              <Button type="submit" size="sm" disabled={updatePost.isPending}>{t('post.save')}</Button>
              <button type="button" onClick={() => setIsEditing(false)} className="text-muted-foreground text-sm">{t('post.cancel')}</button>
            </form>
          ) : post.caption ? (
            <p className="text-sm text-foreground">
              <Link to={`/profile/${profile.username}`} className="font-semibold mr-2">{profile.username}</Link>
              <SafeCaption text={post.caption} allowLinks={isAdminPost} />
            </p>
          ) : null}

          {comments && comments.length > 0 && (
            <button onClick={() => setShowComments(true)} className="text-sm text-muted-foreground">
              {t('post.viewAll', { count: comments.length })}
            </button>
          )}

          <p className="text-xs text-muted-foreground uppercase">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      <CommentsDialog postId={post.id} postOwnerId={profile.id} open={showComments} onOpenChange={setShowComments} />
    </>
  );
}