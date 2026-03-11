import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Camera, Users, Heart, MessageCircle, Zap, Sparkles, Globe, ArrowRight, Star, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logoImg from '@/assets/logo.png';
import { motion } from 'framer-motion';
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

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

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

        {/* Nav - mobile: 2 rows, desktop: 1 row */}
        <nav className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-4">
          {/* Row 1: Logo + desktop actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="Orbikut" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover" />
              <span className="text-2xl sm:text-3xl font-black text-gradient-brand tracking-tight">Orbikut</span>
            </div>

            {/* Desktop actions */}
            <div className="hidden sm:flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                    <Globe className="w-4 h-4" />
                    <span className="text-sm">{currentLang.flag} {currentLang.label}</span>
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
          </div>

          {/* Row 2: Mobile actions */}
          <div className="flex sm:hidden items-center justify-between mt-3 gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground h-9 px-2.5">
                  <Globe className="w-4 h-4" />
                  <span className="text-xs">{currentLang.flag}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[160px]">
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

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="h-9 text-sm">
                <Link to="/auth">{t('nav.signIn')}</Link>
              </Button>
              <Button asChild size="sm" className="gradient-brand hover:opacity-90 glow-primary h-9 text-sm">
                <Link to="/auth">{t('auth.createAccount')}</Link>
              </Button>
            </div>
          </div>
        </nav>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-20 md:pt-28 md:pb-36">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              className="space-y-8"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.h1
                className="text-4xl sm:text-5xl md:text-7xl font-black text-foreground leading-[1.05] tracking-tight"
                variants={fadeUp}
                custom={0}
              >
                {t('landing.hero')}{' '}
                <span className="text-gradient-brand">{t('landing.heroBrand')}</span>
              </motion.h1>
              <motion.p
                className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed"
                variants={fadeUp}
                custom={1}
              >
                {t('landing.heroDesc')}
              </motion.p>
              <motion.div className="flex flex-col sm:flex-row gap-4" variants={fadeUp} custom={2}>
                <Button asChild size="lg" className="gradient-brand hover:opacity-90 glow-primary text-lg px-8 h-14 font-bold group">
                  <Link to="/auth">
                    <Sparkles className="w-5 h-5 mr-2" />
                    {t('landing.cta')}
                    <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                className="flex items-center gap-6 text-muted-foreground text-sm"
                variants={fadeUp}
                custom={3}
              >
                <span className="flex items-center gap-1"><Users className="w-4 h-4 text-primary" /> {t('landing.community')}</span>
                <span className="flex items-center gap-1"><Zap className="w-4 h-4 text-accent" /> {t('landing.free')}</span>
              </motion.div>
            </motion.div>

            {/* Phone mockup - visible on md+ */}
            <motion.div
              className="hidden md:flex justify-center"
              initial="hidden"
              animate="visible"
              variants={scaleIn}
            >
              <div className="relative w-72">
                <div className="w-full aspect-[9/19] rounded-[2.5rem] border-4 border-muted bg-card shadow-2xl overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-b from-primary/10 to-accent/10 flex flex-col p-5">
                    {/* Mock header */}
                    <div className="flex items-center gap-2 mb-4">
                      <img src={logoImg} alt="Orbikut" className="w-8 h-8 rounded-lg object-cover" />
                      <span className="text-lg font-black text-gradient-brand">Orbikut</span>
                    </div>
                    {/* Mock story bar */}
                    <div className="flex gap-2 mb-4">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-accent p-[2px]">
                            <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                              <Users className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </div>
                          <div className="w-8 h-1.5 rounded bg-muted/60" />
                        </div>
                      ))}
                    </div>
                    {/* Mock post cards */}
                    <div className="flex-1 space-y-3 overflow-hidden">
                      <div className="rounded-xl bg-muted/40 border border-border/50 p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/30" />
                          <div className="w-16 h-2 rounded bg-muted/80" />
                        </div>
                        <div className="w-full h-20 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <Camera className="w-6 h-6 text-primary/50" />
                        </div>
                        <div className="flex gap-3">
                          <Heart className="w-4 h-4 text-primary/50" />
                          <MessageCircle className="w-4 h-4 text-muted-foreground/50" />
                          <Star className="w-4 h-4 text-accent/50" />
                        </div>
                      </div>
                      <div className="rounded-xl bg-muted/40 border border-border/50 p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-accent/30" />
                          <div className="w-20 h-2 rounded bg-muted/80" />
                        </div>
                        <div className="w-full h-12 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-accent/50" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Floating icons */}
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
            </motion.div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-20 bg-card/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
          >
            {t('landing.featuresTitle')}
          </motion.h2>
          <motion.p
            className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {t('landing.featuresDesc')}
          </motion.p>
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 group"
                variants={fadeUp}
                custom={i}
              >
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 pointer-events-none" />
        <motion.div
          className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
        >
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
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between text-sm text-muted-foreground">
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
