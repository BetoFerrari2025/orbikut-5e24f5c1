import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNotifications, useMarkAsRead, useDeleteNotification, useDeleteAllNotifications, Notification } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, UserPlus, Bell, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type FilterType = 'all' | 'like' | 'comment' | 'follow';

export default function Notifications() {
  const { t } = useTranslation();

  const typeConfig = {
    like: { icon: Heart, label: t('notifications.likedPost'), color: 'text-red-500' },
    comment: { icon: MessageCircle, label: t('notifications.commentedPost'), color: 'text-blue-500' },
    follow: { icon: UserPlus, label: t('notifications.followedYou'), color: 'text-green-500' },
  };

  const filters: { value: FilterType; label: string; icon: typeof Heart }[] = [
    { value: 'all', label: t('notifications.all'), icon: Bell },
    { value: 'like', label: t('notifications.likesFilter'), icon: Heart },
    { value: 'comment', label: t('notifications.commentsFilter'), icon: MessageCircle },
    { value: 'follow', label: t('notifications.followersFilter'), icon: UserPlus },
  ];
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
        <p className="text-muted-foreground">{t('notifications.loginRequired')}</p>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto">
      <div className="p-4 border-b flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('notifications.title')}</h1>
        {notifications && notifications.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-1" /> {t('notifications.deleteAll')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('notifications.deleteAllConfirm')}</AlertDialogTitle>
                <AlertDialogDescription>{t('notifications.deleteAllDesc')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('notifications.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteAll.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {t('notifications.deleteAll')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 px-4 py-2 border-b overflow-x-auto">
        {filters.map(f => {
          const Icon = f.icon;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                filter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {f.label}
            </button>
          );
        })}
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

      {!isLoading && (!filteredNotifications || filteredNotifications.length === 0) && (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('notifications.noNotifications')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('notifications.noNotificationsDesc')}</p>
        </div>
      )}

      {filteredNotifications && filteredNotifications.length > 0 && (
        <div>
          {filteredNotifications.map((notif) => (
            <NotificationItem key={notif.id} notification={notif} onDelete={(id) => deleteOne.mutate(id)} />
          ))}
        </div>
      )}
    </main>
  );
}

function NotificationItem({ notification, onDelete }: { notification: Notification; onDelete: (id: string) => void }) {
  const { t } = useTranslation();
  const typeConfig = {
    like: { icon: Heart, label: t('notifications.likedPost'), color: 'text-red-500' },
    comment: { icon: MessageCircle, label: t('notifications.commentedPost'), color: 'text-blue-500' },
    follow: { icon: UserPlus, label: t('notifications.followedYou'), color: 'text-green-500' },
  };
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
