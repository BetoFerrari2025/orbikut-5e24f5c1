import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfileByUsername, useUserPosts, useFollowStatus, useToggleFollow, useFollowersCount, useFollowingCount } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useGetOrCreateConversation } from '@/hooks/useMessages';
import { Grid3X3, Settings, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';

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

  const isOwnProfile = user?.id === profile?.id;

  const handleFollowToggle = () => {
    if (!profile || !followStatus) return;
    toggleFollow.mutate({ targetUserId: profile.id, isFollowing: followStatus.isFollowing });
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
          <div className="flex items-start gap-8 mb-8">
            <Skeleton className="w-24 h-24 sm:w-36 sm:h-36 rounded-full" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-24" />
              <div className="flex gap-6">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
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
          <h2 className="text-xl font-semibold">Usuário não encontrado</h2>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile header */}
        <div className="flex items-start gap-6 sm:gap-12 mb-8">
          <Avatar className="w-20 h-20 sm:w-36 sm:h-36">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-2xl sm:text-4xl">
              {profile.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-semibold">{profile.username}</h1>
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
                  >
                    {followStatus?.isFollowing ? 'Seguindo' : 'Seguir'}
                  </Button>
                  <Button variant="secondary" size="icon" onClick={handleMessage} disabled={getOrCreateConversation.isPending}>
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </>
              ) : null}
            </div>

            <div className="flex gap-6 mb-4 text-sm sm:text-base">
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

            {profile.full_name && (
              <p className="font-semibold">{profile.full_name}</p>
            )}
            {profile.bio && (
              <p className="text-sm whitespace-pre-wrap">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t">
          <div className="flex justify-center">
            <button className="flex items-center gap-2 py-4 border-t border-foreground -mt-px">
              <Grid3X3 className="w-4 h-4" />
              <span className="text-sm font-semibold uppercase tracking-wide">Publicações</span>
            </button>
          </div>
        </div>

        {/* Posts grid */}
        {postsLoading ? (
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <div key={post.id} className="aspect-square bg-muted">
                <img
                  src={post.image_url}
                  alt={post.caption ?? 'Post'}
                  className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-pointer"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Grid3X3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma publicação ainda</p>
          </div>
        )}
      </main>
    </div>
  );
}
