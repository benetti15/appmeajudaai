import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Metric {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  comparison: string;
}

interface Tip {
  type: 'success' | 'warning' | 'info';
  message: string;
}

interface PersonalCoachProps {
  userType: 'client' | 'professional';
}

export function PersonalCoach({ userType }: PersonalCoachProps) {
  // Mock data - in real implementation, this would come from analytics
  const professionalMetrics: Metric[] = [
    {
      label: 'Taxa de Aceitação',
      value: '70%',
      trend: 'up',
      comparison: 'Média: 50%'
    },
    {
      label: 'Tempo de Resposta',
      value: '45 min',
      trend: 'down',
      comparison: 'Meta: < 1h'
    },
    {
      label: 'Avaliação Média',
      value: '4.8⭐',
      trend: 'up',
      comparison: 'Excelente!'
    }
  ];

  const clientMetrics: Metric[] = [
    {
      label: 'Serviços Realizados',
      value: '5',
      trend: 'up',
      comparison: 'Este mês'
    },
    {
      label: 'Economia Total',
      value: 'R$ 350',
      trend: 'up',
      comparison: 'Com Toninho'
    },
    {
      label: 'Satisfação',
      value: '95%',
      trend: 'neutral',
      comparison: 'Muito bom!'
    }
  ];

  const professionalTips: Tip[] = [
    {
      type: 'success',
      message: 'Seus orçamentos têm 70% de aceitação - 20% acima da média! Continue assim! 🎉'
    },
    {
      type: 'info',
      message: 'Responder em menos de 1h aumenta aceitação em 40%. Você está indo bem!'
    },
    {
      type: 'warning',
      message: 'Adicione mais fotos do seu trabalho para aumentar confiança em 65%'
    }
  ];

  const clientTips: Tip[] = [
    {
      type: 'success',
      message: 'Você avaliou todos os serviços! Isso ajuda muito a comunidade. 👏'
    },
    {
      type: 'info',
      message: 'Pedidos com fotos recebem 80% mais orçamentos. Continue usando!'
    }
  ];

  const metrics = userType === 'professional' ? professionalMetrics : clientMetrics;
  const tips = userType === 'professional' ? professionalTips : clientTips;

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Target className="w-4 h-4 text-blue-600" />;
  };

  const getTipIcon = (type: 'success' | 'warning' | 'info') => {
    if (type === 'success') return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (type === 'warning') return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    return <Sparkles className="w-4 h-4 text-blue-600" />;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Coaching Personalizado</h3>
          <p className="text-sm text-muted-foreground">
            Insights sobre seu desempenho
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {metrics.map((metric) => (
          <Card key={metric.label} className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{metric.label}</span>
                {getTrendIcon(metric.trend)}
              </div>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="text-xs text-muted-foreground">{metric.comparison}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tips */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Dicas do Toninho
        </h4>
        {tips.map((tip, index) => (
          <Card 
            key={index} 
            className={`p-3 ${
              tip.type === 'success' ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' :
              tip.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800' :
              'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
            }`}
          >
            <div className="flex items-start gap-2">
              {getTipIcon(tip.type)}
              <p className="text-sm flex-1">{tip.message}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Goal */}
      <Card className="mt-6 p-4 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">Próxima Meta</h4>
            <p className="text-xs text-muted-foreground">
              {userType === 'professional'
                ? 'Complete mais 3 serviços para ganhar o badge "Expert"'
                : 'Avalie mais 2 profissionais para ganhar o badge "Avaliador"'}
            </p>
          </div>
        </div>
      </Card>
    </Card>
  );
}