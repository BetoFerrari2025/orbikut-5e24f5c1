import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNotifications, useMarkAsRead, useDeleteNotification, useDeleteAllNotifications, Notification } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Heart, MessageCircle, UserPlus, Bell, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const typeConfig = {
  like: { icon: Heart, label: 'curtiu seu post', color: 'text-red-500' },
  comment: { icon: MessageCircle, label: 'comentou no seu post', color: 'text-blue-500' },
  follow: { icon: UserPlus, label: 'começou a seguir você', color: 'text-green-500' },
};

type FilterType = 'all' | 'like' | 'comment' | 'follow';

const filters: { value: FilterType; label: string; icon: typeof Heart }[] = [
  { value: 'all', label: 'Todas', icon: Bell },
  { value: 'like', label: 'Curtidas', icon: Heart },
  { value: 'comment', label: 'Comentários', icon: MessageCircle },
  { value: 'follow', label: 'Seguidores', icon: UserPlus },
];

export default function Notifications() {
  const { user } = useAuth();
  const { data: notifications, isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const deleteOne = useDeleteNotification();
  const deleteAll = useDeleteAllNotifications();
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredNotifications = notifications?.filter(
    n => filter === 'all' || n.type === filter
  );

  useEffect(() => {
    if (notifications && notifications.some(n => !n.read)) {
      markAsRead.mutate();
    }
  }, [notifications]);

  if (!user) {
    return (
      <main className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Faça login para ver suas notificações.</p>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto">
      <div className="p-4 border-b flex items-center justify-between">
        <h1 className="text-xl font-bold">Notificações</h1>
        {notifications && notifications.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-1" /> Excluir tudo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir todas as notificações?</AlertDialogTitle>
                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteAll.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Excluir tudo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {isLoading && (
        <div className="space-y-0">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3 p-4 border-b">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && (!notifications || notifications.length === 0) && (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhuma notificação ainda</p>
          <p className="text-sm text-muted-foreground mt-1">Quando alguém curtir, comentar ou seguir você, aparecerá aqui</p>
        </div>
      )}

      {notifications && notifications.length > 0 && (
        <div>
          {notifications.map((notif) => (
            <NotificationItem key={notif.id} notification={notif} onDelete={(id) => deleteOne.mutate(id)} />
          ))}
        </div>
      )}
    </main>
  );
}

function NotificationItem({ notification, onDelete }: { notification: Notification; onDelete: (id: string) => void }) {
  const config = typeConfig[notification.type];
  const Icon = config.icon;

  const linkTo = notification.type === 'follow'
    ? `/profile/${notification.actor?.username}`
    : notification.post_id
      ? `/post/${notification.post_id}`
      : '#';

  return (
    <div className={cn(
      "flex items-center gap-3 p-4 border-b hover:bg-muted/50 transition-colors",
      !notification.read && "bg-primary/5"
    )}>
      <Link to={linkTo} className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative shrink-0">
          <Avatar className="w-10 h-10">
            <AvatarImage src={notification.actor?.avatar_url ?? undefined} />
            <AvatarFallback>{notification.actor?.username?.[0]?.toUpperCase() ?? '?'}</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background flex items-center justify-center">
            <Icon className={cn("w-3 h-3", config.color)} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm">
            <span className="font-semibold">{notification.actor?.username ?? 'Alguém'}</span>
            {' '}{config.label}
            {notification.content && (
              <span className="text-muted-foreground">: "{notification.content}"</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDistanceToNow(new Date(notification.created_at), { locale: ptBR, addSuffix: true })}
          </p>
        </div>
      </Link>

      <button
        onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
        className="shrink-0 p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
