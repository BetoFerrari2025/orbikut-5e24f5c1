import { useState } from 'react';
import { Crown, Check, Sparkles, Zap, Star, Lock, Heart, TrendingUp, BadgeCheck, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const plans = [
  {
    id: 'mensal',
    name: 'Mensal',
    price: 'R$ 19,90',
    period: '/mês',
    highlight: false,
    features: [
      'Selo verificado Premium',
      'Stories ilimitados',
      'Sem anúncios',
      'Acesso à área exclusiva',
    ],
  },
  {
    id: 'anual',
    name: 'Anual',
    price: 'R$ 149,90',
    period: '/ano',
    highlight: true,
    badge: 'Mais popular · -37%',
    features: [
      'Tudo do plano Mensal',
      'Badge animado de ouro',
      'Prioridade no algoritmo',
      'Temas exclusivos do perfil',
      'Suporte prioritário',
    ],
  },
  {
    id: 'vitalicio',
    name: 'Vitalício',
    price: 'R$ 499,00',
    period: 'uma vez',
    highlight: false,
    badge: 'Edição limitada',
    features: [
      'Tudo do plano Anual',
      'Acesso vitalício para sempre',
      'Badge diamante exclusivo',
      'Acesso antecipado a novas features',
    ],
  },
];

const exclusiveContent = [
  { icon: Sparkles, title: 'Bastidores Orbikut', desc: 'Conteúdo inédito direto da equipe', color: 'from-pink-500 to-rose-500' },
  { icon: TrendingUp, title: 'Tendências em primeira mão', desc: 'Veja o que vai bombar antes de todos', color: 'from-purple-500 to-indigo-500' },
  { icon: Palette, title: 'Temas premium', desc: 'Personalize seu perfil com estilos únicos', color: 'from-amber-500 to-orange-500' },
  { icon: Heart, title: 'Comunidade VIP', desc: 'Grupo privado só para assinantes', color: 'from-red-500 to-pink-500' },
];

export default function Subscribers() {
  const [selected, setSelected] = useState('anual');

  const handleSubscribe = () => {
    toast.info('Pagamentos em breve!', {
      description: 'A assinatura ainda não está ativa. Avisaremos você quando estiver disponível 💜',
    });
  };

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 border-b">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-32 h-32 bg-amber-300 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-pink-300 rounded-full blur-3xl animate-pulse" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-amber-400 to-pink-500 shadow-lg shadow-pink-500/30 animate-bounce">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-amber-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Orbikut Premium
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Desbloqueie o melhor da experiência: conteúdo exclusivo, personalizações premium e muito mais.
          </p>
          <Badge variant="secondary" className="mt-4 bg-amber-100 text-amber-900 border-amber-200">
            <Sparkles className="w-3 h-3 mr-1" /> Lançamento em breve
          </Badge>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Plans */}
        <h2 className="text-2xl font-bold mb-6 text-center">Escolha seu plano</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              className={cn(
                'relative p-6 cursor-pointer transition-all hover:scale-[1.02]',
                selected === plan.id
                  ? 'ring-2 ring-primary shadow-xl shadow-primary/20'
                  : 'hover:shadow-lg',
                plan.highlight && 'bg-gradient-to-br from-amber-50 to-pink-50 border-amber-200'
              )}
            >
              {plan.badge && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-pink-500 text-white border-0">
                  {plan.badge}
                </Badge>
              )}
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-extrabold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <Button
          onClick={handleSubscribe}
          size="lg"
          className="w-full md:w-auto md:mx-auto md:flex bg-gradient-to-r from-amber-500 via-pink-500 to-purple-500 hover:opacity-90 text-white font-bold text-lg h-14 px-12 shadow-lg shadow-pink-500/30 mb-12"
        >
          <Crown className="w-5 h-5 mr-2" />
          Quero ser Premium
        </Button>

        {/* Exclusive area preview */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-amber-600" />
            <h2 className="text-2xl font-bold">Área Exclusiva</h2>
          </div>
          <p className="text-muted-foreground mb-6">Uma prévia do que te espera ao virar Premium ✨</p>

          <div className="grid sm:grid-cols-2 gap-4">
            {exclusiveContent.map((item, i) => (
              <Card key={i} className="relative overflow-hidden p-5 group hover:shadow-xl transition-all">
                <div className={cn('absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity bg-gradient-to-br', item.color)} />
                <div className="relative flex gap-4">
                  <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0', item.color)}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold">{item.title}</h3>
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Why upgrade */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
              <BadgeCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Apoie a Orbikut e cresça com a gente</h3>
              <p className="text-sm text-muted-foreground">
                Sua assinatura ajuda a manter a plataforma livre, segura e em constante evolução.
                Em troca, você recebe ferramentas exclusivas para se destacar e uma experiência sem distrações.
              </p>
            </div>
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          🚧 Pagamentos ainda não estão ativos. Estamos finalizando os últimos detalhes.
        </p>
      </div>
    </div>
  );
}
