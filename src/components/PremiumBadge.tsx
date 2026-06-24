import { useQuery } from '@tanstack/react-query';
import { BadgeCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Props {
  userId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PremiumBadge({ userId, className, size = 'md' }: Props) {
  const { data: isPremium } = useQuery({
    queryKey: ['user-is-premium', userId],
    queryFn: async () => {
      const { data } = await supabase.rpc('is_premium', { _user_id: userId });
      return !!data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  if (!isPremium) return null;

  const sizes = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' };

  return (
    <span
      title="Verificado Premium"
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-pink-500 to-purple-500 p-0.5 shadow-sm',
        className,
      )}
    >
      <BadgeCheck className={cn('text-white', sizes[size])} />
    </span>
  );
}
