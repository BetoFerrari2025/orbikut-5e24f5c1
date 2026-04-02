import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion';
import { Heart, TrendingUp, Flame, Users, Zap } from 'lucide-react';
import { useEffect, useRef } from 'react';

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => {
    if (value >= 1000) return Math.round(v / 100) / 10 + 'k' + suffix;
    return Math.round(v) + suffix;
  });

  useEffect(() => {
    if (isInView) {
      animate(count, value, { duration: 2, ease: 'easeOut' });
    }
  }, [isInView, count, value]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

const testimonials = [
  {
    name: 'Lucas M.',
    handle: '@lucasm',
    avatar: '🧑‍💻',
    text: 'Postei aqui e tive MAIS alcance que no Instagram em meses. Sério, isso aqui tá crescendo rápido.',
    likes: 127,
    verified: true,
  },
  {
    name: 'Ana Clara',
    handle: '@anaclaraa',
    avatar: '👩‍🎨',
    text: 'Entrei há 3 dias e já tenho mais engajamento que na minha conta antiga. A interface é incrível.',
    likes: 203,
    verified: true,
  },
  {
    name: 'Pedro Silva',
    handle: '@pedrosilva',
    avatar: '📸',
    text: 'Quem tá chegando agora tá saindo na frente. Já estou construindo minha audiência antes de todo mundo.',
    likes: 156,
    verified: true,
  },
];

const liveActivity = [
  { icon: Users, text: '+23 pessoas entraram nos últimos 30 min', color: 'text-[#00f0ff]' },
  { icon: Flame, text: '847 novos perfis esta semana', color: 'text-[#ff2d55]' },
  { icon: Zap, text: 'Crescimento de 312% no último mês', color: 'text-[#7c3aed]' },
];

export default function LandingSocialProof() {
  return (
    <section className="py-16 md:py-24 bg-[#0e0e15]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
        >
          <div className="inline-flex items-center gap-2 text-xs font-semibold bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20 mb-4">
            <TrendingUp className="w-3.5 h-3.5" /> Crescendo agora
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
            Perfis já estão <span className="bg-gradient-to-r from-[#00f0ff] to-[#7c3aed] bg-clip-text text-transparent">explodindo em alcance</span>
          </h2>
          <p className="text-white/50 max-w-lg mx-auto">
            Veja o que quem entrou primeiro está dizendo:
          </p>
        </motion.div>

        {/* Live activity feed */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mb-10"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
        >
          {liveActivity.map((item, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
              <span className="text-white/70">{item.text}</span>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.12 }}
            >
              {t.verified && (
                <div className="absolute top-3 right-3 text-[10px] bg-[#00f0ff]/15 text-[#00f0ff] px-2 py-0.5 rounded-full border border-[#00f0ff]/20">
                  early adopter ✓
                </div>
              )}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{t.avatar}</span>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-white/40 text-xs">{t.handle}</p>
                </div>
              </div>
              <p className="text-white/70 text-sm leading-relaxed mb-3">{t.text}</p>
              <div className="flex items-center gap-1.5 text-[#ff2d55]/70 text-xs">
                <Heart className="w-3.5 h-3.5 fill-current" /> {t.likes}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Animated counters */}
        <motion.div
          className="mt-12 grid grid-cols-3 gap-4 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ delay: 0.3 }}
        >
          {[
            { value: 5200, suffix: '+', label: 'Usuários ativos', icon: Users, color: 'from-[#7c3aed] to-[#00f0ff]' },
            { value: 28000, suffix: '+', label: 'Posts criados', icon: Flame, color: 'from-[#ff2d55] to-[#ff6090]' },
            { value: 150000, suffix: '+', label: 'Interações', icon: Zap, color: 'from-[#00f0ff] to-[#7c3aed]' },
          ].map((s, i) => (
            <motion.div 
              key={i} 
              className="text-center bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6"
              whileHover={{ scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <s.icon className="w-5 h-5 mx-auto mb-2 text-white/30" />
              <p className={`text-2xl sm:text-3xl font-black bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>
                <AnimatedCounter value={s.value} suffix={s.suffix} />
              </p>
              <p className="text-white/40 text-xs mt-1">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
