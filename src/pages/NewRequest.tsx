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

  const openToninho = () => {
    navigate('/');
    setTimeout(() => {
      const toninhoButton = document.querySelector('[aria-label="Abrir assistente IA"]') as HTMLElement;
      toninhoButton?.click();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Compact Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-3 max-w-2xl">
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
        </div>
      </div>

      {/* Toninho CTA Banner */}
      <div className="container mx-auto px-4 pt-6 max-w-2xl">
        <button
          onClick={openToninho}
          className="w-full group relative overflow-hidden rounded-2xl p-4 
                   bg-gradient-to-r from-primary to-accent hover:scale-[1.02]
                   transition-transform duration-300 shadow-lg hover:shadow-xl"
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                        -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm 
                            flex items-center justify-center shadow-inner
                            group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-bold text-lg">
                  Crie com o Toninho IA ✨
                </h3>
                <p className="text-white/80 text-sm">
                  Deixe a IA preencher tudo pra você
                </p>
              </div>
            </div>
            
            <div className="shrink-0 w-10 h-10 rounded-full bg-white/20 
                          flex items-center justify-center
                          group-hover:translate-x-1 transition-transform duration-300">
              <ArrowLeft className="w-5 h-5 text-white rotate-180" />
            </div>
          </div>
        </button>
      </div>

      {/* Divider */}
      <div className="container mx-auto px-4 py-4 max-w-2xl">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-medium">ou preencha manualmente</span>
          <div className="flex-1 h-px bg-border" />
        </div>
      </div>

      {/* Form Content */}
      <div className="container mx-auto px-4 pb-6 max-w-2xl">
        <ModernRequestForm 
          categoryId={categoryId || ''} 
          categoryName={category?.name}
        />
      </div>
    </div>
  );
}
