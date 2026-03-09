import { useState, useRef } from 'react';
import { Plus, X, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCreateStoryWithPoll } from '@/hooks/useStoryPolls';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CreateStoryWithPollProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateStoryWithPoll({ open, onOpenChange }: CreateStoryWithPollProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
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

    try {
      await createStory.mutateAsync({ file: selectedFile, poll });
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
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogContent className="sm:max-w-md">
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
            <div className="relative aspect-[9/16] max-h-[400px] rounded-lg overflow-hidden">
              {selectedFile?.type.startsWith('video') ? (
                <video src={preview} className="w-full h-full object-cover" muted autoPlay loop />
              ) : (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              )}
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>

              {/* Poll overlay */}
              {showPoll && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-xl p-4 space-y-3">
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
            <div className="flex gap-2">
              <Button
                variant={showPoll ? 'default' : 'outline'}
                onClick={() => setShowPoll(!showPoll)}
                className={cn(showPoll && 'gradient-brand')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Enquete
              </Button>
            </div>
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
