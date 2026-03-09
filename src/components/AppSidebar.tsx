import { Link, useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import {
  Home, Search, Compass, MessageCircle, Bell, User, Settings,
  ShieldAlert, Sparkles, PlusSquare, LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useUnreadCount } from '@/hooks/useNotifications';
import { CreatePost } from '@/components/CreatePost';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: isAdmin } = useIsAdmin();
  const { data: unreadCount } = useUnreadCount();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  if (!user) return null;

  const mainItems = [
    { title: 'Início', url: '/', icon: Home },
    { title: 'Buscar', url: '/search', icon: Search },
    { title: 'Explorar', url: '/discover', icon: Compass },
    { title: 'Notificações', url: '/notifications', icon: Bell, badge: unreadCount },
    { title: 'Mensagens', url: '/messages', icon: MessageCircle },
    ...(profile ? [{ title: 'Perfil', url: `/profile/${profile.username}`, icon: User }] : []),
    { title: 'Configurações', url: '/settings', icon: Settings },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        {/* Brand */}
        <div className={cn("px-4 py-4 flex items-center gap-2", collapsed && "justify-center px-2")}>
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && <span className="text-xl font-extrabold text-gradient-brand">Orbita</span>}
        </div>

        {/* Main nav */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Menu</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} className="relative">
                      <item.icon className="w-5 h-5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                      {(item as any).badge > 0 && (
                        <span className="absolute top-0 left-5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                          {(item as any).badge > 9 ? '9+' : (item as any).badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <div>
                    <CreatePost />
                    {!collapsed && <span className="ml-1">Criar Post</span>}
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin section */}
        {isAdmin && (
          <SidebarGroup>
            {!collapsed && <SidebarGroupLabel>Administração</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/admin/users')}>
                    <Link to="/admin/users">
                      <ShieldAlert className="w-5 h-5 shrink-0" />
                      {!collapsed && <span>Gerenciar Usuários</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Sign out */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut} className="text-destructive hover:bg-destructive/10">
                  <LogOut className="w-5 h-5 shrink-0" />
                  {!collapsed && <span>Sair</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
