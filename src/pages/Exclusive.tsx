import { Link } from 'react-router-dom';
import { Crown, Sparkles, TrendingUp, Palette, Heart, Lock, ArrowLeft, Star, Zap, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsPremium } from '@/hooks/usePremium';
import { Skeleton } from '@/components/ui/skeleton';

const sections = [
  {
    icon: Sparkles,
    title: 'Bastidores Orbikut',
    desc: 'Conteúdo inédito direto da equipe',
    color: 'from-pink-500 to-rose-500',
    posts: [
      'Como nasceu o Orbikut 💡',
      'Roadmap secreto 2026',
      'O algoritmo por dentro',
    ],
  },
  {
    icon: TrendingUp,
    title: 'Tendências em primeira mão',
    desc: 'Veja o que vai bombar antes de todos',
    color: 'from-purple-500 to-indigo-500',
    posts: [
      'Top 10 criadores em ascensão',
      'Hashtags que vão viralizar essa semana',
      'Formatos de post com maior engajamento',
    ],
  },
  {
    icon: Palette,
    title: 'Temas premium',
    desc: 'Personalize seu perfil com estilos únicos',
    color: 'from-amber-500 to-orange-500',
    posts: [
      'Tema Aurora 🌌',
      'Tema Neon 💜',
      'Tema Minimal ⚪',
    ],
  },
  {
    icon: Heart,
    title: 'Comunidade VIP',
    desc: 'Grupo privado só para assinantes',
    color: 'from-red-500 to-pink-500',
    posts: [
      'Lives semanais com a equipe',
      'Sorteios exclusivos',
      'Networking com top criadores',
    ],
  },
];

export default function Exclusive() {
  const { data: isPremium, isLoading } = useIsPremium();

  if (isLoading) {
    return <div className="p-4 space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen pb-20 px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-amber-400 to-pink-500 shadow-lg shadow-pink-500/30">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Área Exclusiva</h1>
          <p className="text-muted-foreground mb-6">
            Esta área é só para assinantes Premium. Vire Premium para desbloquear conteúdos, temas e comunidade VIP.
          </p>
          <Button asChild size="lg" className="bg-gradient-to-r from-amber-500 via-pink-500 to-purple-500 text-white">
            <Link to="/premium">
              <Crown className="w-5 h-5 mr-2" /> Ver planos Premium
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 border-b">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-32 h-32 bg-amber-300 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-pink-300 rounded-full blur-3xl animate-pulse" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 py-10">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link to="/premium"><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Link>
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-7 h-7 text-amber-600" />
            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-amber-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              Área Exclusiva
            </h1>
          </div>
          <p className="text-muted-foreground">Bem-vindo(a) ao seu espaço Premium ✨</p>
          <Badge className="mt-3 bg-gradient-to-r from-amber-500 to-pink-500 text-white border-0">
            <Star className="w-3 h-3 mr-1" /> Membro Premium
          </Badge>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {sections.map((s, i) => (
          <Card key={i} className="p-6 hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0`}>
                <s.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">{s.title}</h2>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </div>
            <ul className="space-y-2">
              {s.posts.map((p, j) => (
                <li key={j} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-sm">{p}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 text-center">
          <MessageCircle className="w-10 h-10 mx-auto mb-3 text-purple-600" />
          <h3 className="font-bold text-lg mb-1">Mais conteúdos chegando</h3>
          <p className="text-sm text-muted-foreground">
            Estamos preparando novidades exclusivas toda semana para você. Fique de olho!
          </p>
        </Card>
      </div>
    </div>
  );
}
