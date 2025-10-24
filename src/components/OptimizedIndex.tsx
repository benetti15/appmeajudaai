import React, { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { NotificationSystem } from "@/components/NotificationSystem";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useQuoteNotifications } from "@/hooks/useQuoteNotifications";
import { MobileBottomNav, MobileCard, ResponsiveGrid } from "@/components/MobileOptimizations";
import { LazyImage } from "@/components/PerformanceOptimizations";
import { DebugInfo } from "@/components/DebugInfo";
import { OnboardingTour } from "@/components/OnboardingTour";
import { supabase } from "@/integrations/supabase/client";
import { 
  Wrench, 
  User, 
  LogOut, 
  Plus, 
  MessageCircle, 
  Settings, 
  Star, 
  Users, 
  Shield, 
  Menu,
  Home,
  Search,
  Heart,
  Award,
  Clock,
  BarChart3,
  Sparkles
} from "lucide-react";

// Memoized components for better performance
const MemoizedHeader = memo(({ profile, unreadCount, unreadQuotes, signOut }: any) => {
  const navigate = useNavigate();
  
  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <LazyImage 
            src="/lovable-uploads/c8434d06-8f8c-46d0-bbd2-778de3b8f219.png" 
            alt="Me Ajuda ai" 
            className="w-10 h-10 animate-float" 
          />
          <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Me Ajuda ai!
          </h1>
        </button>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-600 hidden sm:block">
            Olá, {profile.full_name}
          </span>
          <NotificationSystem unreadQuotes={unreadQuotes} />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="hover:bg-white/50">
                <Menu className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 bg-white/95 backdrop-blur-xl border-white/20" align="end">
              <QuickMenuItems profile={profile} unreadCount={unreadCount} unreadQuotes={unreadQuotes} />
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
});

const QuickMenuItems = memo(({ profile, unreadCount, unreadQuotes }: any) => {
  const navigate = useNavigate();
  
  // Garantir que sempre tenhamos um user_type válido, defaultando para 'client'
  const userType = profile?.user_type || 'client';
  
  return (
    <>
      <DropdownMenuItem 
        onClick={() => navigate(userType === 'client' ? '/client-profile' : '/professional-profile')}
        className="cursor-pointer"
      >
        <User className="w-4 h-4 mr-2" />
        Meu Perfil
      </DropdownMenuItem>
      
      {userType === 'professional' ? (
        <>
          <DropdownMenuItem onClick={() => navigate('/my-services-new')} className="cursor-pointer">
            <Wrench className="w-4 h-4 mr-2" />
            Meus Serviços
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/professional-dashboard')} className="cursor-pointer">
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard
          </DropdownMenuItem>
        </>
      ) : (
        <DropdownMenuItem onClick={() => navigate('/my-requests')} className="cursor-pointer relative">
          <Settings className="w-4 h-4 mr-2" />
          Minhas Solicitações
          {unreadQuotes > 0 && (
            <Badge className="ml-auto bg-red-500 text-white text-xs px-1 py-0 h-4 min-w-4 rounded-full">
              {unreadQuotes}
            </Badge>
          )}
        </DropdownMenuItem>
      )}
      
      
      
      <DropdownMenuItem 
        onClick={() => navigate(userType === 'client' ? '/categories' : '/available-requests')}
        className="cursor-pointer"
      >
        <Plus className="w-4 h-4 mr-2" />
        {userType === 'client' ? 'Nova Solicitação' : 'Oportunidades'}
      </DropdownMenuItem>

      {/* New optimized features - conditional by user type */}
      {userType === 'professional' && (
        <DropdownMenuItem onClick={() => navigate('/templates')} className="cursor-pointer">
          <Settings className="w-4 h-4 mr-2" />
          Templates
        </DropdownMenuItem>
      )}
      
      {userType === 'client' && (
        <DropdownMenuItem onClick={() => navigate('/loyalty')} className="cursor-pointer">
          <Award className="w-4 h-4 mr-2" />
          Fidelidade
        </DropdownMenuItem>
      )}

      {/* Admin */}
      <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer">
        <Shield className="w-4 h-4 mr-2" />
        Admin
      </DropdownMenuItem>
    </>
  );
});

const HeroSection = memo(({ profile }: any) => {
  const navigate = useNavigate();
  
  // Garantir que sempre tenhamos um user_type válido, defaultando para 'client'
  const userType = profile?.user_type || 'client';
  
  return (
    <section className="relative overflow-hidden py-20 px-4">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10"></div>
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-800 leading-tight">
              {userType === 'client' 
                ? 'Encontre o profissional perfeito' 
                : 'Conecte-se com novos clientes'
              }
              <span className="block text-transparent bg-gradient-to-r from-primary to-accent bg-clip-text">
                {userType === 'client' ? 'para seus projetos ✨' : 'e cresça seu negócio 🚀'}
              </span>
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              {userType === 'client' 
                ? 'Receba orçamentos de profissionais qualificados em minutos. Simples, seguro e eficiente.'
                : 'Ofereça seus serviços para clientes que realmente precisam. Aumente sua visibilidade e renda.'
              }
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white px-8 py-4 text-lg font-medium shadow-lg hover:shadow-xl transition-all"
                onClick={() => navigate(userType === 'client' ? '/categories' : '/available-requests')}
              >
                {userType === 'client' ? 'Solicitar Serviço' : 'Ver Oportunidades'}
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-4 text-lg border-2 hover:bg-white/50"
                onClick={() => navigate(userType === 'client' ? '/client-profile' : '/professional-profile')}
              >
                Meu Perfil
              </Button>
            </div>
          </div>
          <div className="relative animate-slide-up">
            <LazyImage 
                src="/lovable-uploads/bcdf9267-23f4-43c5-9f60-203b73298aa4.png" 
                alt="Professional Services Interface" 
                className="w-full max-w-sm mx-auto rounded-2xl shadow-2xl"
            />
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center shadow-lg animate-float">
              <Star className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

const QuickActionsGrid = memo(({ profile, unreadCount, unreadQuotes }: any) => {
  const navigate = useNavigate();
  
  // Garantir que sempre tenhamos um user_type válido, defaultando para 'client'
  const userType = profile?.user_type || 'client';
  
  const quickActions = useMemo(() => [
    {
      title: 'Meu Perfil',
      description: 'Configurar perfil',
      icon: User,
      color: 'from-blue-500 to-blue-600',
      onClick: () => navigate(userType === 'client' ? '/client-profile' : '/professional-profile')
    },
    {
      title: userType === 'client' ? 'Minhas Solicitações' : 'Meus Serviços',
      description: userType === 'client' ? 'Ver situação dos pedidos' : 'Serviços aceitos',
      icon: userType === 'client' ? Settings : Wrench,
      color: userType === 'client' ? 'from-green-500 to-green-600' : 'from-purple-500 to-purple-600',
      onClick: () => navigate(userType === 'client' ? '/my-requests-new' : '/my-services-new'),
      hasNotification: userType === 'client' && unreadQuotes > 0,
      notificationCount: userType === 'client' ? unreadQuotes : 0
    },
    {
      title: 'Acompanhar Progresso',
      description: userType === 'client' ? 'Ver andamento dos pedidos' : 'Gerenciar serviços',
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      onClick: () => navigate(userType === 'client' ? '/track-requests' : '/my-services-new')
    },
    {
      title: userType === 'client' ? 'Nova Solicitação' : 'Oportunidades',
      description: userType === 'client' ? 'Solicitar serviço' : 'Ver disponíveis',
      icon: Plus,
      color: 'from-primary to-accent',
      isGradient: true,
      onClick: () => navigate(userType === 'client' ? '/categories' : '/available-requests')
    }
  ], [userType, unreadCount, unreadQuotes, navigate]);

  return (
    <ResponsiveGrid cols={{ xs: 1, sm: 2, lg: 5 }}>
      {quickActions.map((action, index) => (
        <MobileCard 
          key={index}
          touchable
          onClick={action.onClick}
          className={`p-6 hover:shadow-xl transition-all group bg-white/80 backdrop-blur-xl border-0 shadow-lg relative ${
            action.isGradient ? 'bg-gradient-to-r from-primary to-accent text-white border-0 shadow-lg' : ''
          }`}
        >
          {action.hasNotification && action.notificationCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-semibold shadow-lg">
              {action.notificationCount}
            </div>
          )}
          <div className="text-center space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-lg ${
              action.isGradient ? 'bg-white/20' : `bg-gradient-to-r ${action.color}`
            }`}>
              <action.icon className={`w-8 h-8 ${action.isGradient ? 'text-white' : 'text-white'}`} />
            </div>
            <div>
              <h4 className={`font-semibold ${action.isGradient ? 'text-white' : 'text-gray-800'}`}>
                {action.title}
              </h4>
              <p className={`text-sm ${action.isGradient ? 'text-white/80' : 'text-gray-600'}`}>
                {action.description}
              </p>
            </div>
          </div>
        </MobileCard>
      ))}
    </ResponsiveGrid>
  );
});

const StatsSection = memo(({ profile }: any) => {
  const statsData = useMemo(() => [
    {
      icon: Users,
      value: '1000+',
      label: 'Profissionais Ativos',
      color: 'from-primary to-accent'
    },
    {
      icon: Shield,
      value: profile.is_verified ? '✓' : '⏳',
      label: profile.is_verified ? 'Conta Verificada' : 'Verificação Pendente',
      color: 'from-accent to-primary'
    },
    {
      icon: Star,
      value: '5.0',
      label: 'Avaliação Média',
      color: 'from-primary/80 to-accent/80'
    }
  ], [profile.is_verified]);

  return (
    <ResponsiveGrid cols={{ xs: 1, md: 3 }} className="animate-scale-in">
      {statsData.map((stat, index) => (
        <Card key={index} className="text-center p-6 bg-white/80 backdrop-blur-xl border-0 shadow-lg hover:shadow-xl transition-all">
          <div className={`w-16 h-16 bg-gradient-to-r ${stat.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
            <stat.icon className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        </Card>
      ))}
    </ResponsiveGrid>
  );
});

// Main optimized Index component
export const OptimizedIndex = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const unreadCount = useUnreadMessages();
  const unreadQuotes = useQuoteNotifications();

  // Debug log para verificar o tipo de usuário
  console.log('Profile data:', profile);
  console.log('User type:', profile?.user_type);

  const bottomNavItems = useMemo(() => {
    const userType = profile?.user_type || 'client';
    
    return [
      {
        icon: Home,
        label: 'Início',
        path: '/',
      },
      {
        icon: Search,
        label: userType === 'client' ? 'Solicitar Serviços' : 'Trabalhos',
        path: userType === 'client' ? '/categories' : '/available-requests',
      },
      {
        icon: User,
        label: 'Perfil',
        path: userType === 'client' ? '/client-profile' : '/professional-profile',
      },
    ];
  }, [profile?.user_type, unreadCount]);

  React.useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Se o profile não tem user_type definido, assumir como cliente por padrão
  React.useEffect(() => {
    if (profile && !profile.user_type) {
      console.warn('User type not defined, defaulting to client');
      // Podemos atualizar o perfil no banco para definir como cliente
      const updateUserType = async () => {
        const { error } = await supabase
          .from('profiles')
          .update({ user_type: 'client' })
          .eq('id', user?.id);
        
        if (!error) {
          // Refresh profile to get updated data
          window.location.reload();
        }
      };
      updateUserType();
    }
  }, [profile, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/10 pb-20 md:pb-0">
      <OnboardingTour />
      <MemoizedHeader profile={profile} unreadCount={unreadCount} unreadQuotes={unreadQuotes} signOut={signOut} />
      
      <HeroSection profile={profile} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Dashboard de Ações Rápidas */}
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">Ações Rápidas</h3>
              <p className="text-gray-600">Acesse suas funcionalidades principais</p>
            </div>
            
            <QuickActionsGrid profile={profile} unreadCount={unreadCount} unreadQuotes={unreadQuotes} />
          </div>

          <StatsSection profile={profile} />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav items={bottomNavItems} />

      {/* Footer */}
      <footer className="bg-white/60 backdrop-blur-xl border-t border-white/20 mt-16 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-3 mb-4">
            <LazyImage 
              src="/lovable-uploads/c8434d06-8f8c-46d0-bbd2-778de3b8f219.png" 
              alt="Me Ajuda ai" 
              className="w-8 h-8" 
            />
            <span className="text-lg font-display font-bold text-gray-800">Me Ajuda ai</span>
          </div>
          <p className="text-gray-600">Conectando profissionais e clientes com segurança e eficiência</p>
        </div>
      </footer>
      <DebugInfo />
    </div>
  );
};