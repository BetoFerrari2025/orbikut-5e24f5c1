import { Link } from 'react-router-dom';
import { Home, Search, User, LogOut, MessageCircle, Bell, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreatePost } from '@/components/CreatePost';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import logoImg from '@/assets/logo.png';

export function Navbar() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: unreadCount } = useUnreadCount();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logoImg} alt="Orbikut" className="w-12 h-12 object-contain" />
          <span className="text-3xl font-extrabold text-gradient-brand tracking-tight">Orbikut</span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <Home className="w-6 h-6 text-foreground" />
            </Link>
          </Button>
          
          <Button variant="ghost" size="icon" asChild>
            <Link to="/search">
              <Search className="w-6 h-6 text-foreground" />
            </Link>
          </Button>

          {user && (
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link to="/notifications">
                <Bell className="w-6 h-6 text-foreground" />
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
                <MessageCircle className="w-6 h-6 text-foreground" />
              </Link>
            </Button>
          )}

          {user && <CreatePost />}

          {user && profile && (
            <Button variant="ghost" size="icon" asChild>
              <Link to={`/profile/${profile.username}`}>
                <User className="w-6 h-6 text-foreground" />
              </Link>
            </Button>
          )}

          <Button variant="ghost" size="icon" onClick={toggleTheme} title={theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}>
            {theme === 'dark' ? <Sun className="w-5 h-5 text-foreground" /> : <Moon className="w-5 h-5 text-foreground" />}
          </Button>

          {user && (
            <Button variant="ghost" size="icon" onClick={signOut} className="hover:bg-destructive/10">
              <LogOut className="w-6 h-6 text-foreground hover:text-destructive" />
            </Button>
          )}

          {!user && (
            <Button asChild className="gradient-brand hover:opacity-90 glow-primary text-white">
              <Link to="/auth">{t('nav.signIn')}</Link>
            </Button>
          )}
        </div>

        {/* Mobile navigation */}
        <div className="flex md:hidden items-center gap-1">
          {user ? (
            <>
              <Button variant="ghost" size="icon" asChild className="relative h-9 w-9">
                <Link to="/notifications">
                  <Bell className="w-5 h-5 text-foreground" />
                  {(unreadCount ?? 0) > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                      {unreadCount! > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild className="h-9 w-9">
                <Link to="/messages">
                  <MessageCircle className="w-5 h-5 text-foreground" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} className="h-9 w-9 hover:bg-destructive/10">
                <LogOut className="w-5 h-5 text-foreground hover:text-destructive" />
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="gradient-brand hover:opacity-90 text-white font-semibold">
              <Link to="/auth">{t('nav.signIn')}</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
