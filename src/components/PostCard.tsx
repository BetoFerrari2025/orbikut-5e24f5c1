import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLikes, useToggleLike, useComments, useAddComment } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
import { SparkReaction } from '@/components/SparkReaction';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
  const toggleLike = useToggleLike();
  const addComment = useAddComment();

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

      {/* Image */}
      <div className="aspect-square bg-muted">
        <img
          src={post.image_url}
          alt={post.caption ?? 'Post image'}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Actions */}
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-4">
          <SparkReaction
            isLiked={likesData?.isLiked ?? false}
            onLike={handleLike}
            disabled={!user}
          />
          <button onClick={() => setShowComments(!showComments)}>
            <MessageCircle className="w-6 h-6 hover:text-muted-foreground transition-colors" />
          </button>
        </div>

        {/* Likes count */}
        <p className="font-semibold text-sm">{likesData?.count ?? 0} curtidas</p>

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
              <p key={comment.id} className="text-sm">
                <Link to={`/profile/${comment.profiles.username}`} className="font-semibold mr-2">
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
