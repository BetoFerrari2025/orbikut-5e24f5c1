import { cn } from '@/lib/utils';

interface OnlineIndicatorProps {
  isOnline: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function OnlineIndicator({ isOnline, className, size = 'sm' }: OnlineIndicatorProps) {
  if (!isOnline) return null;
  
  return (
    <span
      className={cn(
        "absolute rounded-full bg-green-500 ring-2 ring-background",
        size === 'sm' ? "w-2.5 h-2.5 bottom-0 right-0" : "w-3.5 h-3.5 bottom-0 right-0",
        className
      )}
    />
  );
}
