import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusSquare, Rabbit, User, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useUnreadCount } from '@/hooks/useNotifications';
import { CreatePost } from '@/components/CreatePost';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: unreadCount } = useUnreadCount();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t md:hidden">
      <div className="flex items-center justify-around h-14">
        <Link
          to="/"
          className={cn(
            "flex flex-col items-center justify-center w-full h-full transition-colors",
            isActive('/') ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Home className="w-6 h-6" />
        </Link>

        <Link
          to="/discover"
          className={cn(
            "flex flex-col items-center justify-center w-full h-full transition-colors",
            isActive('/discover') ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Rabbit className="w-6 h-6" />
        </Link>

        <div className="flex flex-col items-center justify-center w-full h-full">
          <CreatePost />
        </div>

        <Link
          to="/search"
          className={cn(
            "flex flex-col items-center justify-center w-full h-full transition-colors",
            isActive('/search') ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Search className="w-6 h-6" />
        </Link>

        {profile && (
          <Link
            to={`/profile/${profile.username}`}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full transition-colors",
              location.pathname.startsWith('/profile') ? "text-primary" : "text-muted-foreground"
            )}
          >
            <User className="w-6 h-6" />
          </Link>
        )}
      </div>
    </nav>
  );
}
