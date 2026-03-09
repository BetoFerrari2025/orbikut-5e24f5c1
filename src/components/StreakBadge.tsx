import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function StreakBadge({ streak, size = 'md', showLabel = true }: StreakBadgeProps) {
  if (streak < 1) return null;

  const sizeClasses = {
    sm: 'w-5 h-5 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  const getStreakColor = () => {
    if (streak >= 30) return 'from-violet-500 to-fuchsia-500'; // Legendary
    if (streak >= 14) return 'from-amber-400 to-orange-500'; // Epic
    if (streak >= 7) return 'from-orange-400 to-red-500'; // Rare
    return 'from-yellow-400 to-orange-400'; // Common
  };

  return (
    <div className="flex items-center gap-1">
      <div
        className={cn(
          'rounded-full flex items-center justify-center bg-gradient-to-br animate-pulse',
          sizeClasses[size],
          getStreakColor()
        )}
      >
        <Flame className={cn('text-white drop-shadow-lg', iconSizes[size])} />
      </div>
      {showLabel && (
        <span className={cn(
          'font-bold bg-gradient-to-r bg-clip-text text-transparent',
          getStreakColor(),
          size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
        )}>
          {streak}
        </span>
      )}
    </div>
  );
}
