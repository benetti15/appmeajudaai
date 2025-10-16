import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, MapPin, DollarSign, Clock, CheckCircle, AlertCircle, Users, MessageCircle, Bell, Truck, Play, CheckSquare, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ServiceWorkflow } from "@/components/ServiceWorkflow";
import { SupportChat } from "@/components/SupportChat";
import { ClientProgressTracker } from "@/components/ClientProgressTracker";

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
  client_id: string;
  service_categories: { name: string } | null;
}

interface RequestQuote {
  id: string;
  professional_id: string;
  amount: number;
  is_accepted: boolean | null;
  profiles: {
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
  };
}

const TrackRequestDetail = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { requestId } = useParams();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [quotes, setQuotes] = useState<RequestQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'client' | 'professional' | null>(null);
  const [acceptedQuote, setAcceptedQuote] = useState<RequestQuote | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!requestId) {
      navigate("/track-requests");
      return;
    }
    fetchRequestDetail();
    
    // Setup real-time subscription for request updates
    const subscription = supabase
      .channel(`request-${requestId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'service_requests',
        filter: `id=eq.${requestId}`
      }, (payload) => {
        console.log('Request updated:', payload);
        if (payload.new.status !== request?.status) {
          // Show notification for status changes
          showStatusNotification(payload.new.status, payload.old.status);
        }
        fetchRequestDetail();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, navigate, requestId]);

  const fetchRequestDetail = async () => {
    try {
      // Buscar detalhes do pedido
      const { data: requestData, error: requestError } = await supabase
        .from("service_requests")
        .select(`
          *,
          service_categories (name)
        `)
        .eq("id", requestId)
        .single();

      if (requestError) {
        console.error("Erro ao carregar pedido:", requestError);
        navigate("/track-requests");
        return;
      }

      // Determine user role
      const isClient = requestData.client_id === user?.id;
      setUserRole(isClient ? 'client' : 'professional');

      // If not client, check if user is the professional with accepted quote
      if (!isClient) {
        const { data: acceptedQuoteData, error: quoteError } = await supabase
          .from("quotes")
          .select(`
            *,
            profiles!quotes_professional_id_fkey (
              full_name,
              phone,
              avatar_url
            )
          `)
          .eq("request_id", requestId)
          .eq("professional_id", user?.id)
          .eq("is_accepted", true)
          .single();

        if (quoteError || !acceptedQuoteData) {
          navigate("/available-requests");
          return;
        }
        setAcceptedQuote(acceptedQuoteData);
      }

      // Buscar cotações do pedido
      const { data: quotesData, error: quotesError } = await supabase
        .from("quotes")
        .select(`
          *,
          profiles!quotes_professional_id_fkey (
            full_name,
            phone,
            avatar_url
          )
        `)
        .eq("request_id", requestId)
        .order("amount", { ascending: true });

      if (quotesError) throw quotesError;

      const acceptedQuoteFromList = quotesData?.find(q => q.is_accepted === true);
      if (acceptedQuoteFromList) {
        setAcceptedQuote(acceptedQuoteFromList);
      }

      setRequest(requestData);
      setQuotes(quotesData || []);
    } catch (error) {
      console.error("Erro ao carregar detalhes:", error);
    } finally {
      setLoading(false);
    }
  };

  const showStatusNotification = (newStatus: string, oldStatus: string) => {
    const notifications = {
      'heading_to_client': {
        title: '🚀 Profissional a Caminho!',
        message: 'Seu profissional iniciou o atendimento e está se dirigindo ao local.',
        type: 'info'
      },
      'in_progress': {
        title: '🔧 Serviço em Andamento!',
        message: 'O profissional chegou ao local e iniciou o trabalho.',
        type: 'success'
      },
      'awaiting_confirmation': {
        title: '✅ Serviço Concluído!',
        message: 'O profissional finalizou o trabalho. Por favor, confirme a conclusão.',
        type: 'success'
      },
      'completed': {
        title: '🎉 Trabalho Finalizado!',
        message: 'Serviço concluído com sucesso! Avalie o profissional.',
        type: 'success'
      }
    };

    const notification = notifications[newStatus as keyof typeof notifications];
    if (notification) {
      if (notification.type === 'success') {
        toast.success(notification.title, {
          description: notification.message,
          duration: 5000,
        });
      } else {
        toast.info(notification.title, {
          description: notification.message,
          duration: 5000,
        });
      }
    }
  };

  const getStatusInfo = (status: string) => {
    const statusConfig = {
      pending: { 
        label: "Aguardando Profissionais", 
        variant: "secondary" as const,
        progress: 10,
        icon: Clock,
        description: "Seu pedido está sendo divulgado para profissionais"
      },
      quoted: { 
        label: "Recebeu Orçamentos", 
        variant: "default" as const,
        progress: 20,
        icon: DollarSign,
        description: "Você tem orçamentos para analisar"
      },
      heading_to_client: { 
        label: "Profissional a Caminho", 
        variant: "default" as const,
        progress: 50,
        icon: Truck,
        description: "O profissional está se dirigindo ao local"
      },
      in_progress: { 
        label: "Em Andamento", 
        variant: "default" as const,
        progress: 70,
        icon: Play,
        description: "O serviço está sendo executado"
      },
      awaiting_confirmation: { 
        label: "Aguardando Confirmação", 
        variant: "default" as const,
        progress: 85,
        icon: CheckSquare,
        description: "Aguardando confirmação de conclusão"
      },
      awaiting_payment: { 
        label: "Aguardando Pagamento", 
        variant: "default" as const,
        progress: 90,
        icon: CreditCard,
        description: "Aguardando confirmação de pagamento"
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando detalhes...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <Card className="text-center py-12">
          <CardContent>
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Pedido não encontrado</h3>
            <p className="text-muted-foreground mb-6">
              O pedido solicitado não foi encontrado ou você não tem acesso a ele.
            </p>
            <Button onClick={() => navigate("/track-requests")}>
              Voltar aos Meus Pedidos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(request.status);
  const Icon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/track-requests")}
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
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Enhanced Service Workflow - Próximo Passo Destacado */}
          {acceptedQuote && userRole && ['quoted', 'heading_to_client', 'in_progress', 'awaiting_confirmation', 'awaiting_payment', 'completed'].includes(request.status) && (
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-primary">Próximo Passo</CardTitle>
                <CardDescription>
                  {request.status === 'quoted' && userRole === 'professional' && 'Clique em "Iniciar Atendimento" quando estiver a caminho'}
                  {request.status === 'heading_to_client' && userRole === 'professional' && 'Confirme quando chegar ao local'}
                  {request.status === 'in_progress' && userRole === 'professional' && 'Marque como concluído quando terminar o serviço'}
                  {request.status === 'awaiting_confirmation' && userRole === 'client' && 'Confirme se o serviço foi realizado satisfatoriamente'}
                  {request.status === 'awaiting_payment' && userRole === 'client' && 'Confirme o pagamento realizado'}
                  {request.status === 'completed' && userRole === 'client' && 'Avalie o profissional e o serviço prestado'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ServiceWorkflow
                  requestId={requestId!}
                  request={{
                    ...request,
                    professional_id: acceptedQuote.professional_id
                  }}
                  userRole={userRole}
                  onStatusUpdate={fetchRequestDetail}
                />
              </CardContent>
            </Card>
          )}

          {/* Real-time Status Updates for Client */}
          {userRole === 'client' && ['heading_to_client', 'in_progress'].includes(request.status) && (
            <Card className="border-2 border-primary bg-gradient-to-r from-primary/10 to-secondary/10">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="animate-pulse">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-primary">Atendimento Ativo</CardTitle>
                    <CardDescription>
                      {request.status === 'heading_to_client' && 'Seu profissional está a caminho'}
                      {request.status === 'in_progress' && 'Serviço sendo executado no local'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {request.status === 'heading_to_client' && (
                    <>
                      <Truck className="w-8 h-8 text-primary animate-bounce" />
                      <div>
                        <p className="font-medium">Profissional em deslocamento</p>
                        <p className="text-sm text-muted-foreground">
                          O profissional iniciou o atendimento e está se dirigindo ao seu endereço
                        </p>
                      </div>
                    </>
                  )}
                  {request.status === 'in_progress' && (
                    <>
                      <Play className="w-8 h-8 text-green-600 animate-pulse" />
                      <div>
                        <p className="font-medium">Trabalho em andamento</p>
                        <p className="text-sm text-muted-foreground">
                          O profissional chegou ao local e está executando o serviço
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Card */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">{request.title}</CardTitle>
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
                <div className="flex gap-2">
                  <SupportChat 
                    requestId={requestId}
                    issue={`Problema com solicitação: ${request.title}`}
                  />
                  {acceptedQuote && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/chat/${request.id}`)}
                      className="gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat
                    </Button>
                  )}
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
                <Progress value={statusInfo.progress} className="h-3" />
                <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <h4 className="font-medium">Descrição do Serviço</h4>
                <p className="text-muted-foreground">{request.description}</p>
              </div>

              {/* Informações do Pedido */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Localização</p>
                    <p className="text-sm text-muted-foreground">{request.city}, {request.state}</p>
                  </div>
                </div>
                
                {request.budget_estimate && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Orçamento Estimado</p>
                      <p className="text-sm text-muted-foreground">
                        R$ {request.budget_estimate.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )}
                
                {request.preferred_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Data Preferida</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(request.preferred_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium">Urgência</p>
                    <p className="text-sm text-muted-foreground">
                      {request.urgency_level === 1 ? "Baixa" : 
                       request.urgency_level === 2 ? "Média" : "Alta"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Progress Tracker */}
          {userRole === 'client' && acceptedQuote && (
            <ClientProgressTracker 
              requestId={requestId!}
              currentStatus={request.status}
              professionalId={acceptedQuote.professional_id}
              userRole={userRole}
            />
          )}

          {/* Orçamentos Card - Only show for clients */}
          {userRole === 'client' && (
            <Card>
              <CardHeader>
                <CardTitle>Orçamentos Recebidos ({quotes.length})</CardTitle>
                <CardDescription>
                  {quotes.length === 0 
                    ? "Ainda não há orçamentos para este pedido."
                    : acceptedQuote
                    ? "Orçamento aceito - serviço em andamento."
                    : "Analise os orçamentos recebidos e escolha o melhor para você."
                  }
                </CardDescription>
              </CardHeader>
            
            <CardContent>
              {quotes.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Aguardando orçamentos de profissionais...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quotes.map((quote) => (
                    <div key={quote.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h4 className="font-semibold">
                            {quote.profiles.full_name}
                          </h4>
                          <Badge variant={quote.is_accepted === true ? 'default' : 'secondary'}>
                            {quote.is_accepted === null ? 'Pendente' : 
                             quote.is_accepted ? 'Aceito' : 'Rejeitado'}
                          </Badge>
                          {quote.profiles.phone && (
                            <p className="text-sm text-muted-foreground">
                              Tel: {quote.profiles.phone}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            R$ {quote.amount.toLocaleString('pt-BR')}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => navigate(`/professional-profile/${quote.professional_id}`)}
                            >
                              Ver Perfil
                            </Button>
                            {userRole === 'client' && !acceptedQuote && (
                              <Button 
                                size="sm"
                                onClick={() => navigate(`/chat/${request.id}`)}
                              >
                                Conversar
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default TrackRequestDetail;