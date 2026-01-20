import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import { ModernRequestForm } from "@/components/request/ModernRequestForm";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Category images
import eletricaImg from "@/assets/categories/eletrica.jpg";
import encanamentoImg from "@/assets/categories/encanamento.jpg";
import arCondicionadoImg from "@/assets/categories/ar-condicionado.jpg";
import pequenosReparosImg from "@/assets/categories/pequenos-reparos.jpg";
import pinturaImg from "@/assets/categories/pintura.jpg";
import marcenariaImg from "@/assets/categories/marcenaria.jpg";
import limpezaImg from "@/assets/categories/limpeza.jpg";
import jardinagemImg from "@/assets/categories/jardinagem.jpg";
import montagemImg from "@/assets/categories/montagem.jpg";
import eletrodomesticosImg from "@/assets/categories/eletrodomesticos.jpg";
import hidraulicaImg from "@/assets/categories/hidraulica.jpg";

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
}

const categoryImages: Record<string, string> = {
  "Elétrica": eletricaImg,
  "Encanamento": encanamentoImg,
  "Ar Condicionado": arCondicionadoImg,
  "Pequenos Reparos": pequenosReparosImg,
  "Pintura": pinturaImg,
  "Marcenaria": marcenariaImg,
  "Limpeza": limpezaImg,
  "Jardinagem": jardinagemImg,
  "Montagem e Instalações": montagemImg,
  "Eletrodomésticos": eletrodomesticosImg,
  "Hidráulica": hidraulicaImg,
};

export default function NewRequest() {
  const { categoryId } = useParams();
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (categoryId) {
      fetchCategory();
    }
  }, [user, categoryId, navigate]);

  const fetchCategory = async () => {
    try {
      // First check if it's a request ID (redirect to details)
      const { data: requestData } = await supabase
        .from("service_requests")
        .select("id")
        .eq("id", categoryId)
        .eq("client_id", user?.id)
        .single();

      if (requestData) {
        navigate(`/simple-request-details/${requestData.id}`);
        return;
      }

      // Otherwise fetch category
      const { data, error } = await supabase
        .from("service_categories")
        .select("id, name, description")
        .eq("id", categoryId)
        .single();

      if (error) throw error;
      setCategory(data);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erro",
        description: "Categoria não encontrada",
        variant: "destructive",
      });
      navigate("/categories");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingSpinner message="Carregando..." fullScreen />
      </div>
    );
  }

  const categoryImage = category ? categoryImages[category.name] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Compact Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-3 max-w-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/categories")}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              {category && (
                <div className="flex items-center gap-3">
                  {categoryImage && (
                    <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-primary/20">
                      <img 
                        src={categoryImage} 
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h1 className="font-semibold text-foreground leading-tight">
                      {category.name}
                    </h1>
                    <p className="text-xs text-muted-foreground">
                      Nova solicitação
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigate('/');
                setTimeout(() => {
                  const toninhoButton = document.querySelector('[aria-label="Abrir assistente IA"]') as HTMLElement;
                  toninhoButton?.click();
                }, 500);
              }}
              className="gap-1.5 text-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Toninho IA
            </Button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <ModernRequestForm 
          categoryId={categoryId || ''} 
          categoryName={category?.name}
        />
      </div>
    </div>
  );
}
