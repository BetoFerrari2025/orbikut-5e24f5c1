import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, X, Send, Heart, SmilePlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useComments, useAddComment } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
import { useSendNotification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CommentsDialogProps {
  postId: string;
  postOwnerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommentsDialog({ postId, postOwnerId, open, onOpenChange }: CommentsDialogProps) {
  const { data: comments } = useComments(postId);
  const addComment = useAddComment();
  const { user } = useAuth();
  const sendNotification = useSendNotification();
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const handleSend = () => {
    if (!text.trim() || !user) return;
    const content = replyTo ? `@${replyTo} ${text.trim()}` : text.trim();
    addComment.mutate({ postId, content });
    sendNotification.mutate({ userId: postOwnerId, actorId: user.id, type: 'comment', postId, content });
    setText('');
    setReplyTo(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 border-b border-border">
          <DialogTitle className="text-center">Comentários</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
          {(!comments || comments.length === 0) && (
            <div className="text-center py-8">
              <MessageCircle className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">Nenhum comentário ainda</p>
              <p className="text-muted-foreground text-xs">Seja o primeiro a comentar!</p>
            </div>
          )}

          {comments?.map((c: any) => (
            <div key={c.id} className="flex gap-3 group">
              <Link to={`/profile/${c.profiles.username}`}>
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={c.profiles?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">{c.profiles?.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <Link to={`/profile/${c.profiles.username}`} className="text-sm font-semibold text-foreground hover:underline">
                    {c.profiles.username}
                  </Link>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                <p className="text-sm text-foreground mt-0.5">{c.content}</p>
                <button
                  onClick={() => setReplyTo(c.profiles.username)}
                  className="text-xs text-muted-foreground hover:text-primary mt-1 font-semibold"
                >
                  Responder
                </button>
              </div>
            </div>
          ))}
        </div>

        {user ? (
          <div className="border-t border-border p-3 space-y-2">
            {replyTo && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Respondendo a <strong className="text-foreground">@{replyTo}</strong></span>
                <button onClick={() => setReplyTo(null)}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                placeholder={replyTo ? `Responder @${replyTo}...` : 'Adicione um comentário...'}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 text-sm"
                autoFocus
              />
              <Button size="icon" onClick={handleSend} disabled={!text.trim()} variant="ghost" className="text-primary">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-t border-border p-4 text-center">
            <Link to="/auth" className="text-primary font-semibold text-sm hover:underline">
              Entre para comentar
            </Link>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
