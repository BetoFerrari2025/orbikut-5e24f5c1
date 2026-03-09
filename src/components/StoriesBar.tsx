import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useStories, Story } from '@/hooks/useStories';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { CreateStoryWithPoll } from '@/components/CreateStoryWithPoll';
import { StoryViewer } from '@/components/StoryViewer';
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

  const userGroups = storiesMap ? Array.from(storiesMap.entries()) : [];
  const hasOwnStory = user ? storiesMap?.has(user.id) : false;

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
      <StoryViewer
        stories={viewingStories}
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
        onClose={() => setViewingStories(null)}
        onAddStory={() => {
          setViewingStories(null);
          setShowCreateStory(true);
        }}
      />
    </>
  );
}
