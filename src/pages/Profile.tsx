import { useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfile, useProfileByUsername, useUserPosts, useFollowStatus, useToggleFollow, useFollowersCount, useFollowingCount } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useGetOrCreateConversation } from '@/hooks/useMessages';
import { useSendNotification } from '@/hooks/useNotifications';
import { StreakBadge } from '@/components/StreakBadge';
import { PremiumBadge } from '@/components/PremiumBadge';
import { Grid3X3, Settings, MessageCircle, Film, Bookmark, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useSavedPosts, usePostViews } from '@/hooks/usePostExtras';
import { PostCard } from '@/components/PostCard';
import { ProfileHighlights } from '@/components/ProfileHighlights';
import { ProfileLinks } from '@/components/ProfileLinks';
import { OnlineIndicator } from '@/components/OnlineIndicator';
import { isUserOnline } from '@/hooks/useOnlineStatus';
import { useTranslation } from 'react-i18next';
import { usePagePresence } from '@/hooks/usePagePresence';

const isVideo = (url: string) => /\.(mp4|webm|mov)$/i.test(url);
const MAX_PROFILE_RETRIES = 8;

export default function Profile() {
  usePagePresence('profile');
  const { t } = useTranslation();
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useProfileByUsername(username);
  const authUsername = typeof user?.user_metadata?.username === 'string' ? user.user_metadata.username.trim() : '';
  const isOwnPendingRoute = Boolean(user && username && (username === authUsername || username === 'undefined' || username === 'null'));
  const { data: ownProfile, isLoading: ownProfileLoading, refetch: refetchOwnProfile } = useProfile(isOwnPendingRoute ? user?.id : undefined);
  const resolvedProfile = profile ?? (isOwnPendingRoute ? ownProfile ?? null : null);
  const { data: posts, isLoading: postsLoading } = useUserPosts(resolvedProfile?.id);
  const { data: followStatus } = useFollowStatus(resolvedProfile?.id);
  const { data: followersCount } = useFollowersCount(resolvedProfile?.id);
  const { data: followingCount } = useFollowingCount(resolvedProfile?.id);
  const toggleFollow = useToggleFollow();
  const getOrCreateConversation = useGetOrCreateConversation();
  const sendNotification = useSendNotification();

  const retryRef = useRef(0);

  useEffect(() => {
    retryRef.current = 0;
  }, [username, user?.id]);

  useEffect(() => {
    if (!isOwnPendingRoute || !ownProfile?.username || ownProfile.username === username) return;
    navigate(`/profile/${ownProfile.username}`, { replace: true });
  }, [isOwnPendingRoute, ownProfile?.username, username, navigate]);

  useEffect(() => {
    if (
      profileLoading ||
      ownProfileLoading ||
      resolvedProfile ||
      !isOwnPendingRoute ||
      retryRef.current >= MAX_PROFILE_RETRIES
    ) {
      return;
    }

    const timer = setTimeout(() => {
      retryRef.current += 1;
      void refetchProfile();
      void refetchOwnProfile();
    }, 1200);

    return () => clearTimeout(timer);
  }, [profileLoading, ownProfileLoading, resolvedProfile, isOwnPendingRoute, refetchProfile, refetchOwnProfile]);

  const isRecoveringOwnProfile = isOwnPendingRoute && !resolvedProfile && retryRef.current < MAX_PROFILE_RETRIES;

  const isOwnProfile = user?.id === resolvedProfile?.id;
  const { data: savedPosts, isLoading: savedLoading } = useSavedPosts();

  const photoPosts = useMemo(() => posts?.filter(p => p.image_url && !isVideo(p.image_url)) ?? [], [posts]);
  const videoPosts = useMemo(() => posts?.filter(p => p.image_url && isVideo(p.image_url)) ?? [], [posts]);
  const textPosts = useMemo(() => posts?.filter(p => !p.image_url) ?? [], [posts]);

  const handleFollowToggle = () => {
    if (!resolvedProfile || !followStatus || !user) return;
    toggleFollow.mutate({ targetUserId: resolvedProfile.id, isFollowing: followStatus.isFollowing });
    if (!followStatus.isFollowing) {
      sendNotification.mutate({ userId: resolvedProfile.id, actorId: user.id, type: 'follow' });
    }
  };

  const handleMessage = async () => {
    if (!resolvedProfile) return;
    try { await getOrCreateConversation.mutateAsync(resolvedProfile.id); navigate('/messages'); } catch { /* ignore */ }
  };

  if (profileLoading || ownProfileLoading || isRecoveringOwnProfile) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-6 mb-4">
          <Skeleton className="w-24 h-24 sm:w-36 sm:h-36 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-4"><Skeleton className="h-6 w-32" /><Skeleton className="h-10 w-24" /></div>
        </div>
      </main>
    );
  }

  if (!resolvedProfile) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-xl font-semibold text-foreground">{t('profile.userNotFound')}</h2>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 sm:gap-6 mb-4">
        <div className="relative flex-shrink-0">
          <Avatar className="w-20 h-20 sm:w-28 sm:h-28">
            <AvatarImage src={resolvedProfile.avatar_url ?? undefined} />
            <AvatarFallback className="text-2xl sm:text-4xl">{resolvedProfile.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <OnlineIndicator isOnline={isUserOnline((resolvedProfile as any).last_seen)} size="md" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">{resolvedProfile.username}</h1>
            <PremiumBadge userId={resolvedProfile.id} size="md" />
            {(resolvedProfile as any).current_streak > 0 && <StreakBadge streak={(resolvedProfile as any).current_streak} />}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isOwnProfile ? (
              <Button variant="secondary" size="sm" asChild>
                <Link to="/settings"><Settings className="w-4 h-4 mr-2" />{t('profile.editProfile')}</Link>
              </Button>
            ) : user ? (
              <>
                <Button onClick={handleFollowToggle} disabled={toggleFollow.isPending} variant={followStatus?.isFollowing ? 'secondary' : 'default'} className={!followStatus?.isFollowing ? 'gradient-brand hover:opacity-90' : ''} size="sm">
                  {followStatus?.isFollowing ? t('profile.following') : t('profile.follow')}
                </Button>
                <Button variant="secondary" size="icon" onClick={handleMessage} disabled={getOrCreateConversation.isPending}>
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex gap-6 mb-4 text-sm sm:text-base text-foreground">
        <div><span className="font-semibold">{posts?.length ?? 0}</span> {t('profile.posts')}</div>
        <div><span className="font-semibold">{followersCount ?? 0}</span> {t('profile.followers')}</div>
        <div><span className="font-semibold">{followingCount ?? 0}</span> {t('profile.followingCount')}</div>
      </div>

      {resolvedProfile.full_name && <p className="font-semibold text-foreground">{resolvedProfile.full_name}</p>}
      {resolvedProfile.bio && <p className="text-sm whitespace-pre-wrap text-foreground mb-2">{resolvedProfile.bio}</p>}
      <ProfileLinks userId={resolvedProfile.id} isOwnProfile={isOwnProfile} />
      <ProfileHighlights userId={resolvedProfile.id} isOwnProfile={isOwnProfile} />

      <Tabs defaultValue="photos" className="w-full">
        <TabsList className="w-full bg-transparent border-t rounded-none h-auto p-0">
          <TabsTrigger value="photos" className="flex-1 flex items-center justify-center gap-2 py-4 rounded-none border-t-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent -mt-px">
            <Grid3X3 className="w-4 h-4" /><span className="text-sm font-semibold uppercase tracking-wide">{t('profile.photos')}</span>
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex-1 flex items-center justify-center gap-2 py-4 rounded-none border-t-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent -mt-px">
            <Film className="w-4 h-4" /><span className="text-sm font-semibold uppercase tracking-wide">{t('profile.videos')}</span>
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger value="saved" className="flex-1 flex items-center justify-center gap-2 py-4 rounded-none border-t-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent -mt-px">
              <Bookmark className="w-4 h-4" /><span className="text-sm font-semibold uppercase tracking-wide">{t('profile.saved')}</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="photos">
          {postsLoading ? (
            <div className="grid grid-cols-3 gap-1">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="aspect-square" />)}</div>
          ) : photoPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">{photoPosts.map(post => <ProfileGridItem key={post.id} post={post} type="photo" />)}</div>
          ) : (
            <div className="text-center py-12"><Grid3X3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">{t('profile.noPhotos')}</p></div>
          )}
        </TabsContent>

        <TabsContent value="videos">
          {postsLoading ? (
            <div className="grid grid-cols-3 gap-1">{[1,2,3].map(i => <Skeleton key={i} className="aspect-[9/16]" />)}</div>
          ) : videoPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">{videoPosts.map(post => <ProfileGridItem key={post.id} post={post} type="video" />)}</div>
          ) : (
            <div className="text-center py-12"><Film className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">{t('profile.noVideos')}</p></div>
          )}
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="saved">
            {savedLoading ? (
              <div className="grid grid-cols-3 gap-1">{[1,2,3].map(i => <Skeleton key={i} className="aspect-square" />)}</div>
            ) : savedPosts && savedPosts.length > 0 ? (
              <div className="space-y-6 max-w-lg mx-auto">{savedPosts.map((post: any) => <PostCard key={post.id} post={post} />)}</div>
            ) : (
              <div className="text-center py-12"><Bookmark className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">{t('profile.noSaved')}</p></div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </main>
  );
}

function ProfileGridItem({ post, type }: { post: any; type: 'photo' | 'video' }) {
  const { data: viewCount } = usePostViews(post.id);
  if (type === 'video') {
    return (
      <Link to={`/post/${post.id}`} className="aspect-[9/16] bg-muted relative group block">
        <video src={post.image_url} className="w-full h-full object-cover cursor-pointer" muted playsInline onMouseEnter={(e) => e.currentTarget.play()} onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }} />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
        <div className="absolute bottom-1 left-1 flex items-center gap-1 text-white text-xs bg-black/50 rounded px-1.5 py-0.5"><Eye className="w-3 h-3" /><span>{viewCount ?? 0}</span></div>
        <div className="absolute top-1 right-1"><Film className="w-4 h-4 text-white drop-shadow" /></div>
      </Link>
    );
  }
  return (
    <Link to={`/post/${post.id}`} className="aspect-square bg-muted relative group block">
      <img src={post.image_url} alt={post.caption ?? 'Post'} className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-pointer" />
      <div className="absolute bottom-1 left-1 flex items-center gap-1 text-white text-xs bg-black/50 rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><Eye className="w-3 h-3" /><span>{viewCount ?? 0}</span></div>
    </Link>
  );
}