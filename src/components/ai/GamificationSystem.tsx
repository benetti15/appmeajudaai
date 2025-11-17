import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Star, 
  Target, 
  Zap, 
  Award,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Mission {
  id: string;
  title: string;
  description: string;
  reward: string;
  progress: number;
  total: number;
  completed: boolean;
  icon: any;
}

interface GamificationSystemProps {
  userType: 'client' | 'professional';
  onMissionClick?: (missionId: string) => void;
}

export function GamificationSystem({ userType, onMissionClick }: GamificationSystemProps) {
  // Mock missions - in real implementation, these would come from database
  const clientMissions: Mission[] = [
    {
      id: '1',
      title: 'Complete seu Perfil',
      description: 'Preencha todas as informações do seu perfil',
      reward: '+50 pontos e destaque nos resultados',
      progress: 3,
      total: 5,
      completed: false,
      icon: Star
    },
    {
      id: '2',
      title: 'Primeira Avaliação',
      description: 'Avalie seu primeiro profissional',
      reward: '+30 pontos',
      progress: 0,
      total: 1,
      completed: false,
      icon: Trophy
    },
    {
      id: '3',
      title: 'Convide um Amigo',
      description: 'Compartilhe o app com amigos',
      reward: '+100 pontos + R$ 10 de crédito',
      progress: 0,
      total: 1,
      completed: false,
      icon: Award
    }
  ];

  const professionalMissions: Mission[] = [
    {
      id: '1',
      title: 'Responda 5 Pedidos Hoje',
      description: 'Envie orçamentos para 5 pedidos hoje',
      reward: 'Badge de Ativo + destaque',
      progress: 2,
      total: 5,
      completed: false,
      icon: Zap
    },
    {
      id: '2',
      title: 'Mantenha 5 Estrelas',
      description: 'Mantenha avaliação 5⭐ por 1 mês',
      reward: 'Badge Premium + prioridade',
      progress: 15,
      total: 30,
      completed: false,
      icon: Star
    },
    {
      id: '3',
      title: 'Complete 10 Serviços',
      description: 'Finalize 10 serviços com sucesso',
      reward: '+200 pontos + selo verificado',
      progress: 7,
      total: 10,
      completed: false,
      icon: Target
    }
  ];

  const missions = userType === 'client' ? clientMissions : professionalMissions;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Missões Diárias</h3>
          <p className="text-sm text-muted-foreground">
            Complete missões e ganhe recompensas!
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {missions.map((mission) => (
          <Card 
            key={mission.id} 
            className={`p-4 hover:border-primary/50 transition-all cursor-pointer ${
              mission.completed ? 'bg-green-50 dark:bg-green-950/20 border-green-500' : ''
            }`}
            onClick={() => onMissionClick?.(mission.id)}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                mission.completed ? 'bg-green-100 dark:bg-green-900' : 'bg-primary/10'
              }`}>
                {mission.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <mission.icon className="w-5 h-5 text-primary" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold">{mission.title}</h4>
                    <p className="text-sm text-muted-foreground">{mission.description}</p>
                  </div>
                  {mission.completed && (
                    <Badge className="bg-green-500">Completo!</Badge>
                  )}
                </div>

                {!mission.completed && (
                  <>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-semibold">{mission.progress}/{mission.total}</span>
                      </div>
                      <Progress value={(mission.progress / mission.total) * 100} />
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Award className="w-4 h-4 text-yellow-600" />
                      <span className="text-muted-foreground">{mission.reward}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Performance Tips */}
      <Card className="mt-6 p-4 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="flex items-start gap-2">
          <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">Dica do Toninho</h4>
            <p className="text-xs text-muted-foreground">
              {userType === 'client' 
                ? 'Avalie profissionais após cada serviço para acumular mais pontos e ajudar a comunidade!'
                : 'Responder pedidos em menos de 1h aumenta sua taxa de aceitação em 40%!'}
            </p>
          </div>
        </div>
      </Card>
    </Card>
  );
}