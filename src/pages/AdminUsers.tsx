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
  TrendingUp, UserPlus, FileText, Calendar, Activity, Radio,
} from 'lucide-react';
import { usePresenceCount } from '@/hooks/usePresenceCount';
import { toast } from 'sonner';
import { formatDistanceToNow, format, subDays, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

  // Fetch admin user IDs
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
      {
        onSuccess: () => toast.success(isCurrentlyAdmin ? 'Admin removido' : 'Admin adicionado'),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldAlert className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
      </div>

      <Tabs defaultValue="users" className="w-full max-w-2xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="w-4 h-4" /> Dashboard
          </TabsTrigger>
        </TabsList>

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
              <p className="text-sm text-muted-foreground">{filteredUsers?.length ?? 0} usuários encontrados</p>
              {filteredUsers?.map((u: any) => (
                <div key={u.id} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={u.avatar_url ?? undefined} />
                    <AvatarFallback>{(u.username ?? 'U')[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground text-sm truncate">{u.username ?? 'Sem nome'}</p>
                      {adminUserIds?.has(u.id) && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary">ADMIN</span>
                      )}
                      {u.is_blocked && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-destructive/20 text-destructive">BLOQUEADO</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    <p className="text-xs text-muted-foreground">{u.post_count} posts</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title={adminUserIds?.has(u.id) ? 'Remover admin' : 'Tornar admin'}
                      onClick={() => handleToggleAdmin(u.id, adminUserIds?.has(u.id) ?? false)}
                    >
                      <ShieldCheck className={`w-4 h-4 ${adminUserIds?.has(u.id) ? 'text-primary' : 'text-muted-foreground'}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedUserId(u.id)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleBlock(u.id, u.is_blocked)}
                    >
                      <Ban className={`w-4 h-4 ${u.is_blocked ? 'text-accent' : 'text-destructive'}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteUser(u.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Dashboard Tab ── */}
        <TabsContent value="dashboard" className="space-y-6 mt-4">
          {/* Realtime Presence Cards */}
          <RealtimePresenceCards />

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" /> Total Usuários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{stats?.total_users ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Total Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{stats?.total_posts ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-accent" /> Novos Hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-accent">{stats?.users_today ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Posts Hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">{stats?.posts_today ?? 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
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
                      className="h-7 px-2 text-xs"
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
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={signupStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="signup_date"
                      tickFormatter={(v) => format(new Date(v), 'dd/MM')}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))',
                      }}
                      labelFormatter={(v) => format(new Date(v), "dd 'de' MMMM", { locale: ptBR })}
                    />
                    <Line
                      type="monotone"
                      dataKey="user_count"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                      name="Cadastros"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  Sem dados para o período selecionado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Detail Dialog */}
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

function RealtimePresenceCards() {
  const homeCount = usePresenceCount('home');
  const authCount = usePresenceCount('auth');

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-500 animate-pulse" /> Na Home (tempo real)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Radio className="w-3 h-3 text-green-500 animate-pulse" />
            <p className="text-3xl font-bold text-foreground">{homeCount}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">pessoas acessando agora</p>
        </CardContent>
      </Card>
      <Card className="border-accent/30 bg-accent/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-accent animate-pulse" /> Na Página de Cadastro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Radio className="w-3 h-3 text-accent animate-pulse" />
            <p className="text-3xl font-bold text-foreground">{authCount}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">visitantes na tela de login/cadastro</p>
        </CardContent>
      </Card>
    </div>
  );
}

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
              <p className="text-foreground font-medium">
                {format(new Date(user.created_at), "dd/MM/yyyy")}
              </p>
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
