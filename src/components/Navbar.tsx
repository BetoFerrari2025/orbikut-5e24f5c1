import { Link } from 'react-router-dom';
import { Home, Search, User, LogOut, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreatePost } from '@/components/CreatePost';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

export function Navbar() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile(user?.id);

  return (
    <nav className="sticky top-0 z-50 bg-background border-b">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-instagram flex items-center justify-center">
            <Camera className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-gradient-instagram hidden sm:block">PhotoShare</span>
        </Link>

        <div className="flex items-center gap-1">
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
            <Button asChild className="gradient-instagram hover:opacity-90">
              <Link to="/auth">Entrar</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
