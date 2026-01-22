import { Trophy, Star, Zap, MessageCircle, CheckCircle, Shield, Award, TrendingUp, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
}

interface ProfileAchievementsProps {
  userType: 'client' | 'professional';
  stats: {
    servicesCompleted?: number;
    requestsCreated?: number;
    quotesReceived?: number;
    quotesSent?: number;
    messagesTotal?: number;
    reviewsGiven?: number;
    reviewsReceived?: number;
    isVerified?: boolean;
    profileComplete?: boolean;
    daysActive?: number;
  };
}

export function ProfileAchievements({ userType, stats }: ProfileAchievementsProps) {
  const getAchievements = (): Achievement[] => {
    if (userType === 'client') {
      return [
        {
          id: 'first-request',
          title: 'Primeira Solicitação',
          description: 'Crie sua primeira solicitação de serviço',
          icon: Zap,
          unlocked: (stats.requestsCreated || 0) >= 1,
          progress: Math.min(stats.requestsCreated || 0, 1),
          maxProgress: 1,
          rarity: 'common',
          xpReward: 10
        },
        {
          id: 'active-requester',
          title: 'Cliente Ativo',
          description: 'Crie 5 solicitações de serviço',
          icon: TrendingUp,
          unlocked: (stats.requestsCreated || 0) >= 5,
          progress: Math.min(stats.requestsCreated || 0, 5),
          maxProgress: 5,
          rarity: 'rare',
          xpReward: 50
        },
        {
          id: 'quote-collector',
          title: 'Colecionador de Orçamentos',
          description: 'Receba 10 orçamentos de profissionais',
          icon: MessageCircle,
          unlocked: (stats.quotesReceived || 0) >= 10,
          progress: Math.min(stats.quotesReceived || 0, 10),
          maxProgress: 10,
          rarity: 'rare',
          xpReward: 30
        },
        {
          id: 'service-completed',
          title: 'Missão Cumprida',
          description: 'Complete seu primeiro serviço',
          icon: CheckCircle,
          unlocked: (stats.servicesCompleted || 0) >= 1,
          progress: Math.min(stats.servicesCompleted || 0, 1),
          maxProgress: 1,
          rarity: 'common',
          xpReward: 25
        },
        {
          id: 'reviewer',
          title: 'Avaliador',
          description: 'Avalie 3 profissionais',
          icon: Star,
          unlocked: (stats.reviewsGiven || 0) >= 3,
          progress: Math.min(stats.reviewsGiven || 0, 3),
          maxProgress: 3,
          rarity: 'rare',
          xpReward: 40
        },
        {
          id: 'loyal-customer',
          title: 'Cliente Fiel',
          description: 'Complete 10 serviços',
          icon: Trophy,
          unlocked: (stats.servicesCompleted || 0) >= 10,
          progress: Math.min(stats.servicesCompleted || 0, 10),
          maxProgress: 10,
          rarity: 'epic',
          xpReward: 100
        },
        {
          id: 'profile-complete',
          title: 'Perfil Completo',
          description: 'Complete todas as informações do perfil',
          icon: Award,
          unlocked: stats.profileComplete || false,
          rarity: 'common',
          xpReward: 20
        },
        {
          id: 'vip-client',
          title: 'Cliente VIP',
          description: 'Complete 25 serviços',
          icon: Trophy,
          unlocked: (stats.servicesCompleted || 0) >= 25,
          progress: Math.min(stats.servicesCompleted || 0, 25),
          maxProgress: 25,
          rarity: 'legendary',
          xpReward: 250
        }
      ];
    }

    // Professional achievements
    return [
      {
        id: 'first-quote',
        title: 'Primeiro Orçamento',
        description: 'Envie seu primeiro orçamento',
        icon: Zap,
        unlocked: (stats.quotesSent || 0) >= 1,
        progress: Math.min(stats.quotesSent || 0, 1),
        maxProgress: 1,
        rarity: 'common',
        xpReward: 10
      },
      {
        id: 'quote-master',
        title: 'Mestre dos Orçamentos',
        description: 'Envie 20 orçamentos',
        icon: MessageCircle,
        unlocked: (stats.quotesSent || 0) >= 20,
        progress: Math.min(stats.quotesSent || 0, 20),
        maxProgress: 20,
        rarity: 'rare',
        xpReward: 50
      },
      {
        id: 'verified-pro',
        title: 'Profissional Verificado',
        description: 'Complete a verificação de documentos',
        icon: Shield,
        unlocked: stats.isVerified || false,
        rarity: 'epic',
        xpReward: 100
      },
      {
        id: 'first-service',
        title: 'Primeiro Serviço',
        description: 'Complete seu primeiro serviço',
        icon: CheckCircle,
        unlocked: (stats.servicesCompleted || 0) >= 1,
        progress: Math.min(stats.servicesCompleted || 0, 1),
        maxProgress: 1,
        rarity: 'common',
        xpReward: 25
      },
      {
        id: 'rising-star',
        title: 'Estrela em Ascensão',
        description: 'Receba 5 avaliações positivas',
        icon: Star,
        unlocked: (stats.reviewsReceived || 0) >= 5,
        progress: Math.min(stats.reviewsReceived || 0, 5),
        maxProgress: 5,
        rarity: 'rare',
        xpReward: 60
      },
      {
        id: 'expert-pro',
        title: 'Profissional Expert',
        description: 'Complete 25 serviços',
        icon: Award,
        unlocked: (stats.servicesCompleted || 0) >= 25,
        progress: Math.min(stats.servicesCompleted || 0, 25),
        maxProgress: 25,
        rarity: 'epic',
        xpReward: 150
      },
      {
        id: 'profile-complete',
        title: 'Perfil Completo',
        description: 'Complete todas as informações do perfil',
        icon: Award,
        unlocked: stats.profileComplete || false,
        rarity: 'common',
        xpReward: 20
      },
      {
        id: 'legendary-pro',
        title: 'Profissional Lendário',
        description: 'Complete 100 serviços',
        icon: Trophy,
        unlocked: (stats.servicesCompleted || 0) >= 100,
        progress: Math.min(stats.servicesCompleted || 0, 100),
        maxProgress: 100,
        rarity: 'legendary',
        xpReward: 500
      }
    ];
  };

  const achievements = getAchievements();
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalXp = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.xpReward, 0);

  const rarityColors = {
    common: 'from-gray-400 to-gray-500 border-gray-300',
    rare: 'from-blue-400 to-blue-600 border-blue-400',
    epic: 'from-purple-400 to-purple-600 border-purple-400',
    legendary: 'from-amber-400 to-orange-500 border-amber-400'
  };

  const rarityBg = {
    common: 'bg-gray-50 dark:bg-gray-900/30',
    rare: 'bg-blue-50 dark:bg-blue-900/30',
    epic: 'bg-purple-50 dark:bg-purple-900/30',
    legendary: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30'
  };

  return (
    <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-amber-500" />
            Conquistas
          </CardTitle>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">
              {unlockedCount}/{achievements.length}
            </span>
            <span className="flex items-center gap-1 text-amber-600 font-semibold">
              <Zap className="w-4 h-4" />
              {totalXp} XP
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {achievements.map((achievement) => {
            const Icon = achievement.icon;
            return (
              <Tooltip key={achievement.id}>
                <TooltipTrigger asChild>
                  <div 
                    className={cn(
                      "relative aspect-square rounded-xl border-2 p-2 transition-all cursor-pointer hover:scale-105",
                      achievement.unlocked 
                        ? cn(rarityBg[achievement.rarity], "border-opacity-100")
                        : "bg-muted/30 border-muted grayscale opacity-50"
                    )}
                    style={{
                      borderColor: achievement.unlocked ? undefined : undefined
                    }}
                  >
                    <div className={cn(
                      "w-full h-full rounded-lg flex items-center justify-center",
                      achievement.unlocked && "bg-gradient-to-br",
                      achievement.unlocked && rarityColors[achievement.rarity].split(' ').slice(0, 2).join(' ')
                    )}>
                      {achievement.unlocked ? (
                        <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      ) : (
                        <Lock className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
                      )}
                    </div>
                    
                    {/* Progress indicator for locked achievements */}
                    {!achievement.unlocked && achievement.progress !== undefined && achievement.maxProgress && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted rounded-b-lg overflow-hidden">
                        <div 
                          className="h-full bg-primary/50"
                          style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px]">
                  <div className="space-y-1">
                    <div className="font-semibold flex items-center gap-2">
                      {achievement.title}
                      {achievement.unlocked && (
                        <CheckCircle className="w-3 h-3 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    {achievement.progress !== undefined && achievement.maxProgress && (
                      <p className="text-xs font-medium">
                        Progresso: {achievement.progress}/{achievement.maxProgress}
                      </p>
                    )}
                    <p className="text-xs text-amber-600 font-semibold">
                      +{achievement.xpReward} XP
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
