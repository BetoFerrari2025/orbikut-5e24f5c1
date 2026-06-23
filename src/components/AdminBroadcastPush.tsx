import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Megaphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TEMPLATES = [
  { title: '🔥 Tem coisa nova rolando!', body: 'Abra agora e veja o que está bombando no Orbikut.' },
  { title: '✨ Sentimos sua falta', body: 'Volta pra gente, tem novidade esperando você.' },
  { title: '🚀 Bora postar?', body: 'Seu próximo post pode viralizar. Vai lá!' },
  { title: '💬 Você tem amigos online', body: 'Mande um oi e comece uma conversa.' },
];

export function AdminBroadcastPush() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/');
  const [segment, setSegment] = useState<'all' | 'inactive_3d'>('all');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Preencha título e mensagem');
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-broadcast-push', {
        body: { title, body, url, segment },
      });
      if (error) throw error;
      toast.success(`🚀 Push enviado para ${data?.sent ?? 0} dispositivo(s)`);
      setTitle('');
      setBody('');
    } catch (e: any) {
      toast.error('Falha ao enviar: ' + (e?.message ?? e));
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Megaphone className="w-4 h-4 text-primary" />
          Notificação em massa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.title}
              type="button"
              onClick={() => { setTitle(tpl.title); setBody(tpl.body); }}
              className="text-left p-2 rounded-lg border text-xs hover:bg-accent/30 transition-colors"
            >
              <div className="font-semibold truncate">{tpl.title}</div>
              <div className="text-muted-foreground line-clamp-2">{tpl.body}</div>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <Label>Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} placeholder="🔥 Algo incrível" />
        </div>
        <div className="space-y-2">
          <Label>Mensagem</Label>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={140} rows={3} placeholder="O que você quer dizer?" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Link ao clicar</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/" />
          </div>
          <div className="space-y-2">
            <Label>Segmento</Label>
            <Select value={segment} onValueChange={(v: any) => setSegment(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos com push ativo</SelectItem>
                <SelectItem value="inactive_3d">Inativos há 3+ dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={send} disabled={sending} className="w-full gap-2">
          <Send className="w-4 h-4" />
          {sending ? 'Enviando...' : 'Enviar push agora'}
        </Button>
      </CardContent>
    </Card>
  );
}
