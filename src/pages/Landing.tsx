import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Camera, Users, Heart, MessageCircle, Zap, Sparkles, Globe, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logoImg from '@/assets/logo.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LANGUAGES = [
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

export default function Landing() {
  const { t, i18n } = useTranslation();

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const features = [
    { icon: Camera, title: t('landing.photosVideos'), desc: t('landing.photosVideosDesc'), color: 'text-primary' },
    { icon: Sparkles, title: t('landing.interactiveStories'), desc: t('landing.interactiveStoriesDesc'), color: 'text-accent' },
    { icon: Heart, title: t('landing.reactionsLikes'), desc: t('landing.reactionsLikesDesc'), color: 'text-primary' },
    { icon: MessageCircle, title: t('landing.privateMessages'), desc: t('landing.privateMessagesDesc'), color: 'text-accent' },
    { icon: Users, title: t('landing.communityTitle'), desc: t('landing.communityDesc'), color: 'text-primary' },
    { icon: Zap, title: t('landing.streaksHighlights'), desc: t('landing.streaksHighlightsDesc'), color: 'text-accent' },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero */}
      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20 pointer-events-none" />
        <nav className="relative z-10 max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Orbikut" className="w-10 h-10 rounded-xl object-cover" />
            <span className="text-3xl font-black text-gradient-brand tracking-tight">Orbikut</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">{currentLang.flag} {currentLang.label}</span>
                  <span className="sm:hidden text-sm">{currentLang.flag}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                {LANGUAGES.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => i18n.changeLanguage(lang.code)}
                    className={i18n.language === lang.code ? 'bg-accent/10 font-semibold' : ''}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" asChild>
              <Link to="/auth">{t('nav.signIn')}</Link>
            </Button>
            <Button asChild className="gradient-brand hover:opacity-90 glow-primary">
              <Link to="/auth">{t('auth.createAccount')}</Link>
            </Button>
          </div>
        </nav>

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-24 md:pt-28 md:pb-36">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl md:text-7xl font-black text-foreground leading-[1.05] tracking-tight">
                {t('landing.hero')}{' '}
                <span className="text-gradient-brand">{t('landing.heroBrand')}</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
                {t('landing.heroDesc')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="gradient-brand hover:opacity-90 glow-primary text-lg px-8 h-14 font-bold group">
                  <Link to="/auth">
                    <Sparkles className="w-5 h-5 mr-2" />
                    {t('landing.cta')}
                    <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
              <div className="flex items-center gap-6 text-muted-foreground text-sm">
                <span className="flex items-center gap-1"><Users className="w-4 h-4 text-primary" /> {t('landing.community')}</span>
                <span className="flex items-center gap-1"><Zap className="w-4 h-4 text-accent" /> {t('landing.free')}</span>
              </div>
            </div>

            {/* Phone mockup */}
            <div className="hidden md:flex justify-center">
              <div className="relative w-72">
                <div className="w-full aspect-[9/19] rounded-[2.5rem] border-4 border-muted bg-card shadow-2xl overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-b from-primary/10 to-accent/10 flex flex-col items-center justify-center gap-4 p-6">
                    <img src={logoImg} alt="Orbikut" className="w-16 h-16 rounded-2xl object-cover" />
                    <p className="text-3xl font-black text-gradient-brand">Orbikut</p>
                    <div className="w-full space-y-3 mt-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-full h-16 rounded-xl bg-muted/50 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-14 h-14 rounded-2xl bg-primary/20 backdrop-blur-sm flex items-center justify-center animate-bounce" style={{ animationDuration: '3s' }}>
                  <Heart className="w-7 h-7 text-primary" />
                </div>
                <div className="absolute -bottom-2 -left-6 w-12 h-12 rounded-xl bg-accent/20 backdrop-blur-sm flex items-center justify-center animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                  <Camera className="w-6 h-6 text-accent" />
                </div>
                <div className="absolute top-1/2 -right-8 w-10 h-10 rounded-lg bg-muted/30 backdrop-blur-sm flex items-center justify-center animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
                  <MessageCircle className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-20 bg-card/50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
            {t('landing.featuresTitle')}
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
            {t('landing.featuresDesc')}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-black text-foreground">
            {t('landing.ctaTitle')} <span className="text-gradient-brand">{t('landing.ctaBrand')}</span>?
          </h2>
          <p className="text-xl text-muted-foreground">
            {t('landing.ctaDesc')}
          </p>
          <Button asChild size="lg" className="gradient-brand hover:opacity-90 glow-primary text-lg px-10 h-14 font-bold group">
            <Link to="/auth">
              {t('landing.createMyAccount')}
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Orbikut" className="w-5 h-5 rounded object-cover" />
            <span className="font-bold">Orbikut</span>
          </div>
          <p>© {new Date().getFullYear()} Orbikut. {t('landing.allRightsReserved')}</p>
        </div>
      </footer>
    </div>
  );
}
