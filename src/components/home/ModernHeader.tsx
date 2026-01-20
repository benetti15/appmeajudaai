import React, { memo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { NotificationBadge } from "@/components/NotificationBadge";
import { LazyImage } from "@/components/PerformanceOptimizations";
import { 
  Menu, 
  User, 
  LogOut, 
  Plus, 
  Settings, 
  Sparkles, 
  BarChart3, 
  Wrench,
  ChevronDown,
  Award,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModernHeaderProps {
  profile: any;
  unreadCount: number;
  unreadQuotes: number;
  signOut: () => void;
}

export const ModernHeader = memo(({ profile, unreadCount, unreadQuotes, signOut }: ModernHeaderProps) => {
  const navigate = useNavigate();
  const [showLogo, setShowLogo] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    setShowLogo(true);
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const userType = profile?.user_type || 'client';
  
  return (
    <header className={cn(
      "sticky top-0 z-40 transition-all duration-300",
      scrolled 
        ? "bg-background/80 backdrop-blur-2xl border-b border-border/50 shadow-sm" 
        : "bg-transparent"
    )}>
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-3 group cursor-pointer"
        >
          <div className="relative">
            <LazyImage 
              src="/lovable-uploads/c8434d06-8f8c-46d0-bbd2-778de3b8f219.png" 
              alt="Me Ajuda ai" 
              className="w-11 h-11 group-hover:scale-110 transition-transform duration-300" 
            />
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          
          <h1 className="flex items-center gap-1.5 text-2xl font-display font-black tracking-tight">
            <span className={cn(
              "bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient transition-all duration-500",
              showLogo ? "opacity-100" : "opacity-0"
            )}>
              ME AJUDA
            </span>
            <span className={cn(
              "relative inline-flex items-center transition-all duration-500",
              showLogo ? "opacity-100 scale-100" : "opacity-0 scale-50"
            )}>
              <span className="bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent font-black text-3xl">
                AI!
              </span>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-cyan-400 rounded-full" />
            </span>
          </h1>
        </button>
        
        {/* Right side */}
        <div className="flex items-center gap-3">
          
          {/* Greeting */}
          <span className="text-sm font-medium text-muted-foreground hidden md:block">
            Olá, <span className="text-foreground font-semibold">{profile?.full_name?.split(' ')[0] || 'Usuário'}</span>
          </span>
          
          {/* Notifications */}
          <NotificationBadge />
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 rounded-xl border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="hidden sm:inline font-medium">Menu</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-56 rounded-xl bg-background/95 backdrop-blur-2xl border-border/50 shadow-xl p-2" 
              align="end"
            >
              {/* User info header */}
              <div className="px-3 py-2 mb-2">
                <p className="font-semibold text-foreground">{profile?.full_name || "Usuário"}</p>
                <p className="text-xs text-muted-foreground">
                  {userType === 'professional' ? '🔧 Profissional' : '👤 Cliente'}
                </p>
              </div>
              
              <DropdownMenuSeparator className="bg-border/50" />
              
              <DropdownMenuItem 
                onClick={() => navigate(userType === 'client' ? '/client-profile' : '/professional-profile')}
                className="cursor-pointer rounded-lg py-2.5 px-3 focus:bg-primary/10"
              >
                <User className="w-4 h-4 mr-3 text-primary" />
                Meu Perfil
              </DropdownMenuItem>
              
              {userType === 'professional' ? (
                <>
                  <DropdownMenuItem onClick={() => navigate('/my-services-new')} className="cursor-pointer rounded-lg py-2.5 px-3 focus:bg-primary/10">
                    <Wrench className="w-4 h-4 mr-3 text-accent" />
                    Meus Serviços
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/professional-dashboard')} className="cursor-pointer rounded-lg py-2.5 px-3 focus:bg-primary/10">
                    <BarChart3 className="w-4 h-4 mr-3 text-blue-500" />
                    Dashboard
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => navigate('/my-requests')} className="cursor-pointer rounded-lg py-2.5 px-3 focus:bg-primary/10 relative">
                  <Settings className="w-4 h-4 mr-3 text-accent" />
                  Minhas Solicitações
                  {unreadQuotes > 0 && (
                    <Badge className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0 h-5 min-w-5 rounded-full">
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
                className="cursor-pointer rounded-lg py-2.5 px-3 focus:bg-primary/10"
              >
                <Plus className="w-4 h-4 mr-3 text-green-500" />
                {userType === 'client' ? 'Nova Solicitação' : 'Oportunidades'}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-border/50" />
              
              <DropdownMenuItem onClick={() => navigate('/about-toninho')} className="cursor-pointer rounded-lg py-2.5 px-3 focus:bg-primary/10">
                <Sparkles className="w-4 h-4 mr-3 text-primary" />
                Sobre o Toninho
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-border/50" />
              
              <DropdownMenuItem 
                onClick={signOut} 
                className="cursor-pointer rounded-lg py-2.5 px-3 text-red-600 focus:bg-red-50 focus:text-red-600"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
});

ModernHeader.displayName = 'ModernHeader';