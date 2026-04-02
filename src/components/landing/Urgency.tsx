import { motion } from 'framer-motion';
import { ArrowRight, Clock, CheckCircle2, Flame, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function LandingUrgency() {
  return (
    <section className="py-16 md:py-24 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-t from-[#7c3aed]/15 to-transparent rounded-full blur-3xl" />
      </div>

      <motion.div
        className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6 }}
      >
        <div className="inline-flex items-center gap-2 text-xs font-semibold bg-[#ff2d55]/10 text-[#ff2d55] px-3 py-1.5 rounded-full border border-[#ff2d55]/20 animate-pulse">
          <Flame className="w-3.5 h-3.5" /> Essa vantagem não vai durar para sempre
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black">
          Depois que lotar,{' '}
          <span className="bg-gradient-to-r from-[#7c3aed] via-[#ff2d55] to-[#ff6090] bg-clip-text text-transparent">
            vai ser tarde demais
          </span>
        </h2>

        <p className="text-lg text-white/50 max-w-xl mx-auto">
          Toda rede social começa pequena. Quem entra agora constrói audiência enquanto é fácil. Amanhã, vai ser como gritar num estádio lotado.
        </p>

        {/* Urgency indicators */}
        <div className="flex flex-wrap justify-center gap-3 py-2">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs text-white/60">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Crescendo <strong className="text-white">312%</strong> ao mês</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs text-white/60">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Janela de oportunidade <strong className="text-amber-400">fechando</strong></span>
          </div>
        </div>

        <div className="pt-2">
          <Button asChild size="lg" className="w-full sm:w-auto bg-gradient-to-r from-[#7c3aed] to-[#ff2d55] hover:opacity-90 text-white text-base sm:text-lg px-10 h-14 font-bold group shadow-xl shadow-purple-500/30 rounded-xl">
            <Link to="/auth">
              Entrar antes que cresça
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        <p className="text-white/40 text-sm flex items-center justify-center gap-4 flex-wrap">
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 100% gratuito</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Menos de 30 seg</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Acesso imediato</span>
        </p>
      </motion.div>
    </section>
  );
}
