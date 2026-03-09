import { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useStories, useCreateStory, Story } from '@/hooks/useStories';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function StoriesBar() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: storiesMap } = useStories();
  const createStory = useCreateStory();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewingStories, setViewingStories] = useState<Story[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleCreateStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await createStory.mutateAsync(file);
      toast.success('Story publicado!');
    } catch {
      toast.error('Erro ao publicar story');
    }
    e.target.value = '';
  };

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

  return (
    <>
      <div className="flex gap-4 overflow-x-auto py-4 px-2 scrollbar-hide">
        {/* Add story button */}
        {user && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-1 min-w-[68px]"
            disabled={createStory.isPending}
          >
            <div className="relative">
              <Avatar className="w-16 h-16 border-2 border-muted">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback>{profile?.username?.[0]?.toUpperCase() ?? '?'}</AvatarFallback>
              </Avatar>
              <div className={cn(
                "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-primary-foreground",
                hasOwnStory ? "gradient-brand" : "bg-primary"
              )}>
                <Plus className="w-3 h-3" />
              </div>
            </div>
            <span className="text-xs text-muted-foreground truncate w-16 text-center">
              {createStory.isPending ? '...' : 'Seu story'}
            </span>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCreateStory} className="hidden" />
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
              <span className="text-xs truncate w-16 text-center">{storyUser.username}</span>
            </button>
          );
        })}
      </div>

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

              <img
                src={viewingStories[currentIndex].image_url}
                alt="Story"
                className="w-full aspect-[9/16] object-cover"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
