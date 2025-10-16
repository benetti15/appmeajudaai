import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Crown, 
  Star, 
  Trophy, 
  Gift, 
  Coins, 
  TrendingUp,
  Award,
  Calendar,
  Target,
  CheckCircle,
  Flame,
  Zap,
  User,
  Users,
  ArrowLeft
} from 'lucide-react';

// Interfaces
interface UserLevel {
  id: string;
  name: string;
  min_points: number;
  max_points: number;
  color: string;
  benefits: string[];
  icon: string;
}

interface UserPoints {
  total_points: number;
  available_points: number;
  lifetime_points: number;
  current_level: UserLevel;
  next_level: UserLevel | null;
  points_to_next_level: number;
}

interface PointTransaction {
  id: string;
  type: 'earned' | 'spent';
  points: number;
  description: string;
  created_at: string;
  related_id?: string;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  category: 'discount' | 'premium' | 'boost' | 'cosmetic';
  image_url?: string;
  is_active: boolean;
  stock?: number;
  expiry_days?: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points_reward: number;
  criteria: any;
  is_unlocked: boolean;
  unlocked_at?: string;
}

// User levels configuration
const USER_LEVELS: UserLevel[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    min_points: 0,
    max_points: 999,
    color: '#CD7F32',
    benefits: ['Suporte básico', 'Histórico de 30 dias'],
    icon: 'bronze'
  },
  {
    id: 'silver',
    name: 'Prata',
    min_points: 1000,
    max_points: 2999,
    color: '#C0C0C0',
    benefits: ['Suporte prioritário', 'Histórico de 90 dias', 'Templates básicos'],
    icon: 'silver'
  },
  {
    id: 'gold',
    name: 'Ouro',
    min_points: 3000,
    max_points: 9999,
    color: '#FFD700',
    benefits: ['Suporte VIP', 'Histórico ilimitado', 'Templates premium', 'Analytics avançados'],
    icon: 'gold'
  },
  {
    id: 'platinum',
    name: 'Platina',
    min_points: 10000,
    max_points: 24999,
    color: '#E5E4E2',
    benefits: ['Suporte 24/7', 'Todas as funcionalidades', 'Badge exclusivo', 'Desconto em serviços'],
    icon: 'platinum'
  },
  {
    id: 'diamond',
    name: 'Diamante',
    min_points: 25000,
    max_points: 999999,
    color: '#B9F2FF',
    benefits: ['Tudo do Platina', 'Conta manager dedicado', 'Early access a funcionalidades'],
    icon: 'diamond'
  }
];

// Points system
const POINT_ACTIONS = {
  // Client actions
  'create_request': 10,
  'complete_service': 50,
  'leave_review': 25,
  'refer_friend': 100,
  'profile_complete': 30,
  
  // Professional actions
  'send_quote': 15,
  'complete_job': 75,
  'receive_5_star_review': 40,
  'first_month_completion': 200,
  'weekly_active': 20,
  'monthly_active': 100,
};

// Loyalty Dashboard Component
export const LoyaltyDashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLoyaltyData();
    }
  }, [user]);

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true);
      
      // Mock user points data - in real app this would come from a loyalty system table
      const mockUserPoints = {
        total_points: 1500,
        available_points: 1200,
        lifetime_points: 3000,
      };
      
      setUserPoints(calculateUserLevel(mockUserPoints));

      // Mock transactions - in real app this would come from database
      const mockTransactions: PointTransaction[] = [
        {
          id: '1',
          type: 'earned',
          points: 50,
          description: 'Serviço completado',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          type: 'earned',
          points: 25,
          description: 'Avaliação deixada',
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      
      setTransactions(mockTransactions);

      // Mock achievements
      const mockAchievements: Achievement[] = [
        {
          id: '1',
          name: 'Primeiro Pedido',
          description: 'Fez seu primeiro pedido na plataforma',
          icon: 'star',
          points_reward: 50,
          criteria: {},
          is_unlocked: true,
          unlocked_at: new Date().toISOString()
        }
      ];
      
      setAchievements(mockAchievements);

    } catch (error) {
      console.error('Error fetching loyalty data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar dados de fidelidade",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateUserLevel = (pointsData: any): UserPoints => {
    const totalPoints = pointsData.total_points || 0;
    
    let currentLevel = USER_LEVELS[0];
    let nextLevel = null;
    
    for (let i = 0; i < USER_LEVELS.length; i++) {
      if (totalPoints >= USER_LEVELS[i].min_points && totalPoints <= USER_LEVELS[i].max_points) {
        currentLevel = USER_LEVELS[i];
        nextLevel = USER_LEVELS[i + 1] || null;
        break;
      }
    }
    
    const pointsToNextLevel = nextLevel ? nextLevel.min_points - totalPoints : 0;
    
    return {
      ...pointsData,
      current_level: currentLevel,
      next_level: nextLevel,
      points_to_next_level: pointsToNextLevel
    };
  };

  const awardPoints = async (action: keyof typeof POINT_ACTIONS, description?: string) => {
    if (!user) return;

    const points = POINT_ACTIONS[action];
    if (!points) return;

    try {
      // Mock awarding points - in real app this would update database
      toast({
        title: "Pontos ganhos! 🎉",
        description: `Você ganhou ${points} pontos por ${description || action}`,
      });

      // Update local state
      if (userPoints) {
        const updatedPoints = {
          ...userPoints,
          total_points: userPoints.total_points + points,
          available_points: userPoints.available_points + points,
          lifetime_points: userPoints.lifetime_points + points
        };
        setUserPoints(calculateUserLevel(updatedPoints));
      }
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando sistema de fidelidade...</div>;
  }

  if (!userPoints) {
    return <div className="text-center p-8">Erro ao carregar dados de fidelidade</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-primary">Sistema de Fidelidade</h1>
              <p className="text-sm text-muted-foreground">Ganhe pontos e conquiste recompensas</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          {/* Header with level info */}
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Nível {userPoints.current_level.name}</h2>
                    <p className="text-muted-foreground">
                      {userPoints.total_points.toLocaleString()} pontos totais
                    </p>
                  </div>
                </div>
                <Badge 
                  className="text-white px-4 py-2 text-lg"
                  style={{ backgroundColor: userPoints.current_level.color }}
                >
                  {userPoints.current_level.name}
                </Badge>
              </div>

              {userPoints.next_level && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Próximo nível: {userPoints.next_level.name}</span>
                    <span>{userPoints.points_to_next_level} pontos necessários</span>
                  </div>
                  <Progress 
                    value={(userPoints.total_points - userPoints.current_level.min_points) / 
                           (userPoints.next_level.min_points - userPoints.current_level.min_points) * 100} 
                    className="h-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="rewards">Recompensas</TabsTrigger>
              <TabsTrigger value="achievements">Conquistas</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OverviewTab userPoints={userPoints} awardPoints={awardPoints} />
            </TabsContent>

            <TabsContent value="rewards">
              <RewardsTab userPoints={userPoints} />
            </TabsContent>

            <TabsContent value="achievements">
              <AchievementsTab achievements={achievements} />
            </TabsContent>

            <TabsContent value="history">
              <HistoryTab transactions={transactions} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ userPoints, awardPoints }: { userPoints: UserPoints; awardPoints: Function }) => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos Disponíveis</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userPoints.available_points.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Para trocar por recompensas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos Totais</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userPoints.lifetime_points.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Ganhos ao longo do tempo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nível Atual</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userPoints.current_level.name}</div>
            {userPoints.next_level && (
              <p className="text-xs text-muted-foreground">
                {userPoints.points_to_next_level} para {userPoints.next_level.name}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Level Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Benefícios do Seu Nível</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userPoints.current_level.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions for Earning Points */}
      <Card>
        <CardHeader>
          <CardTitle>Ganhe Pontos Rapidamente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => awardPoints('profile_complete', 'Completar perfil')}
              className="justify-start"
              variant="outline"
            >
              <User className="w-4 h-4 mr-2" />
              Complete seu perfil (+30 pontos)
            </Button>
            <Button 
              onClick={() => awardPoints('refer_friend', 'Indicar um amigo')}
              className="justify-start"
              variant="outline"
            >
              <Users className="w-4 h-4 mr-2" />
              Indique um amigo (+100 pontos)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Rewards Tab Component
const RewardsTab = ({ userPoints }: { userPoints: UserPoints }) => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    // Mock rewards data - in real app this would come from database
    const mockRewards: Reward[] = [
      {
        id: '1',
        name: '10% de Desconto',
        description: 'Desconto de 10% no próximo serviço',
        points_cost: 500,
        category: 'discount',
        is_active: true,
        expiry_days: 30
      },
      {
        id: '2',
        name: 'Badge Premium',
        description: 'Badge exclusivo no seu perfil',
        points_cost: 1000,
        category: 'cosmetic',
        is_active: true
      },
      {
        id: '3',
        name: 'Impulso de Visibilidade',
        description: 'Seus serviços aparecem em destaque por 7 dias',
        points_cost: 750,
        category: 'boost',
        is_active: true
      }
    ];
    
    setRewards(mockRewards);
  };

  const redeemReward = async (reward: Reward) => {
    if (userPoints.available_points < reward.points_cost) {
      toast({
        title: "Pontos insuficientes",
        description: `Você precisa de ${reward.points_cost - userPoints.available_points} pontos a mais`,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Recompensa resgatada! 🎉",
      description: `Você resgatou: ${reward.name}`,
    });
  };

  const categoryIcons = {
    discount: Gift,
    premium: Crown,
    boost: Zap,
    cosmetic: Star
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-muted-foreground">
          Você tem <span className="font-bold text-primary">{userPoints.available_points}</span> pontos para gastar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rewards.map((reward) => {
          const IconComponent = categoryIcons[reward.category];
          const canAfford = userPoints.available_points >= reward.points_cost;
          
          return (
            <Card key={reward.id} className={`transition-all ${canAfford ? 'hover:shadow-lg' : 'opacity-60'}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">{reward.name}</CardTitle>
                  </div>
                  <Badge variant={canAfford ? "default" : "secondary"}>
                    {reward.points_cost} pontos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {reward.description}
                </p>
                <Button 
                  onClick={() => redeemReward(reward)}
                  disabled={!canAfford}
                  className="w-full"
                >
                  {canAfford ? 'Resgatar' : 'Pontos insuficientes'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// Achievements Tab Component
const AchievementsTab = ({ achievements }: { achievements: Achievement[] }) => {
  // Mock achievements data
  const mockAchievements = [
    {
      id: '1',
      name: 'Primeiro Pedido',
      description: 'Fez seu primeiro pedido na plataforma',
      icon: 'star',
      points_reward: 50,
      is_unlocked: true,
      unlocked_at: '2024-01-15'
    },
    {
      id: '2',
      name: 'Cliente Fiel',
      description: 'Completou 10 serviços',
      icon: 'trophy',
      points_reward: 200,
      is_unlocked: false
    },
    {
      id: '3',
      name: 'Avaliador',
      description: 'Deixou 5 avaliações',
      icon: 'star',
      points_reward: 100,
      is_unlocked: false
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {mockAchievements.map((achievement) => (
        <Card key={achievement.id} className={achievement.is_unlocked ? 'bg-primary/5 border-primary/20' : ''}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  achievement.is_unlocked ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {achievement.is_unlocked ? <Trophy className="w-6 h-6" /> : <Trophy className="w-6 h-6" />}
                </div>
                <div>
                  <CardTitle className="text-lg">{achievement.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    +{achievement.points_reward} pontos
                  </p>
                </div>
              </div>
              {achievement.is_unlocked && (
                <Badge className="bg-green-500">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Conquistado
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {achievement.description}
            </p>
            {achievement.is_unlocked && achievement.unlocked_at && (
              <p className="text-xs text-muted-foreground mt-2">
                Conquistado em {new Date(achievement.unlocked_at).toLocaleDateString('pt-BR')}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// History Tab Component
const HistoryTab = ({ transactions }: { transactions: PointTransaction[] }) => {
  return (
    <div className="space-y-4">
      {transactions.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">Nenhuma transação de pontos ainda</p>
        </Card>
      ) : (
        transactions.map((transaction) => (
          <Card key={transaction.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === 'earned' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {transaction.type === 'earned' ? <TrendingUp className="w-5 h-5" /> : <Gift className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className={`font-bold ${
                  transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'earned' ? '+' : '-'}{transaction.points} pontos
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};