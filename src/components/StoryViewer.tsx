import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Heart, MessageCircle, Plus, Music, Type, Send, X, Play, Pause, Volume2, VolumeX } from 'lucide-react';
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
} from '@/hooks/useStoryInteractions';
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

  if (!stories || !stories[currentIndex]) return null;

  const currentStory = stories[currentIndex];

  return (
    <Dialog open={!!stories} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 bg-black border-none overflow-hidden [&>button]:text-white [&>button]:z-20">
        <div className="relative" onClick={handleStoryNav}>
          {/* Progress bars */}
          <div className="absolute top-2 left-2 right-2 z-10 flex gap-1">
            {stories.map((_, i) => (
              <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30">
                <div className={cn("h-full rounded-full bg-white transition-all", i <= currentIndex ? "w-full" : "w-0")} />
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
            <video
              src={currentStory.image_url}
              className="w-full aspect-[9/16] object-cover"
              autoPlay muted playsInline loop
            />
          ) : (
            <img src={currentStory.image_url} alt="Story" className="w-full aspect-[9/16] object-cover" />
          )}

          {/* Caption overlay */}
          {currentStory.caption && (
            <div className="absolute bottom-24 left-4 right-16 z-10 pointer-events-none">
              <p className="text-white text-sm bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">{currentStory.caption}</p>
            </div>
          )}

          {/* Audio Player */}
          {currentStory.music_url && (
            <StoryAudioPlayer musicUrl={currentStory.music_url} storyId={currentStory.id} />
          )}

          {/* Right-side action buttons */}
          <div className="absolute right-3 bottom-28 z-10 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <StoryLikeButton storyId={currentStory.id} />
            <button
              onClick={() => setShowComments(true)}
              className="flex flex-col items-center"
            >
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
          />

          {/* Poll overlay */}
          <StoryPollOverlay storyId={currentStory.id} />
        </div>

        {/* Comments overlay */}
        {showComments && (
          <StoryCommentsPanel
            storyId={currentStory.id}
            onClose={() => setShowComments(false)}
          />
        )}

        {/* Caption edit overlay */}
        {showCaptionEdit && (
          <CaptionEditOverlay
            story={currentStory}
            onClose={() => setShowCaptionEdit(false)}
          />
        )}

        {/* Music input overlay */}
        {showMusicInput && (
          <MusicInputOverlay
            story={currentStory}
            onClose={() => setShowMusicInput(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Audio Player ───
function StoryAudioPlayer({ musicUrl, storyId }: { musicUrl: string; storyId: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    // Auto-play when story changes
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [storyId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const update = () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    audio.addEventListener('timeupdate', update);
    return () => audio.removeEventListener('timeupdate', update);
  }, []);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  return (
    <>
      <audio ref={audioRef} src={musicUrl} loop muted={muted} />
      <div
        className="absolute top-14 left-3 right-3 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={togglePlay} className="shrink-0">
          {isPlaying ? (
            <Pause className="w-4 h-4 text-white" />
          ) : (
            <Play className="w-4 h-4 text-white" />
          )}
        </button>
        <Music className="w-3 h-3 text-white/70 shrink-0 animate-pulse" />
        <div className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <button onClick={toggleMute} className="shrink-0">
          {muted ? (
            <VolumeX className="w-4 h-4 text-white/70" />
          ) : (
            <Volume2 className="w-4 h-4 text-white/70" />
          )}
        </button>
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

// ─── Owner Controls (caption + music) ───
function StoryOwnerControls({ story, onEditCaption, onEditMusic }: { story: Story; onEditCaption: () => void; onEditMusic: () => void }) {
  const { user } = useAuth();
  if (user?.id !== story.user_id) return null;

  return (
    <div className="absolute left-3 bottom-28 z-10 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
      <button onClick={onEditCaption} className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <Type className="w-5 h-5 text-white" />
        </div>
        <span className="text-white text-[10px] mt-0.5">Legenda</span>
      </button>
      <button onClick={onEditMusic} className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <Music className="w-5 h-5 text-white" />
        </div>
        <span className="text-white text-[10px] mt-0.5">Música</span>
      </button>
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
          {(!comments || comments.length === 0) && (
            <p className="text-muted-foreground text-sm text-center py-4">Nenhum comentário ainda</p>
          )}
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
            <Input
              placeholder="Escreva um comentário..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 text-sm"
            />
            <Button size="icon" onClick={handleSend} disabled={!text.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Caption Edit ───
function CaptionEditOverlay({ story, onClose }: { story: Story; onClose: () => void }) {
  const [caption, setCaption] = useState(story.caption ?? '');
  const updateCaption = useUpdateStoryCaption();

  const handleSave = async () => {
    try {
      await updateCaption.mutateAsync({ storyId: story.id, caption });
      toast.success('Legenda atualizada!');
      onClose();
    } catch {
      toast.error('Erro ao atualizar legenda');
    }
  };

  return (
    <div className="absolute inset-0 z-20 flex items-end" onClick={(e) => e.stopPropagation()}>
      <div className="flex-1" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md rounded-t-2xl p-4 space-y-3 animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between">
          <h3 className="text-foreground font-semibold">Editar Legenda</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <Input
          placeholder="Escreva uma legenda..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={200}
        />
        <Button onClick={handleSave} disabled={updateCaption.isPending} className="w-full">
          {updateCaption.isPending ? 'Salvando...' : 'Salvar Legenda'}
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
      if (!file.type.startsWith('audio/')) {
        toast.error('Selecione um arquivo de áudio');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande (máx 10MB)');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('story-music')
        .upload(fileName, selectedFile, { contentType: selectedFile.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('story-music')
        .getPublicUrl(fileName);

      await updateMusic.mutateAsync({ storyId: story.id, musicUrl: publicUrl });
      toast.success('Música adicionada!');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar música');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      await updateMusic.mutateAsync({ storyId: story.id, musicUrl: '' });
      toast.success('Música removida!');
      onClose();
    } catch {
      toast.error('Erro ao remover música');
    }
  };

  return (
    <div className="absolute inset-0 z-20 flex items-end" onClick={(e) => e.stopPropagation()}>
      <div className="flex-1" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md rounded-t-2xl p-4 space-y-3 animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between">
          <h3 className="text-foreground font-semibold">Adicionar Música</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center hover:border-primary transition-colors"
        >
          <Music className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-sm">
            {selectedFile ? selectedFile.name : 'Toque para selecionar um áudio'}
          </p>
          <p className="text-muted-foreground text-xs mt-1">MP3, WAV, M4A (máx 10MB)</p>
        </button>

        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="flex-1"
          >
            {uploading ? 'Enviando...' : 'Salvar Música'}
          </Button>
          {story.music_url && (
            <Button variant="destructive" onClick={handleRemove} disabled={uploading}>
              Remover
            </Button>
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
          <button
            onClick={() => handleVote('A')}
            className={cn(
              "relative overflow-hidden rounded-lg p-3 text-white font-medium transition-all",
              userVote === 'A' ? "ring-2 ring-primary" : "",
              !userVote ? "hover:scale-105 bg-primary/40" : "bg-primary/30"
            )}
          >
            {userVote && <div className="absolute inset-0 bg-primary/50" style={{ width: `${poll.percentA}%` }} />}
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
            {userVote && <div className="absolute inset-0 bg-accent/50" style={{ width: `${poll.percentB}%` }} />}
            <span className="relative z-10">
              {poll.option_b}
              {userVote && <span className="ml-2 text-sm">{poll.percentB}%</span>}
            </span>
          </button>
        </div>
        {userVote && <p className="text-white/70 text-xs text-center">{poll.total} votos</p>}
      </div>
    </div>
  );
}
