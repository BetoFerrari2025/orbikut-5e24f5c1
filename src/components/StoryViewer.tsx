import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Heart, MessageCircle, Plus, Music, Type, Send, X, Play, Pause, Volume2, VolumeX, Eye, Star, Link2, ExternalLink, GripVertical } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Story } from '@/hooks/useStories';
import { useStoryPoll, useVotePoll, useUserVote } from '@/hooks/useStoryPolls';
import {
  useStoryLikes,
  useHasLikedStory,
  useToggleStoryLike,
  useStoryComments,
  useAddStoryComment,
  useUpdateStoryCaption,
  useUpdateStoryMusic,
  useUpdateStoryLink,
  useRecordStoryView,
  useStoryViewers,
} from '@/hooks/useStoryInteractions';
import { useUserHighlights, useCreateHighlight, useAddToHighlight } from '@/hooks/useHighlights';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StoryViewerProps {
  stories: Story[] | null;
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
  onClose: () => void;
  onAddStory: () => void;
}

export function StoryViewer({ stories, currentIndex, setCurrentIndex, onClose, onAddStory }: StoryViewerProps) {
  const [showComments, setShowComments] = useState(false);
  const [showCaptionEdit, setShowCaptionEdit] = useState(false);
  const [showMusicInput, setShowMusicInput] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [showHighlightSave, setShowHighlightSave] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const { user } = useAuth();
  const recordView = useRecordStoryView();

  const STORY_DURATION = 5000;
  const TICK_INTERVAL = 50;
  const isPaused = showComments || showCaptionEdit || showMusicInput || showLinkInput || showViewers || showHighlightSave;

  useEffect(() => {
    if (!stories || !stories[currentIndex]) return;
    const s = stories[currentIndex];
    if (user && s.user_id !== user.id) {
      recordView.mutate(s.id);
    }
  }, [currentIndex, stories]);

  useEffect(() => {
    if (!stories || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setProgress(0);
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);
      if (elapsed >= STORY_DURATION) {
        if (timerRef.current) clearInterval(timerRef.current);
        if (currentIndex < stories.length - 1) setCurrentIndex(currentIndex + 1);
        else onClose();
      }
    }, TICK_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentIndex, stories, isPaused]);

  const handleStoryNav = (e: React.MouseEvent) => {
    if (!stories) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX < rect.width / 2) {
      if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    } else {
      if (currentIndex < stories.length - 1) setCurrentIndex(currentIndex + 1);
      else onClose();
    }
  };

  const isVideo = (url: string) => /\.(mp4|webm|mov|avi)$/i.test(url);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !stories) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0) {
      if (currentIndex < stories.length - 1) setCurrentIndex(currentIndex + 1);
      else onClose();
    } else {
      if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    }
  };

  if (!stories || !stories[currentIndex]) return null;
  const currentStory = stories[currentIndex];

  return (
    <Dialog open={!!stories} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 bg-black border-none overflow-hidden [&>button]:text-white [&>button]:z-20">
        <div className="relative" onClick={handleStoryNav} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {/* Progress bars */}
          <div className="absolute top-2 left-2 right-2 z-10 flex gap-1">
            {stories.map((_, i) => (
              <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
                <div className="h-full rounded-full bg-white" style={{ width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%', transition: i === currentIndex ? 'width 50ms linear' : 'none' }} />
              </div>
            ))}
          </div>

          {/* User info */}
          <div className="absolute top-6 left-3 z-10 flex items-center gap-2">
            <Avatar className="w-8 h-8 border border-white/50">
              <AvatarImage src={currentStory.profiles.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs">{currentStory.profiles.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-white text-sm font-semibold">{currentStory.profiles.username}</span>
          </div>

          {/* Media */}
          {isVideo(currentStory.image_url) ? (
            <video src={currentStory.image_url} className="w-full aspect-[9/16] object-cover" autoPlay muted playsInline loop />
          ) : (
            <img src={currentStory.image_url} alt="Story" className="w-full aspect-[9/16] object-cover" />
          )}

          {/* Caption overlay - draggable text */}
          {currentStory.caption && (
            <DraggableOverlay className="z-10 pointer-events-auto" defaultX={16} defaultY={-120} containerSelector=".story-media-container">
              <p className="text-white text-sm bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 max-w-[80%]">{currentStory.caption}</p>
            </DraggableOverlay>
          )}

          {/* Link CTA button overlay - clickable by viewers */}
          {(currentStory as any).link_url && user?.id !== currentStory.user_id && (
            <DraggableOverlay className="z-10" defaultX={16} defaultY={-80} isDraggable={false}>
              <a
                href={(currentStory as any).link_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-5 py-2.5 text-sm font-semibold shadow-lg hover:opacity-90 transition-opacity"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span className="truncate">{(currentStory as any).link_label || 'Saiba mais'}</span>
              </a>
            </DraggableOverlay>
          )}

          {/* Link CTA for owner view */}
          {(currentStory as any).link_url && user?.id === currentStory.user_id && (
            <div className="absolute bottom-16 left-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-5 py-2.5 text-sm font-semibold opacity-70">
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span className="truncate">{(currentStory as any).link_label || 'Saiba mais'}</span>
              </div>
            </div>
          )}

          {/* Audio Player */}
          {currentStory.music_url && <StoryAudioPlayer musicUrl={currentStory.music_url} storyId={currentStory.id} />}

          {/* Right-side action buttons */}
          <div className="absolute right-3 bottom-28 z-10 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <StoryLikeButton storyId={currentStory.id} />
            <button onClick={() => setShowComments(true)} className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-white text-[10px] mt-0.5">Comentar</span>
            </button>
            <button onClick={onAddStory} className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <span className="text-white text-[10px] mt-0.5">Novo</span>
            </button>
          </div>

          {/* Owner-only edit buttons */}
          <StoryOwnerControls
            story={currentStory}
            onEditCaption={() => setShowCaptionEdit(true)}
            onEditMusic={() => setShowMusicInput(true)}
            onEditLink={() => setShowLinkInput(true)}
            onShowViewers={() => setShowViewers(true)}
            onSaveHighlight={() => setShowHighlightSave(true)}
          />

          {/* Poll overlay */}
          <StoryPollOverlay storyId={currentStory.id} />
        </div>

        {showComments && <StoryCommentsPanel storyId={currentStory.id} onClose={() => setShowComments(false)} />}
        {showCaptionEdit && <CaptionEditOverlay story={currentStory} onClose={() => setShowCaptionEdit(false)} />}
        {showMusicInput && <MusicInputOverlay story={currentStory} onClose={() => setShowMusicInput(false)} />}
        {showLinkInput && user?.id === currentStory.user_id && <LinkInputOverlay story={currentStory} onClose={() => setShowLinkInput(false)} />}
        {showViewers && user?.id === currentStory.user_id && <StoryViewersPanel storyId={currentStory.id} onClose={() => setShowViewers(false)} />}
        {showHighlightSave && user?.id === currentStory.user_id && <HighlightSavePanel storyId={currentStory.id} userId={user.id} onClose={() => setShowHighlightSave(false)} />}
      </DialogContent>
    </Dialog>
  );
}

// ─── Draggable Overlay ───
function DraggableOverlay({ children, className, defaultX = 16, defaultY = -120, isDraggable = true, containerSelector }: {
  children: React.ReactNode;
  className?: string;
  defaultX?: number;
  defaultY?: number;
  isDraggable?: boolean;
  containerSelector?: string;
}) {
  const [pos, setPos] = useState({ x: defaultX, y: defaultY });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const elRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isDraggable) return;
    e.stopPropagation();
    e.preventDefault();
    dragging.current = true;
    const rect = elRef.current!.getBoundingClientRect();
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    elRef.current!.setPointerCapture(e.pointerId);
  }, [isDraggable]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !elRef.current) return;
    e.stopPropagation();
    const parent = elRef.current.parentElement!;
    const parentRect = parent.getBoundingClientRect();
    const x = e.clientX - parentRect.left - offset.current.x;
    const y = e.clientY - parentRect.top - offset.current.y;
    setPos({ x, y });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    dragging.current = false;
    elRef.current?.releasePointerCapture(e.pointerId);
  }, []);

  // Use absolute positioning from top-left
  const isNegativeY = defaultY < 0;

  return (
    <div
      ref={elRef}
      className={cn("absolute", isDraggable && "cursor-grab active:cursor-grabbing touch-none", className)}
      style={isNegativeY && pos.y === defaultY
        ? { bottom: Math.abs(defaultY) + 'px', left: pos.x + 'px' }
        : { top: pos.y + 'px', left: pos.x + 'px' }
      }
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {children}
    </div>
  );
}

// ─── Audio Player ───
function StoryAudioPlayer({ musicUrl, storyId }: { musicUrl: string; storyId: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
    return () => { if (audio) { audio.pause(); audio.currentTime = 0; } };
  }, [storyId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const update = () => { if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100); };
    audio.addEventListener('timeupdate', update);
    return () => audio.removeEventListener('timeupdate', update);
  }, []);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else { audio.play().then(() => setIsPlaying(true)).catch(() => {}); }
  };
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) { audioRef.current.muted = !muted; setMuted(!muted); }
  };

  return (
    <>
      <audio ref={audioRef} src={musicUrl} loop muted={muted} />
      <div className="absolute top-14 left-3 right-3 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
        <button onClick={togglePlay} className="shrink-0">{isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}</button>
        <Music className="w-3 h-3 text-white/70 shrink-0 animate-pulse" />
        <div className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
        </div>
        <button onClick={toggleMute} className="shrink-0">{muted ? <VolumeX className="w-4 h-4 text-white/70" /> : <Volume2 className="w-4 h-4 text-white/70" />}</button>
      </div>
    </>
  );
}

function StoryLikeButton({ storyId }: { storyId: string }) {
  const { data: likeCount } = useStoryLikes(storyId);
  const { data: hasLiked } = useHasLikedStory(storyId);
  const toggleLike = useToggleStoryLike();
  return (
    <button onClick={() => toggleLike.mutate(storyId)} className="flex flex-col items-center">
      <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <Heart className={cn("w-5 h-5 transition-colors", hasLiked ? "fill-red-500 text-red-500" : "text-white")} />
      </div>
      <span className="text-white text-[10px] mt-0.5">{likeCount ?? 0}</span>
    </button>
  );
}

// ─── Owner Controls ───
function StoryOwnerControls({ story, onEditCaption, onEditMusic, onEditLink, onShowViewers, onSaveHighlight }: {
  story: Story; onEditCaption: () => void; onEditMusic: () => void; onEditLink: () => void; onShowViewers: () => void; onSaveHighlight: () => void;
}) {
  const { user } = useAuth();
  if (user?.id !== story.user_id) return null;
  return (
    <div className="absolute left-3 bottom-28 z-10 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
      <button onClick={onEditCaption} className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"><Type className="w-5 h-5 text-white" /></div>
        <span className="text-white text-[10px] mt-0.5">Texto</span>
      </button>
      <button onClick={onEditMusic} className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"><Music className="w-5 h-5 text-white" /></div>
        <span className="text-white text-[10px] mt-0.5">Música</span>
      </button>
      <button onClick={onEditLink} className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"><Link2 className="w-5 h-5 text-white" /></div>
        <span className="text-white text-[10px] mt-0.5">Link</span>
      </button>
      <button onClick={onShowViewers} className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"><Eye className="w-5 h-5 text-white" /></div>
        <span className="text-white text-[10px] mt-0.5">Vistas</span>
      </button>
      <button onClick={onSaveHighlight} className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"><Star className="w-5 h-5 text-white" /></div>
        <span className="text-white text-[10px] mt-0.5">Destaque</span>
      </button>
    </div>
  );
}

// ─── Viewers Panel ───
function StoryViewersPanel({ storyId, onClose }: { storyId: string; onClose: () => void }) {
  const { data: viewers } = useStoryViewers(storyId);
  return (
    <div className="absolute inset-0 z-20 flex flex-col" onClick={(e) => e.stopPropagation()}>
      <div className="flex-1" onClick={onClose} />
      <div className="bg-background/95 backdrop-blur-md rounded-t-2xl max-h-[60%] flex flex-col animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-foreground font-semibold flex items-center gap-2"><Eye className="w-4 h-4" />Visualizações ({viewers?.length ?? 0})</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {(!viewers || viewers.length === 0) && <p className="text-muted-foreground text-sm text-center py-4">Ninguém viu ainda</p>}
          {viewers?.map((v: any) => (
            <div key={v.id} className="flex items-center gap-3">
              <Avatar className="w-9 h-9">
                <AvatarImage src={v.profiles?.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">{v.profiles?.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1"><p className="text-foreground text-sm font-medium">{v.profiles?.username}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Comments Panel ───
function StoryCommentsPanel({ storyId, onClose }: { storyId: string; onClose: () => void }) {
  const { data: comments } = useStoryComments(storyId);
  const addComment = useAddStoryComment();
  const [text, setText] = useState('');
  const { user } = useAuth();
  const handleSend = () => {
    if (!text.trim() || !user) return;
    addComment.mutate({ storyId, content: text.trim() });
    setText('');
  };
  return (
    <div className="absolute inset-0 z-20 flex flex-col" onClick={(e) => e.stopPropagation()}>
      <div className="flex-1" onClick={onClose} />
      <div className="bg-background/95 backdrop-blur-md rounded-t-2xl max-h-[60%] flex flex-col animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-foreground font-semibold">Comentários</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {(!comments || comments.length === 0) && <p className="text-muted-foreground text-sm text-center py-4">Nenhum comentário ainda</p>}
          {comments?.map((c: any) => (
            <div key={c.id} className="flex gap-2">
              <Avatar className="w-7 h-7">
                <AvatarImage src={c.profiles?.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px]">{c.profiles?.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <span className="text-foreground text-xs font-semibold">{c.profiles?.username}</span>
                <p className="text-foreground text-sm">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
        {user && (
          <div className="p-3 border-t border-border flex gap-2">
            <Input placeholder="Escreva um comentário..." value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} className="flex-1 text-sm" />
            <Button size="icon" onClick={handleSend} disabled={!text.trim()}><Send className="w-4 h-4" /></Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Caption Edit with live preview ───
function CaptionEditOverlay({ story, onClose }: { story: Story; onClose: () => void }) {
  const [caption, setCaption] = useState(story.caption ?? '');
  const [textPos, setTextPos] = useState({ x: 16, y: 200 });
  const updateCaption = useUpdateStoryCaption();
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const textRef = useRef<HTMLDivElement>(null);

  const handleSave = async () => {
    try {
      await updateCaption.mutateAsync({ storyId: story.id, caption });
      toast.success('Texto salvo!');
      onClose();
    } catch { toast.error('Erro ao salvar texto'); }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    dragging.current = true;
    const rect = textRef.current!.getBoundingClientRect();
    const parent = textRef.current!.parentElement!.getBoundingClientRect();
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    textRef.current!.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || !textRef.current) return;
    e.stopPropagation();
    const parent = textRef.current.parentElement!.getBoundingClientRect();
    setTextPos({
      x: e.clientX - parent.left - offset.current.x,
      y: e.clientY - parent.top - offset.current.y,
    });
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    dragging.current = false;
    textRef.current?.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col" onClick={(e) => e.stopPropagation()}>
      {/* Live preview of text - draggable */}
      {caption && (
        <div
          ref={textRef}
          className="absolute z-30 cursor-grab active:cursor-grabbing touch-none select-none"
          style={{ left: textPos.x, top: textPos.y }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div className="flex items-center gap-1">
            <GripVertical className="w-3 h-3 text-white/50" />
            <p className="text-white text-sm bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 max-w-[200px] break-words">{caption}</p>
          </div>
        </div>
      )}

      <div className="flex-1" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md rounded-t-2xl p-4 space-y-3 animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between">
          <h3 className="text-foreground font-semibold">Adicionar Texto</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <p className="text-xs text-muted-foreground">Digite o texto e arraste para posicionar</p>
        <Input
          placeholder="Digite seu texto..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={200}
          autoFocus
        />
        <Button onClick={handleSave} disabled={updateCaption.isPending} className="w-full">
          {updateCaption.isPending ? 'Salvando...' : 'Salvar Texto'}
        </Button>
      </div>
    </div>
  );
}

// ─── Music Input ───
function MusicInputOverlay({ story, onClose }: { story: Story; onClose: () => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateMusic = useUpdateStoryMusic();
  const { user } = useAuth();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) { toast.error('Selecione um arquivo de áudio'); return; }
      if (file.size > 10 * 1024 * 1024) { toast.error('Arquivo muito grande (máx 10MB)'); return; }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('story-music').upload(fileName, selectedFile, { contentType: selectedFile.type });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('story-music').getPublicUrl(fileName);
      await updateMusic.mutateAsync({ storyId: story.id, musicUrl: publicUrl });
      toast.success('Música adicionada!');
      onClose();
    } catch (err: any) { toast.error(err.message || 'Erro ao enviar música'); }
    finally { setUploading(false); }
  };

  const handleRemove = async () => {
    try { await updateMusic.mutateAsync({ storyId: story.id, musicUrl: '' }); toast.success('Música removida!'); onClose(); }
    catch { toast.error('Erro ao remover música'); }
  };

  return (
    <div className="absolute inset-0 z-20 flex items-end" onClick={(e) => e.stopPropagation()}>
      <div className="flex-1" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md rounded-t-2xl p-4 space-y-3 animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between">
          <h3 className="text-foreground font-semibold">Adicionar Música</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileSelect} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center hover:border-primary transition-colors">
          <Music className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-sm">{selectedFile ? selectedFile.name : 'Toque para selecionar um áudio'}</p>
          <p className="text-muted-foreground text-xs mt-1">MP3, WAV, M4A (máx 10MB)</p>
        </button>
        <div className="flex gap-2">
          <Button onClick={handleUpload} disabled={!selectedFile || uploading} className="flex-1">{uploading ? 'Enviando...' : 'Salvar Música'}</Button>
          {story.music_url && <Button variant="destructive" onClick={handleRemove} disabled={uploading}>Remover</Button>}
        </div>
      </div>
    </div>
  );
}

// ─── Link Input with live CTA preview + drag ───
function LinkInputOverlay({ story, onClose }: { story: Story; onClose: () => void }) {
  const [linkUrl, setLinkUrl] = useState((story as any).link_url ?? '');
  const [linkLabel, setLinkLabel] = useState((story as any).link_label ?? '');
  const [ctaPos, setCtaPos] = useState({ x: 40, y: 300 });
  const updateLink = useUpdateStoryLink();
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const ctaRef = useRef<HTMLDivElement>(null);

  const handleSave = async () => {
    try {
      await updateLink.mutateAsync({ storyId: story.id, linkUrl: linkUrl.trim(), linkLabel: linkLabel.trim() || 'Saiba mais' });
      toast.success(linkUrl.trim() ? 'Link salvo!' : 'Link removido!');
      onClose();
    } catch { toast.error('Erro ao salvar link'); }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    dragging.current = true;
    const rect = ctaRef.current!.getBoundingClientRect();
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    ctaRef.current!.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || !ctaRef.current) return;
    e.stopPropagation();
    const parent = ctaRef.current.parentElement!.getBoundingClientRect();
    setCtaPos({ x: e.clientX - parent.left - offset.current.x, y: e.clientY - parent.top - offset.current.y });
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    dragging.current = false;
    ctaRef.current?.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col" onClick={(e) => e.stopPropagation()}>
      {/* Live CTA preview - draggable */}
      {linkUrl && linkLabel && (
        <div
          ref={ctaRef}
          className="absolute z-30 cursor-grab active:cursor-grabbing touch-none select-none"
          style={{ left: ctaPos.x, top: ctaPos.y }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div className="flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-5 py-2.5 text-sm font-semibold shadow-lg">
            <GripVertical className="w-3 h-3 opacity-50" />
            <ExternalLink className="w-4 h-4 shrink-0" />
            <span>{linkLabel || 'Saiba mais'}</span>
          </div>
        </div>
      )}

      <div className="flex-1" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md rounded-t-2xl p-4 space-y-3 animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between">
          <h3 className="text-foreground font-semibold">Adicionar Link</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <p className="text-xs text-muted-foreground">Digite a URL e a chamada para ação, depois arraste para posicionar</p>
        <Input placeholder="https://exemplo.com" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} type="url" />
        <Input placeholder="Chamada para ação (ex: Saiba mais)" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} />
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={updateLink.isPending} className="flex-1">{updateLink.isPending ? 'Salvando...' : 'Salvar Link'}</Button>
          {(story as any).link_url && (
            <Button variant="destructive" onClick={() => { setLinkUrl(''); setLinkLabel(''); }} disabled={updateLink.isPending}>Remover</Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Poll Overlay ───
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
          <button onClick={() => handleVote('A')} className={cn("relative overflow-hidden rounded-lg p-3 text-white font-medium transition-all", userVote === 'A' ? "ring-2 ring-primary" : "", !userVote ? "hover:scale-105 bg-primary/40" : "bg-primary/30")}>
            {userVote && <div className="absolute inset-0 bg-primary/50" style={{ width: `${poll.percentA}%` }} />}
            <span className="relative z-10">{poll.option_a}{userVote && <span className="ml-2 text-sm">{poll.percentA}%</span>}</span>
          </button>
          <button onClick={() => handleVote('B')} className={cn("relative overflow-hidden rounded-lg p-3 text-white font-medium transition-all", userVote === 'B' ? "ring-2 ring-accent" : "", !userVote ? "hover:scale-105 bg-accent/40" : "bg-accent/30")}>
            {userVote && <div className="absolute inset-0 bg-accent/50" style={{ width: `${poll.percentB}%` }} />}
            <span className="relative z-10">{poll.option_b}{userVote && <span className="ml-2 text-sm">{poll.percentB}%</span>}</span>
          </button>
        </div>
        {userVote && <p className="text-white/70 text-xs text-center">{poll.total} votos</p>}
      </div>
    </div>
  );
}

// ─── Highlight Save Panel ───
function HighlightSavePanel({ storyId, userId, onClose }: { storyId: string; userId: string; onClose: () => void }) {
  const { data: highlights } = useUserHighlights(userId);
  const createHighlight = useCreateHighlight();
  const addToHighlight = useAddToHighlight();
  const [newName, setNewName] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);

  const handleAddToExisting = async (highlightId: string) => {
    try { await addToHighlight.mutateAsync({ highlightId, storyId }); toast.success('Adicionado ao destaque!'); onClose(); }
    catch { toast.error('Erro ao adicionar'); }
  };
  const handleCreateNew = async () => {
    if (!newName.trim()) return;
    try { await createHighlight.mutateAsync({ name: newName.trim(), storyId }); toast.success('Destaque criado!'); onClose(); }
    catch { toast.error('Erro ao criar destaque'); }
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col" onClick={(e) => e.stopPropagation()}>
      <div className="flex-1" onClick={onClose} />
      <div className="bg-background/95 backdrop-blur-md rounded-t-2xl max-h-[60%] flex flex-col animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-foreground font-semibold flex items-center gap-2"><Star className="w-4 h-4" />Salvar em Destaque</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {highlights && highlights.length > 0 && highlights.map((h: any) => (
            <button key={h.id} onClick={() => handleAddToExisting(h.id)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {h.cover_url ? <img src={h.cover_url} alt="" className="w-full h-full object-cover" /> : <Star className="w-4 h-4 text-muted-foreground" />}
              </div>
              <span className="text-foreground font-medium">{h.name}</span>
            </button>
          ))}
          {showNewInput ? (
            <div className="flex gap-2 pt-2">
              <Input placeholder="Nome do destaque..." value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateNew()} className="flex-1" autoFocus />
              <Button onClick={handleCreateNew} disabled={!newName.trim() || createHighlight.isPending} size="sm">{createHighlight.isPending ? '...' : 'Criar'}</Button>
            </div>
          ) : (
            <button onClick={() => setShowNewInput(true)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Plus className="w-5 h-5 text-primary" /></div>
              <span className="text-primary font-medium">Novo destaque</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
