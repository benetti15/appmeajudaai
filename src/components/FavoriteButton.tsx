import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner";

interface FavoriteButtonProps {
  professionalId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

export function FavoriteButton({ 
  professionalId, 
  variant = "outline", 
  size = "default",
  showLabel = true 
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkFavoriteStatus();
    }
  }, [user, professionalId]);

  const checkFavoriteStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("client_id", user?.id)
        .eq("professional_id", professionalId)
        .maybeSingle();

      if (error) throw error;
      setIsFavorite(!!data);
    } catch (error) {
      console.error("Error checking favorite:", error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }

    setLoading(true);
    try {
      if (isFavorite) {
        // Remover dos favoritos
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("client_id", user.id)
          .eq("professional_id", professionalId);

        if (error) throw error;
        
        setIsFavorite(false);
        toast.success("Removido dos favoritos");
      } else {
        // Adicionar aos favoritos
        const { error } = await supabase
          .from("favorites")
          .insert({
            client_id: user.id,
            professional_id: professionalId,
          });

        if (error) throw error;
        
        setIsFavorite(true);
        toast.success("Adicionado aos favoritos");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Erro ao atualizar favoritos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleFavorite}
      disabled={loading}
      className="gap-2"
    >
      <Heart 
        className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} 
      />
      {showLabel && (isFavorite ? 'Favoritado' : 'Favoritar')}
    </Button>
  );
}
