import { motion } from 'framer-motion';
import { Star, Heart, TrendingUp } from 'lucide-react';

const testimonials = [
  {
    name: 'Lucas M.',
    handle: '@lucasm',
    avatar: '🧑‍💻',
    text: 'Finalmente uma rede social onde meus posts são vistos! No primeiro dia já tive mais engajamento do que meses em outra rede.',
    likes: 47,
  },
  {
    name: 'Ana Clara',
    handle: '@anaclaraa',
    avatar: '👩‍🎨',
    text: 'A interface é linda e muito rápida. Parece TikTok + Instagram, mas sem aquele filtro que esconde seu conteúdo.',
    likes: 92,
  },
  {
    name: 'Pedro Silva',
    handle: '@pedrosilva',
    avatar: '📸',
    text: 'Cheguei cedo e já estou construindo minha audiência. Essa é a hora certa de entrar.',
    likes: 63,
  },
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
            <TrendingUp className="w-3.5 h-3.5" /> Crescendo rápido
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
            Usuários já estão <span className="bg-gradient-to-r from-[#00f0ff] to-[#7c3aed] bg-clip-text text-transparent">começando a testar</span>
          </h2>
          <p className="text-white/50 max-w-lg mx-auto">
            Veja o que quem entrou primeiro está dizendo:
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.12 }}
            >
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

        <motion.div
          className="mt-10 flex justify-center gap-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ delay: 0.3 }}
        >
          {[
            { value: '2k+', label: 'Usuários ativos' },
            { value: '10k+', label: 'Posts criados' },
            { value: '50k+', label: 'Interações' },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-[#7c3aed] to-[#ff2d55] bg-clip-text text-transparent">{s.value}</p>
              <p className="text-white/40 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
