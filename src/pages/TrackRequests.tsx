import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, MapPin, DollarSign, Clock, Eye, CheckCircle, AlertCircle, Users } from "lucide-react";
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

interface RequestQuote {
  id: string;
  professional_id: string;
  amount: number;
  is_accepted: boolean | null;
  profiles: {
    full_name: string;
  };
}

const TrackRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [quotes, setQuotes] = useState<Record<string, RequestQuote[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchRequestsWithProgress();
  }, [user, navigate]);

  const fetchRequestsWithProgress = async () => {
    try {
      // Buscar pedidos do usuário
      const { data: requestsData, error: requestsError } = await supabase
        .from("service_requests")
        .select(`
          *,
          service_categories (name)
        `)
        .eq("client_id", user?.id)
        .order("created_at", { ascending: false });

      if (requestsError) throw requestsError;

      // Buscar cotações para cada pedido
      const quotesData: Record<string, RequestQuote[]> = {};
      if (requestsData) {
        for (const request of requestsData) {
          const { data: requestQuotes, error: quotesError } = await supabase
            .from("quotes")
            .select(`
              *,
              profiles!quotes_professional_id_fkey (
                full_name
              )
            `)
            .eq("request_id", request.id);

          if (!quotesError && requestQuotes) {
            quotesData[request.id] = requestQuotes;
          }
        }
      }

      setRequests(requestsData || []);
      setQuotes(quotesData);
    } catch (error) {
      console.error("Erro ao carregar progresso:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusConfig = {
      pending: { 
        label: "Aguardando Profissionais", 
        variant: "secondary" as const,
        progress: 25,
        icon: Clock,
        description: "Seu pedido está sendo divulgado para profissionais"
      },
      quoted: { 
        label: "Recebeu Orçamentos", 
        variant: "default" as const,
        progress: 50,
        icon: DollarSign,
        description: "Você tem orçamentos para analisar"
      },
      in_progress: { 
        label: "Em Andamento", 
        variant: "default" as const,
        progress: 75,
        icon: Users,
        description: "O serviço está sendo executado"
      },
      completed: { 
        label: "Concluído", 
        variant: "default" as const,
        progress: 100,
        icon: CheckCircle,
        description: "Serviço finalizado com sucesso"
      },
      cancelled: { 
        label: "Cancelado", 
        variant: "destructive" as const,
        progress: 0,
        icon: AlertCircle,
        description: "Este pedido foi cancelado"
      },
    };
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  const getProgressSteps = (status: string) => {
    const steps = [
      { key: "pending", label: "Pedido Criado" },
      { key: "quoted", label: "Orçamentos Recebidos" },
      { key: "in_progress", label: "Em Execução" },
      { key: "completed", label: "Finalizado" }
    ];

    const statusOrder = ["pending", "quoted", "in_progress", "completed"];
    const currentIndex = statusOrder.indexOf(status);
    
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando progresso...</p>
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
            <h1 className="text-2xl font-bold text-primary">Acompanhar Progresso</h1>
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
                  Criar Primeiro Pedido
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {requests.map((request) => {
                const statusInfo = getStatusInfo(request.status);
                const Icon = statusInfo.icon;
                const requestQuotes = quotes[request.id] || [];
                const progressSteps = getProgressSteps(request.status);

                return (
                  <Card key={request.id} className="border-l-4 border-l-primary">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <CardTitle className="text-xl">{request.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant={statusInfo.variant} className="gap-1">
                              <Icon className="w-3 h-3" />
                              {statusInfo.label}
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
                    
                    <CardContent className="space-y-6">
                      {/* Barra de Progresso */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Progresso do Pedido</h4>
                          <span className="text-sm text-muted-foreground">{statusInfo.progress}%</span>
                        </div>
                        <Progress value={statusInfo.progress} className="h-2" />
                        <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
                      </div>

                      {/* Timeline de Etapas */}
                      <div className="space-y-3">
                        <h4 className="font-medium">Etapas do Processo</h4>
                        <div className="space-y-2">
                          {progressSteps.map((step, index) => (
                            <div key={step.key} className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                step.completed 
                                  ? "bg-primary text-primary-foreground" 
                                  : step.current
                                  ? "bg-primary/20 border-2 border-primary"
                                  : "bg-muted"
                              }`}>
                                {step.completed && <CheckCircle className="w-2 h-2" />}
                              </div>
                              <span className={`text-sm ${
                                step.completed || step.current 
                                  ? "text-foreground font-medium" 
                                  : "text-muted-foreground"
                              }`}>
                                {step.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Informações do Pedido */}
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

                      {/* Orçamentos Recebidos */}
                      {requestQuotes.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium">Orçamentos Recebidos ({requestQuotes.length})</h4>
                          <div className="space-y-2">
                            {requestQuotes.slice(0, 3).map((quote) => (
                              <div key={quote.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                <div>
                              <p className="font-medium">
                                {quote.profiles.full_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Status: {quote.is_accepted === null ? 'Pendente' : quote.is_accepted ? 'Aceito' : 'Rejeitado'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">R$ {quote.amount.toLocaleString('pt-BR')}</p>
                                </div>
                              </div>
                            ))}
                            {requestQuotes.length > 3 && (
                              <p className="text-sm text-muted-foreground text-center">
                                E mais {requestQuotes.length - 3} orçamento(s)...
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Ações */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/request-details/${request.id}`)}
                        >
                          Ver Detalhes Completos
                        </Button>
                        {requestQuotes.length > 0 && (
                          <Button 
                            size="sm"
                            onClick={() => navigate(`/request-details/${request.id}`)}
                          >
                            Ver Orçamentos
                          </Button>
                        )}
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

export default TrackRequests;