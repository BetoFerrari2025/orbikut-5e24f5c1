import { useState, useEffect } from 'react';
import { Download, Share, MoreVertical, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
        <h1 className="text-lg font-bold text-foreground">{t('install.title')}</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Download className="w-10 h-10 text-primary" />
        </div>

        <div className="space-y-2 max-w-sm">
          <h2 className="text-2xl font-bold text-foreground">{t('install.installApp')}</h2>
          <p className="text-muted-foreground text-sm">
            {t('install.installDesc')}
          </p>
        </div>

        {isStandalone ? (
          <div className="bg-accent/50 rounded-xl p-4 max-w-sm">
            <p className="text-sm text-foreground font-medium">{t('install.alreadyInstalled')}</p>
          </div>
        ) : (
          <>
            <Button onClick={handleInstall} size="lg" className="rounded-full gap-2 px-8">
              <Download className="w-5 h-5" />
              {t('install.downloadNow')}
            </Button>

            {!deferredPrompt && (
              <div className="bg-card border border-border rounded-xl p-5 max-w-sm space-y-4">
                <p className="text-xs text-muted-foreground text-center">{t('install.altInstructions')}</p>
                {isIos ? (
                  <>
                    <p className="text-sm text-foreground font-medium">{t('install.iosTitle')}</p>
                    <div className="space-y-3 text-left">
                      <div className="flex items-start gap-3">
                        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                        <p className="text-sm text-muted-foreground">{t('install.iosStep1')}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                        <p className="text-sm text-muted-foreground">{t('install.iosStep2')}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                        <p className="text-sm text-muted-foreground">{t('install.iosStep3')}</p>
                      </div>
                    </div>
                  </>
                ) : isAndroid ? (
                  <>
                    <p className="text-sm text-foreground font-medium">{t('install.androidTitle')}</p>
                    <div className="space-y-3 text-left">
                      <div className="flex items-start gap-3">
                        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                        <p className="text-sm text-muted-foreground">{t('install.androidStep1')}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                        <p className="text-sm text-muted-foreground">{t('install.androidStep2')}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t('install.otherDevice')}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
