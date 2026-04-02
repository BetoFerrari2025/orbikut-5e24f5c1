import { motion } from 'framer-motion';
import { ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
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
        <div className="inline-flex items-center gap-2 text-xs font-semibold bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-full border border-amber-500/20">
          <Clock className="w-3.5 h-3.5" /> Vagas limitadas para early adopters
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black">
          Você está chegando{' '}
          <span className="bg-gradient-to-r from-[#7c3aed] via-[#ff2d55] to-[#ff6090] bg-clip-text text-transparent">
            antes da maioria
          </span>
        </h2>

        <p className="text-lg text-white/50 max-w-xl mx-auto">
          Essa vantagem não dura para sempre. Quanto antes você criar sua conta, mais tempo tem para construir sua presença.
        </p>

        <div className="pt-2">
          <Button asChild size="lg" className="w-full sm:w-auto bg-gradient-to-r from-[#7c3aed] to-[#ff2d55] hover:opacity-90 text-white text-base sm:text-lg px-10 h-14 font-bold group shadow-xl shadow-purple-500/30 rounded-xl">
            <Link to="/auth">
              Criar conta grátis agora
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        <p className="text-white/40 text-sm flex items-center justify-center gap-4">
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Sem custo</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Menos de 1 minuto</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Acesso imediato</span>
        </p>
      </motion.div>
    </section>
  );
}
