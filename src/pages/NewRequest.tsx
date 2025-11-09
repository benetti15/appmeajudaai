import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, Wrench, Snowflake, Home, Paintbrush, HardHat, Sparkles, Leaf, Package, Refrigerator } from "lucide-react";
import { SimpleRequestCreation } from "@/components/SimpleRequestCreation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
}

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'quoted' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  created_at: string;
  preferred_date?: string;
  address: string;
  city: string;
  client_id: string;
}

interface Quote {
  id: string;
  professional_id: string;
  amount: number;
  is_accepted: boolean;
  profiles?: {
    full_name: string;
  };
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

export default function NewRequest() {
  const { categoryId } = useParams();
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [existingRequest, setExistingRequest] = useState<ServiceRequest | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
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
      checkExistingRequest();
      fetchCategory();
    }
  }, [user, categoryId, navigate]);

  const checkExistingRequest = async () => {
    try {
      // Check if this is actually a request ID instead of category ID
      const { data: requestData, error: requestError } = await supabase
        .from("service_requests")
        .select("*")
        .eq("id", categoryId)
        .eq("client_id", user?.id)
        .single();

      if (requestData && !requestError) {
        setExistingRequest(requestData as any); // Type assertion
        fetchQuotes(requestData.id);
        return;
      }
    } catch (error) {
      // Not a request ID, continue with category logic
    }
  };

  const fetchCategory = async () => {
    if (existingRequest) return; // Skip if we found an existing request
    
    try {
      const { data, error } = await supabase
        .from("service_categories")
        .select("id, name, description")
        .eq("id", categoryId)
        .single();

      if (error) throw error;
      setCategory(data);
    } catch (error) {
      console.error("Error fetching category:", error);
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

  const fetchQuotes = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from("quotes")
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .eq("request_id", requestId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error) {
      console.error("Error fetching quotes:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <LoadingSpinner message="Carregando..." fullScreen />
      </div>
    );
  }

  // If we found an existing request, redirect to details
  if (existingRequest) {
    navigate(`/simple-request-details/${existingRequest.id}`);
    return null;
  }

  // Otherwise, show new request creation form
  const IconComponent = category ? categoryIcons[category.name] || Home : Home;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header Visual Aprimorado */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/categories")}
              className="hover:scale-110 transition-transform duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            {/* Breadcrumb Visual */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="hover:text-primary transition-colors cursor-pointer" 
                    onClick={() => navigate("/categories")}>
                Categorias
              </span>
              <span>/</span>
              <span className="text-foreground font-medium">Novo Pedido</span>
            </div>
          </div>

          {/* Card de Header com Ícone da Categoria */}
          <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 
                        rounded-2xl p-6 border-2 border-primary/20 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 
                            shadow-lg animate-scale-in">
                <IconComponent className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-1">
                  Novo Pedido
                </h1>
                <p className="text-lg text-muted-foreground flex items-center gap-2">
                  {category ? (
                    <>
                      <span className="font-semibold text-primary">{category.name}</span>
                      <span className="text-sm">• {category.description}</span>
                    </>
                  ) : (
                    "Criar solicitação de serviço"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <SimpleRequestCreation categoryId={categoryId} />
      </div>
    </div>
  );
}