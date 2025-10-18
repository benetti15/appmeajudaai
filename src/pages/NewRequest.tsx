import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SimpleRequestCreation } from "@/components/SimpleRequestCreation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  // If we found an existing request, redirect to details
  if (existingRequest) {
    navigate(`/simple-request-details/${existingRequest.id}`);
    return null;
  }

  // Otherwise, show new request creation form
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/categories")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Novo Pedido</h1>
            <p className="text-muted-foreground">
              {category ? `Categoria: ${category.name}` : "Criar solicitação de serviço"}
            </p>
          </div>
        </div>

        <SimpleRequestCreation categoryId={categoryId} />
      </div>
    </div>
  );
}