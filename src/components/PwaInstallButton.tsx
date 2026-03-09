import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Also show a manual "add to home" hint on iOS / browsers without beforeinstallprompt
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  if (isStandalone || dismissed) return null;

  // If no native prompt, show a tip for all mobile users
  if (!deferredPrompt) {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isMobile = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
    
    if (!isMobile) return null;

    return (
      <div className="fixed bottom-20 right-4 z-50 md:bottom-6 animate-in slide-in-from-bottom fade-in">
        <div className="bg-card border border-border shadow-lg rounded-2xl p-3 pr-8 max-w-[260px] relative">
          <button onClick={() => setDismissed(true)} className="absolute top-2 right-2 text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
          <p className="text-xs text-foreground">
            {isIos 
              ? <>Toque em <strong>Compartilhar</strong> e depois em <strong>"Adicionar à Tela de Início"</strong> para instalar o app.</>
              : <>Abra o menu do navegador (⋮) e toque em <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</>
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-6 animate-in slide-in-from-bottom fade-in">
      <Button
        onClick={handleInstall}
        className="rounded-full shadow-lg gap-2 px-4"
        size="sm"
      >
        <Download className="w-4 h-4" />
        Instalar App
      </Button>
    </div>
  );
}
