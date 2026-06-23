import { Bell, BellOff, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';

export function PushNotificationCard() {
  const { supported, subscribed, permission, loading, subscribe, unsubscribe } =
    usePushNotifications();

  if (!supported) {
    return (
      <Card className="p-4 flex items-start gap-3">
        <BellOff className="w-5 h-5 text-muted-foreground mt-0.5" />
        <div className="text-sm text-muted-foreground">
          Seu navegador não suporta notificações push. Instale o app na tela inicial para ativar.
        </div>
      </Card>
    );
  }

  const handleClick = async () => {
    if (subscribed) {
      await unsubscribe();
      toast.info('Notificações desativadas');
    } else {
      const ok = await subscribe();
      if (ok) toast.success('🔔 Notificações ativadas! Você não vai perder nada.');
      else if (permission === 'denied')
        toast.error('Permissão negada. Habilite nas configurações do navegador.');
    }
  };

  return (
    <Card className="p-4 flex items-center justify-between gap-3 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          {subscribed ? (
            <BellRing className="w-5 h-5 text-primary animate-pulse" />
          ) : (
            <Bell className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm">
            {subscribed ? 'Notificações ativas' : 'Ative as notificações 🔔'}
          </div>
          <div className="text-xs text-muted-foreground line-clamp-2">
            {subscribed
              ? 'Receba curtidas, comentários e DMs em tempo real, mesmo com o app fechado.'
              : 'Fique por dentro de tudo: curtidas, mensagens e novidades direto no celular.'}
          </div>
        </div>
      </div>
      <Button size="sm" onClick={handleClick} disabled={loading} variant={subscribed ? 'outline' : 'default'}>
        {loading ? '...' : subscribed ? 'Desativar' : 'Ativar'}
      </Button>
    </Card>
  );
}
