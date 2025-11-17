import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'action';
  icon: any;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ProactiveDashboardProps {
  userType: 'client' | 'professional';
}

export function ProactiveDashboard({ userType }: ProactiveDashboardProps) {
  const navigate = useNavigate();

  // Mock insights - in real implementation, these would come from AI analysis
  const clientInsights: Insight[] = [
    {
      id: '1',
      type: 'action',
      icon: AlertCircle,
      title: 'Orçamentos Pendentes',
      message: 'Você tem 3 orçamentos aguardando análise. Quer que eu te ajude a comparar?',
      action: {
        label: 'Comparar agora',
        onClick: () => navigate('/my-requests')
      }
    },
    {
      id: '2',
      type: 'warning',
      icon: Clock,
      title: 'Pedido sem Respostas',
      message: 'Seu pedido está sem respostas há 2 dias. Posso sugerir melhorias na descrição?',
      action: {
        label: 'Melhorar pedido',
        onClick: () => navigate('/my-requests')
      }
    },
    {
      id: '3',
      type: 'info',
      icon: CheckCircle2,
      title: 'Serviço Concluído',
      message: 'Não esqueça de avaliar o profissional João Silva!',
      action: {
        label: 'Avaliar',
        onClick: () => {}
      }
    }
  ];

  const professionalInsights: Insight[] = [
    {
      id: '1',
      type: 'action',
      icon: TrendingUp,
      title: 'Novos Pedidos',
      message: 'Há 5 novos pedidos na sua área! Recomendo conferir antes que outros profissionais respondam.',
      action: {
        label: 'Ver pedidos',
        onClick: () => navigate('/available-requests')
      }
    },
    {
      id: '2',
      type: 'warning',
      icon: AlertCircle,
      title: 'Cliente Aguardando',
      message: 'Cliente aguarda seu orçamento há 12h. Responder rápido aumenta em 40% a chance de aceitação!',
      action: {
        label: 'Responder agora',
        onClick: () => navigate('/available-requests')
      }
    },
    {
      id: '3',
      type: 'success',
      icon: CheckCircle2,
      title: 'Excelente Performance!',
      message: 'Você tem 95% de taxa de aceitação de orçamentos - acima da média de 70%! Continue assim.',
    }
  ];

  const insights = userType === 'client' ? clientInsights : professionalInsights;

  const getTypeColor = (type: Insight['type']) => {
    switch (type) {
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'info': return 'text-blue-600 dark:text-blue-400';
      case 'action': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  const getTypeBadge = (type: Insight['type']) => {
    switch (type) {
      case 'success': return 'default';
      case 'warning': return 'destructive';
      case 'info': return 'secondary';
      case 'action': return 'default';
      default: return 'outline';
    }
  };

  if (insights.length === 0) return null;

  return (
    <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">Toninho tem sugestões para você</h3>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => (
          <Card key={insight.id} className="p-4 hover:border-primary/50 transition-colors">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${getTypeColor(insight.type)} bg-current/10`}>
                <insight.icon className="w-5 h-5" style={{ color: 'currentColor' }} />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold">{insight.title}</h4>
                  <Badge variant={getTypeBadge(insight.type)} className="text-xs">
                    {insight.type === 'action' ? 'Ação' :
                     insight.type === 'warning' ? 'Atenção' :
                     insight.type === 'success' ? 'Sucesso' : 'Info'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{insight.message}</p>
                {insight.action && (
                  <Button
                    size="sm"
                    onClick={insight.action.onClick}
                    className="bg-gradient-to-r from-primary to-accent"
                  >
                    {insight.action.label}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
}