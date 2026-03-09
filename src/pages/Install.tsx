import { useState, useEffect } from 'react';
import { Download, Share, MoreVertical, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = /android/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center gap-3 p-4 border-b border-border">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Instalar App</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Download className="w-10 h-10 text-primary" />
        </div>

        <div className="space-y-2 max-w-sm">
          <h2 className="text-2xl font-bold text-foreground">Instale o Orbikut</h2>
          <p className="text-muted-foreground text-sm">
            Tenha acesso rápido direto da tela inicial do seu celular, como um app nativo.
          </p>
        </div>

        {isStandalone ? (
          <div className="bg-accent/50 rounded-xl p-4 max-w-sm">
            <p className="text-sm text-foreground font-medium">✅ App já está instalado!</p>
          </div>
        ) : deferredPrompt ? (
          <Button onClick={handleInstall} size="lg" className="rounded-full gap-2 px-8">
            <Download className="w-5 h-5" />
            Baixar App Agora
          </Button>
        ) : (
          <div className="bg-card border border-border rounded-xl p-5 max-w-sm space-y-4">
            {isIos ? (
              <>
                <p className="text-sm text-foreground font-medium">Como instalar no iPhone/iPad:</p>
                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                    <p className="text-sm text-muted-foreground">
                      Toque no ícone <Share className="w-4 h-4 inline text-primary" /> <strong className="text-foreground">Compartilhar</strong> na barra do Safari
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                    <p className="text-sm text-muted-foreground">
                      Role para baixo e toque em <strong className="text-foreground">"Adicionar à Tela de Início"</strong>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                    <p className="text-sm text-muted-foreground">
                      Toque em <strong className="text-foreground">"Adicionar"</strong> para confirmar
                    </p>
                  </div>
                </div>
              </>
            ) : isAndroid ? (
              <>
                <p className="text-sm text-foreground font-medium">Como instalar no Android:</p>
                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                    <p className="text-sm text-muted-foreground">
                      Toque no menu <MoreVertical className="w-4 h-4 inline text-primary" /> do navegador (três pontinhos)
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                    <p className="text-sm text-muted-foreground">
                      Toque em <strong className="text-foreground">"Instalar app"</strong> ou <strong className="text-foreground">"Adicionar à tela inicial"</strong>
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Abra este site no navegador do seu celular para instalar o app.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
