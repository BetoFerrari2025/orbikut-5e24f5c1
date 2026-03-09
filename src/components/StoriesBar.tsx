import { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useStories, Story } from '@/hooks/useStories';
import { useStoryPoll, useVotePoll, useUserVote } from '@/hooks/useStoryPolls';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { CreateStoryWithPoll } from '@/components/CreateStoryWithPoll';
import { cn } from '@/lib/utils';

export function StoriesBar() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: storiesMap } = useStories();
  const [viewingStories, setViewingStories] = useState<Story[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCreateStory, setShowCreateStory] = useState(false);

  const openStories = (stories: Story[]) => {
    setViewingStories(stories);
    setCurrentIndex(0);
  };

  const handleStoryNav = (e: React.MouseEvent) => {
    if (!viewingStories) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX < rect.width / 2) {
      if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    } else {
      if (currentIndex < viewingStories.length - 1) setCurrentIndex(currentIndex + 1);
      else setViewingStories(null);
    }
  };

  const userGroups = storiesMap ? Array.from(storiesMap.entries()) : [];
  const hasOwnStory = user ? storiesMap?.has(user.id) : false;

  const isVideo = (url: string) => /\.(mp4|webm|mov|avi)$/i.test(url);

  return (
    <>
      <div className="flex gap-4 overflow-x-auto py-4 px-2 scrollbar-hide">
        {/* Add story button */}
        {user && (
          <button
            onClick={() => {
              if (hasOwnStory) {
                const ownStories = storiesMap?.get(user.id);
                if (ownStories) openStories(ownStories);
              } else {
                setShowCreateStory(true);
              }
            }}
            className="flex flex-col items-center gap-1 min-w-[68px]"
          >
            <div className="relative">
              <Avatar className={cn("w-16 h-16 border-2", hasOwnStory ? "border-transparent" : "border-muted")}>
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback>{profile?.username?.[0]?.toUpperCase() ?? '?'}</AvatarFallback>
              </Avatar>
              {hasOwnStory && (
                <div className="absolute inset-0 rounded-full p-[2px] gradient-brand -m-[2px]">
                  <div className="w-full h-full rounded-full bg-background" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-primary-foreground z-10 bg-primary">
                <Plus className="w-3 h-3" />
              </div>
            </div>
            <span className="text-xs text-muted-foreground truncate w-16 text-center">Seu story</span>
          </button>
        )}

        {/* Other users' stories */}
        {userGroups.map(([userId, stories]) => {
          if (userId === user?.id) return null;
          const storyUser = stories[0].profiles;
          return (
            <button
              key={userId}
              onClick={() => openStories(stories)}
              className="flex flex-col items-center gap-1 min-w-[68px]"
            >
              <div className="p-[2px] rounded-full gradient-brand">
                <Avatar className="w-[60px] h-[60px] border-2 border-background">
                  <AvatarImage src={storyUser.avatar_url ?? undefined} />
                  <AvatarFallback>{storyUser.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
              <span className="text-xs text-foreground truncate w-16 text-center">{storyUser.username}</span>
            </button>
          );
        })}
      </div>

      {/* Create story with poll */}
      <CreateStoryWithPoll open={showCreateStory} onOpenChange={setShowCreateStory} />

      {/* Story viewer */}
      <Dialog open={!!viewingStories} onOpenChange={(open) => !open && setViewingStories(null)}>
        <DialogContent className="max-w-md p-0 bg-black border-none overflow-hidden [&>button]:text-white [&>button]:z-20">
          {viewingStories && viewingStories[currentIndex] && (
            <div className="relative" onClick={handleStoryNav}>
              {/* Progress bars */}
              <div className="absolute top-2 left-2 right-2 z-10 flex gap-1">
                {viewingStories.map((_, i) => (
                  <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30">
                    <div className={cn("h-full rounded-full bg-white", i <= currentIndex ? "w-full" : "w-0")} />
                  </div>
                ))}
              </div>

              {/* User info */}
              <div className="absolute top-6 left-3 z-10 flex items-center gap-2">
                <Avatar className="w-8 h-8 border border-white/50">
                  <AvatarImage src={viewingStories[currentIndex].profiles.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">{viewingStories[currentIndex].profiles.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-white text-sm font-semibold">{viewingStories[currentIndex].profiles.username}</span>
              </div>

              {isVideo(viewingStories[currentIndex].image_url) ? (
                <video
                  src={viewingStories[currentIndex].image_url}
                  className="w-full aspect-[9/16] object-cover"
                  autoPlay
                  muted
                  playsInline
                  loop
                />
              ) : (
                <img
                  src={viewingStories[currentIndex].image_url}
                  alt="Story"
                  className="w-full aspect-[9/16] object-cover"
                />
              )}

              {/* Story Poll overlay */}
              <StoryPollOverlay storyId={viewingStories[currentIndex].id} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function StoryPollOverlay({ storyId }: { storyId: string }) {
  const { data: poll } = useStoryPoll(storyId);
  const votePoll = useVotePoll();
  const { data: userVote } = useUserVote(poll?.id ?? '');
  const { user } = useAuth();

  if (!poll) return null;

  const handleVote = (option: 'A' | 'B') => {
    if (!user || userVote) return;
    votePoll.mutate({ pollId: poll.id, option, storyId });
  };

  return (
    <div className="absolute bottom-8 left-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
      <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 space-y-3">
        <p className="text-white font-semibold text-center">{poll.question}</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleVote('A')}
            className={cn(
              "relative overflow-hidden rounded-lg p-3 text-white font-medium transition-all",
              userVote === 'A' ? "ring-2 ring-primary" : "",
              !userVote ? "hover:scale-105 bg-primary/40" : "bg-primary/30"
            )}
          >
            {userVote && (
              <div
                className="absolute inset-0 bg-primary/50"
                style={{ width: `${poll.percentA}%` }}
              />
            )}
            <span className="relative z-10">
              {poll.option_a}
              {userVote && <span className="ml-2 text-sm">{poll.percentA}%</span>}
            </span>
          </button>
          <button
            onClick={() => handleVote('B')}
            className={cn(
              "relative overflow-hidden rounded-lg p-3 text-white font-medium transition-all",
              userVote === 'B' ? "ring-2 ring-accent" : "",
              !userVote ? "hover:scale-105 bg-accent/40" : "bg-accent/30"
            )}
          >
            {userVote && (
              <div
                className="absolute inset-0 bg-accent/50"
                style={{ width: `${poll.percentB}%` }}
              />
            )}
            <span className="relative z-10">
              {poll.option_b}
              {userVote && <span className="ml-2 text-sm">{poll.percentB}%</span>}
            </span>
          </button>
        </div>
        {userVote && (
          <p className="text-white/70 text-xs text-center">{poll.total} votos</p>
        )}
      </div>
    </div>
  );
}
