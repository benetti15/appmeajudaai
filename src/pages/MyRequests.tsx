import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, MapPin, DollarSign, Clock, Eye, CheckCircle, CreditCard, Star } from "lucide-react";
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

const MyRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchRequests();
  }, [user, navigate]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("service_requests")
        .select(`
          *,
          service_categories!service_requests_category_id_fkey (name)
        `)
        .eq("client_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", variant: "secondary" as const },
      quoted: { label: "Com Orçamentos", variant: "default" as const },
      heading_to_client: { label: "Profissional a Caminho", variant: "default" as const },
      in_progress: { label: "Em Andamento", variant: "default" as const },
      awaiting_confirmation: { label: "Aguardando Confirmação", variant: "default" as const },
      awaiting_payment: { label: "Aguardando Pagamento", variant: "default" as const },
      completed: { label: "Concluído", variant: "default" as const },
      cancelled: { label: "Cancelado", variant: "destructive" as const },
    };
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  const getActionButton = (request: ServiceRequest) => {
    switch (request.status) {
      case 'in_progress':
      case 'awaiting_confirmation':
        return (
          <Button 
            variant="default" 
            size="sm"
            onClick={() => navigate(`/track-request/${request.id}`)}
            className="gap-1"
          >
            <CheckCircle className="w-3 h-3" />
            Confirmar Serviço
          </Button>
        );
      case 'awaiting_payment':
        return (
          <Button 
            variant="default" 
            size="sm"
            onClick={() => navigate(`/track-request/${request.id}`)}
            className="gap-1"
          >
            <CreditCard className="w-3 h-3" />
            Confirmar Pagamento
          </Button>
        );
      case 'completed':
        return (
          <Button 
            variant="default" 
            size="sm"
            onClick={() => navigate(`/track-request/${request.id}`)}
            className="gap-1"
          >
            <Star className="w-3 h-3" />
            Avaliar Profissional
          </Button>
        );
      default:
        return (
          <Button 
            variant="default" 
            size="sm"
            onClick={() => navigate(`/track-request/${request.id}`)}
            className="gap-1"
          >
            <Clock className="w-3 h-3" />
            Acompanhar
          </Button>
        );
    }
  };

  const getUrgencyColor = (level: number) => {
    if (level >= 3) return "text-destructive";
    if (level === 2) return "text-amber-600";
    return "text-muted-foreground";
  };

  if (loading) {
    return <LoadingSpinner message="Carregando suas solicitações..." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 pb-20 md:pb-0">
      {/* Header - Mobile optimized */}
      <header className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center gap-3 md:gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/")}
              className="gap-1.5 h-9 px-2.5 md:px-3"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
            <h1 className="text-lg md:text-2xl font-bold text-primary truncate">Minhas Solicitações</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="max-w-4xl mx-auto">
          {requests.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Eye className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Nenhum pedido encontrado</h3>
                <p className="text-muted-foreground mb-6">
                  Você ainda não fez nenhum pedido de serviço.
                </p>
                <Button onClick={() => navigate("/categories")}>
                  + Nova Solicitação
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 md:space-y-6">
              {requests.map((request) => {
                const statusBadge = getStatusBadge(request.status);
                return (
                  <Card key={request.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary">
                    <CardHeader className="p-3 md:p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 md:gap-4">
                        <div className="space-y-2 w-full">
                          <CardTitle className="text-base md:text-xl line-clamp-2">{request.title}</CardTitle>
                          <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                            <Badge variant={statusBadge.variant} className="text-xs">
                              {statusBadge.label}
                            </Badge>
                            {request.service_categories && (
                              <Badge variant="outline" className="text-xs">
                                {request.service_categories.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-left sm:text-right text-xs text-muted-foreground">
                          <p>Criado em</p>
                          <p className="font-medium text-sm">
                            {format(new Date(request.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 md:space-y-4 p-3 md:p-6 pt-0">
                      <p className="text-muted-foreground line-clamp-2 text-sm">{request.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 text-xs md:text-sm">
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary flex-shrink-0" />
                          <span className="truncate">{request.city}, {request.state}</span>
                        </div>
                        
                        {request.budget_estimate && (
                          <div className="flex items-center gap-1.5 md:gap-2">
                            <DollarSign className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-600 flex-shrink-0" />
                            <span className="truncate">
                              R$ {request.budget_estimate.toLocaleString('pt-BR')}
                            </span>
                          </div>
                        )}
                        
                        {request.preferred_date && (
                          <div className="flex items-center gap-1.5 md:gap-2">
                            <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600 flex-shrink-0" />
                            <span className="truncate">
                              {format(new Date(request.preferred_date), "dd/MM", { locale: ptBR })}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 md:pt-4 border-t gap-3">
                        <div className="flex items-center gap-2">
                          <Clock className={`w-3.5 h-3.5 md:w-4 md:h-4 ${getUrgencyColor(request.urgency_level)}`} />
                          <span className="text-xs md:text-sm">
                            Urgência: {request.urgency_level === 1 ? "Baixa" : 
                                     request.urgency_level === 2 ? "Média" : "Alta"}
                          </span>
                        </div>
                        
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/request-details/${request.id}`)}
                            className="flex-1 sm:flex-none text-xs h-8"
                          >
                            Detalhes
                          </Button>
                          {getActionButton(request)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyRequests;