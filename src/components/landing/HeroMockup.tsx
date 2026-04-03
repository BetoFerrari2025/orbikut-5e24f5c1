import { motion } from 'framer-motion';
import { Heart, Camera, MessageCircle } from 'lucide-react';
import logoImg from '@/assets/logo.png';
import heroVideo from '@/assets/hero-demo.mp4.asset.json';

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
          {/* Video feed mockup */}
          <div className="w-full h-full relative">
            <video
              src={heroVideo.url}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Overlay with logo */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
              <div className="flex items-center gap-2">
                <img src={logoImg} alt="Orbikut" className="w-7 h-7 rounded-lg object-cover" />
                <span className="text-sm font-black bg-gradient-to-r from-[#00f0ff] to-[#ff2d55] bg-clip-text text-transparent">Orbikut</span>
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
