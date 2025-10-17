import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchFilters, FilterState } from "@/components/SearchFilters";
import { ArrowLeft, Calendar, DollarSign, MapPin, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  budget_estimate: number | null;
  address: string;
  city: string;
  state: string;
  created_at: string;
  preferred_date: string | null;
  urgency_level: number;
  service_categories: { name: string } | null;
}

export default function AdvancedSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("service_requests")
        .select(`
          *,
          service_categories (name)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
      setFilteredRequests(data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filters: FilterState) => {
    let filtered = [...requests];

    // Filtro de busca
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(search) || 
        r.description.toLowerCase().includes(search)
      );
    }

    // Filtro de categoria
    if (filters.categoryId) {
      filtered = filtered.filter(r => r.category_id === filters.categoryId);
    }

    // Filtro de cidade
    if (filters.city) {
      filtered = filtered.filter(r => r.city === filters.city);
    }

    // Filtro de orçamento
    if (filters.minBudget !== null) {
      filtered = filtered.filter(r => 
        r.budget_estimate !== null && r.budget_estimate >= filters.minBudget!
      );
    }
    if (filters.maxBudget !== null) {
      filtered = filtered.filter(r => 
        r.budget_estimate !== null && r.budget_estimate <= filters.maxBudget!
      );
    }

    // Filtro de urgência
    if (filters.urgencyLevel) {
      filtered = filtered.filter(r => 
        r.urgency_level === parseInt(filters.urgencyLevel!)
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'price_asc':
          return (a.budget_estimate || 0) - (b.budget_estimate || 0);
        case 'price_desc':
          return (b.budget_estimate || 0) - (a.budget_estimate || 0);
        case 'urgency':
          return b.urgency_level - a.urgency_level;
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredRequests(filtered);
  };

  const getUrgencyColor = (level: number) => {
    switch (level) {
      case 3: return "destructive";
      case 2: return "default";
      case 1: return "secondary";
      default: return "secondary";
    }
  };

  const getUrgencyLabel = (level: number) => {
    switch (level) {
      case 3: return "Alta";
      case 2: return "Média";
      case 1: return "Baixa";
      default: return "Normal";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Busca Avançada</h1>
            <p className="text-muted-foreground">
              {filteredRequests.length} {filteredRequests.length === 1 ? 'serviço encontrado' : 'serviços encontrados'}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <SearchFilters onFilterChange={handleFilterChange} />

          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhum serviço encontrado</h3>
                <p className="text-muted-foreground">
                  Tente ajustar os filtros para ver mais resultados
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRequests.map((request) => (
                <Card
                  key={request.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/request-details/${request.id}`)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg">{request.title}</CardTitle>
                      <Badge variant={getUrgencyColor(request.urgency_level)}>
                        {getUrgencyLabel(request.urgency_level)}
                      </Badge>
                    </div>
                    {request.service_categories && (
                      <Badge variant="outline" className="w-fit">
                        {request.service_categories.name}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <CardDescription className="line-clamp-2">
                      {request.description}
                    </CardDescription>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{request.city}, {request.state}</span>
                      </div>

                      {request.budget_estimate && (
                        <div className="flex items-center gap-2 text-green-600">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-semibold">
                            R$ {request.budget_estimate.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(request.created_at), "d 'de' MMMM", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
