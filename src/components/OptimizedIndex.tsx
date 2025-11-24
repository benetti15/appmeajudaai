import React, { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBadge } from "@/components/NotificationBadge";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useQuoteNotifications } from "@/hooks/useQuoteNotifications";
import { MobileBottomNav, MobileCard, ResponsiveGrid } from "@/components/MobileOptimizations";
import { LazyImage } from "@/components/PerformanceOptimizations";
import { DebugInfo } from "@/components/DebugInfo";
import { OnboardingTour } from "@/components/OnboardingTour";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { HeroSection } from "@/components/HeroSection";
import { ToninhoBanner } from "@/components/ToninhoBanner";
import { QuickActionCards } from "@/components/QuickActionCards";
import { HelpCenter } from "@/components/ai/HelpCenter";
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
  Sparkles,
  Zap,
  FileText,
  MapPin,
  DollarSign,
  Briefcase
} from "lucide-react";

// Memoized components for better performance
const MemoizedHeader = memo(({ profile, unreadCount, unreadQuotes, signOut }: any) => {
  const navigate = useNavigate();
  const [showLogo, setShowLogo] = React.useState(false);
  
  React.useEffect(() => {
    setShowLogo(true);
  }, []);
  
  return (
    <header className="bg-white/70 backdrop-blur-2xl border-b border-white/30 shadow-xl sticky top-0 z-40 animate-slide-down">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5"></div>
      <div className="container mx-auto px-4 py-4 flex justify-between items-center relative">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-3 group cursor-pointer"
        >
          <div className="relative">
            <LazyImage 
              src="/lovable-uploads/c8434d06-8f8c-46d0-bbd2-778de3b8f219.png" 
              alt="Me Ajuda ai" 
              className="w-12 h-12 animate-float group-hover:scale-110 transition-transform" 
            />
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          <h1 className="flex items-center gap-2 text-3xl font-display font-black tracking-tight">
            {/* ME AJUDA com múltiplas camadas de efeitos */}
            <span className={`relative transition-all duration-700 ${
              showLogo ? 'opacity-100 translate-x-0 animate-gradient' : 'opacity-0 -translate-x-4'
            }`}
            style={{ animationDelay: '0ms' }}>
              {/* Sombra de fundo */}
              <span className="absolute inset-0 bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 blur-xl"></span>
              {/* Borda externa */}
              <span className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary blur-sm opacity-30"></span>
              {/* Texto principal */}
              <span className="relative bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] drop-shadow-md">
                ME AJUDA
              </span>
            </span>
            
            {/* AI com efeitos especiais de IA */}
            <span className={`relative inline-flex items-center ml-1 transition-all duration-700 ${
              showLogo ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}
            style={{ animationDelay: '400ms', transitionDelay: '400ms' }}>
              {/* Camada de brilho externa pulsante */}
              <span className="absolute -inset-4 bg-gradient-to-r from-cyan-400/20 via-blue-500/20 to-purple-600/20 rounded-lg blur-xl animate-pulse"></span>
              {/* Camada de brilho média */}
              <span className="absolute -inset-2 bg-gradient-to-r from-cyan-400/40 via-blue-500/40 to-purple-600/40 rounded-lg blur-md"></span>
              {/* Camada de brilho interna */}
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 blur-md opacity-75 animate-pulse"></span>
              
              {/* Borda brilhante */}
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500 blur-sm"></span>
              
              {/* Texto AI principal */}
              <span className="relative bg-gradient-to-br from-cyan-300 via-blue-400 to-purple-500 bg-clip-text text-transparent font-black text-4xl animate-gradient bg-[length:200%_auto] drop-shadow-2xl">
                AI!
              </span>
              
              {/* Ponto de luz no canto */}
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-300 rounded-full animate-ping shadow-lg shadow-cyan-400"></span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-lg shadow-cyan-500"></span>
              
              {/* Pequenos pontos decorativos */}
              <span className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></span>
              <span className="absolute top-0 left-1/2 w-1 h-1 bg-blue-300 rounded-full animate-ping" style={{ animationDelay: '200ms' }}></span>
            </span>
          </h1>
        </button>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-600 hidden sm:block">
            Olá, {profile.full_name}
          </span>
          <NotificationBadge />
          
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
        onClick={() => {
          const targetPath = userType === 'client' ? '/categories' : '/available-requests';
          setTimeout(() => navigate(targetPath), 100);
        }}
        className="cursor-pointer"
      >
        <Plus className="w-4 h-4 mr-2" />
        {userType === 'client' ? 'Nova Solicitação' : 'Oportunidades'}
      </DropdownMenuItem>
      
      <DropdownMenuSeparator />
      
      <DropdownMenuItem onClick={() => navigate('/about-toninho')} className="cursor-pointer">
        <Sparkles className="w-4 h-4 mr-2 text-primary" />
        Sobre o Toninho
      </DropdownMenuItem>
    </>
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
      onClick: () => navigate(userType === 'client' ? '/client-profile' : '/professional-profile'),
      isHighlighted: false
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
      title: userType === 'client' ? 'Nova Solicitação' : 'Oportunidades',
      description: userType === 'client' ? 'Solicitar serviço' : 'Ver disponíveis',
      icon: Plus,
      color: 'from-primary to-accent',
      isGradient: true,
      onClick: () => {
        const targetPath = userType === 'client' ? '/categories' : '/available-requests';
        setTimeout(() => navigate(targetPath), 100);
      }
    }
  ], [userType, unreadCount, unreadQuotes, navigate]);

  return (
    <ResponsiveGrid cols={{ xs: 1, sm: 2, lg: 5 }}>
      {quickActions.map((action, index) => (
        <MobileCard 
          key={index}
          touchable
          onClick={action.onClick}
          className={`p-6 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 group 
                     bg-white/80 backdrop-blur-xl border-2 border-transparent hover:border-primary/50 
                     shadow-lg relative overflow-hidden cursor-pointer hover:-translate-y-2 hover:scale-105 ${
            action.isGradient ? 'bg-gradient-to-r from-primary to-accent text-white border-0' : ''
          }`}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full 
                          transition-transform duration-1000 bg-gradient-to-r 
                          from-transparent via-white/30 to-transparent"></div>
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


// Main optimized Index component
export const OptimizedIndex = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const unreadCount = useUnreadMessages();
  const unreadQuotes = useQuoteNotifications();

  const userType = profile?.user_type || 'client';
  
  const quickActions = useMemo(() => {
    const baseActions = [
      {
        icon: Plus,
        title: userType === 'client' ? 'Nova Solicitação' : 'Ver Solicitações',
        description: userType === 'client' ? 'Criar pedido com Toninho' : 'Encontrar trabalhos',
        onClick: () => navigate(userType === 'client' ? '/categories' : '/available-requests'),
        variant: 'primary' as const
      },
      {
        icon: MessageCircle,
        title: 'Conversas',
        description: 'Suas mensagens',
        onClick: () => navigate('/conversations'),
        badge: unreadCount > 0 ? unreadCount.toString() : undefined
      },
      {
        icon: User,
        title: 'Meu Perfil',
        description: 'Configurações',
        onClick: () => navigate(userType === 'client' ? '/client-profile' : '/professional-profile')
      }
    ];

    if (userType === 'client') {
      baseActions.splice(2, 0, {
        icon: FileText,
        title: 'Meus Pedidos',
        description: 'Acompanhar status',
        onClick: () => navigate('/my-requests'),
        badge: unreadQuotes > 0 ? unreadQuotes.toString() : undefined
      });
    }

    return baseActions;
  }, [userType, unreadCount, unreadQuotes, navigate]);

  const bottomNavItems = useMemo(() => {
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

  // Verificar se profile foi carregado corretamente
  // Não é mais necessário atualizar manualmente, o trigger handle_new_user garante o valor

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
    <div className="min-h-screen bg-gradient-subtle">
      <MemoizedHeader 
        profile={profile} 
        unreadCount={unreadCount}
        unreadQuotes={unreadQuotes}
        signOut={signOut}
      />
      
      <OnboardingTour />
      
      {/* Hero Section */}
      <HeroSection />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Toninho Banner */}
          <ToninhoBanner
            message="💡 Dica do Toninho: Clique no botão 'Nova Solicitação' e eu vou te ajudar a criar seu pedido de forma rápida e fácil!"
            variant="tip"
            dismissible
          />

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                O que você precisa fazer hoje?
              </h2>
              <p className="text-muted-foreground text-lg">
                Acesse suas funcionalidades principais
              </p>
            </div>
            
          <QuickActionCards actions={quickActions} columns={4} />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav items={bottomNavItems} />

      {/* Footer com wave animation */}
      <footer className="relative bg-gradient-to-b from-white/60 to-white/80 
                         backdrop-blur-xl border-t border-white/30 mt-20 py-12 overflow-hidden">
        {/* Wave animation */}
        <div className="absolute top-0 left-0 w-full overflow-hidden leading-none">
          <svg className="relative block w-full h-12" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
                  className="fill-primary/10 animate-wave"></path>
          </svg>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
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