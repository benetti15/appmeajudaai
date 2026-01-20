import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Zap, Wrench, Snowflake, Home, Paintbrush, HardHat, Sparkles, Leaf, Package, Refrigerator, Droplets } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Import category images
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
  icon_url: string | null;
  is_active: boolean;
}

const categoryIcons: Record<string, React.ComponentType<any>> = {
  "Elétrica": Zap,
  "Encanamento": Wrench,
  "Ar Condicionado": Snowflake,
  "Pequenos Reparos": Home,
  "Pintura": Paintbrush,
  "Marcenaria": HardHat,
  "Limpeza": Sparkles,
  "Jardinagem": Leaf,
  "Montagem e Instalações": Package,
  "Eletrodomésticos": Refrigerator,
  "Hidráulica": Droplets,
};

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

export default function ServiceCategories() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchCategories();
  }, [user, navigate]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setCategories((data || []) as any);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    navigate(`/new-request/${categoryId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <LoadingSpinner message="Carregando categorias..." fullScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20 md:pb-0">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-8 animate-fade-in">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/")}
            className="hover:scale-110 transition-transform duration-200 h-9 w-9 md:h-10 md:w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl md:text-3xl font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Categorias de Serviço
            </h1>
            <p className="text-xs md:text-base text-muted-foreground mt-0.5 md:mt-1">Selecione o tipo de serviço</p>
          </div>
        </div>

        {/* Grid de Categorias - 2 columns on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {categories.map((category, index) => {
            const IconComponent = categoryIcons[category.name] || Home;
            const categoryImage = categoryImages[category.name];
            
            return (
              <Card
                key={category.id}
                style={{ animationDelay: `${index * 50}ms` }}
                className="group relative overflow-hidden cursor-pointer border-2 border-border/50
                         hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10
                         transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1
                         bg-gradient-to-br from-card via-card to-card/80
                         animate-fade-in"
                onClick={() => handleCategorySelect(category.id)}
              >
                {/* Background image with overlay */}
                {categoryImage && (
                  <div className="absolute inset-0 z-0">
                    <img 
                      src={categoryImage} 
                      alt={category.name}
                      className="w-full h-full object-cover opacity-20 group-hover:opacity-30 group-hover:scale-110 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
                  </div>
                )}

                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent 
                              translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 z-10" />
                
                <CardHeader className="relative z-20 pb-2 md:pb-3 p-3 md:p-6">
                  <div className="flex items-center gap-2 md:gap-4">
                    {/* Icon with mini image */}
                    <div className="relative">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl overflow-hidden shadow-lg 
                                    group-hover:scale-110 group-hover:rotate-3 transition-all duration-300
                                    ring-2 ring-primary/20 group-hover:ring-primary/40">
                        {categoryImage ? (
                          <img 
                            src={categoryImage} 
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                            <IconComponent className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                          </div>
                        )}
                      </div>
                      {/* Icon badge */}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-7 md:h-7 rounded-full 
                                    bg-gradient-to-br from-primary to-accent 
                                    flex items-center justify-center shadow-lg
                                    ring-2 ring-background">
                        <IconComponent className="h-2.5 w-2.5 md:h-3.5 md:w-3.5 text-white" />
                      </div>
                    </div>
                    
                    <CardTitle className="text-sm md:text-xl text-card-foreground group-hover:text-primary 
                                       transition-colors duration-300 line-clamp-2 leading-tight">
                      {category.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                
                <CardContent className="relative z-20 p-3 md:p-6 pt-0">
                  <CardDescription className="text-xs md:text-sm leading-relaxed group-hover:text-foreground/90 
                                            transition-colors duration-300 line-clamp-2">
                    {category.description}
                  </CardDescription>
                </CardContent>

                {/* Bottom indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent 
                              scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left z-20" />
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}