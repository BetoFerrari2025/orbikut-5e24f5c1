import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfileByUsername, useUserPosts, useFollowStatus, useToggleFollow, useFollowersCount, useFollowingCount } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useGetOrCreateConversation } from '@/hooks/useMessages';
import { useSendNotification } from '@/hooks/useNotifications';
import { StreakBadge } from '@/components/StreakBadge';
import { Grid3X3, Settings, MessageCircle, Film, Bookmark, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useSavedPosts, usePostViews } from '@/hooks/usePostExtras';
import { PostCard } from '@/components/PostCard';

const isVideo = (url: string) => /\.(mp4|webm|mov)$/i.test(url);

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useProfileByUsername(username);
  const { data: posts, isLoading: postsLoading } = useUserPosts(profile?.id);
  const { data: followStatus } = useFollowStatus(profile?.id);
  const { data: followersCount } = useFollowersCount(profile?.id);
  const { data: followingCount } = useFollowingCount(profile?.id);
  const toggleFollow = useToggleFollow();
  const getOrCreateConversation = useGetOrCreateConversation();
  const sendNotification = useSendNotification();

  const isOwnProfile = user?.id === profile?.id;
  const { data: savedPosts, isLoading: savedLoading } = useSavedPosts();

  const photoPosts = useMemo(() => posts?.filter(p => !isVideo(p.image_url)) ?? [], [posts]);
  const videoPosts = useMemo(() => posts?.filter(p => isVideo(p.image_url)) ?? [], [posts]);

  const handleFollowToggle = () => {
    if (!profile || !followStatus || !user) return;
    toggleFollow.mutate({ targetUserId: profile.id, isFollowing: followStatus.isFollowing });
    if (!followStatus.isFollowing) {
      sendNotification.mutate({ userId: profile.id, actorId: user.id, type: 'follow' });
    }
  };

  const handleMessage = async () => {
    if (!profile) return;
    try {
      await getOrCreateConversation.mutateAsync(profile.id);
      navigate('/messages');
    } catch { /* ignore */ }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-6 mb-4">
            <Skeleton className="w-24 h-24 sm:w-36 sm:h-36 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
          <div className="flex gap-6 mb-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h2 className="text-xl font-semibold text-foreground">Usuário não encontrado</h2>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile header - top row: avatar + username + actions */}
        <div className="flex items-center gap-4 sm:gap-6 mb-4">
          <Avatar className="w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-2xl sm:text-4xl">
              {profile.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">{profile.username}</h1>
              {(profile as any).current_streak > 0 && (
                <StreakBadge streak={(profile as any).current_streak} />
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isOwnProfile ? (
                <Button variant="secondary" size="sm" asChild>
                  <Link to="/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Editar perfil
                  </Link>
                </Button>
              ) : user ? (
                <>
                  <Button
                    onClick={handleFollowToggle}
                    disabled={toggleFollow.isPending}
                    variant={followStatus?.isFollowing ? 'secondary' : 'default'}
                    className={!followStatus?.isFollowing ? 'gradient-brand hover:opacity-90' : ''}
                    size="sm"
                  >
                    {followStatus?.isFollowing ? 'Seguindo' : 'Seguir'}
                  </Button>
                  <Button variant="secondary" size="icon" onClick={handleMessage} disabled={getOrCreateConversation.isPending}>
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-6 mb-4 text-sm sm:text-base text-foreground">
          <div>
            <span className="font-semibold">{posts?.length ?? 0}</span> publicações
          </div>
          <div>
            <span className="font-semibold">{followersCount ?? 0}</span> seguidores
          </div>
          <div>
            <span className="font-semibold">{followingCount ?? 0}</span> seguindo
          </div>
        </div>

        {/* Bio - full width below */}
        {profile.full_name && (
          <p className="font-semibold text-foreground">{profile.full_name}</p>
        )}
        {profile.bio && (
          <p className="text-sm whitespace-pre-wrap text-foreground mb-4">{profile.bio}</p>
        )}

        {/* Tabs */}
        <Tabs defaultValue="photos" className="w-full">
          <TabsList className="w-full bg-transparent border-t rounded-none h-auto p-0">
            <TabsTrigger
              value="photos"
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-none border-t-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent -mt-px"
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="text-sm font-semibold uppercase tracking-wide">Fotos</span>
            </TabsTrigger>
            <TabsTrigger
              value="videos"
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-none border-t-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent -mt-px"
            >
              <Film className="w-4 h-4" />
              <span className="text-sm font-semibold uppercase tracking-wide">Vídeos</span>
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger
                value="saved"
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-none border-t-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent -mt-px"
              >
                <Bookmark className="w-4 h-4" />
                <span className="text-sm font-semibold uppercase tracking-wide">Salvos</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="photos">
            {postsLoading ? (
              <div className="grid grid-cols-3 gap-1">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="aspect-square" />
                ))}
              </div>
            ) : photoPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {photoPosts.map((post) => (
                  <ProfileGridItem key={post.id} post={post} type="photo" />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Grid3X3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma foto ainda</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="videos">
            {postsLoading ? (
              <div className="grid grid-cols-3 gap-1">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="aspect-[9/16]" />
                ))}
              </div>
            ) : videoPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {videoPosts.map((post) => (
                  <ProfileGridItem key={post.id} post={post} type="video" />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Film className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum vídeo ainda</p>
              </div>
            )}
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="saved">
              {savedLoading ? (
                <div className="grid grid-cols-3 gap-1">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="aspect-square" />
                  ))}
                </div>
              ) : savedPosts && savedPosts.length > 0 ? (
                <div className="space-y-6 max-w-lg mx-auto">
                  {savedPosts.map((post: any) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bookmark className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum post salvo ainda</p>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </main>
      <BottomNav />
    </div>
  );
}
