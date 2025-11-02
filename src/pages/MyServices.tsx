import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceStatusFlow, ExtendedServiceStatus } from "@/components/service-system/ServiceStatusFlow";
import { ArrivalEstimator } from "@/components/service-system/ArrivalEstimator";
import { MutualConfirmation } from "@/components/service-system/MutualConfirmation";
import { ArrowLeft, MessageCircle, CheckCircle, DollarSign, Calendar, User, AlertCircle, Eye, Play, Clock, MapPin, Loader2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AcceptedService {
  id: string;
  title: string;
  client_name: string;
  client_id: string;
  total_amount: number;
  status: ExtendedServiceStatus;
  created_at: string;
  request_id: string;
  estimated_arrival?: number;
  service_request: {
    title: string;
    description: string;
    client_id: string;
  };
  quote_status?: string;
}

const MyServices = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [services, setServices] = useState<AcceptedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingService, setStartingService] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedService, setSelectedService] = useState<AcceptedService | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (profile?.user_type !== "professional") {
      toast({
        title: "Acesso negado",
        description: "Esta página é apenas para profissionais.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    fetchAcceptedServices();
  }, [user, profile]);

  const fetchAcceptedServices = async () => {
    try {
      // Buscar quotes aceitos do profissional
      const { data: quotesData, error: quotesError } = await supabase
        .from("quotes")
        .select("*")
        .eq("professional_id", user?.id)
        .eq("is_accepted", true)
        .order("created_at", { ascending: false });

      if (quotesError) throw quotesError;

      // Para cada quote, buscar detalhes da request e do cliente
      const servicesWithDetails = await Promise.all(
        (quotesData || []).map(async (quote) => {
          const { data: requestData, error: requestError } = await supabase
            .from("service_requests")
            .select(`
              id,
              title, 
              description,
              status,
              client_id,
              profiles!service_requests_client_id_fkey(
                full_name
              )
            `)
            .eq("id", quote.request_id)
            .single();

          if (requestError) {
            console.error("Error fetching request:", requestError);
            return null;
          }

          return {
            id: quote.id,
            title: requestData?.title || "",
            client_name: requestData?.profiles?.full_name || "Cliente",
            client_id: requestData?.client_id || "",
            total_amount: quote.amount || 0,
            status: requestData?.status || "accepted",
            created_at: quote.created_at,
            request_id: quote.request_id,
            service_request: {
              title: requestData?.title || "",
              description: requestData?.description || "",
              client_id: requestData?.client_id || "",
            }
          };
        })
      );

      const validServices = servicesWithDetails.filter(service => service !== null);
      setServices(validServices as any); // Type assertion
    } catch (error) {
      console.error("Error fetching accepted services:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os serviços.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChatWithClient = (requestId: string) => {
    navigate(`/chat/${requestId}`);
  };

  const handleStartService = async (serviceId: string, requestId: string) => {
    // Prevenir múltiplas execuções simultâneas
    if (startingService) {
      toast({
        title: "Aguarde",
        description: "Já há um atendimento sendo iniciado. Aguarde a conclusão.",
        variant: "default",
      });
      return;
    }

    setStartingService(serviceId);
    
    try {
      // Verificar se o serviço ainda está no status correto
      const currentService = services.find(s => s.id === serviceId);
      if (!currentService) {
        throw new Error("Serviço não encontrado");
      }
      
      if (currentService.status !== "accepted") {
        throw new Error("Este serviço não pode mais ser iniciado");
      }

      // Atualizar o status da service_request
      const { error: requestError } = await supabase
        .from("service_requests")
        .update({ 
          status: "in_progress"
        })
        .eq("id", requestId);

      if (requestError) throw requestError;

      // Tentar criar notificação para o cliente (não crítico se falhar)
      try {
        await supabase
          .from("notifications")
          .insert({
            user_id: currentService.client_id,
            title: "Atendimento Iniciado! 🚀",
            message: "Seu profissional está a caminho! Acompanhe o progresso do seu serviço.",
            type: "service_started",
            related_id: requestId
          });
      } catch (notificationError) {
        console.error("Notification error (non-critical):", notificationError);
      }

      // Atualizar o estado local de forma mais segura
      setServices(prev => prev.map(service => 
        service.id === serviceId 
          ? { ...service, status: "in_progress" }
          : service
      ));

      toast({
        title: "Atendimento iniciado! 🎉",
        description: "O cliente foi notificado que você está a caminho.",
      });

      // Navegar para o acompanhamento após feedback
      setTimeout(() => {
        navigate(`/track-request/${requestId}`);
      }, 1500);

    } catch (error) {
      console.error("Error starting service:", error);
      toast({
        title: "Erro ao iniciar atendimento",
        description: error instanceof Error ? error.message : "Não foi possível iniciar o atendimento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setStartingService(null);
    }
  };

  const getStatusBadge = (status: ExtendedServiceStatus) => {
    const statusConfig = {
      accepted: { label: "Aceito", variant: "default" as const, color: "text-green-600" },
      on_way: { label: "A Caminho", variant: "default" as const, color: "text-blue-600" },
      arrived: { label: "Chegou", variant: "default" as const, color: "text-purple-600" },
      in_progress: { label: "Em Andamento", variant: "default" as const, color: "text-orange-600" },
      awaiting_client_confirmation: { label: "Aguardando Confirmação", variant: "default" as const, color: "text-amber-600" },
      payment_confirmed: { label: "Pagamento Confirmado", variant: "default" as const, color: "text-green-600" },
      completed: { label: "Concluído", variant: "default" as const, color: "text-emerald-600" },
      cancelled: { label: "Cancelado", variant: "destructive" as const, color: "text-red-600" },
    };
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.accepted;
  };

  const handleEstimateSet = (serviceId: string, minutes: number) => {
    setServices(prev => prev.map(service => 
      service.id === serviceId 
        ? { ...service, estimated_arrival: minutes, status: 'on_way' as ExtendedServiceStatus }
        : service
    ));
    toast({
      title: "Estimativa definida!",
      description: `${minutes} minutos`,
    });
  };

  const handleProfessionalComplete = (serviceId: string, notes?: string) => {
    setServices(prev => prev.map(service => 
      service.id === serviceId 
        ? { ...service, status: 'awaiting_client_confirmation' as ExtendedServiceStatus }
        : service
    ));
    toast({
      title: "Concluído!",
      description: "Serviço marcado como concluído!",
    });
  };

  const handleClientConfirm = (serviceId: string) => {
    setServices(prev => prev.map(service => 
      service.id === serviceId 
        ? { ...service, status: 'payment_confirmed' as ExtendedServiceStatus }
        : service
    ));
    toast({
      title: "Confirmado!",
      description: "Cliente confirmou conclusão!",
    });
  };

  const handlePaymentConfirm = (serviceId: string) => {
    setServices(prev => prev.map(service => 
      service.id === serviceId 
        ? { ...service, status: 'completed' as ExtendedServiceStatus }
        : service
    ));
    toast({
      title: "Finalizado!", 
      description: "Pagamento confirmado!",
    });
  };

  const filteredServices = services.filter(service => {
    switch (activeTab) {
      case 'pending': return ['accepted', 'on_way', 'arrived'].includes(service.status);
      case 'active': return ['in_progress', 'awaiting_client_confirmation'].includes(service.status);
      case 'completed': return ['completed', 'payment_confirmed'].includes(service.status);
      default: return true;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando serviços...</p>
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
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                Meus Serviços - Fluxo Avançado
              </h1>
              <p className="text-sm text-muted-foreground">Gerenciamento completo com timeline e confirmações</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Tabs for filtering */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Todos ({services.length})</TabsTrigger>
              <TabsTrigger value="pending">Pendentes ({services.filter(s => ['accepted', 'on_way', 'arrived'].includes(s.status)).length})</TabsTrigger>
              <TabsTrigger value="active">Ativos ({services.filter(s => ['in_progress', 'awaiting_client_confirmation'].includes(s.status)).length})</TabsTrigger>
              <TabsTrigger value="completed">Finalizados ({services.filter(s => ['completed', 'payment_confirmed'].includes(s.status)).length})</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Botão Minhas Conversas */}
          <div className="mb-6 flex justify-between">
            <Button 
              onClick={() => navigate('/fluxo-demo')}
              variant="outline"
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Ver Demo Completa
            </Button>
            <Button 
              onClick={() => navigate('/conversations')}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Minhas Conversas
            </Button>
          </div>

          {filteredServices.length === 0 ? (
            <div className="space-y-6">
              <Card className="text-center py-12 border-2 border-dashed">
                <CardContent>
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">
                    {activeTab === 'all' ? 'Nenhum serviço aceito' : 
                     activeTab === 'pending' ? 'Nenhum serviço pendente' :
                     activeTab === 'active' ? 'Nenhum serviço ativo' :
                     'Nenhum serviço finalizado'}
                  </h3>
                  <p className="text-muted-foreground mb-8">
                    {activeTab === 'all' 
                      ? 'Você ainda não aceitou nenhum orçamento.' 
                      : 'Não há serviços nesta categoria no momento.'}
                  </p>

                  {activeTab === 'all' && (
                    <>
                      {/* Como receber mais serviços */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-8 text-left">
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                          <CardHeader>
                            <CardTitle className="text-blue-800 flex items-center gap-2 text-base">
                              <Sparkles className="w-5 h-5" />
                              Como receber mais serviços
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm text-blue-700">
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>Adicione mais especialidades ao seu perfil</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>Expanda sua área de cobertura</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>Melhore sua avaliação média</span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                          <CardHeader>
                            <CardTitle className="text-green-800 flex items-center gap-2 text-base">
                              <AlertCircle className="w-5 h-5" />
                              Dicas para destacar seu perfil
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm text-green-700">
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>Complete sua verificação de identidade</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>Adicione certificações profissionais</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>Responda rápido às mensagens dos clientes</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button 
                          onClick={() => navigate("/available-requests")}
                          size="lg"
                          className="gap-2"
                        >
                          <Eye className="w-5 h-5" />
                          Ver Oportunidades Disponíveis
                        </Button>
                        <Button 
                          onClick={() => navigate("/professional-profile")}
                          variant="outline"
                          size="lg"
                          className="gap-2"
                        >
                          <User className="w-5 h-5" />
                          Melhorar Meu Perfil
                        </Button>
                      </div>
                    </>
                  )}

                  {activeTab !== 'all' && (
                    <Button onClick={() => setActiveTab('all')} variant="outline">
                      Ver Todos os Serviços
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card className="p-4 text-center bg-white/80 backdrop-blur-xl border-0 shadow-lg">
                  <div className="text-2xl font-bold text-primary">{services.length}</div>
                  <div className="text-sm text-gray-600">Total de Serviços</div>
                </Card>
                <Card className="p-4 text-center bg-white/80 backdrop-blur-xl border-0 shadow-lg">
                  <div className="text-2xl font-bold text-green-600">
                    R$ {services.reduce((total, service) => total + service.total_amount, 0).toLocaleString('pt-BR')}
                  </div>
                  <div className="text-sm text-gray-600">Valor Total</div>
                </Card>
                <Card className="p-4 text-center bg-white/80 backdrop-blur-xl border-0 shadow-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {services.filter(s => ['in_progress', 'on_way', 'arrived'].includes(s.status)).length}
                  </div>
                  <div className="text-sm text-gray-600">Em Andamento</div>
                </Card>
                <Card className="p-4 text-center bg-white/80 backdrop-blur-xl border-0 shadow-lg">
                  <div className="text-2xl font-bold text-emerald-600">
                    {services.filter(s => s.status === 'completed').length}
                  </div>
                  <div className="text-sm text-gray-600">Concluídos</div>
                </Card>
              </div>

              {filteredServices.map((service) => {
                const statusBadge = getStatusBadge(service.status);
                return (
                  <Card key={service.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <CardTitle className="text-xl flex items-center gap-2">
                            {service.service_request.title}
                            {selectedService?.id === service.id && (
                              <Badge variant="outline" className="animate-pulse">Expandido</Badge>
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <ServiceStatusFlow currentStatus={service.status} compact={true} />
                            <Badge variant="outline">
                              Aceito em {format(new Date(service.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            R$ {service.total_amount.toLocaleString('pt-BR')}
                          </div>
                          <div className="text-sm text-gray-600">Valor do Serviço</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">{service.service_request.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          <span className="font-medium">Cliente: {service.client_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span>
                            Aceito: {format(new Date(service.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>

                      {/* Enhanced Components Integration */}
                      {service.status === 'accepted' && (
                        <ArrivalEstimator
                          onEstimateSet={(minutes) => handleEstimateSet(service.id, minutes)}
                          currentEstimate={service.estimated_arrival}
                          showEstimate={false}
                        />
                      )}

                      {service.status === 'on_way' && (
                        <ArrivalEstimator
                          onEstimateSet={(minutes) => handleEstimateSet(service.id, minutes)}
                          currentEstimate={service.estimated_arrival}
                          showEstimate={true}
                        />
                      )}

                      {(['in_progress', 'awaiting_client_confirmation', 'payment_confirmed'].includes(service.status)) && (
                        <MutualConfirmation
                          userRole="professional"
                          currentStatus={service.status}
                          onProfessionalComplete={(notes) => handleProfessionalComplete(service.id, notes)}
                          onClientConfirm={() => handleClientConfirm(service.id)}
                          onPaymentConfirm={() => handlePaymentConfirm(service.id)}
                          professionalName="Você"
                          clientName={service.client_name}
                          serviceAmount={service.total_amount}
                          loading={false}
                        />
                      )}

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          <p>Status: <span className={statusBadge.color}>{statusBadge.label}</span></p>
                        </div>
                        
                        <div className="flex gap-2 flex-wrap">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedService(selectedService?.id === service.id ? null : service)}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            {selectedService?.id === service.id ? 'Menos Detalhes' : 'Mais Detalhes'}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/track-request/${service.request_id}`)}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Acompanhar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleChatWithClient(service.request_id)}
                            className="gap-2"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Chat
                          </Button>
                        </div>
                      </div>

                      {/* Enhanced Status Messages */}
                      {service.status === 'accepted' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-blue-800">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Próximos passos:</span>
                          </div>
                          <p className="text-sm text-blue-700 mt-1">
                            Defina uma estimativa de chegada e entre em contato com o cliente para alinhar detalhes.
                          </p>
                        </div>
                      )}

                      {selectedService?.id === service.id && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg animate-fade-in">
                          <h4 className="font-semibold mb-3">Detalhes Expandidos</h4>
                          <ServiceStatusFlow 
                            currentStatus={service.status}
                            showDescription={true}
                            showProgress={true}
                          />
                        </div>
                      )}
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

export default MyServices;