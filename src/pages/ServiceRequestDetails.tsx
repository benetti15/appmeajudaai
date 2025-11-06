import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Home, 
  MapPin, 
  Calendar, 
  Clock, 
  User,
  AlertCircle,
  DollarSign,
  MessageCircle,
  Star
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ServiceStatus, ExtendedServiceStatus } from "@/components/service-system/ServiceStatusFlow";
import { EnhancedServiceTimeline } from "@/components/service-system/EnhancedServiceTimeline";
import { MutualConfirmation } from "@/components/service-system/MutualConfirmation";
import { QuoteManager } from "@/components/service-system/QuoteManager";
import { QuoteCreationModal } from "@/components/service-system/QuoteCreationModal";
import { UrgencyBadge } from "@/components/service-system/UrgencyBadge";
import { ServiceAttachments } from "@/components/service-system/ServiceAttachments";
import { EnhancedServiceActions } from "@/components/service-system/EnhancedServiceActions";
import { ProfessionalStatusCard } from "@/components/service-system/ProfessionalStatusCard";
import { IntegratedReviewSystem } from "@/components/IntegratedReviewSystem";
import { LiveTrackingMap } from "@/components/service-system/LiveTrackingMap";
import { TemporarySupportSystem } from "@/components/TemporarySupportSystem";
import { AutoLocationSharing } from "@/components/service-system/AutoLocationSharing";

// Wrapper component to check if tracking is active
function LiveTrackingMapWrapper({ 
  requestId, 
  clientLatitude, 
  clientLongitude, 
  clientAddress 
}: {
  requestId: string;
  clientLatitude: number;
  clientLongitude: number;
  clientAddress: string;
}) {
  const [hasActiveTracking, setHasActiveTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkTracking = async () => {
      console.log('🗺️ LiveTrackingMapWrapper - Checking for active tracking:', requestId);
      
      const { data, error } = await supabase
        .from('professional_live_location')
        .select('id')
        .eq('request_id', requestId)
        .maybeSingle();
      
      if (error) {
        console.error('❌ Error checking tracking:', error);
      }
      
      console.log('🗺️ Tracking data found:', !!data, data);
      setHasActiveTracking(!!data && !error);
      setIsLoading(false);
    };

    checkTracking();

    // Subscribe to changes
    const channel = supabase
      .channel(`tracking-check-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'professional_live_location',
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          setHasActiveTracking(payload.eventType !== 'DELETE');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Verificando localização do profissional...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!hasActiveTracking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Rastreamento em Tempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            O profissional ainda não iniciou o deslocamento. O mapa aparecerá quando ele estiver a caminho.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <LiveTrackingMap
      requestId={requestId}
      clientLatitude={clientLatitude}
      clientLongitude={clientLongitude}
      clientAddress={clientAddress}
    />
  );
}

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  budget_estimate?: number;
  urgency_level: number;
  preferred_date?: string;
  status: ServiceStatus;
  extended_status?: ExtendedServiceStatus;
  created_at: string;
  client_id: string;
  category_id?: string;
  completion_notes?: string;
  service_categories?: {
    name: string;
  };
  client_profile?: {
    full_name: string;
    phone?: string;
  };
}

interface Professional {
  id: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
}

export default function ServiceRequestDetails() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [optimisticStatus, setOptimisticStatus] = useState<ExtendedServiceStatus | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchRequestDetails();
  }, [user, requestId, navigate]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch request details
      const { data: requestData, error: requestError } = await supabase
        .from("service_requests")
        .select(`
          *,
          service_categories!service_requests_category_id_fkey (name),
          client_profile:profiles!service_requests_client_id_fkey (
            full_name,
            phone
          )
        `)
        .eq("id", requestId)
        .maybeSingle();

      if (requestError) throw requestError;
      if (!requestData) {
        setError("Solicitação não encontrada. Você pode não ter permissão para acessá-la.");
        setLoading(false);
        return;
      }

      setRequest(requestData as any); // Type assertion

      // If there's an accepted quote, fetch professional info
      if (['accepted', 'in_progress', 'completed'].includes(requestData.status)) {
        const { data: acceptedQuote } = await supabase
          .from("quotes")
          .select(`
            professional_id,
            profiles:professional_id (
              full_name,
              phone,
              avatar_url
            )
          `)
          .eq("request_id", requestId)
          .eq("is_accepted", true)
          .maybeSingle();

        if (acceptedQuote?.profiles) {
          setProfessional({
            id: acceptedQuote.professional_id,
            ...acceptedQuote.profiles
          });
        }
      }

    } catch (error: any) {
      console.error("Error fetching request details:", error);
      setError(error.message || "Erro ao carregar detalhes da solicitação");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = () => {
    fetchRequestDetails();
  };

  const handleOptimisticStatusChange = (status: ExtendedServiceStatus | null) => {
    setOptimisticStatus(status);
    
    // Se há um status otimista, não fazer reload da página ainda
    if (!status) {
      // Limpo o status otimista, agora posso fazer reload
      fetchRequestDetails();
    }
  };

  const handleProfessionalComplete = (notes?: string) => {
    // Mock functionality for professional completion
    setOptimisticStatus('awaiting_client_confirmation');
    console.log('Professional completed with notes:', notes);
    // In real app, this would call API
    setTimeout(() => {
      setOptimisticStatus(null);
      // Simulate status update - using 'completed' for now since it's a valid ServiceStatus
      if (request) {
        setRequest({...request, status: 'completed' as ServiceStatus});
      }
    }, 2000);
  };

  const handleClientConfirm = () => {
    // Mock functionality for client confirmation
    setOptimisticStatus('payment_confirmed');
    console.log('Client confirmed completion');
    // In real app, this would call API
    setTimeout(() => {
      setOptimisticStatus(null);
      // Simulate status update
      if (request) {
        setRequest({...request, status: 'completed' as ServiceStatus});
      }
    }, 2000);
  };

  const handlePaymentConfirm = () => {
    // Mock functionality for payment confirmation
    setOptimisticStatus('completed');
    console.log('Payment confirmed');
    // In real app, this would call API
    setTimeout(() => {
      setOptimisticStatus(null);
      // Simulate status update
      if (request) {
        setRequest({...request, status: 'completed' as ServiceStatus});
      }
    }, 2000);
  };

  const getUserRole = (): 'client' | 'professional' => {
    if (request?.client_id === user?.id) return 'client';
    return 'professional';
  };

  const getUrgencyInfo = (level: number) => {
    const urgencyConfig = {
      1: { label: "Baixa", color: "text-green-600" },
      2: { label: "Média", color: "text-yellow-600" }, 
      3: { label: "Alta", color: "text-red-600" }
    };
    return urgencyConfig[level as keyof typeof urgencyConfig] || urgencyConfig[1];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando detalhes do serviço...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-primary/5 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-xl font-semibold mb-2">Erro ao Carregar</h3>
            <p className="text-muted-foreground mb-4">
              {error || "Solicitação não encontrada"}
            </p>
            <Button onClick={() => navigate("/")} className="w-full">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userRole = getUserRole();
  const urgencyInfo = getUrgencyInfo(request.urgency_level);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-primary/5">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="h-8 w-8 p-0 sm:h-10 sm:w-auto sm:px-3">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Voltar</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/")} className="h-8 w-8 p-0 sm:h-10 sm:w-auto sm:px-3">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Início</span>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-foreground truncate">Detalhes do Serviço</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {userRole === 'client' ? 'Sua solicitação' : 'Oportunidade de serviço'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Request Details */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            {/* Quote Creation Button - Highlighted at top for Professionals */}
            {userRole === 'professional' && request.status === 'pending' && (
              <Card className="border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-green-800 flex items-center gap-2 text-sm sm:text-base">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                    <span className="truncate">Oportunidade de Negócio</span>
                  </CardTitle>
                  <p className="text-green-700 text-xs sm:text-sm">
                    Este cliente está procurando um profissional. Envie seu orçamento agora!
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <QuoteCreationModal
                    requestId={request.id}
                    clientId={request.client_id}
                    requestTitle={request.title}
                    onQuoteSubmitted={handleStatusUpdate}
                  />
                </CardContent>
              </Card>
            )}

            {/* Chat Button - Prominently displayed for both users */}
            {(professional || userRole === 'professional') && (
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                <CardContent className="p-3 sm:p-4">
                  <Button 
                    className="w-full gap-2 sm:gap-3 h-10 sm:h-12 text-sm sm:text-base font-medium"
                    onClick={() => navigate(`/chat/${request.id}`)}
                  >
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="truncate">Conversar com {userRole === 'client' ? 'Profissional' : 'Cliente'}</span>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Auto Location Sharing - For professionals on active service */}
            {userRole === 'professional' && user?.id && (
              <AutoLocationSharing
                requestId={request.id}
                professionalId={user.id}
                status={(request.extended_status || request.status) as string}
                isActive={
                  request.extended_status === 'on_way' || 
                  request.extended_status === 'arrived' ||
                  request.extended_status === 'in_progress' ||
                  request.status === 'accepted' ||
                  request.status === 'in_progress'
                }
              />
            )}
            
            {/* Status e Próxima Ação (apenas para profissional) */}
            {userRole === 'professional' && (
              <ProfessionalStatusCard
                currentStatus={(optimisticStatus || request.extended_status || request.status) as ExtendedServiceStatus}
                requestTitle={request.title}
                clientName={request.client_profile?.full_name}
                budgetEstimate={request.budget_estimate}
                preferredDate={request.preferred_date}
                urgencyLevel={request.urgency_level}
                optimisticStatus={optimisticStatus}
              />
            )}

            {/* Quote Manager */}
            <QuoteManager
              requestId={request.id}
              clientId={request.client_id}
              currentStatus={request.status}
              userRole={userRole}
              onQuoteAccepted={handleStatusUpdate}
            />

            {/* Enhanced Service Details with Attachments */}
            <ServiceAttachments
              title={request.title}
              description={request.description}
              preferredDate={request.preferred_date ? format(new Date(request.preferred_date), "dd/MM/yyyy", { locale: ptBR }) : undefined}
              preferredTime={request.preferred_date ? format(new Date(request.preferred_date), "HH:mm", { locale: ptBR }) : undefined}
              hasTimeFlexibility={request.urgency_level <= 2}
              category={request.service_categories?.name}
              address={request.address}
              city={request.city}
              state={request.state}
              budgetEstimate={request.budget_estimate}
              urgencyLevel={request.urgency_level}
              attachments={[
                // Mock attachments - replace with real data from database
                {
                  id: '1',
                  name: 'foto-problema.jpg',
                  type: 'image',
                  url: '/lovable-uploads/a2395b76-67d3-4ddf-917d-20d3727d187d.png',
                  size: '2.1 MB',
                  uploadedAt: '2 horas atrás'
                },
                {
                  id: '2', 
                  name: 'manual-equipamento.pdf',
                  type: 'document',
                  url: '#',
                  size: '890 KB',
                  uploadedAt: '1 dia atrás'
                }
              ]}
            />

            {/* GPS Tracking Map - Show for client when professional is sharing location */}
            {userRole === 'client' && 
             request.latitude && 
             request.longitude && (
              <LiveTrackingMapWrapper
                requestId={request.id}
                clientLatitude={Number(request.latitude)}
                clientLongitude={Number(request.longitude)}
                clientAddress={`${request.address}, ${request.city} - ${request.state}`}
              />
            )}

            {/* Enhanced Unified Timeline - Replaces both timelines */}
            <EnhancedServiceTimeline
              requestId={request.id}
              currentStatus={(optimisticStatus || request.extended_status || request.status) as ExtendedServiceStatus}
              userRole={userRole}
            />

            {/* Mutual Confirmation */}
            {(['in_progress', 'awaiting_client_confirmation', 'payment_confirmed'].includes(
              optimisticStatus || request.extended_status || request.status
            )) && (
              <MutualConfirmation
                userRole={userRole}
                currentStatus={(optimisticStatus || request.extended_status || request.status) as ExtendedServiceStatus}
                onProfessionalComplete={handleProfessionalComplete}
                onClientConfirm={handleClientConfirm}
                onPaymentConfirm={handlePaymentConfirm}
                professionalName={professional?.full_name}
                clientName={request.client_profile?.full_name}
                serviceAmount={request.budget_estimate || undefined}
                loading={!!optimisticStatus}
              />
            )}

            {/* Review System - Show when service is completed */}
            {request.status === 'completed' && (
              <>
                {userRole === 'client' && professional && (
                  <IntegratedReviewSystem
                    professionalId={professional.id}
                    requestId={request.id}
                    canReview={true}
                    showFilters={false}
                    mandatoryReview={false}
                  />
                )}
                
                {userRole === 'professional' && (
                  <Card className="border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-primary" />
                        Avaliação do Serviço
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                          <p className="text-sm text-muted-foreground">
                            Aguardando avaliação do cliente
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            O cliente poderá avaliar o serviço e deixar um comentário sobre sua experiência
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full gap-2"
                          onClick={() => navigate(`/professional-profile/${user?.id}`)}
                        >
                          <Star className="w-4 h-4" />
                          Ver Minhas Avaliações
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>

          {/* Right Column - Actions & Extra Features */}
          <div className="space-y-4 sm:space-y-6">
            <EnhancedServiceActions
              requestId={request.id}
              currentStatus={(request.extended_status || request.status) as ExtendedServiceStatus}
              userRole={userRole}
              professionalInfo={professional || undefined}
              clientInfo={userRole === 'professional' && request.client_profile ? {
                id: request.client_id,
                ...request.client_profile
              } : undefined}
              onStatusUpdate={handleStatusUpdate}
              onOptimisticStatusChange={handleOptimisticStatusChange}
            />

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {userRole === 'professional' && request.status === 'pending' && (
                  <QuoteCreationModal
                    requestId={request.id}
                    clientId={request.client_id}
                    requestTitle={request.title}
                    onQuoteSubmitted={handleStatusUpdate}
                    trigger={
                      <Button variant="outline" className="w-full gap-2 h-9 text-sm">
                        <DollarSign className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">Editar Orçamento</span>
                      </Button>
                    }
                  />
                )}
                
                <TemporarySupportSystem 
                  requestId={request.id}
                  requestTitle={request.title}
                  currentStatus={request.status}
                />
              </CardContent>
            </Card>

            {/* Professional Rating */}
            {professional && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Profissional</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <p className="font-medium text-sm truncate">{professional.full_name}</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                      <Star className="w-4 h-4 fill-gray-300 text-gray-300 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground ml-1">(4.2)</span>
                    </div>
                    <p className="text-xs text-muted-foreground">127 serviços realizados</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2 h-8 text-xs"
                      onClick={() => navigate(`/professional-profile/${professional.id}`)}
                    >
                      <span className="truncate">Ver Perfil Completo</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}