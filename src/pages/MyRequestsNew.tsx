import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, MapPin, Plus, Eye, MessageCircle, Star } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ServiceStatusFlow, ServiceStatus, SERVICE_STATUS_CONFIG } from "@/components/service-system/ServiceStatusFlow";

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  status: ServiceStatus;
  budget_estimate: number | null;
  address: string;
  city: string;
  state: string;
  created_at: string;
  preferred_date: string | null;
  urgency_level: number;
  service_categories: { name: string } | null;
}

const MyRequestsNew = () => {
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

  const getUrgencyInfo = (level: number) => {
    const urgencyConfig = {
      1: { label: "Baixa", color: "text-green-600" },
      2: { label: "Média", color: "text-yellow-600" }, 
      3: { label: "Alta", color: "text-red-600" }
    };
    return urgencyConfig[level as keyof typeof urgencyConfig] || urgencyConfig[1];
  };

  const getActionButton = (request: ServiceRequest) => {
    const statusConfig = SERVICE_STATUS_CONFIG[request.status];
    
    switch (request.status) {
      case 'pending':
        return (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/service-request/${request.id}`)}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Acompanhar
          </Button>
        );
        
      case 'quoted':
        return (
          <Button 
            size="sm"
            onClick={() => navigate(`/service-request/${request.id}`)}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Ver Orçamentos
          </Button>
        );
        
      case 'accepted':
      case 'in_progress':
        return (
          <div className="flex gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigate(`/chat/${request.id}`)}
              className="gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </Button>
            <Button 
              size="sm"
              onClick={() => navigate(`/service-request/${request.id}`)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Acompanhar
            </Button>
          </div>
        );
        
      case 'completed':
        return (
          <div className="flex gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigate(`/service-request/${request.id}`)}
              className="gap-2"
            >
              <Star className="w-4 h-4" />
              Avaliar
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigate(`/service-request/${request.id}`)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Ver Detalhes
            </Button>
          </div>
        );
        
      default:
        return (
          <Button 
            variant="outline"
            size="sm"
            onClick={() => navigate(`/service-request/${request.id}`)}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Ver Detalhes
          </Button>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando suas solicitações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Início
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-primary">Minhas Solicitações</h1>
                <p className="text-sm text-muted-foreground">
                  Acompanhe suas solicitações de serviço
                </p>
              </div>
            </div>
            <Button 
              onClick={() => navigate("/categories")}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Solicitação
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {requests.length === 0 ? (
            <Card className="text-center py-16">
              <CardContent>
                <div className="w-24 h-24 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                  <Eye className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">Nenhuma solicitação ainda</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Você ainda não criou nenhuma solicitação de serviço. 
                  Comece criando seu primeiro pedido!
                </p>
                <Button 
                  onClick={() => navigate("/categories")}
                  size="lg"
                  className="gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Criar Primeiro Pedido
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(
                  requests.reduce((acc, req) => {
                    acc[req.status] = (acc[req.status] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([status, count]) => {
                  const statusInfo = SERVICE_STATUS_CONFIG[status as ServiceStatus];
                  return (
                    <Card key={status} className="text-center">
                      <CardContent className="p-4">
                        <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${statusInfo.color}`}>
                          <statusInfo.icon className="w-4 h-4" />
                        </div>
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-xs text-muted-foreground">{statusInfo.label}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Request List */}
              <div className="space-y-4">
                {requests.map((request) => {
                  const urgencyInfo = getUrgencyInfo(request.urgency_level);
                  
                  return (
                    <Card key={request.id} className="hover:shadow-lg transition-all duration-200">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg mb-2 line-clamp-1">{request.title}</CardTitle>
                            <div className="flex items-center gap-2 flex-wrap">
                              <ServiceStatusFlow 
                                currentStatus={request.status} 
                                compact 
                                showDescription={false}
                                showProgress={false}
                              />
                              {request.service_categories && (
                                <Badge variant="outline" className="text-xs">
                                  {request.service_categories.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground flex-shrink-0">
                            <p className="text-xs">Criado em</p>
                            <p className="font-medium">
                              {format(new Date(request.created_at), "dd/MM", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0 space-y-4">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {request.description}
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                            <span className="truncate">{request.city}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${urgencyInfo.color.replace('text-', 'bg-')}`} />
                            <span>Urgência {urgencyInfo.label}</span>
                          </div>
                          
                          {request.budget_estimate && (
                            <div className="flex items-center gap-1">
                              <span className="text-green-600">💰</span>
                              <span>R$ {request.budget_estimate.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                            </div>
                          )}
                          
                          {request.preferred_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-blue-600 flex-shrink-0" />
                              <span>{format(new Date(request.preferred_date), "dd/MM", { locale: ptBR })}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t">
                          <ServiceStatusFlow 
                            currentStatus={request.status} 
                            showDescription={false}
                            showProgress={true}
                            compact={true}
                          />
                          
                          <div className="flex gap-2">
                            {getActionButton(request)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyRequestsNew;