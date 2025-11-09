import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Zap, Wrench, Snowflake, Home, Paintbrush, HardHat, Sparkles, Leaf, Package, Refrigerator } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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
      setCategories((data || []) as any); // Type assertion
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header Melhorado */}
        <div className="flex items-center gap-4 mb-8 animate-fade-in">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/")}
            className="hover:scale-110 transition-transform duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Categorias de Serviço
            </h1>
            <p className="text-muted-foreground mt-1">Selecione o tipo de serviço que você precisa</p>
          </div>
        </div>

        {/* Grid de Categorias com Animações */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => {
            const IconComponent = categoryIcons[category.name] || Home;
            
            return (
              <Card
                key={category.id}
                style={{ animationDelay: `${index * 50}ms` }}
                className="group relative overflow-hidden cursor-pointer border-2 border-border/50
                         hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10
                         transition-all duration-300 hover:scale-105 hover:-translate-y-1
                         bg-gradient-to-br from-card via-card to-card/80
                         animate-fade-in"
                onClick={() => handleCategorySelect(category.id)}
              >
                {/* Efeito de brilho no hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent 
                              translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                
                <CardHeader className="relative pb-3">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 
                                  group-hover:from-primary/30 group-hover:to-accent/30 
                                  transition-all duration-300 group-hover:scale-110 group-hover:rotate-3
                                  shadow-lg">
                      <IconComponent className="h-7 w-7 text-primary group-hover:text-accent 
                                              transition-colors duration-300" />
                    </div>
                    <CardTitle className="text-xl text-card-foreground group-hover:text-primary 
                                       transition-colors duration-300">
                      {category.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <CardDescription className="text-sm leading-relaxed group-hover:text-foreground/90 
                                            transition-colors duration-300">
                    {category.description}
                  </CardDescription>
                </CardContent>

                {/* Indicador visual de clique */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent 
                              scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}