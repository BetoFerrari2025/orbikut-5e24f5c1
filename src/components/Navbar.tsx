import { Link } from 'react-router-dom';
import { Home, Search, User, LogOut, Sparkles, MessageCircle, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreatePost } from '@/components/CreatePost';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useUnreadCount } from '@/hooks/useNotifications';

export function Navbar() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: unreadCount } = useUnreadCount();

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center glow-primary">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-2xl font-extrabold text-gradient-brand">Orbita</span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <Home className="w-6 h-6" />
            </Link>
          </Button>
          
          <Button variant="ghost" size="icon" asChild>
            <Link to="/search">
              <Search className="w-6 h-6" />
            </Link>
          </Button>

          {user && (
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link to="/notifications">
                <Bell className="w-6 h-6" />
                {(unreadCount ?? 0) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {unreadCount! > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            </Button>
          )}

          {user && (
            <Button variant="ghost" size="icon" asChild>
              <Link to="/messages">
                <MessageCircle className="w-6 h-6" />
              </Link>
            </Button>
          )}

          {user && <CreatePost />}

          {user && profile && (
            <Button variant="ghost" size="icon" asChild>
              <Link to={`/profile/${profile.username}`}>
                <User className="w-6 h-6" />
              </Link>
            </Button>
          )}

          {user && (
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="w-6 h-6" />
            </Button>
          )}

          {!user && (
            <Button asChild className="gradient-brand hover:opacity-90 glow-primary">
              <Link to="/auth">Entrar</Link>
            </Button>
          )}
        </div>

        {/* Mobile - only show login button or logout */}
        <div className="flex md:hidden items-center gap-1">
          {user && (
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link to="/notifications">
                <Bell className="w-5 h-5" />
                {(unreadCount ?? 0) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {unreadCount! > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            </Button>
          )}
          {user && (
            <Button variant="ghost" size="icon" asChild>
              <Link to="/messages">
                <MessageCircle className="w-5 h-5" />
              </Link>
            </Button>
          )}
          {user && (
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          )}
          {!user && (
            <Button asChild size="sm" className="gradient-brand hover:opacity-90">
              <Link to="/auth">Entrar</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
