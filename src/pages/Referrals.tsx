import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Copy, Users, Gift, Share2, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Referrals() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadReferralData();
  }, [user]);

  const loadReferralData = async () => {
    if (!user) return;
    setLoading(true);

    // Get referral code
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', user.id)
      .single();

    if (profile?.referral_code) {
      setReferralCode(profile.referral_code);
    }

    // Get referral count
    const { data: countData } = await supabase.rpc('get_referral_count', { _user_id: user.id });
    setReferralCount(countData ?? 0);

    // Get referral list with profiles
    const { data: refs } = await supabase
      .from('referrals')
      .select('id, created_at, referred_id')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    if (refs && refs.length > 0) {
      const userIds = refs.map(r => r.referred_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);

      const merged = refs.map(r => ({
        ...r,
        profile: profiles?.find(p => p.id === r.referred_id)
      }));
      setReferrals(merged);
    }

    setLoading(false);
  };

  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Orbikut - Nova Rede Social',
        text: 'Entre no Orbikut comigo! Uma rede social nova onde seu conteúdo tem mais alcance.',
        url: referralLink,
      });
    } else {
      copyLink();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <Gift className="w-12 h-12 mx-auto text-primary" />
        <h1 className="text-2xl font-bold">Indique e Ganhe</h1>
        <p className="text-muted-foreground">
          Convide amigos para o Orbikut e ganhe destaque na plataforma!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold">{referralCount}</p>
            <p className="text-sm text-muted-foreground">Pessoas convidadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Gift className="w-8 h-8 mx-auto mb-2 text-amber-500" />
            <p className="text-3xl font-bold">{referralCount >= 5 ? '🏆' : referralCount >= 3 ? '🥈' : '🎯'}</p>
            <p className="text-sm text-muted-foreground">
              {referralCount >= 10 ? 'Embaixador' : referralCount >= 5 ? 'Influenciador' : referralCount >= 3 ? 'Ativo' : 'Iniciante'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seu link exclusivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={referralLink} readOnly className="text-sm" />
            <Button onClick={copyLink} variant="outline" size="icon" className="shrink-0">
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <Button onClick={shareLink} className="w-full gradient-brand" size="lg">
            <Share2 className="w-4 h-4 mr-2" /> Compartilhar link
          </Button>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recompensas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { count: 1, label: 'Badge de Early Adopter', done: referralCount >= 1 },
            { count: 3, label: 'Destaque no perfil', done: referralCount >= 3 },
            { count: 5, label: 'Badge de Influenciador', done: referralCount >= 5 },
            { count: 10, label: 'Badge de Embaixador', done: referralCount >= 10 },
          ].map(m => (
            <div key={m.count} className={`flex items-center gap-3 p-3 rounded-lg border ${m.done ? 'bg-primary/10 border-primary/30' : 'bg-muted/50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${m.done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {m.done ? '✓' : m.count}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${m.done ? '' : 'text-muted-foreground'}`}>{m.label}</p>
                <p className="text-xs text-muted-foreground">Convide {m.count} {m.count === 1 ? 'pessoa' : 'pessoas'}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Referral List */}
      {referrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Seus convidados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {referrals.map(r => (
              <div key={r.id} className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={r.profile?.avatar_url} />
                  <AvatarFallback>{r.profile?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{r.profile?.full_name || r.profile?.username || 'Usuário'}</p>
                  <p className="text-xs text-muted-foreground">@{r.profile?.username}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
