import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallButton() {
  const navigate = useNavigate();
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
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      navigate('/install');
    }
  };

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  if (isStandalone || dismissed) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-6 animate-in slide-in-from-bottom fade-in flex flex-col items-end gap-2">
      <button onClick={() => setDismissed(true)} className="bg-card border border-border rounded-full w-6 h-6 flex items-center justify-center text-muted-foreground shadow">
        <X className="w-3 h-3" />
      </button>
      <Button
        onClick={handleInstall}
        className="rounded-full shadow-lg gap-2 px-5"
        size="sm"
      >
        <Download className="w-4 h-4" />
        Baixar App
      </Button>
    </div>
  );
}
