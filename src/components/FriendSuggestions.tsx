import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { useToggleFollow } from '@/hooks/useProfile';
import { useSendNotification } from '@/hooks/useNotifications';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

function useSuggestedUsers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['suggested-users', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get users I already follow
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds = following?.map((f) => f.following_id) ?? [];
      const excludeIds = [user.id, ...followingIds];

      // Get random users I don't follow
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .not('is_blocked', 'eq', true)
        .limit(10);

      if (error) throw error;

      // Shuffle and take 3
      const shuffled = (data ?? []).sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 3);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function FriendSuggestions() {
  const { t } = useTranslation();
  const { data: suggestions, isLoading } = useSuggestedUsers();
  const { user } = useAuth();
  const toggleFollow = useToggleFollow();
  const sendNotification = useSendNotification();
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  if (!user || isLoading || !suggestions?.length) return null;

  const handleFollow = (targetUserId: string) => {
    toggleFollow.mutate({ targetUserId, isFollowing: false });
    sendNotification.mutate({ userId: targetUserId, actorId: user.id, type: 'follow' });
    setFollowedIds((prev) => new Set(prev).add(targetUserId));
  };

  const visibleSuggestions = suggestions.filter((s) => !followedIds.has(s.id));
  if (!visibleSuggestions.length) return null;

  return (
    <div className="bg-card border-y md:border md:rounded-lg overflow-hidden -mx-4 md:mx-0 w-[calc(100%+2rem)] md:w-full p-4">
      <p className="text-sm font-semibold text-foreground mb-3">{t('suggestions.title')}</p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {visibleSuggestions.map((profile) => (
          <div
            key={profile.id}
            className="flex flex-col items-center gap-2 min-w-[110px] bg-muted/50 rounded-xl p-3 border border-border"
          >
            <Link to={`/profile/${profile.username}`}>
              <Avatar className="w-14 h-14 ring-2 ring-primary/20">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {profile.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Link to={`/profile/${profile.username}`} className="text-center">
              <p className="text-xs font-semibold text-foreground truncate max-w-[90px]">
                {profile.full_name || profile.username}
              </p>
              <p className="text-[10px] text-muted-foreground truncate max-w-[90px]">
                @{profile.username}
              </p>
            </Link>
            <Button
              size="sm"
              className="h-7 text-xs w-full gap-1"
              onClick={() => handleFollow(profile.id)}
              disabled={toggleFollow.isPending}
            >
              <UserPlus className="w-3 h-3" />
              {t('suggestions.follow')}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
