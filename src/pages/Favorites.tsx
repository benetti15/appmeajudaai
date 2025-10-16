import { useAuth } from "@/hooks/useAuth";
import { FavoritesSystem } from "@/components/FavoritesSystem";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Favorites() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-primary/5">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Meus Favoritos
            </h1>
            <p className="text-muted-foreground">
              Profissionais salvos para acesso rápido
            </p>
          </div>
        </div>

        <FavoritesSystem />
      </div>
    </div>
  );
}