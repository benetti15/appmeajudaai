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

  const getStatusBorderColor = (status: ServiceStatus) => {
    const borderColors: Record<ServiceStatus, string> = {
      'pending': 'border-l-warning',
      'quoted': 'border-l-primary',
      'accepted': 'border-l-success',
      'in_progress': 'border-l-accent',
      'completed': 'border-l-success',
      'cancelled': 'border-l-destructive',
      'disputed': 'border-l-destructive',
    };
    return borderColors[status] || 'border-l-muted';
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
                    className={`
                      group relative overflow-hidden
                      border-l-4 ${getStatusBorderColor(request.status)}
                      transition-all duration-300 ease-out
                      hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1
                      hover:border-l-8
                      cursor-pointer
                    `}
                    onClick={() => navigate(`/service-request/${request.id}`)}
                  >
                    {/* Animated gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    
                    {/* Header */}
                    <CardHeader className="pb-3 relative">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg sm:text-xl mb-3 truncate group-hover:text-primary transition-colors duration-200">
                            {request.title}
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="animate-fade-in">
                              {getStatusBadge(request.status)}
                            </div>
                            <div className="animate-fade-in" style={{ animationDelay: '50ms' }}>
                              {getUrgencyBadge(request.urgency_level)}
                            </div>
                            {request.service_categories && (
                              <Badge 
                                variant="secondary" 
                                className="text-xs animate-fade-in transition-transform duration-200 hover:scale-110"
                                style={{ animationDelay: '100ms' }}
                              >
                                {request.service_categories.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right text-xs text-muted-foreground">
                            <p className="font-medium">Criado em</p>
                            <p className="text-lg font-bold text-foreground">
                              {format(new Date(request.created_at), "dd/MM", { locale: ptBR })}
                            </p>
                          </div>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/service-request/${request.id}`);
                            }}
                            className="gap-1.5 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 group/btn"
                          >
                            <Eye className="w-3.5 h-3.5 group-hover/btn:rotate-12 transition-transform duration-200" />
                            Detalhes
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {/* Body */}
                    <CardContent className="pt-4 space-y-4 relative">
                      <p className="text-sm text-muted-foreground truncate-2 leading-relaxed">
                        {request.description}
                      </p>
                      
                      {/* Key Info - Grid with animations */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="transform transition-all duration-200 hover:scale-105 hover:-translate-y-0.5">
                          <InfoCard 
                            icon={MapPin}
                            label="Localização"
                            value={request.city}
                            iconColor="text-primary"
                            className="h-full hover:bg-muted/70 transition-colors"
                          />
                        </div>
                        
                        {request.budget_estimate && (
                          <div className="col-span-1 sm:col-span-2 flex items-center justify-center sm:justify-start p-3 rounded-lg bg-success/10 hover:bg-success/20 transition-all duration-200 transform hover:scale-105">
                            <PriceTag amount={request.budget_estimate} size="md" />
                          </div>
                        )}
                        
                        {request.preferred_date && !request.budget_estimate && (
                          <div className="transform transition-all duration-200 hover:scale-105 hover:-translate-y-0.5">
                            <InfoCard 
                              icon={Calendar}
                              label="Data Preferida"
                              value={format(new Date(request.preferred_date), "dd/MM/yy", { locale: ptBR })}
                              iconColor="text-accent"
                              className="h-full hover:bg-muted/70 transition-colors"
                            />
                          </div>
                        )}
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
