import { useState } from 'react';
import { useProfileLinks, useAddProfileLink, useUpdateProfileLink, useDeleteProfileLink } from '@/hooks/useProfileLinks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, Plus, X, Link as LinkIcon, Pencil, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface ProfileLinksProps {
  userId: string;
  isOwnProfile: boolean;
}

export function ProfileLinks({ userId, isOwnProfile }: ProfileLinksProps) {
  const { data: links, isLoading } = useProfileLinks(userId);
  const addLink = useAddProfileLink();
  const updateLink = useUpdateProfileLink();
  const deleteLink = useDeleteProfileLink();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const { t } = useTranslation();

  const handleAdd = () => {
    if (!title.trim() || !url.trim()) {
      toast.error(t('profileLinks.fillAllFields'));
      return;
    }
    const finalUrl = url.startsWith('http') ? url : `https://${url}`;
    addLink.mutate({ title: title.trim(), url: finalUrl }, {
      onSuccess: () => {
        setTitle('');
        setUrl('');
        setAdding(false);
        toast.success(t('profileLinks.linkAdded'));
      },
      onError: () => toast.error(t('profileLinks.addError')),
    });
  };

  const startEdit = (link: { id: string; title: string; url: string }) => {
    setEditingId(link.id);
    setEditTitle(link.title);
    setEditUrl(link.url);
  };

  const handleUpdate = () => {
    if (!editingId || !editTitle.trim() || !editUrl.trim()) {
      toast.error(t('profileLinks.fillAllFields'));
      return;
    }
    const finalUrl = editUrl.startsWith('http') ? editUrl : `https://${editUrl}`;
    updateLink.mutate({ id: editingId, title: editTitle.trim(), url: finalUrl }, {
      onSuccess: () => {
        setEditingId(null);
        toast.success(t('profileLinks.linkUpdated'));
      },
      onError: () => toast.error(t('profileLinks.updateError')),
    });
  };

  const handleDelete = (linkId: string) => {
    deleteLink.mutate(linkId, {
      onSuccess: () => toast.success(t('profileLinks.linkRemoved')),
      onError: () => toast.error(t('profileLinks.removeError')),
    });
  };

  if (isLoading) return null;
  if (!links?.length && !isOwnProfile) return null;

  return (
    <div className="mb-4">
      {links && links.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {links.map((link) => (
            editingId === link.id ? (
              <div key={link.id} className="flex items-center gap-2 w-full">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder={t('profileLinks.title')}
                  className="h-8 text-sm flex-1"
                />
                <Input
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="URL"
                  className="h-8 text-sm flex-1"
                />
                <Button size="sm" onClick={handleUpdate} disabled={updateLink.isPending} className="h-8">
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div key={link.id} className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1.5 text-sm group">
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                  {link.title}
                </a>
                {isOwnProfile && (
                  <div className="flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(link)} className="text-muted-foreground hover:text-primary">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(link.id)} className="text-muted-foreground hover:text-destructive">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )
          ))}
        </div>
      )}

      {isOwnProfile && !adding && (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('profileLinks.addLink')}
        </button>
      )}

      {adding && (
        <div className="flex items-center gap-2 mt-2">
          <Input
            placeholder={t('profileLinks.title')}
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
