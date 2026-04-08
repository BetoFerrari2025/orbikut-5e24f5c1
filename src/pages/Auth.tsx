import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { processReferral } from '@/hooks/useReferral';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';
import logoImg from '@/assets/logo.png';
import { usePagePresence } from '@/hooks/usePagePresence';

export default function Auth() {
  usePagePresence('auth');

  // Load GerenciarROI UTM script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://zwylxoajyyjflvvcwpvz.supabase.co/functions/v1/utms/latest.js';
    script.async = true;
    script.defer = true;
    script.setAttribute('data-gerenciaroi-prevent-xcod-sck', '');
    script.setAttribute('data-gerenciaroi-prevent-subids', '');
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  // Meta Pixels
  useEffect(() => {
    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
      document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init','26621257560825002');
      fbq('init','1641404680335617');
      fbq('init','1111316097827689');
      fbq('track','PageView');
    `;
    document.head.appendChild(script);

    // noscript fallback images
    const ns1 = document.createElement('img');
    ns1.height = 1; ns1.width = 1; ns1.style.display = 'none';
    ns1.src = 'https://www.facebook.com/tr?id=1641404680335617&ev=PageView&noscript=1';
    document.body.appendChild(ns1);

    const ns2 = document.createElement('img');
    ns2.height = 1; ns2.width = 1; ns2.style.display = 'none';
    ns2.src = 'https://www.facebook.com/tr?id=1111316097827689&ev=PageView&noscript=1';
    document.body.appendChild(ns2);

    return () => {
      document.head.removeChild(script);
      document.body.removeChild(ns1);
      document.body.removeChild(ns2);
    };
  }, []);

  // GerenciaROI - Rastreamento ao Vivo
  useEffect(() => {
    const uid = "0d6e183b-9b25-4bb6-a59c-187fd39f35fe";
    const sid = Math.random().toString(36).substr(2, 12) + Date.now().toString(36);
    const url = "https://zwylxoajyyjflvvcwpvz.supabase.co/functions/v1/track-visitor";
    const send = (action: string) => {
      const data = JSON.stringify({ user_id: uid, session_id: sid, page_url: location.href, action });
      if (navigator.sendBeacon) { navigator.sendBeacon(url, data); }
      else { fetch(url, { method: "POST", body: data, headers: { "Content-Type": "application/json" }, keepalive: true }); }
    };
    send("heartbeat");
    const interval = setInterval(() => send("heartbeat"), 15000);
    const handleUnload = () => send("leave");
    const handleVisibility = () => { if (document.hidden) send("leave"); else send("heartbeat"); };
    window.addEventListener("beforeunload", handleUnload);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleUnload);
      document.removeEventListener("visibilitychange", handleVisibility);
      send("leave");
    };
  }, []);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success(t('auth.loginSuccess'));
        navigate('/');
      } else {
        if (!username.trim()) {
          toast.error(t('auth.usernameRequired'));
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, username, fullName);
        if (error) throw error;
        // Process referral after successful signup
        const { data: { session: newSession } } = await supabase.auth.getSession();
        if (newSession?.user) {
          await processReferral(newSession.user.id);
        }
        toast.success(t('auth.accountCreated'));
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || t('auth.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center bg-background p-4 pt-8 sm:pt-4 overflow-y-auto relative">
      {/* Language selector */}
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Globe className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {[
              { code: 'pt', flag: '🇧🇷', label: 'Português' },
              { code: 'en', flag: '🇺🇸', label: 'English' },
              { code: 'es', flag: '🇪🇸', label: 'Español' },
              { code: 'fr', flag: '🇫🇷', label: 'Français' },
              { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
              { code: 'it', flag: '🇮🇹', label: 'Italiano' },
              { code: 'ja', flag: '🇯🇵', label: '日本語' },
              { code: 'ko', flag: '🇰🇷', label: '한국어' },
              { code: 'zh', flag: '🇨🇳', label: '中文' },
            ].map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => i18n.changeLanguage(lang.code)}
                className={i18n.language === lang.code ? 'bg-accent' : ''}
              >
                <span className="mr-2">{lang.flag}</span>
                {lang.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img src={logoImg} alt="Orbikut" className="w-16 h-16 rounded-2xl object-cover" />
          </div>
          <CardTitle className="text-3xl font-bold text-gradient-brand">
            Orbikut
          </CardTitle>
          <CardDescription>
            {isLogin ? t('auth.loginTitle') : t('auth.signupTitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">{t('auth.username')}</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder={t('auth.usernamePlaceholder')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={!isLogin}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t('auth.fullName')}</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={t('auth.fullNamePlaceholder')}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full gradient-brand hover:opacity-90 glow-primary"
              disabled={loading}
            >
              {loading ? t('auth.loading') : isLogin ? t('auth.login') : t('auth.createAccount')}
            </Button>
          </form>
          {isLogin && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={async () => {
                  if (!email.trim()) {
                    toast.error(t('auth.enterEmailFirst'));
                    return;
                  }
                  try {
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/reset-password`,
                    });
                    if (error) throw error;
                    toast.success(t('auth.recoveryEmailSent'));
                  } catch (err: any) {
                    toast.error(err.message || t('auth.recoveryEmailError'));
                  }
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {t('auth.forgotPassword')}
              </button>
            </div>
          )}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
