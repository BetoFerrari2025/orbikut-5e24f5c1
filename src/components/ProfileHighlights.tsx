import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, X } from 'lucide-react';
import { useUserHighlights, useHighlightStories, useDeleteHighlight, useUpdateHighlightName } from '@/hooks/useHighlights';
import { StoryViewer } from '@/components/StoryViewer';
import { Story } from '@/hooks/useStories';
import { toast } from 'sonner';

interface ProfileHighlightsProps {
  userId: string;
  isOwnProfile: boolean;
}

export function ProfileHighlights({ userId, isOwnProfile }: ProfileHighlightsProps) {
  const { data: highlights } = useUserHighlights(userId);
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const deleteHighlight = useDeleteHighlight();
  const updateName = useUpdateHighlightName();

  if (!highlights || highlights.length === 0) return null;

  const handleStartEdit = (h: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(h.id);
    setEditName(h.name);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await updateName.mutateAsync({ highlightId: id, name: editName.trim() });
      toast.success('Nome atualizado!');
    } catch {
      toast.error('Erro ao renomear');
    }
    setEditingId(null);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteHighlight.mutateAsync(id);
      toast.success('Destaque removido!');
    } catch {
      toast.error('Erro ao remover');
    }
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto py-4 scrollbar-hide">
        {highlights.map((h: any) => (
          <div key={h.id} className="flex flex-col items-center gap-1 min-w-[68px] relative group">
            {editingId === h.id ? (
              <div className="flex flex-col items-center gap-1">
                <div className="p-[2px] rounded-full border-2 border-primary">
                  <Avatar className="w-14 h-14 border-2 border-background">
                    {h.cover_url ? (
                      <AvatarImage src={h.cover_url} />
                    ) : (
                      <AvatarFallback className="text-xs bg-muted">{h.name[0]?.toUpperCase()}</AvatarFallback>
                    )}
                  </Avatar>
                </div>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(h.id)}
                  className="w-20 h-6 text-[10px] p-1 text-center"
                  autoFocus
                />
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="w-5 h-5" onClick={() => handleSaveEdit(h.id)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="w-5 h-5" onClick={() => setEditingId(null)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setSelectedHighlightId(h.id)}
                  className="flex flex-col items-center gap-1"
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
                {isOwnProfile && (
                  <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleStartEdit(h, e)}
                      className="w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center"
                    >
                      <Pencil className="w-2.5 h-2.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(h.id, e)}
                      className="w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center"
                    >
                      <Trash2 className="w-2.5 h-2.5 text-destructive" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
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
