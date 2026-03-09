import { useState, useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCreatePost } from '@/hooks/usePosts';
import { toast } from 'sonner';

export function CreatePost() {
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createPost = useCreatePost();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) {
      toast.error('Selecione uma imagem');
      return;
    }

    try {
      await createPost.mutateAsync({ imageFile: selectedImage, caption });
      toast.success('Post criado com sucesso!');
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
