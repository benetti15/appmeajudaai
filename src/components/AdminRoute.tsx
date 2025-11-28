import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAdmin, loading } = useUserRole();
  const navigate = useNavigate();

  if (loading) {
    return <LoadingSpinner message="Verificando permissões..." fullScreen />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-destructive/5 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <ShieldX className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">Acesso Negado</AlertTitle>
            <AlertDescription className="mt-2">
              Você não tem permissão para acessar esta área administrativa.
              Apenas administradores podem visualizar este conteúdo.
            </AlertDescription>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => navigate(-1)} variant="outline">
                Voltar
              </Button>
              <Button onClick={() => navigate("/")}>
                Ir para Início
              </Button>
            </div>
          </Alert>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
