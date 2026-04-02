import { motion } from 'framer-motion';
import { TrendingUp, Eye, Zap, Star, ArrowRight } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0, 0, 0.2, 1] as const },
  }),
};

const benefits = [
  {
    icon: TrendingUp,
    title: 'Crescimento que você não vê em nenhum lugar',
    desc: 'Perfis novos crescem até 10x mais rápido que em redes saturadas.',
    color: 'text-[#7c3aed]',
    bg: 'bg-[#7c3aed]/10',
    border: 'border-[#7c3aed]/20',
    stat: '10x mais rápido',
  },
  {
    icon: Eye,
    title: 'Seu conteúdo é visto de verdade',
    desc: 'Sem pagar para ser visto. Algoritmo que prioriza quem cria conteúdo.',
    color: 'text-[#00f0ff]',
    bg: 'bg-[#00f0ff]/10',
    border: 'border-[#00f0ff]/20',
    stat: '95% de alcance',
  },
  {
    icon: Star,
    title: 'Menos criadores = mais destaque',
    desc: 'Enquanto outros competem com milhões, aqui você compete com centenas.',
    color: 'text-[#ff2d55]',
    bg: 'bg-[#ff2d55]/10',
    border: 'border-[#ff2d55]/20',
    stat: 'Menos competição',
  },
  {
    icon: Zap,
    title: 'Rápido, bonito e sem enrolação',
    desc: 'Interface que faz você querer voltar. Criada para quem valoriza qualidade.',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
    stat: 'UX premium',
  },
];

export default function LandingBenefits() {
  return (
    <section className="py-16 md:py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#7c3aed]/5 to-transparent pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <motion.h2
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
        >
          Por que entrar <span className="bg-gradient-to-r from-[#7c3aed] to-[#ff2d55] bg-clip-text text-transparent">agora</span>?
        </motion.h2>
        <motion.p
          className="text-white/50 text-center mb-12 md:mb-16 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ delay: 0.1 }}
        >
          A vantagem de quem chega primeiro é real — e mensurável:
        </motion.p>
        <motion.div
          className="grid sm:grid-cols-2 gap-5 md:gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {benefits.map((b, i) => (
            <motion.div
              key={i}
              className={`${b.bg} border ${b.border} rounded-2xl p-6 hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden`}
              variants={fadeUp}
              custom={i}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${b.bg} flex items-center justify-center`}>
                  <b.icon className={`w-6 h-6 ${b.color}`} />
                </div>
                <span className={`text-[10px] font-bold ${b.color} ${b.bg} px-2.5 py-1 rounded-full border ${b.border}`}>
                  {b.stat}
                </span>
              </div>
              <h3 className="text-lg font-bold mb-2">{b.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
