import { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, X, BarChart3, Type, Link2, ExternalLink, GripVertical, Minus, Music, Play, Pause, SlidersHorizontal, Sun, Contrast, Smile, ChevronUp, ChevronDown } from 'lucide-react';
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

function DraggablePreview({ children, className, onPositionChange }: {
  children: React.ReactNode;
  className?: string;
  onPositionChange?: (centerX: number, centerY: number, containerWidth: number, containerHeight: number) => void;
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const elRef = useRef<HTMLDivElement>(null);

  // Center on first render
  useEffect(() => {
    if (pos === null && elRef.current) {
      const parent = elRef.current.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        const elRect = elRef.current.getBoundingClientRect();
        const cx = (parentRect.width - elRect.width) / 2;
        const cy = (parentRect.height - elRect.height) / 2;
        setPos({ x: cx, y: cy });
        // Report center point
        const centerX = cx + elRect.width / 2;
        const centerY = cy + elRect.height / 2;
        onPositionChange?.(centerX, centerY, parentRect.width, parentRect.height);
      }
    }
  });

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
    x = Math.max(0, Math.min(x, parentRect.width - elRect.width));
    y = Math.max(0, Math.min(y, parentRect.height - elRect.height));
    setPos({ x, y });
    // Report center point of element
    const centerX = x + elRect.width / 2;
    const centerY = y + elRect.height / 2;
    onPositionChange?.(centerX, centerY, parentRect.width, parentRect.height);
  }, [onPositionChange]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    dragging.current = false;
    elRef.current?.releasePointerCapture(e.pointerId);
  }, []);

  return (
    <div
      ref={elRef}
      className={cn("absolute cursor-grab active:cursor-grabbing touch-none select-none z-10", className)}
      style={{ left: pos?.x ?? 0, top: pos?.y ?? 0, visibility: pos === null ? 'hidden' : 'visible' }}
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
  const [textPosPercent, setTextPosPercent] = useState({ x: 50, y: 50 });
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Link overlay
  const [showLink, setShowLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [linkPosPercent, setLinkPosPercent] = useState({ x: 50, y: 50 });

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

  // Stickers
  const [showStickers, setShowStickers] = useState(false);
  const [stickers, setStickers] = useState<{ id: string; emoji: string }[]>([]);
  const stickerIdCounter = useRef(0);

  // Controls panel
  const [showControls, setShowControls] = useState(true);

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
        linkX: showLink && linkUrl.trim() ? linkPosPercent.x : undefined,
        linkY: showLink && linkUrl.trim() ? linkPosPercent.y : undefined,
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
    setShowStickers(false);
    setStickers([]);
    stickerIdCounter.current = 0;
    setShowControls(true);
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
      <DialogContent className="sm:max-w-md p-0 max-h-[95vh] overflow-hidden flex flex-col border-none bg-black">
        {!preview ? (
          <div className="p-6 space-y-4 bg-background rounded-lg">
            <DialogHeader>
              <DialogTitle>Criar Story</DialogTitle>
            </DialogHeader>
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
          </div>
        ) : (
          <>
            {/* Fullscreen preview with overlays */}
            <div ref={previewContainerRef} className="relative flex-1 min-h-0 overflow-hidden">
              {selectedFile?.type.startsWith('video') ? (
                <video src={preview} className="w-full h-full object-cover" style={{ filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)` }} muted autoPlay loop />
              ) : (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" style={{ filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)` }} />
              )}

              {/* Close / change media button */}
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-3 right-3 z-20 bg-black/50 hover:bg-black/70 text-white border-none"
                onClick={() => { setSelectedFile(null); setPreview(null); }}
              >
                <X className="w-4 h-4" />
              </Button>

              {/* Draggable text overlay */}
              {showText && (
                <DraggablePreview
                  onPositionChange={(centerX, centerY, containerW, containerH) => {
                    setTextPosPercent({
                      x: Math.round((centerX / containerW) * 100),
                      y: Math.round((centerY / containerH) * 100),
                    });
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
                <DraggablePreview
                  onPositionChange={(centerX, centerY, containerW, containerH) => {
                    setLinkPosPercent({
                      x: Math.round((centerX / containerW) * 100),
                      y: Math.round((centerY / containerH) * 100),
                    });
                  }}
                >
                  <div className="flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-5 py-2.5 text-sm font-semibold shadow-lg">
                    <GripVertical className="w-3 h-3 opacity-50" />
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    <span>{linkLabel || 'Saiba mais'}</span>
                  </div>
                </DraggablePreview>
              )}

              {/* Draggable sticker overlays */}
              {stickers.map((sticker) => (
                <DraggablePreview key={sticker.id}>
                  <div className="relative group">
                    <span className="text-4xl select-none drop-shadow-lg">{sticker.emoji}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setStickers(prev => prev.filter(s => s.id !== sticker.id));
                      }}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </DraggablePreview>
              ))}

              {/* Poll overlay inside preview */}
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

              {/* Bottom controls overlay inside the preview */}
              <div className="absolute bottom-0 left-0 right-0 z-20">
                {/* Toggle controls button */}
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowControls(!showControls)}
                    className="bg-black/60 backdrop-blur-sm text-white rounded-t-lg px-4 py-1 flex items-center gap-1 text-xs"
                  >
                    {showControls ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                    {showControls ? 'Ocultar' : 'Editar'}
                  </button>
                </div>

                {showControls && (
                  <div className="bg-black/70 backdrop-blur-md p-3 space-y-3 max-h-[40vh] overflow-y-auto">
                    {/* Tool buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant={showText ? 'default' : 'outline'}
                        onClick={() => setShowText(!showText)}
                        className={cn("border-white/30 text-white", showText && 'gradient-brand')}
                        size="sm"
                      >
                        <Type className="w-4 h-4 mr-1" />
                        Texto
                      </Button>
                      <Button
                        variant={showLink ? 'default' : 'outline'}
                        onClick={() => setShowLink(!showLink)}
                        className={cn("border-white/30 text-white", showLink && 'gradient-brand')}
                        size="sm"
                      >
                        <Link2 className="w-4 h-4 mr-1" />
                        Link
                      </Button>
                      <Button
                        variant={showPoll ? 'default' : 'outline'}
                        onClick={() => setShowPoll(!showPoll)}
                        className={cn("border-white/30 text-white", showPoll && 'gradient-brand')}
                        size="sm"
                      >
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Enquete
                      </Button>
                      <Button
                        variant={showMusic ? 'default' : 'outline'}
                        onClick={() => setShowMusic(!showMusic)}
                        className={cn("border-white/30 text-white", showMusic && 'gradient-brand')}
                        size="sm"
                      >
                        <Music className="w-4 h-4 mr-1" />
                        Música
                      </Button>
                      <Button
                        variant={showFilters ? 'default' : 'outline'}
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn("border-white/30 text-white", showFilters && 'gradient-brand')}
                        size="sm"
                      >
                        <SlidersHorizontal className="w-4 h-4 mr-1" />
                        Filtros
                      </Button>
                      <Button
                        variant={showStickers ? 'default' : 'outline'}
                        onClick={() => setShowStickers(!showStickers)}
                        className={cn("border-white/30 text-white", showStickers && 'gradient-brand')}
                        size="sm"
                      >
                        <Smile className="w-4 h-4 mr-1" />
                        Stickers
                      </Button>
                    </div>

                    {/* Text input */}
                    {showText && (
                      <div className="space-y-2">
                        <Input
                          placeholder="Digite seu texto..."
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          maxLength={200}
                          className="bg-white/20 border-0 text-white placeholder:text-white/70"
                        />
                        <div className="flex gap-1.5 flex-wrap">
                          {TEXT_COLORS.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => setTextColor(c.value)}
                              className={cn(
                                "w-6 h-6 rounded-full border-2 transition-transform",
                                textColor === c.value ? "border-white scale-110" : "border-white/30"
                              )}
                              style={{ backgroundColor: c.value }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <Minus className="w-3 h-3 text-white/70" />
                          <Slider
                            value={[textSize]}
                            onValueChange={([v]) => setTextSize(v)}
                            min={10}
                            max={36}
                            step={1}
                            className="flex-1"
                          />
                          <Type className="w-4 h-4 text-white/70" />
                        </div>
                      </div>
                    )}

                    {/* Link inputs */}
                    {showLink && (
                      <div className="space-y-2">
                        <Input placeholder="https://exemplo.com" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} type="url" className="bg-white/20 border-0 text-white placeholder:text-white/70" />
                        <Input placeholder="Texto do botão (ex: Saiba mais)" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} className="bg-white/20 border-0 text-white placeholder:text-white/70" />
                      </div>
                    )}

                    {/* Music input */}
                    {showMusic && (
                      <div className="space-y-2">
                        <input ref={musicInputRef} type="file" accept="audio/*" onChange={handleMusicSelect} className="hidden" />
                        <button
                          onClick={() => musicInputRef.current?.click()}
                          className="w-full border border-dashed border-white/30 rounded-lg p-3 text-center hover:border-white/60 transition-colors"
                        >
                          <Music className="w-5 h-5 mx-auto text-white/70 mb-1" />
                          <p className="text-white/70 text-xs">{musicFile ? musicFile.name : 'Selecionar áudio (máx 10MB)'}</p>
                        </button>
                        {musicPreviewUrl && (
                          <div className="flex items-center gap-3 bg-white/10 rounded-lg p-2">
                            <audio ref={musicAudioRef} src={musicPreviewUrl} loop />
                            <button onClick={toggleMusicPreview} className="shrink-0">
                              {isMusicPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
                            </button>
                            <span className="text-xs text-white truncate flex-1">{musicFile?.name}</span>
                            <button onClick={() => { setMusicFile(null); if (musicPreviewUrl) URL.revokeObjectURL(musicPreviewUrl); setMusicPreviewUrl(null); setIsMusicPlaying(false); if (musicAudioRef.current) { musicAudioRef.current.pause(); } }}>
                              <X className="w-3 h-3 text-white/70" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Filters */}
                    {showFilters && (
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <p className="text-xs text-white/70 flex items-center gap-1"><Sun className="w-3 h-3" /> Brilho: {brightness}%</p>
                          <Slider value={[brightness]} onValueChange={([v]) => setBrightness(v)} min={50} max={150} step={1} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-white/70 flex items-center gap-1"><Contrast className="w-3 h-3" /> Contraste: {contrast}%</p>
                          <Slider value={[contrast]} onValueChange={([v]) => setContrast(v)} min={50} max={150} step={1} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-white/70">🎨 Saturação: {saturation}%</p>
                          <Slider value={[saturation]} onValueChange={([v]) => setSaturation(v)} min={0} max={200} step={1} />
                        </div>
                        <Button variant="ghost" size="sm" className="text-white/70" onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); }}>
                          Resetar filtros
                        </Button>
                      </div>
                    )}

                    {/* Sticker picker */}
                    {showStickers && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-8 gap-2">
                          {['😀','😂','🥰','😎','🤩','😜','🥳','😇',
                            '❤️','🔥','⭐','🎉','👍','👏','💪','🙌',
                            '🌈','🦋','🌸','🍕','🎵','💎','🏆','🎯',
                            '🐶','🐱','🦊','🐻','🐼','🦁','🐸','🐵',
                            '☀️','🌙','⚡','❄️','🌊','🍀','🌺','🎈'].map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                stickerIdCounter.current += 1;
                                setStickers(prev => [...prev, { id: `sticker-${stickerIdCounter.current}`, emoji }]);
                              }}
                              className="text-2xl hover:scale-125 transition-transform p-1"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                        {stickers.length > 0 && (
                          <Button variant="ghost" size="sm" className="text-white/70" onClick={() => setStickers([])}>
                            Remover todos
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Submit button */}
                    <Button
                      onClick={handleSubmit}
                      disabled={!selectedFile || createStory.isPending}
                      className="w-full gradient-brand hover:opacity-90 glow-primary"
                    >
                      {createStory.isPending ? 'Publicando...' : 'Publicar Story'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
