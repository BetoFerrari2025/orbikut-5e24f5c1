import { motion } from 'framer-motion';
import { Heart, Camera, MessageCircle, Users, Star, TrendingUp } from 'lucide-react';
import logoImg from '@/assets/logo.png';

import type { Easing } from 'framer-motion';
const ease: Easing = [0, 0, 0.2, 1];
const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease } },
};

export default function LandingHeroMockup() {
  return (
    <motion.div
      className="hidden md:flex justify-center"
      initial="hidden"
      animate="visible"
      variants={scaleIn}
    >
      <div className="relative w-72">
        <div className="w-full aspect-[9/19] rounded-[2.5rem] border-2 border-white/10 bg-[#12121a] shadow-2xl shadow-purple-500/10 overflow-hidden">
          <div className="w-full h-full bg-gradient-to-b from-[#7c3aed]/10 to-[#ff2d55]/5 flex flex-col p-5">
            <div className="flex items-center gap-2 mb-4">
              <img src={logoImg} alt="Orbikut" className="w-8 h-8 rounded-lg object-cover" />
              <span className="text-lg font-black bg-gradient-to-r from-[#00f0ff] to-[#ff2d55] bg-clip-text text-transparent">Orbikut</span>
            </div>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#ff2d55] p-[2px]">
                    <div className="w-full h-full rounded-full bg-[#12121a] flex items-center justify-center">
                      <Users className="w-4 h-4 text-white/40" />
                    </div>
                  </div>
                  <div className="w-8 h-1.5 rounded bg-white/10" />
                </div>
              ))}
            </div>
            <div className="flex-1 space-y-3 overflow-hidden">
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#7c3aed]/40" />
                  <div className="w-16 h-2 rounded bg-white/15" />
                </div>
                <div className="w-full h-20 rounded-lg bg-gradient-to-br from-[#7c3aed]/20 to-[#ff2d55]/20 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white/30" />
                </div>
                <div className="flex gap-3">
                  <Heart className="w-4 h-4 text-[#ff2d55]/60" />
                  <MessageCircle className="w-4 h-4 text-white/30" />
                  <Star className="w-4 h-4 text-[#00f0ff]/50" />
                </div>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#00f0ff]/30" />
                  <div className="w-20 h-2 rounded bg-white/15" />
                </div>
                <div className="w-full h-12 rounded-lg bg-gradient-to-br from-[#00f0ff]/15 to-[#7c3aed]/15 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#00f0ff]/40" />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Floating icons */}
        <div className="absolute -top-4 -right-4 w-14 h-14 rounded-2xl bg-[#ff2d55]/20 backdrop-blur-sm flex items-center justify-center animate-bounce border border-[#ff2d55]/20" style={{ animationDuration: '3s' }}>
          <Heart className="w-7 h-7 text-[#ff2d55]" />
        </div>
        <div className="absolute -bottom-2 -left-6 w-12 h-12 rounded-xl bg-[#7c3aed]/20 backdrop-blur-sm flex items-center justify-center animate-bounce border border-[#7c3aed]/20" style={{ animationDuration: '4s', animationDelay: '1s' }}>
          <Camera className="w-6 h-6 text-[#7c3aed]" />
        </div>
        <div className="absolute top-1/2 -right-8 w-10 h-10 rounded-lg bg-[#00f0ff]/15 backdrop-blur-sm flex items-center justify-center animate-bounce border border-[#00f0ff]/20" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
          <MessageCircle className="w-5 h-5 text-[#00f0ff]" />
        </div>
      </div>
    </motion.div>
  );
}
