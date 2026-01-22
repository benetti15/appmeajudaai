import { NotificationCenter } from "@/components/notification-system/NotificationCenter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, LogOut, Shield } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { AnimatedLogo } from "@/components/ui/animated-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AppHeaderProps {
  showLogo?: boolean;
}

export function AppHeader({ showLogo = true }: AppHeaderProps = {}) {
  const { user, profile } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso");
    navigate("/auth");
  };

  const navigateToProfile = () => {
    if (profile?.user_type === 'professional') {
      navigate("/professional-profile");
    } else {
      navigate("/client-profile");
    }
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {showLogo ? (
            <div 
              className="cursor-pointer"
              onClick={() => navigate("/")}
            >
              <AnimatedLogo size="sm" showIcon={true} variant="default" />
            </div>
          ) : (
            <h1 
              className="text-lg font-semibold cursor-pointer hover:text-primary transition-colors font-display"
              onClick={() => navigate("/")}
            >
              ME AJUDA AI!
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Notification Center */}
          <NotificationCenter userId={user.id} />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm">
                <p className="font-medium">{profile?.full_name || "Usuário"}</p>
                <p className="text-xs text-muted-foreground">
                  {profile?.user_type === 'professional' ? 'Profissional' : 'Cliente'}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={navigateToProfile}>
                <User className="mr-2 h-4 w-4" />
                Meu Perfil
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/admin/verificacao")}>
                    <Shield className="mr-2 h-4 w-4" />
                    Painel Admin
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
