import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus } from 'lucide-react';
import { useUserHighlights, useHighlightStories } from '@/hooks/useHighlights';
import { StoryViewer } from '@/components/StoryViewer';
import { Story } from '@/hooks/useStories';
import { cn } from '@/lib/utils';

interface ProfileHighlightsProps {
  userId: string;
  isOwnProfile: boolean;
}

export function ProfileHighlights({ userId, isOwnProfile }: ProfileHighlightsProps) {
  const { data: highlights } = useUserHighlights(userId);
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null);

  if (!highlights || highlights.length === 0) return null;

  return (
    <>
      <div className="flex gap-4 overflow-x-auto py-4 scrollbar-hide">
        {highlights.map((h: any) => (
          <button
            key={h.id}
            onClick={() => setSelectedHighlightId(h.id)}
            className="flex flex-col items-center gap-1 min-w-[68px]"
          >
            <div className="p-[2px] rounded-full border-2 border-muted-foreground/30">
              <Avatar className="w-14 h-14 border-2 border-background">
                {h.cover_url ? (
                  <AvatarImage src={h.cover_url} />
                ) : (
                  <AvatarFallback className="text-xs bg-muted">{h.name[0]?.toUpperCase()}</AvatarFallback>
                )}
              </Avatar>
            </div>
            <span className="text-xs text-foreground truncate w-16 text-center">{h.name}</span>
          </button>
        ))}
      </div>

      {selectedHighlightId && (
        <HighlightViewer
          highlightId={selectedHighlightId}
          onClose={() => setSelectedHighlightId(null)}
        />
      )}
    </>
  );
}

function HighlightViewer({ highlightId, onClose }: { highlightId: string; onClose: () => void }) {
  const { data: items } = useHighlightStories(highlightId);
  const [currentIndex, setCurrentIndex] = useState(0);

  const stories: Story[] | null = items?.map((item: any) => ({
    ...item.stories,
    profiles: item.stories.profiles,
  })) ?? null;

  if (!stories || stories.length === 0) {
    onClose();
    return null;
  }

  return (
    <StoryViewer
      stories={stories}
      currentIndex={currentIndex}
      setCurrentIndex={setCurrentIndex}
      onClose={onClose}
      onAddStory={() => {}}
    />
  );
}
