import { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, X, BarChart3, Type, Link2, ExternalLink, GripVertical, Minus, Music, Play, Pause, SlidersHorizontal, Sun, Contrast } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useCreateStoryWithPoll } from '@/hooks/useStoryPolls';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TEXT_COLORS = [
  { label: 'Branco', value: '#ffffff' },
  { label: 'Preto', value: '#000000' },
  { label: 'Vermelho', value: '#ef4444' },
  { label: 'Azul', value: '#3b82f6' },
  { label: 'Verde', value: '#22c55e' },
  { label: 'Amarelo', value: '#eab308' },
  { label: 'Rosa', value: '#ec4899' },
  { label: 'Roxo', value: '#a855f7' },
];

interface CreateStoryWithPollProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DraggablePreview({ children, className, initialX, initialY, onPositionChange }: {
  children: React.ReactNode;
  className?: string;
  initialX: number;
  initialY: number;
  onPositionChange?: (x: number, y: number) => void;
}) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const elRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dragging.current = true;
    const rect = elRef.current!.getBoundingClientRect();
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    elRef.current!.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !elRef.current) return;
    e.stopPropagation();
    const parent = elRef.current.parentElement!;
    const parentRect = parent.getBoundingClientRect();
    const elRect = elRef.current.getBoundingClientRect();
    let x = e.clientX - parentRect.left - offset.current.x;
    let y = e.clientY - parentRect.top - offset.current.y;
    // Clamp within parent
    x = Math.max(0, Math.min(x, parentRect.width - elRect.width));
    y = Math.max(0, Math.min(y, parentRect.height - elRect.height));
    setPos({ x, y });
    onPositionChange?.(x, y);
  }, [onPositionChange]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    dragging.current = false;
    elRef.current?.releasePointerCapture(e.pointerId);
  }, []);

  return (
    <div
      ref={elRef}
      className={cn("absolute cursor-grab active:cursor-grabbing touch-none select-none z-10", className)}
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {children}
    </div>
  );
}

export function CreateStoryWithPoll({ open, onOpenChange }: CreateStoryWithPollProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');

  // Text overlay
  const [showText, setShowText] = useState(false);
  const [caption, setCaption] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(14);
  // Text position as percentage (0-100)
  const [textPosPercent, setTextPosPercent] = useState({ x: 50, y: 50 });
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Link overlay
  const [showLink, setShowLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');

  // Music
  const [showMusic, setShowMusic] = useState(false);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicPreviewUrl, setMusicPreviewUrl] = useState<string | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const musicAudioRef = useRef<HTMLAudioElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  const { user } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const createStory = useCreateStoryWithPoll();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Selecione uma imagem ou vídeo');
      return;
    }

    const poll = showPoll && pollQuestion && optionA && optionB
      ? { question: pollQuestion, optionA, optionB }
      : undefined;

    // Upload music if selected
    let musicUrl: string | undefined;
    if (showMusic && musicFile && user) {
      const fileExt = musicFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('story-music').upload(fileName, musicFile, { contentType: musicFile.type });
      if (uploadError) { toast.error('Erro ao enviar música'); return; }
      const { data: { publicUrl } } = supabase.storage.from('story-music').getPublicUrl(fileName);
      musicUrl = publicUrl;
    }

    try {
      await createStory.mutateAsync({
        file: selectedFile,
        poll,
        caption: showText && caption.trim() ? caption.trim() : undefined,
        captionX: showText && caption.trim() ? textPosPercent.x : undefined,
        captionY: showText && caption.trim() ? textPosPercent.y : undefined,
        captionColor: showText && caption.trim() ? textColor : undefined,
        captionSize: showText && caption.trim() ? textSize : undefined,
        linkUrl: showLink && linkUrl.trim() ? linkUrl.trim() : undefined,
        linkLabel: showLink && linkLabel.trim() ? linkLabel.trim() : undefined,
        musicUrl,
        filterBrightness: brightness,
        filterContrast: contrast,
        filterSaturation: saturation,
      });
      toast.success('Story publicado!');
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao publicar story');
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreview(null);
    setShowPoll(false);
    setPollQuestion('');
    setOptionA('');
    setOptionB('');
    setShowText(false);
    setCaption('');
    setTextColor('#ffffff');
    setTextSize(14);
    setTextPosPercent({ x: 50, y: 50 });
    setShowLink(false);
    setLinkUrl('');
    setLinkLabel('');
    setShowMusic(false);
    setMusicFile(null);
    if (musicPreviewUrl) URL.revokeObjectURL(musicPreviewUrl);
    setMusicPreviewUrl(null);
    setIsMusicPlaying(false);
    if (musicAudioRef.current) { musicAudioRef.current.pause(); musicAudioRef.current.currentTime = 0; }
    setShowFilters(false);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };

  const handleMusicSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) { toast.error('Selecione um arquivo de áudio'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Arquivo muito grande (máx 10MB)'); return; }
    setMusicFile(file);
    if (musicPreviewUrl) URL.revokeObjectURL(musicPreviewUrl);
    setMusicPreviewUrl(URL.createObjectURL(file));
  };

  const toggleMusicPreview = () => {
    const audio = musicAudioRef.current;
    if (!audio) return;
    if (isMusicPlaying) { audio.pause(); setIsMusicPlaying(false); }
    else { audio.play().then(() => setIsMusicPlaying(true)).catch(() => {}); }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Story</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!preview ? (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Toque para selecionar foto ou vídeo</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div ref={previewContainerRef} className="relative aspect-[9/16] max-h-[400px] rounded-lg overflow-hidden bg-black">
              {selectedFile?.type.startsWith('video') ? (
                <video src={preview} className="w-full h-full object-cover" style={{ filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)` }} muted autoPlay loop />
              ) : (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" style={{ filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)` }} />
              )}
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2 z-20"
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>

              {/* Draggable text overlay - percentage based */}
              {showText && (
                <DraggablePreview
                  initialX={20}
                  initialY={180}
                  onPositionChange={(x, y) => {
                    const container = previewContainerRef.current;
                    if (container) {
                      const rect = container.getBoundingClientRect();
                      setTextPosPercent({
                        x: Math.round((x / rect.width) * 100),
                        y: Math.round((y / rect.height) * 100),
                      });
                    }
                  }}
                >
                  <div className="flex items-center gap-1" style={{ visibility: caption ? 'visible' : 'hidden' }}>
                    <GripVertical className="w-3 h-3 text-white/50 shrink-0" />
                    <p
                      className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2"
                      style={{
                        color: textColor,
                        fontSize: `${textSize}px`,
                        maxWidth: 'calc(100vw - 80px)',
                        overflowWrap: 'break-word',
                        wordBreak: 'normal',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {caption}
                    </p>
                  </div>
                </DraggablePreview>
              )}

              {/* Draggable link CTA overlay */}
              {showLink && linkUrl && (
                <DraggablePreview initialX={50} initialY={240}>
                  <div className="flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-5 py-2.5 text-sm font-semibold shadow-lg">
                    <GripVertical className="w-3 h-3 opacity-50" />
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    <span>{linkLabel || 'Saiba mais'}</span>
                  </div>
                </DraggablePreview>
              )}

              {/* Poll overlay */}
              {showPoll && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-xl p-4 space-y-3 z-10">
                  <Input
                    placeholder="Sua pergunta..."
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    className="bg-white/20 border-0 text-white placeholder:text-white/70"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Opção A"
                      value={optionA}
                      onChange={(e) => setOptionA(e.target.value)}
                      className="bg-primary/30 border-0 text-white placeholder:text-white/70"
                    />
                    <Input
                      placeholder="Opção B"
                      value={optionB}
                      onChange={(e) => setOptionB(e.target.value)}
                      className="bg-accent/30 border-0 text-white placeholder:text-white/70"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {preview && (
            <>
              {/* Tool buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={showText ? 'default' : 'outline'}
                  onClick={() => setShowText(!showText)}
                  className={cn(showText && 'gradient-brand')}
                  size="sm"
                >
                  <Type className="w-4 h-4 mr-2" />
                  Texto
                </Button>
                <Button
                  variant={showLink ? 'default' : 'outline'}
                  onClick={() => setShowLink(!showLink)}
                  className={cn(showLink && 'gradient-brand')}
                  size="sm"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Link
                </Button>
                <Button
                  variant={showPoll ? 'default' : 'outline'}
                  onClick={() => setShowPoll(!showPoll)}
                  className={cn(showPoll && 'gradient-brand')}
                  size="sm"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Enquete
                </Button>
                <Button
                  variant={showMusic ? 'default' : 'outline'}
                  onClick={() => setShowMusic(!showMusic)}
                  className={cn(showMusic && 'gradient-brand')}
                  size="sm"
                >
                  <Music className="w-4 h-4 mr-2" />
                  Música
                </Button>
                <Button
                  variant={showFilters ? 'default' : 'outline'}
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(showFilters && 'gradient-brand')}
                  size="sm"
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>

              {/* Text input */}
              {showText && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Digite o texto e arraste na imagem para posicionar</p>
                  <Input
                    placeholder="Digite seu texto..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    maxLength={200}
                  />
                  {/* Color picker */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Cor</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {TEXT_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setTextColor(c.value)}
                          className={cn(
                            "w-7 h-7 rounded-full border-2 transition-transform",
                            textColor === c.value ? "border-primary scale-110" : "border-muted"
                          )}
                          style={{ backgroundColor: c.value }}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Font size slider */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Tamanho: {textSize}px</p>
                    <div className="flex items-center gap-2">
                      <Minus className="w-3 h-3 text-muted-foreground" />
                      <Slider
                        value={[textSize]}
                        onValueChange={([v]) => setTextSize(v)}
                        min={10}
                        max={36}
                        step={1}
                        className="flex-1"
                      />
                      <Type className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              )}

              {/* Link inputs */}
              {showLink && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Digite a URL e o texto do botão, depois arraste para posicionar</p>
                  <Input placeholder="https://exemplo.com" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} type="url" />
                  <Input placeholder="Texto do botão (ex: Saiba mais)" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} />
                </div>
              )}

              {/* Music input */}
              {showMusic && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Selecione um áudio para tocar durante o story</p>
                  <input ref={musicInputRef} type="file" accept="audio/*" onChange={handleMusicSelect} className="hidden" />
                  <button
                    onClick={() => musicInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center hover:border-primary transition-colors"
                  >
                    <Music className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                    <p className="text-muted-foreground text-sm">{musicFile ? musicFile.name : 'Toque para selecionar áudio'}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">MP3, WAV, M4A (máx 10MB)</p>
                  </button>
                  {musicPreviewUrl && (
                    <div className="flex items-center gap-3 bg-muted rounded-lg p-3">
                      <audio ref={musicAudioRef} src={musicPreviewUrl} loop />
                      <button onClick={toggleMusicPreview} className="shrink-0">
                        {isMusicPlaying ? <Pause className="w-5 h-5 text-primary" /> : <Play className="w-5 h-5 text-primary" />}
                      </button>
                      <span className="text-sm text-foreground truncate flex-1">{musicFile?.name}</span>
                      <button onClick={() => { setMusicFile(null); if (musicPreviewUrl) URL.revokeObjectURL(musicPreviewUrl); setMusicPreviewUrl(null); setIsMusicPlaying(false); if (musicAudioRef.current) { musicAudioRef.current.pause(); } }}>
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Filters */}
              {showFilters && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Ajuste os filtros visuais do story</p>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Sun className="w-3 h-3" /> Brilho: {brightness}%</p>
                      <Slider value={[brightness]} onValueChange={([v]) => setBrightness(v)} min={50} max={150} step={1} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Contrast className="w-3 h-3" /> Contraste: {contrast}%</p>
                      <Slider value={[contrast]} onValueChange={([v]) => setContrast(v)} min={50} max={150} step={1} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">🎨 Saturação: {saturation}%</p>
                      <Slider value={[saturation]} onValueChange={([v]) => setSaturation(v)} min={0} max={200} step={1} />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); }}>
                      Resetar filtros
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!selectedFile || createStory.isPending}
            className="w-full gradient-brand hover:opacity-90 glow-primary"
          >
            {createStory.isPending ? 'Publicando...' : 'Publicar Story'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
