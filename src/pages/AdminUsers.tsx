import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  useAdminUsers, useAdminStats, useAdminSignupStats,
  useAdminToggleBlock, useAdminDeleteUser, useAdminDeletePost, useAdminToggleRole,
} from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  Users, BarChart3, Search, Ban, Trash2, Eye, ShieldAlert, ShieldCheck,
  TrendingUp, UserPlus, FileText, Calendar, Activity, Radio, MousePointerClick, ExternalLink,
} from 'lucide-react';
import { usePresenceCount } from '@/hooks/usePresenceCount';
import { toast } from 'sonner';
import { formatDistanceToNow, format, subDays, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function AdminUsers() {
  const { data: users, isLoading } = useAdminUsers();
  const { data: stats } = useAdminStats();
  const toggleBlock = useAdminToggleBlock();
  const deleteUser = useAdminDeleteUser();
  const deletePost = useAdminDeletePost();
  const toggleRole = useAdminToggleRole();
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30');

  const { data: adminUserIds } = useQuery({
    queryKey: ['admin-role-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      if (error) throw error;
      return new Set((data ?? []).map((r: any) => r.user_id));
    },
  });

  const startDate = format(
    dateRange === '7' ? subDays(new Date(), 7)
      : dateRange === '30' ? subDays(new Date(), 30)
      : dateRange === '90' ? subDays(new Date(), 90)
      : subMonths(new Date(), 12),
    'yyyy-MM-dd'
  );
  const endDate = format(new Date(), 'yyyy-MM-dd');
  const { data: signupStats } = useAdminSignupStats(startDate, endDate);

  const filteredUsers = users?.filter((u: any) =>
    (u.username ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const handleBlock = (userId: string, currentBlocked: boolean) => {
    toggleBlock.mutate({ userId, blocked: !currentBlocked }, {
      onSuccess: () => toast.success(currentBlocked ? 'Usuário desbloqueado' : 'Usuário bloqueado'),
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação é irreversível.')) return;
    deleteUser.mutate(userId, { onSuccess: () => toast.success('Usuário excluído') });
  };

  const handleToggleAdmin = (userId: string, isCurrentlyAdmin: boolean) => {
    const action = isCurrentlyAdmin ? 'remover admin de' : 'tornar admin';
    if (!confirm(`Tem certeza que deseja ${action} este usuário?`)) return;
    toggleRole.mutate(
      { userId, role: 'admin', grant: !isCurrentlyAdmin },
      { onSuccess: () => toast.success(isCurrentlyAdmin ? 'Admin removido' : 'Admin adicionado') }
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 border border-primary/20">
        <div className="p-2 bg-primary/20 rounded-lg">
          <ShieldAlert className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Painel Administrativo</h1>
          <p className="text-xs text-muted-foreground">Gerencie usuários, métricas e links</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-11">
          <TabsTrigger value="dashboard" className="gap-1.5 text-xs">
            <BarChart3 className="w-4 h-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5 text-xs">
            <Users className="w-4 h-4" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="links" className="gap-1.5 text-xs">
            <MousePointerClick className="w-4 h-4" /> Links
          </TabsTrigger>
        </TabsList>

        {/* ── Dashboard Tab ── */}
        <TabsContent value="dashboard" className="space-y-5 mt-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Total Usuários</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats?.total_users ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-accent" />
                  <span className="text-xs text-muted-foreground">Total Posts</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats?.total_posts ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <UserPlus className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Novos Hoje</span>
                </div>
                <p className="text-2xl font-bold text-green-500">{stats?.users_today ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Posts Hoje</span>
                </div>
                <p className="text-2xl font-bold text-blue-500">{stats?.posts_today ?? 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Realtime */}
          <RealtimePresenceCards />

          {/* Chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Novos Cadastros
                </CardTitle>
                <div className="flex gap-1">
                  {[
                    { label: '7d', value: '7' },
                    { label: '30d', value: '30' },
                    { label: '90d', value: '90' },
                    { label: '1a', value: '365' },
                  ].map(opt => (
                    <Button
                      key={opt.value}
                      variant={dateRange === opt.value ? 'default' : 'ghost'}
                      size="sm"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => setDateRange(opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {signupStats && signupStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={signupStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="signup_date" tickFormatter={(v) => format(new Date(v), 'dd/MM')} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                      labelFormatter={(v) => format(new Date(v), "dd 'de' MMMM", { locale: ptBR })}
                    />
                    <Line type="monotone" dataKey="user_count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} name="Cadastros" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                  Sem dados para o período
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Users Tab ── */}
        <TabsContent value="users" className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, e-mail ou username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{filteredUsers?.length ?? 0} usuários encontrados</p>
              {filteredUsers?.map((u: any) => (
                <div key={u.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3 hover:border-primary/30 transition-colors">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={u.avatar_url ?? undefined} />
                    <AvatarFallback>{(u.username ?? 'U')[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-foreground text-sm truncate">{u.username ?? 'Sem nome'}</p>
                      {adminUserIds?.has(u.id) && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/20 text-primary">ADMIN</span>
                      )}
                      {u.is_blocked && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-destructive/20 text-destructive">BLOQUEADO</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                    <p className="text-[11px] text-muted-foreground">{u.post_count} posts</p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" title={adminUserIds?.has(u.id) ? 'Remover admin' : 'Tornar admin'} onClick={() => handleToggleAdmin(u.id, adminUserIds?.has(u.id) ?? false)}>
                      <ShieldCheck className={`w-3.5 h-3.5 ${adminUserIds?.has(u.id) ? 'text-primary' : 'text-muted-foreground'}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedUserId(u.id)}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleBlock(u.id, u.is_blocked)}>
                      <Ban className={`w-3.5 h-3.5 ${u.is_blocked ? 'text-accent' : 'text-destructive'}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteUser(u.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Links/Clicks Tab ── */}
        <TabsContent value="links" className="space-y-4 mt-4">
          <LinkClicksPanel />
        </TabsContent>
      </Tabs>

      {selectedUserId && (
        <UserDetailDialog
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onDeletePost={(postId) => {
            deletePost.mutate(postId, { onSuccess: () => toast.success('Post excluído') });
          }}
        />
      )}
    </div>
  );
}

/* ── Link Clicks Panel ── */
function LinkClicksPanel() {
  const { data: postsWithLinks, isLoading } = useQuery({
    queryKey: ['admin-link-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, caption, link_url, link_label, image_url, created_at, profiles (username, avatar_url)')
        .not('link_url', 'is', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: clickCounts } = useQuery({
    queryKey: ['admin-link-clicks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('link_clicks')
        .select('post_id');
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((c: any) => {
        counts[c.post_id] = (counts[c.post_id] || 0) + 1;
      });
      return counts;
    },
  });

  const totalClicks = clickCounts ? Object.values(clickCounts).reduce((a, b) => a + b, 0) : 0;

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ExternalLink className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Posts com Link</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{postsWithLinks?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <MousePointerClick className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Total Cliques</span>
            </div>
            <p className="text-2xl font-bold text-accent">{totalClicks}</p>
          </CardContent>
        </Card>
      </div>

      {/* Posts list */}
      {postsWithLinks && postsWithLinks.length > 0 ? (
        <div className="space-y-2">
          {postsWithLinks.map((post: any) => {
            const clicks = clickCounts?.[post.id] ?? 0;
            return (
              <div key={post.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                  {/\.(mp4|webm|mov)$/i.test(post.image_url) ? (
                    <video src={post.image_url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {post.link_label || 'Saiba mais'}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{post.link_url}</p>
                  <p className="text-[10px] text-muted-foreground">
                    por @{(post as any).profiles?.username ?? '?'} · {format(new Date(post.created_at), 'dd/MM/yy')}
                  </p>
                </div>
                <div className="text-center shrink-0 min-w-[50px]">
                  <div className="flex items-center gap-1 justify-center">
                    <MousePointerClick className="w-3.5 h-3.5 text-accent" />
                    <span className="text-lg font-bold text-foreground">{clicks}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">cliques</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhum post com link encontrado
        </div>
      )}
    </div>
  );
}

/* ── Realtime Presence ── */
function RealtimePresenceCards() {
  const homeCount = usePresenceCount('home');
  const authCount = usePresenceCount('auth');
  const feedCount = usePresenceCount('feed');
  const discoverCount = usePresenceCount('discover');
  const messagesCount = usePresenceCount('messages');
  const profileCount = usePresenceCount('profile');
  const notificationsCount = usePresenceCount('notifications');

  const cards = [
    { label: 'Feed', count: feedCount, icon: Activity, borderClass: 'border-primary/20 bg-primary/5' },
    { label: 'Explorar', count: discoverCount, icon: Eye, borderClass: 'border-blue-500/20 bg-blue-500/5' },
    { label: 'Mensagens', count: messagesCount, icon: FileText, borderClass: 'border-purple-500/20 bg-purple-500/5' },
    { label: 'Perfil', count: profileCount, icon: Users, borderClass: 'border-orange-500/20 bg-orange-500/5' },
    { label: 'Notificações', count: notificationsCount, icon: Radio, borderClass: 'border-yellow-500/20 bg-yellow-500/5' },
    { label: 'Home', count: homeCount, icon: Activity, borderClass: 'border-primary/20 bg-primary/5' },
    { label: 'Cadastro', count: authCount, icon: UserPlus, borderClass: 'border-accent/20 bg-accent/5' },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Radio className="w-4 h-4 text-green-500 animate-pulse" /> Tempo Real
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {cards.map((c) => (
            <div key={c.label} className={`rounded-lg p-2.5 border ${c.borderClass}`}>
              <div className="flex items-center gap-1.5">
                <c.icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">{c.label}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Radio className="w-2.5 h-2.5 text-green-500 animate-pulse" />
                <span className="text-lg font-bold text-foreground">{c.count}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── User Detail Dialog ── */
function UserDetailDialog({ userId, onClose, onDeletePost }: { userId: string; onClose: () => void; onDeletePost: (postId: string) => void }) {
  const { data: users } = useAdminUsers();
  const user = users?.find((u: any) => u.id === userId);

  const { data: posts } = useQuery({
    queryKey: ['admin-user-posts', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (!user) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.avatar_url ?? undefined} />
              <AvatarFallback>{(user.username ?? 'U')[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold">{user.username}</p>
              <p className="text-sm text-muted-foreground font-normal">{user.email}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-muted rounded-lg p-3">
              <p className="text-muted-foreground text-xs">Nome completo</p>
              <p className="text-foreground font-medium">{user.full_name || '—'}</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-muted-foreground text-xs">Membro desde</p>
              <p className="text-foreground font-medium">{format(new Date(user.created_at), "dd/MM/yyyy")}</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-muted-foreground text-xs">Último login</p>
              <p className="text-foreground font-medium">
                {user.last_sign_in_at
                  ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true, locale: ptBR })
                  : 'Nunca'}
              </p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-muted-foreground text-xs">Total de posts</p>
              <p className="text-foreground font-medium">{user.post_count}</p>
            </div>
          </div>

          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4" /> Posts do Usuário
          </h4>
          {posts && posts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post: any) => (
                <div key={post.id} className="relative group aspect-square bg-muted rounded overflow-hidden">
                  {/\.(mp4|webm|mov)$/i.test(post.image_url) ? (
                    <video src={post.image_url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={() => onDeletePost(post.id)}
                    className="absolute inset-0 bg-destructive/0 group-hover:bg-destructive/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-5 h-5 text-white" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">Nenhum post</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
