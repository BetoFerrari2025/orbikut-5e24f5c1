import { useState, useRef } from 'react';
import { ImagePlus, Video, X, Send, Smile, Bold, Italic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCreatePost } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const EMOJI_LIST = ['😀','😂','🥰','😎','🔥','❤️','👏','🎉','💯','✨','😍','🤩','😢','😤','🤔','👀','💪','🙌','🫶','😊','🥳','💀','😭','🤣','💖','⭐','🚀','🌟','👑','🎶'];

export function InlinePostComposer() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id ?? '');
  const createPost = useCreatePost();
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!user) return null;

  const insertFormatting = (prefix: string, suffix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = text.substring(start, end);
    const newText = text.substring(0, start) + prefix + selected + suffix + text.substring(end);
    setText(newText);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const insertEmoji = (emoji: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setText(prev => prev + emoji);
      return;
    }
    const start = ta.selectionStart;
    const newText = text.substring(0, start) + emoji + text.substring(start);
    setText(newText);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setExpanded(true);
    }
  };

  const handleSubmit = async () => {
    if (!file && !text.trim()) {
      toast.error('Escreva algo ou adicione uma foto/vídeo');
      return;
    }
    try {
      await createPost.mutateAsync({ imageFile: file ?? undefined, caption: text });
      toast.success('Publicado com sucesso!');
      setText('');
      setFile(null);
      setPreview(null);
      setExpanded(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao publicar');
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setText('');
    setExpanded(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-3 mb-4">
      <div className="flex items-start gap-3">
        <Avatar className="w-9 h-9 shrink-0">
          <AvatarImage src={profile?.avatar_url ?? undefined} />
          <AvatarFallback>{(profile?.username ?? 'U')[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <Textarea
            ref={textareaRef}
            placeholder="O que você quer postar agora?"
            value={text}
            onChange={(e) => { setText(e.target.value); if (!expanded) setExpanded(true); }}
            onFocus={() => setExpanded(true)}
            rows={expanded ? 3 : 1}
            className="resize-none min-h-0 border-0 bg-muted/50 focus-visible:ring-1 text-sm px-3 py-2 rounded-lg"
          />
        </div>
      </div>

      {preview && (
        <div className="relative mt-3 rounded-lg overflow-hidden max-h-60">
          {file && /^video\//i.test(file.type) ? (
            <video src={preview} className="w-full max-h-60 object-cover rounded-lg" controls muted />
          ) : (
            <img src={preview} alt="Preview" className="w-full max-h-60 object-cover rounded-lg" />
          )}
          <Button variant="secondary" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => { setFile(null); setPreview(null); }}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {expanded && (
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground h-8 px-2" onClick={() => fileRef.current?.click()}>
              <ImagePlus className="w-4 h-4" /> Foto
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground h-8 px-2" onClick={() => fileRef.current?.click()}>
              <Video className="w-4 h-4" /> Vídeo
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8" title="Negrito" onClick={() => insertFormatting('**', '**')}>
              <Bold className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8" title="Itálico" onClick={() => insertFormatting('*', '*')}>
              <Italic className="w-4 h-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8" title="Emoji">
                  <Smile className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                <div className="grid grid-cols-6 gap-1">
                  {EMOJI_LIST.map(emoji => (
                    <button key={emoji} className="text-xl hover:bg-muted rounded p-1 transition-colors" onClick={() => insertEmoji(emoji)}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={reset}>
              Cancelar
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1.5 gradient-brand"
              onClick={handleSubmit}
              disabled={(!file && !text.trim()) || createPost.isPending}
            >
              <Send className="w-3.5 h-3.5" />
              {createPost.isPending ? 'Publicando...' : 'Publicar'}
            </Button>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/mp4,video/webm,video/quicktime"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}