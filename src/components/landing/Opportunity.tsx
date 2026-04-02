import { motion } from 'framer-motion';
import { ArrowRight, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const steps = [
  { year: '2004', name: 'Orkut', desc: 'Quem entrou no começo dominou as comunidades.', status: 'Saturou' },
  { year: '2010', name: 'Instagram', desc: 'Os primeiros perfis viraram referência.', status: 'Saturou' },
  { year: '2016', name: 'TikTok', desc: 'Criadores iniciais explodiram em seguidores.', status: 'Saturando' },
  { year: '2025', name: 'Orbikut', desc: 'Ainda no começo. A sua vez chegou. 🚀', active: true, status: 'AGORA' },
];

export default function LandingOpportunity() {
  return (
    <section className="py-16 md:py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#ff2d55]/5 to-transparent pointer-events-none" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
            Toda rede social <span className="bg-gradient-to-r from-[#ff2d55] to-[#ff6090] bg-clip-text text-transparent">começa assim…</span>
          </h2>
          <p className="text-white/50 max-w-lg mx-auto">
            Quem entra no início cresce mais rápido. Depois que populariza, fica muito mais difícil.
          </p>
        </motion.div>

        <div className="space-y-4">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              className={`flex items-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl border transition-all ${
                s.active
                  ? 'bg-gradient-to-r from-[#7c3aed]/15 to-[#ff2d55]/15 border-[#ff2d55]/30 scale-[1.02]'
                  : 'bg-white/5 border-white/10'
              }`}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.1 }}
            >
              <span className={`text-xl sm:text-2xl font-black shrink-0 ${s.active ? 'bg-gradient-to-r from-[#7c3aed] to-[#ff2d55] bg-clip-text text-transparent' : 'text-white/30'}`}>
                {s.year}
              </span>
              <div className="flex-1">
                <p className={`font-bold ${s.active ? 'text-white' : 'text-white/60'}`}>{s.name}</p>
                <p className={`text-sm ${s.active ? 'text-white/70' : 'text-white/40'}`}>{s.desc}</p>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                s.active 
                  ? 'bg-[#ff2d55]/20 text-[#ff2d55] animate-pulse' 
                  : 'bg-white/5 text-white/30'
              }`}>
                {s.status}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ delay: 0.4 }}
        >
          <Button asChild size="lg" className="bg-gradient-to-r from-[#7c3aed] to-[#ff2d55] hover:opacity-90 text-white text-lg px-8 h-14 font-bold group shadow-xl shadow-purple-500/30 rounded-xl">
            <Link to="/auth">
              Garantir meu lugar agora
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
