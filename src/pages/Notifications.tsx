import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNotifications, useMarkAsRead, Notification } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Heart, MessageCircle, UserPlus, Bell } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const typeConfig = {
  like: { icon: Heart, label: 'curtiu seu post', color: 'text-red-500' },
  comment: { icon: MessageCircle, label: 'comentou no seu post', color: 'text-blue-500' },
  follow: { icon: UserPlus, label: 'começou a seguir você', color: 'text-green-500' },
};

export default function Notifications() {
  const { user } = useAuth();
  const { data: notifications, isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();

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
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">Notificações</h1>
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
            <NotificationItem key={notif.id} notification={notif} />
          ))}
        </div>
      )}
    </main>
  );
}

function NotificationItem({ notification }: { notification: Notification }) {
  const config = typeConfig[notification.type];
  const Icon = config.icon;

  const linkTo = notification.type === 'follow'
    ? `/profile/${notification.actor?.username}`
    : notification.post_id
      ? `/post/${notification.post_id}`
      : '#';

  return (
    <Link
      to={linkTo}
      className={cn(
        "flex items-center gap-3 p-4 border-b hover:bg-muted/50 transition-colors",
        !notification.read && "bg-primary/5"
      )}
    >
      <div className="relative">
        <Avatar className="w-10 h-10">
          <AvatarImage src={notification.actor?.avatar_url ?? undefined} />
          <AvatarFallback>{notification.actor?.username?.[0]?.toUpperCase() ?? '?'}</AvatarFallback>
        </Avatar>
        <div className={cn("absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background flex items-center justify-center")}>
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
  );
}
