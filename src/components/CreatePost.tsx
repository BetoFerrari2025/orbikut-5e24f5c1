import { useState, useRef } from 'react';
import { ImagePlus, Video, X, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCreatePost } from '@/hooks/usePosts';
import { useIsAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function CreatePost() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createPost = useCreatePost();
  const { data: isAdmin } = useIsAdmin();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) {
      toast.error(t('post.selectImage'));
      return;
    }

    try {
      await createPost.mutateAsync({
        imageFile: selectedImage,
        caption,
        linkUrl: linkUrl.trim() || undefined,
        linkLabel: linkLabel.trim() || undefined,
      });
      toast.success(t('post.postCreated'));
      setOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar post');
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setPreview(null);
    setCaption('');
    setLinkUrl('');
    setLinkLabel('');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-muted text-foreground">
          <ImagePlus className="w-6 h-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar nova publicação</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!preview ? (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <ImagePlus className="w-10 h-10 text-muted-foreground" />
                <Video className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Clique para selecionar uma imagem ou vídeo</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4,video/webm,video/quicktime"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative">
              {selectedImage && /^video\//i.test(selectedImage.type) ? (
                <video
                  src={preview!}
                  className="w-full aspect-square object-cover rounded-lg"
                  controls
                  muted
                />
              ) : (
                <img
                  src={preview!}
                  alt="Preview"
                  className="w-full aspect-square object-cover rounded-lg"
                />
              )}
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => {
                  setSelectedImage(null);
                  setPreview(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <Textarea
            placeholder="Escreva uma legenda..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
          />

          {isAdmin && (
            <div className="space-y-2 p-3 rounded-lg border border-accent/30 bg-accent/5">
              <p className="text-xs font-semibold text-accent flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Link de ação (Admin)
              </p>
              <Input
                placeholder="https://exemplo.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="text-sm"
              />
              <Input
                placeholder="Texto do botão (ex: Saiba mais)"
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                className="text-sm"
              />
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!selectedImage || createPost.isPending}
            className="w-full gradient-brand hover:opacity-90 glow-primary"
          >
            {createPost.isPending ? 'Publicando...' : 'Compartilhar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
