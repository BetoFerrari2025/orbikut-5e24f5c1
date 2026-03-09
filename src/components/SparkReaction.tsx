import { useState, useEffect, useCallback } from 'react';
import { Heart, Flame, Sparkles, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface SparkReactionProps {
  isLiked: boolean;
  onLike: () => void;
  disabled?: boolean;
  iconClassName?: string;
}

const emojis = ['❤️', '🔥', '💥', '⭐', '✨', '💫', '🎉', '💖'];

export function SparkReaction({ isLiked, onLike, disabled, iconClassName }: SparkReactionProps) {
  const [floating, setFloating] = useState<FloatingEmoji[]>([]);
  const [isHolding, setIsHolding] = useState(false);
  const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null);
  const [sparkCount, setSparkCount] = useState(0);

  const createEmoji = useCallback(() => {
    const newEmoji: FloatingEmoji = {
      id: Date.now() + Math.random(),
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      x: Math.random() * 60 - 30,
      y: 0,
      scale: 0.5 + Math.random() * 0.8,
      rotation: Math.random() * 360,
    };
    setFloating(prev => [...prev, newEmoji]);
    setSparkCount(prev => prev + 1);

    // Remove after animation
    setTimeout(() => {
      setFloating(prev => prev.filter(e => e.id !== newEmoji.id));
    }, 1500);
  }, []);

  const handleMouseDown = () => {
    if (disabled) return;
    setIsHolding(true);
    
    // Initial reaction
    createEmoji();
    
    // Continue creating emojis while holding
    const timer = setInterval(() => {
      createEmoji();
    }, 100);
    setHoldTimer(timer);
  };

  const handleMouseUp = () => {
    setIsHolding(false);
    if (holdTimer) {
      clearInterval(holdTimer);
      setHoldTimer(null);
    }
    
    // Trigger like if not already liked
    if (!isLiked && sparkCount > 0) {
      onLike();
    }
    setSparkCount(0);
  };

  useEffect(() => {
    return () => {
      if (holdTimer) clearInterval(holdTimer);
    };
  }, [holdTimer]);

  return (
    <div className="relative">
      <button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        onClick={() => !isHolding && onLike()}
        disabled={disabled}
        className={cn(
          "relative transition-transform duration-150",
          isHolding && "scale-125"
        )}
      >
        <Heart
          className={cn(
            'w-7 h-7 transition-all duration-200',
            isLiked ? 'fill-primary text-primary scale-110' : 'hover:text-muted-foreground',
            isHolding && 'animate-pulse'
          )}
        />
      </button>
      
      {/* Floating emojis */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 pointer-events-none overflow-visible">
        {floating.map((emoji) => (
          <span
            key={emoji.id}
            className="absolute animate-float-up text-2xl"
            style={{
              left: `${emoji.x}px`,
              transform: `scale(${emoji.scale}) rotate(${emoji.rotation}deg)`,
              animation: 'float-up 1.5s ease-out forwards',
            }}
          >
            {emoji.emoji}
          </span>
        ))}
      </div>
      
      {/* Spark burst effect */}
      {isHolding && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Sparkles className="w-12 h-12 text-primary animate-ping opacity-50" />
          </div>
        </div>
      )}
    </div>
  );
}
