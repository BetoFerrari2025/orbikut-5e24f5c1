import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Globe, ArrowRight, Sparkles, TrendingUp, Eye, Zap, Users, Star, ChevronRight, CheckCircle2, MessageCircle, Heart, Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logoImg from '@/assets/logo.png';
import { motion } from 'framer-motion';
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

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
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
              <Link to="/auth">{t('auth.createAccount')}</Link>
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
              <Link to="/auth">{t('auth.createAccount')}</Link>
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
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 text-[#00f0ff] px-3 py-1.5 rounded-full border border-[#00f0ff]/20 mb-4">
                  <Sparkles className="w-3.5 h-3.5" /> Nova rede social brasileira
                </span>
              </motion.div>

              <motion.h1
                className="text-3xl sm:text-4xl md:text-6xl font-black leading-[1.08] tracking-tight"
                variants={fadeUp} custom={1}
              >
                Entre na nova rede social{' '}
                <span className="bg-gradient-to-r from-[#7c3aed] via-[#ff2d55] to-[#ff6090] bg-clip-text text-transparent">
                  enquanto ainda está no começo
                </span>
              </motion.h1>

              <motion.p className="text-base sm:text-lg text-white/60 max-w-lg leading-relaxed" variants={fadeUp} custom={2}>
                Mais alcance, menos concorrência. Quem entra primeiro sai na frente.
              </motion.p>

              <motion.div variants={fadeUp} custom={3}>
                <Button asChild size="lg" className="w-full sm:w-auto bg-gradient-to-r from-[#7c3aed] to-[#ff2d55] hover:opacity-90 text-white text-base sm:text-lg px-8 h-14 font-bold group shadow-xl shadow-purple-500/30 rounded-xl">
                  <Link to="/auth">
                    Criar conta grátis agora
                    <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </motion.div>

              <motion.div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-white/50 text-sm" variants={fadeUp} custom={4}>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sem custo</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Leva menos de 1 minuto</span>
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
