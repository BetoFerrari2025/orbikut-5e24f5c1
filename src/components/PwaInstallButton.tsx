import { useState, useEffect } from 'react';
import { Download, X, Share, MoreVertical, CheckCircle2, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallButton() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

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
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
      return;
    }

    if (isMobile) {
      setSheetOpen(true);
    } else {
      navigate('/install');
    }
  };

  const handleSheetInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
      setSheetOpen(false);
    }
  };

  if (isStandalone || dismissed) return null;

  return (
    <>
      <div className="fixed bottom-20 right-4 z-50 md:bottom-6 animate-in slide-in-from-bottom fade-in flex flex-col items-end gap-2">
        <button onClick={() => setDismissed(true)} className="bg-card border border-border rounded-full w-6 h-6 flex items-center justify-center text-muted-foreground shadow">
          <X className="w-3 h-3" />
        </button>
        <Button
          onClick={handleInstall}
          className="rounded-full shadow-lg gap-2 px-5 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
          size="sm"
        >
          <Download className="w-4 h-4" />
          Baixar App
        </Button>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader className="text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
              <Smartphone className="w-7 h-7 text-primary" />
            </div>
            <SheetTitle className="text-xl">Instale o Orbikut</SheetTitle>
            <SheetDescription>
              Tenha acesso rápido direto da tela inicial do seu celular
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {deferredPrompt && isAndroid && (
              <Button onClick={handleSheetInstall} className="w-full rounded-full gap-2 h-12 text-base">
                <Download className="w-5 h-5" />
                Baixar App Agora
              </Button>
            )}

            {isIos && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">No iPhone/iPad:</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                    <p className="text-sm text-muted-foreground pt-1">Toque no ícone <Share className="w-4 h-4 inline mx-1" /> Compartilhar na barra do Safari</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                    <p className="text-sm text-muted-foreground pt-1">Role para baixo e toque em "Adicionar à Tela de Início"</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                    <p className="text-sm text-muted-foreground pt-1">Toque em "Adicionar" para confirmar</p>
                  </div>
                </div>
              </div>
            )}

            {isAndroid && !deferredPrompt && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">No Android:</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                    <p className="text-sm text-muted-foreground pt-1">Toque no menu do navegador <MoreVertical className="w-4 h-4 inline mx-1" /> (três pontinhos)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                    <p className="text-sm text-muted-foreground pt-1">Toque em "Instalar app" ou "Adicionar à tela inicial"</p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-center">
              <SheetClose asChild>
                <Button variant="ghost" size="sm">Talvez depois</Button>
              </SheetClose>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
