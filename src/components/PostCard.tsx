import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, MoreHorizontal, Bookmark, BookmarkCheck, Eye, Share2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLikes, useToggleLike, useComments, useAddComment } from '@/hooks/usePosts';
import { useSavedPost, useToggleSave, usePostViews, useRecordView } from '@/hooks/usePostExtras';
import { useAuth } from '@/contexts/AuthContext';
import { SparkReaction } from '@/components/SparkReaction';
import { useSendNotification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
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
  const [newComment, setNewComment] = useState('');
  const { user } = useAuth();
  const { data: likesData } = useLikes(post.id);
  const { data: comments } = useComments(post.id);
  const { data: savedData } = useSavedPost(post.id);
  const { data: viewCount } = usePostViews(post.id);
  const toggleLike = useToggleLike();
  const addComment = useAddComment();
  const toggleSave = useToggleSave();
  const recordView = useRecordView();
  const sendNotification = useSendNotification();
  const viewRecorded = useRef(false);

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
      try { await navigator.share({ title: 'Orbik', url }); } catch {}
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    }
  };

  const handleLike = () => {
    if (!user) return;
    toggleLike.mutate({ postId: post.id, isLiked: likesData?.isLiked ?? false });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    addComment.mutate({ postId: post.id, content: newComment });
    setNewComment('');
  };

  return (
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
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
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
            <button onClick={() => setShowComments(!showComments)}>
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
        {comments && comments.length > 0 && !showComments && (
          <button
            onClick={() => setShowComments(true)}
            className="text-sm text-muted-foreground"
          >
            Ver todos os {comments.length} comentários
          </button>
        )}

        {/* Comments section */}
        {showComments && comments && (
          <div className="space-y-2 pt-2 border-t">
            {comments.map((comment: any) => (
              <p key={comment.id} className="text-sm text-foreground">
                <Link to={`/profile/${comment.profiles.username}`} className="font-semibold mr-2 text-foreground">
                  {comment.profiles.username}
                </Link>
                {comment.content}
              </p>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground uppercase">
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
        </p>

        {/* Add comment */}
        {user && (
          <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-2 border-t">
            <Input
              placeholder="Adicione um comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="border-0 focus-visible:ring-0 px-0 text-foreground"
            />
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              disabled={!newComment.trim()}
              className="text-primary font-semibold"
            >
              Publicar
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
