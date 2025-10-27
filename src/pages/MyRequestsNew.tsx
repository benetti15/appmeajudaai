import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { InfoCard } from "@/components/ui/info-card";
import { PriceTag } from "@/components/ui/price-tag";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, MapPin, Plus, Eye, MessageCircle, Star, AlertCircle, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ServiceStatus, SERVICE_STATUS_CONFIG } from "@/components/service-system/ServiceStatusFlow";

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
          service_categories!service_requests_category_id_fkey (name)
        `)
        .eq("client_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests((data || []) as any);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: ServiceStatus) => {
    const statusConfig = SERVICE_STATUS_CONFIG[status];
    const Icon = statusConfig.icon;
    
    return (
      <Badge variant="outline" className={`gap-1.5 ${statusConfig.color} border-current`}>
        <Icon className="w-3 h-3" />
        {statusConfig.label}
      </Badge>
    );
  };

  const getUrgencyBadge = (level: number) => {
    const urgencyConfig = {
      1: { label: "Baixa", variant: "success" as const },
      2: { label: "Média", variant: "warning" as const },
      3: { label: "Alta", variant: "destructive" as const }
    };
    const config = urgencyConfig[level as keyof typeof urgencyConfig] || urgencyConfig[1];
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <AlertCircle className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getActionButton = (request: ServiceRequest) => {
    switch (request.status) {
      case 'pending':
        return (
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate(`/service-request/${request.id}`)}
            className="w-full sm:w-auto gap-2"
          >
            <Eye className="w-4 h-4" />
            Acompanhar Status
          </Button>
        );
        
      case 'quoted':
        return (
          <Button 
            size="lg"
            onClick={() => navigate(`/service-request/${request.id}`)}
            className="w-full sm:w-auto gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Ver Orçamentos
          </Button>
        );
        
      case 'accepted':
      case 'in_progress':
        return (
          <Button 
            size="lg"
            onClick={() => navigate(`/chat/${request.id}`)}
            className="w-full sm:w-auto gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Chat com Profissional
          </Button>
        );
        
      case 'completed':
        return (
          <Button 
            variant="success"
            size="lg"
            onClick={() => navigate(`/service-request/${request.id}`)}
            className="w-full sm:w-auto gap-2"
          >
            <Star className="w-4 h-4" />
            Avaliar Serviço
          </Button>
        );
        
      default:
        return (
          <Button 
            variant="outline"
            size="lg"
            onClick={() => navigate(`/service-request/${request.id}`)}
            className="w-full sm:w-auto gap-2"
          >
            <Eye className="w-4 h-4" />
            Ver Detalhes
          </Button>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-accent animate-spin" 
                 style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-muted-foreground font-medium">Carregando suas solicitações...</p>
        </div>
      </div>
    );
  }

  const statusCounts = requests.reduce((acc, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="bg-background/90 backdrop-blur-md border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  Minhas Solicitações
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Gerencie suas solicitações de serviço
                </p>
              </div>
            </div>
            <Button 
              onClick={() => navigate("/categories")}
              size="lg"
              className="gap-2 shadow-lg hover-lift"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nova Solicitação</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          {requests.length === 0 ? (
            <Card className="text-center py-12 sm:py-20 shadow-lg border-2 border-dashed">
              <CardContent>
                <div className="w-20 h-20 sm:w-28 sm:h-28 mx-auto mb-6 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
                  <Eye className="w-10 h-10 sm:w-14 sm:h-14 text-white" />
                </div>
                <h3 className="text-xl sm:text-3xl font-bold mb-3">Nenhuma solicitação ainda</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-md mx-auto">
                  Comece sua jornada criando sua primeira solicitação de serviço!
                </p>
                <Button 
                  onClick={() => navigate("/categories")}
                  size="xl"
                  className="gap-2 shadow-lg hover-lift"
                >
                  <Plus className="w-6 h-6" />
                  Criar Primeira Solicitação
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Summary Pills - Horizontal Scroll */}
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {Object.entries(statusCounts).map(([status, count]) => {
                  const statusInfo = SERVICE_STATUS_CONFIG[status as ServiceStatus];
                  const Icon = statusInfo.icon;
                  return (
                    <Card 
                      key={status} 
                      className="flex-shrink-0 hover-lift cursor-pointer shadow-card"
                    >
                      <CardContent className="px-6 py-4 flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${statusInfo.color} bg-opacity-10`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold">{count}</p>
                          <p className="text-sm text-muted-foreground whitespace-nowrap">{statusInfo.label}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Request Cards - Optimized Layout */}
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card 
                    key={request.id} 
                    className="hover-lift shadow-card transition-all duration-300 overflow-hidden"
                  >
                    {/* Header */}
                    <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg sm:text-xl mb-3 truncate">{request.title}</CardTitle>
                          <div className="flex flex-wrap items-center gap-2">
                            {getStatusBadge(request.status)}
                            {getUrgencyBadge(request.urgency_level)}
                            {request.service_categories && (
                              <Badge variant="secondary" className="text-xs">
                                {request.service_categories.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <p>Criado em</p>
                          <p className="text-lg font-bold text-foreground">
                            {format(new Date(request.created_at), "dd/MM", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {/* Body */}
                    <CardContent className="pt-4 space-y-4">
                      <p className="text-sm text-muted-foreground truncate-2">
                        {request.description}
                      </p>
                      
                      {/* Key Info - 3 Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <InfoCard 
                          icon={MapPin}
                          label="Localização"
                          value={request.city}
                          iconColor="text-primary"
                        />
                        
                        {request.budget_estimate && (
                          <div className="col-span-1 sm:col-span-2 flex items-center justify-center sm:justify-start p-3 rounded-lg bg-success/10">
                            <PriceTag amount={request.budget_estimate} size="md" />
                          </div>
                        )}
                        
                        {request.preferred_date && !request.budget_estimate && (
                          <InfoCard 
                            icon={Calendar}
                            label="Data Preferida"
                            value={format(new Date(request.preferred_date), "dd/MM/yy", { locale: ptBR })}
                            iconColor="text-accent"
                          />
                        )}
                      </div>

                      {/* Footer - Action Button */}
                      <div className="pt-3 border-t">
                        {getActionButton(request)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyRequestsNew;
