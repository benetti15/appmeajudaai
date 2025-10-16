import { useAuth } from "@/hooks/useAuth";
import { VerificationSystem } from "@/components/VerificationSystem";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function VerificationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-primary/5">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="p-2"
            >
              <Home className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Verificação de Conta
            </h1>
            <p className="text-muted-foreground">
              Aumente sua credibilidade verificando sua identidade e qualificações
            </p>
          </div>
        </div>

        <VerificationSystem showUploadForm={true} />
      </div>
    </div>
  );
}