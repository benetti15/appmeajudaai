import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useQuoteNotifications } from "@/hooks/useQuoteNotifications";
import { OnboardingTour } from "@/components/OnboardingTour";
import { DebugInfo } from "@/components/DebugInfo";
import { LazyImage } from "@/components/PerformanceOptimizations";
import { ModernHeader } from "@/components/home/ModernHeader";
import { ModernHeroSection } from "@/components/home/ModernHeroSection";
import { ModernQuickActions } from "@/components/home/ModernQuickActions";
import { ModernBottomNav } from "@/components/home/ModernBottomNav";
import { ModernToninhoBanner } from "@/components/home/ModernToninhoBanner";
import { 
  Plus, 
  MessageCircle, 
  User,
  Home,
  Search,
  FileText,
  Sparkles
} from "lucide-react";

export const ModernIndex = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const unreadCount = useUnreadMessages();
  const unreadQuotes = useQuoteNotifications();

  const userType = profile?.user_type || 'client';
  
  const quickActions = useMemo(() => {
    if (userType === 'professional') {
      return [
        {
          icon: Plus,
          title: 'Ver Solicitações',
          description: 'Encontrar novos trabalhos',
          onClick: () => navigate('/available-requests'),
          variant: 'gradient' as const
        },
        {
          icon: FileText,
          title: 'Meus Serviços',
          description: 'Serviços aceitos',
          onClick: () => navigate('/my-services'),
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
          description: 'Configurações da conta',
          onClick: () => navigate('/professional-profile')
        }
      ];
    }
    
    // Cliente
    return [
      {
        icon: Plus,
        title: 'Nova Solicitação',
        description: 'Criar pedido com Toninho IA',
        onClick: () => navigate('/categories'),
        variant: 'gradient' as const
      },
      {
        icon: FileText,
        title: 'Meus Pedidos',
        description: 'Acompanhar status',
        onClick: () => navigate('/my-requests'),
        badge: unreadQuotes > 0 ? unreadQuotes.toString() : undefined
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
        description: 'Configurações da conta',
        onClick: () => navigate('/client-profile')
      }
    ];
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
        label: userType === 'client' ? 'Serviços' : 'Trabalhos',
        path: userType === 'client' ? '/categories' : '/available-requests',
      },
      {
        icon: User,
        label: 'Perfil',
        path: userType === 'client' ? '/client-profile' : '/professional-profile',
      },
    ];
  }, [userType]);

  React.useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-xl animate-ping" />
          </div>
          <p className="text-muted-foreground font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <ModernHeader 
        profile={profile} 
        unreadCount={unreadCount}
        unreadQuotes={unreadQuotes}
        signOut={signOut}
      />
      
      <OnboardingTour />
      
      {/* Hero Section */}
      <ModernHeroSection />
      
      <main className="container mx-auto px-3 md:px-4 py-6 md:py-12 pb-28 md:pb-12">
        <div className="max-w-5xl mx-auto space-y-6 md:space-y-10">
          {/* Toninho Banner - more compact on mobile */}
          <ModernToninhoBanner
            message="Clique em 'Nova Solicitação' e eu vou te ajudar a criar seu pedido!"
            action="Começar"
            actionPath="/categories"
            variant="tip"
            dismissible
          />

          {/* Quick Actions Section */}
          <div className="space-y-4 md:space-y-6">
            <div className="text-center">
              <h2 className="text-xl md:text-3xl font-display font-bold text-foreground mb-1 md:mb-2">
                O que você precisa?
              </h2>
              <p className="text-sm md:text-base text-muted-foreground">
                Acesse suas funcionalidades
              </p>
            </div>
            
            <ModernQuickActions actions={quickActions} columns={4} />
          </div>
          
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <ModernBottomNav items={bottomNavItems} />

      {/* Footer with wave animation */}
      <footer className="relative bg-gradient-to-b from-transparent to-primary/5 border-t border-border/30 mt-12 py-10 overflow-hidden hidden md:block">
        {/* Wave decoration */}
        <div className="absolute top-0 left-0 w-full overflow-hidden leading-none transform -translate-y-full">
          <svg className="relative block w-full h-8" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path 
              d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
              className="fill-primary/5"
            />
          </svg>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="flex justify-center items-center gap-3 mb-4">
            <LazyImage 
              src="/lovable-uploads/c8434d06-8f8c-46d0-bbd2-778de3b8f219.png" 
              alt="Me Ajuda ai" 
              className="w-8 h-8" 
            />
            <div className="flex items-center gap-1.5 text-xl font-display font-black">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                ME AJUDA
              </span>
              <span className="bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                AI!
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Me Ajuda AI. Conectando você aos melhores profissionais.
          </p>
        </div>
      </footer>
      
      <DebugInfo />
    </div>
  );
};