import { useState } from 'react';
import { useProfileLinks, useAddProfileLink, useDeleteProfileLink } from '@/hooks/useProfileLinks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, Plus, X, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileLinksProps {
  userId: string;
  isOwnProfile: boolean;
}

export function ProfileLinks({ userId, isOwnProfile }: ProfileLinksProps) {
  const { data: links, isLoading } = useProfileLinks(userId);
  const addLink = useAddProfileLink();
  const deleteLink = useDeleteProfileLink();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  const handleAdd = () => {
    if (!title.trim() || !url.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    const finalUrl = url.startsWith('http') ? url : `https://${url}`;
    addLink.mutate({ title: title.trim(), url: finalUrl }, {
      onSuccess: () => {
        setTitle('');
        setUrl('');
        setAdding(false);
        toast.success('Link adicionado!');
      },
      onError: () => toast.error('Erro ao adicionar link'),
    });
  };

  if (isLoading) return null;
  if (!links?.length && !isOwnProfile) return null;

  return (
    <div className="mb-4">
      {links && links.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {links.map((link) => (
            <div key={link.id} className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1.5 text-sm group">
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                {link.title}
              </a>
              {isOwnProfile && (
                <button
                  onClick={() => deleteLink.mutate(link.id)}
                  className="ml-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isOwnProfile && !adding && (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar link
        </button>
      )}

      {adding && (
        <div className="flex items-center gap-2 mt-2">
          <Input
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-8 text-sm flex-1"
          />
          <Input
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="h-8 text-sm flex-1"
          />
          <Button size="sm" onClick={handleAdd} disabled={addLink.isPending} className="h-8">
            <LinkIcon className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)} className="h-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
