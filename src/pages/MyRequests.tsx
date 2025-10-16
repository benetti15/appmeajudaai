import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
          service_categories (name)
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-primary">Minhas Solicitações</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
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
            <div className="space-y-6">
              {requests.map((request) => {
                const statusBadge = getStatusBadge(request.status);
                return (
                  <Card key={request.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <CardTitle className="text-xl">{request.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant={statusBadge.variant}>
                              {statusBadge.label}
                            </Badge>
                            {request.service_categories && (
                              <Badge variant="outline">
                                {request.service_categories.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p>Criado em</p>
                          <p className="font-medium">
                            {format(new Date(request.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground line-clamp-2">{request.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span>{request.city}, {request.state}</span>
                        </div>
                        
                        {request.budget_estimate && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span>
                              Orçamento: R$ {request.budget_estimate.toLocaleString('pt-BR')}
                            </span>
                          </div>
                        )}
                        
                        {request.preferred_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span>
                              {format(new Date(request.preferred_date), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <Clock className={`w-4 h-4 ${getUrgencyColor(request.urgency_level)}`} />
                          <span className="text-sm">
                            Urgência: {request.urgency_level === 1 ? "Baixa" : 
                                     request.urgency_level === 2 ? "Média" : "Alta"}
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/request-details/${request.id}`)}
                          >
                            Ver Detalhes
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