import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Globe, ArrowRight, Sparkles, TrendingUp, Eye, Zap, Users, Star, ChevronRight, CheckCircle2, MessageCircle, Heart, Camera, Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logoImg from '@/assets/logo.png';
import { motion } from 'framer-motion';
import { captureReferralCode } from '@/hooks/useReferral';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LandingHeroMockup from '@/components/landing/HeroMockup';
import LandingBenefits from '@/components/landing/Benefits';
import LandingSocialProof from '@/components/landing/SocialProof';
import LandingOpportunity from '@/components/landing/Opportunity';
import LandingUrgency from '@/components/landing/Urgency';

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

import type { Easing } from 'framer-motion';
const ease: Easing = [0, 0, 0.2, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function Landing() {
  const { t, i18n } = useTranslation();
  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    captureReferralCode();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* ── URGENCY BANNER ── */}
      <div className="relative bg-gradient-to-r from-[#7c3aed] via-[#ff2d55] to-[#ff6090] text-white text-center py-2.5 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-30" />
        <motion.p 
          className="relative text-xs sm:text-sm font-bold tracking-wide flex items-center justify-center gap-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Flame className="w-4 h-4 animate-pulse" />
          <span>⚠️ Você está entre os primeiros usuários — isso significa mais alcance e menos concorrência</span>
          <Flame className="w-4 h-4 animate-pulse" />
        </motion.p>
      </div>

      {/* ── NAV ── */}
      <nav className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Orbikut" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover" />
            <span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-[#00f0ff] via-[#ff2d55] to-[#ff6090] bg-clip-text text-transparent tracking-tight">Orbikut</span>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-white/60 hover:text-white hover:bg-white/10">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">{currentLang.flag} {currentLang.label}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px] bg-[#16161f] border-white/10 text-white">
                {LANGUAGES.map((lang) => (
                  <DropdownMenuItem key={lang.code} onClick={() => i18n.changeLanguage(lang.code)} className={`hover:bg-white/10 ${i18n.language === lang.code ? 'bg-white/5 font-semibold' : ''}`}>
                    <span className="mr-2">{lang.flag}</span>{lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" asChild className="text-white/80 hover:text-white hover:bg-white/10">
              <Link to="/auth">{t('nav.signIn')}</Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-[#7c3aed] to-[#ff2d55] hover:opacity-90 text-white font-bold shadow-lg shadow-purple-500/25">
              <Link to="/auth">Entrar antes que cresça 🚀</Link>
            </Button>
          </div>
        </div>
        {/* Mobile row */}
        <div className="flex sm:hidden items-center justify-between mt-3 gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-white/60 hover:text-white hover:bg-white/10 h-9 px-2.5">
                <Globe className="w-4 h-4" />
                <span className="text-xs">{currentLang.flag}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[160px] bg-[#16161f] border-white/10 text-white">
              {LANGUAGES.map((lang) => (
                <DropdownMenuItem key={lang.code} onClick={() => i18n.changeLanguage(lang.code)} className={`hover:bg-white/10 ${i18n.language === lang.code ? 'bg-white/5 font-semibold' : ''}`}>
                  <span className="mr-2">{lang.flag}</span>{lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="h-9 text-sm text-white/80 hover:text-white hover:bg-white/10">
              <Link to="/auth">{t('nav.signIn')}</Link>
            </Button>
            <Button asChild size="sm" className="bg-gradient-to-r from-[#7c3aed] to-[#ff2d55] hover:opacity-90 text-white font-bold h-9 text-sm shadow-lg shadow-purple-500/25">
              <Link to="/auth">Entrar agora 🚀</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header className="relative">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-[#7c3aed]/20 via-[#ff2d55]/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#00f0ff]/8 rounded-full blur-3xl" />
          <div className="absolute top-40 right-10 w-60 h-60 bg-[#ff2d55]/8 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-16 md:pt-24 md:pb-32">
          <div className="grid md:grid-cols-2 gap-10 md:gap-12 items-center">
            <motion.div className="space-y-6 md:space-y-8" initial="hidden" animate="visible" variants={staggerContainer}>
              <motion.div variants={fadeUp} custom={0}>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#ff2d55]/15 text-[#ff2d55] px-3 py-1.5 rounded-full border border-[#ff2d55]/25 mb-4 animate-pulse">
                  <Flame className="w-3.5 h-3.5" /> +847 pessoas entraram esta semana
                </span>
              </motion.div>

              <motion.h1
                className="text-3xl sm:text-4xl md:text-6xl font-black leading-[1.08] tracking-tight"
                variants={fadeUp} custom={1}
              >
                Sua chance de{' '}
                <span className="bg-gradient-to-r from-[#7c3aed] via-[#ff2d55] to-[#ff6090] bg-clip-text text-transparent">
                  crescer antes de todo mundo
                </span>
              </motion.h1>

              <motion.p className="text-base sm:text-lg text-white/60 max-w-lg leading-relaxed" variants={fadeUp} custom={2}>
                Enquanto as redes tradicionais estão saturadas, aqui seu conteúdo é visto de verdade. Quem entra primeiro, sai na frente.
              </motion.p>

              <motion.div variants={fadeUp} custom={3}>
                <Button asChild size="lg" className="w-full sm:w-auto bg-gradient-to-r from-[#7c3aed] to-[#ff2d55] hover:opacity-90 text-white text-base sm:text-lg px-8 h-14 font-bold group shadow-xl shadow-purple-500/30 rounded-xl">
                  <Link to="/auth">
                    Entrar antes que cresça
                    <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </motion.div>

              <motion.div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-white/50 text-sm" variants={fadeUp} custom={4}>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% gratuito</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Menos de 30 segundos</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Acesso imediato</span>
              </motion.div>
            </motion.div>

            {/* Phone mockup */}
            <LandingHeroMockup />
          </div>
        </div>
      </header>

      {/* ── BENEFÍCIOS ── */}
      <LandingBenefits />

      {/* ── PROVA SOCIAL ── */}
      <LandingSocialProof />

      {/* ── OPORTUNIDADE ── */}
      <LandingOpportunity />

      {/* ── URGÊNCIA + CTA FINAL ── */}
      <LandingUrgency />

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Orbikut" className="w-5 h-5 rounded object-cover" />
            <span className="font-bold text-white/60">Orbikut</span>
          </div>
          <p>© {new Date().getFullYear()} Orbikut. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
