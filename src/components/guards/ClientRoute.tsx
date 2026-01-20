import { Navigate } from "react-router-dom";
import { useUserType } from "@/hooks/useUserType";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface ClientRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Guard de rota exclusivo para CLIENTES.
 * Redireciona profissionais para a home ou rota especificada.
 */
export function ClientRoute({ children, redirectTo = "/" }: ClientRouteProps) {
  const { isClient, isProfessional, isLoading, isAuthenticated } = useUserType();
  const hasShownToast = useRef(false);

  // Mostrar toast de feedback quando profissional tenta acessar
  useEffect(() => {
    if (!isLoading && isProfessional && !hasShownToast.current) {
      hasShownToast.current = true;
      toast.info("Esta página é exclusiva para clientes", {
        description: "Você foi redirecionado para a página inicial"
      });
    }
  }, [isLoading, isProfessional]);

  // Aguarda carregamento do perfil
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <LoadingSpinner />
      </div>
    );
  }

  // Não autenticado - redireciona para login
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Não é cliente - redireciona para home
  if (!isClient) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
