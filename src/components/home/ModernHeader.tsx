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
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const userType = profile?.user_type || 'client';
  
  return (
    <header className={cn(
      "sticky top-0 z-40 transition-all duration-300 bg-background border-b",
      scrolled 
        ? "border-border shadow-sm" 
        : "border-transparent"
    )}>
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-3 group cursor-pointer"
        >
          <img 
            src="/toninho-logo.png" 
            alt="Me Ajuda Aí" 
            className="w-10 h-10 md:w-11 md:h-11 rounded-xl group-hover:scale-105 transition-transform duration-200" 
          />
          
          <h1 className="text-lg md:text-xl font-semibold text-foreground tracking-tight">
            Me Ajuda Aí
          </h1>
        </button>
        
        {/* Right side */}
        <div className="flex items-center gap-3">
          
          {/* Greeting - desktop only */}
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
                className="gap-2 rounded-xl h-10 border-border hover:border-primary/50 hover:bg-secondary transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="hidden sm:inline font-medium text-foreground">Menu</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-56 rounded-2xl bg-background border-border shadow-lg p-2" 
              align="end"
            >
              {/* User info header */}
              <div className="px-3 py-2 mb-2">
                <p className="font-semibold text-foreground">{profile?.full_name || "Usuário"}</p>
                <p className="text-xs text-muted-foreground">
                  {userType === 'professional' ? '🔧 Profissional' : '👤 Cliente'}
                </p>
              </div>
              
              <DropdownMenuSeparator className="bg-border" />
              
              <DropdownMenuItem 
                onClick={() => navigate(userType === 'client' ? '/client-profile' : '/professional-profile')}
                className="cursor-pointer rounded-xl py-2.5 px-3 focus:bg-secondary"
              >
                <User className="w-4 h-4 mr-3 text-primary" />
                Meu Perfil
              </DropdownMenuItem>
              
              {userType === 'professional' ? (
                <>
                  <DropdownMenuItem onClick={() => navigate('/my-services-new')} className="cursor-pointer rounded-xl py-2.5 px-3 focus:bg-secondary">
                    <Wrench className="w-4 h-4 mr-3 text-muted-foreground" />
                    Meus Serviços
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/professional-dashboard')} className="cursor-pointer rounded-xl py-2.5 px-3 focus:bg-secondary">
                    <BarChart3 className="w-4 h-4 mr-3 text-muted-foreground" />
                    Dashboard
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => navigate('/my-requests')} className="cursor-pointer rounded-xl py-2.5 px-3 focus:bg-secondary relative">
                  <Settings className="w-4 h-4 mr-3 text-muted-foreground" />
                  Minhas Solicitações
                  {unreadQuotes > 0 && (
                    <Badge className="ml-auto bg-destructive text-destructive-foreground text-xs px-1.5 py-0 h-5 min-w-5 rounded-full">
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
                className="cursor-pointer rounded-xl py-2.5 px-3 focus:bg-secondary"
              >
                <Plus className="w-4 h-4 mr-3 text-primary" />
                {userType === 'client' ? 'Nova Solicitação' : 'Oportunidades'}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-border" />
              
              <DropdownMenuItem onClick={() => navigate('/about-toninho')} className="cursor-pointer rounded-xl py-2.5 px-3 focus:bg-secondary">
                <Sparkles className="w-4 h-4 mr-3 text-primary" />
                Sobre o Toninho
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-border" />
              
              <DropdownMenuItem 
                onClick={signOut} 
                className="cursor-pointer rounded-xl py-2.5 px-3 text-destructive focus:bg-destructive/10 focus:text-destructive"
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