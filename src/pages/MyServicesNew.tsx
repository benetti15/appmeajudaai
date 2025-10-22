import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  MessageCircle, 
  Star, 
  User, 
  Play,
  CheckCircle,
  Briefcase,
  Search,
  DollarSign,
  Eye
} from "lucide-react";
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
  client_profile?: {
    full_name: string;
    phone?: string;
  };
  accepted_quote?: {
    id: string;
    amount: number;
    description: string;
  };
}

const MyServicesNew = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeServices, setActiveServices] = useState<ServiceRequest[]>([]);
  const [availableServices, setAvailableServices] = useState<ServiceRequest[]>([]);
  const [completedServices, setCompletedServices] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("available");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    console.log("MyServicesNew - useEffect executado", { user: user?.id, profileType: profile?.user_type });
    
    if (!user || profile?.user_type !== 'professional') {
      console.log("MyServicesNew - Redirecionando: usuário não é profissional", { user: user?.id, profileType: profile?.user_type });
      navigate("/");
      return;
    }
    
    console.log("MyServicesNew - Iniciando fetchServices");
    fetchServices();
  }, [user, profile, navigate]);

  const fetchServices = async () => {
    console.log("MyServicesNew - fetchServices iniciado");
    
    try {
      console.log("MyServicesNew - Buscando serviços disponíveis...");
      
      // Fetch available requests (not yet quoted by this professional)
      const { data: availableData, error: availableError } = await supabase
        .from("service_requests")
        .select(`
          *,
          service_categories!service_requests_category_id_fkey (name),
          client_profile:profiles!service_requests_client_id_fkey (
            full_name,
            phone
          )
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (availableError) {
        console.error("MyServicesNew - Erro ao buscar serviços disponíveis:", availableError);
        throw availableError;
      }
      
      console.log("MyServicesNew - Serviços disponíveis encontrados:", availableData?.length);

      // Filter out requests this professional already quoted
      console.log("MyServicesNew - Verificando orçamentos já enviados...");
      const quotedRequestIds = await getQuotedRequestIds();
      console.log("MyServicesNew - IDs de requests já orçados:", quotedRequestIds);
      
      const filteredAvailable = availableData?.filter(
        request => !quotedRequestIds.includes(request.id)
      ) || [];
      
      console.log("MyServicesNew - Serviços disponíveis após filtro:", filteredAvailable.length);

      // Fetch active services (where this professional has accepted quotes)
      console.log("MyServicesNew - Buscando serviços ativos...");
      const { data: activeData, error: activeError } = await supabase
        .from("service_requests")
        .select(`
          *,
          service_categories!service_requests_category_id_fkey (name),
          client_profile:profiles!service_requests_client_id_fkey (
            full_name,
            phone
          ),
          quotes!inner (
            id,
            amount,
            description,
            is_accepted
          )
        `)
        .eq("quotes.professional_id", user?.id)
        .eq("quotes.is_accepted", true)
        .in("status", ["accepted", "in_progress"])
        .order("created_at", { ascending: false });

      if (activeError) {
        console.error("MyServicesNew - Erro ao buscar serviços ativos:", activeError);
        throw activeError;
      }
      
      console.log("MyServicesNew - Serviços ativos encontrados:", activeData?.length);

      // Fetch completed services
      console.log("MyServicesNew - Buscando serviços concluídos...");
      const { data: completedData, error: completedError } = await supabase
        .from("service_requests")
        .select(`
          *,
          service_categories!service_requests_category_id_fkey (name),
          client_profile:profiles!service_requests_client_id_fkey (
            full_name,
            phone
          ),
          quotes!inner (
            id,
            amount,
            description,
            is_accepted
          )
        `)
        .eq("quotes.professional_id", user?.id)
        .eq("quotes.is_accepted", true)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (completedError) {
        console.error("MyServicesNew - Erro ao buscar serviços concluídos:", completedError);
        throw completedError;
      }
      
      console.log("MyServicesNew - Serviços concluídos encontrados:", completedData?.length);

      setAvailableServices(filteredAvailable as any); // Type assertion
      setActiveServices((activeData || []) as any); // Type assertion
      setCompletedServices((completedData || []) as any); // Type assertion
      
      console.log("MyServicesNew - fetchServices concluído com sucesso");
    } catch (error) {
      console.error("MyServicesNew - Erro geral ao carregar serviços:", error);
    } finally {
      setLoading(false);
      console.log("MyServicesNew - Loading finalizado");
    }
  };

  const getQuotedRequestIds = async () => {
    console.log("MyServicesNew - getQuotedRequestIds iniciado");
    
    try {
      const { data, error } = await supabase
        .from("quotes")
        .select("request_id")
        .eq("professional_id", user?.id);
      
      if (error) {
        console.error("MyServicesNew - Erro ao buscar IDs orçados:", error);
        return [];
      }
      
      const requestIds = data?.map(q => q.request_id) || [];
      console.log("MyServicesNew - getQuotedRequestIds concluído:", requestIds);
      return requestIds;
    } catch (error) {
      console.error("MyServicesNew - Erro geral em getQuotedRequestIds:", error);
      return [];
    }
  };

  const updateServiceStatus = async (serviceId: string, newStatus: ServiceStatus) => {
    // Temporarily cast to any to avoid type issues while we implement the database changes
    const dbStatus = newStatus as any;
    
    setUpdatingStatus(serviceId);
    try {
      const { error } = await supabase
        .from("service_requests")
        .update({ status: dbStatus })
        .eq("id", serviceId);
      
      if (error) throw error;
      
      
      toast({
        title: "Status atualizado!",
        description: "O atendimento foi iniciado com sucesso.",
      });
      
      // Refresh services after status update
      await fetchServices();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o atendimento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getActionButton = (service: ServiceRequest) => {
    switch (service.status) {
      case 'pending':
        return (
          <Button 
            size="sm"
            onClick={() => navigate(`/service-request/${service.id}`)}
            className="gap-2"
          >
            <DollarSign className="w-4 h-4" />
            Enviar Orçamento
          </Button>
        );
        
      case 'accepted':
        return (
          <>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigate(`/service-request/${service.id}`)}
              className="gap-2 w-full sm:w-auto"
            >
              <span className="sm:hidden">Detalhes</span>
              <span className="hidden sm:inline">Ver Detalhes</span>
            </Button>
            <Button 
              size="sm"
              disabled={updatingStatus === service.id}
              onClick={async () => {
                // Update status to in_progress first
                await updateServiceStatus(service.id, 'in_progress');
                // Navigate only after successful update
                if (!updatingStatus) {
                  navigate(`/service-request/${service.id}`);
                }
              }}
              className="gap-2 w-full sm:w-auto"
            >
              {updatingStatus === service.id ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-background border-t-current" />
                  <span className="sm:hidden">Iniciando...</span>
                  <span className="hidden sm:inline">Iniciando...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span className="sm:hidden">Iniciar</span>
                  <span className="hidden sm:inline">Iniciar Atendimento</span>
                </>
              )}
            </Button>
          </>
        );
        
      case 'in_progress':
        return (
          <>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigate(`/chat/${service.id}`)}
              className="gap-2 w-full sm:w-auto"
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </Button>
            <Button 
              size="sm"
              onClick={() => navigate(`/service-request/${service.id}`)}
              className="gap-2 w-full sm:w-auto"
            >
              <CheckCircle className="w-4 h-4" />
              Finalizar
            </Button>
          </>
        );
        
      case 'completed':
        return (
          <>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigate(`/service-request/${service.id}`)}
              className="gap-2 w-full sm:w-auto"
            >
              <Star className="w-4 h-4" />
              Avaliar
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigate(`/service-request/${service.id}`)}
              className="gap-2 w-full sm:w-auto"
            >
              Ver Detalhes
            </Button>
          </>
        );
        
      default:
        return null;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando seus serviços...</p>
        </div>
      </div>
    );
  }

  const ServiceCard = ({ service }: { service: ServiceRequest }) => {
    const urgencyInfo = getUrgencyInfo(service.urgency_level);
    
    return (
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg mb-2 line-clamp-1 pr-2 sm:pr-0">{service.title}</CardTitle>
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                <ServiceStatusFlow 
                  currentStatus={service.status} 
                  compact 
                  showDescription={false}
                  showProgress={false}
                />
                {service.service_categories && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    {service.service_categories.name}
                  </Badge>
                )}
                {service.accepted_quote && (
                  <Badge variant="default" className="text-xs px-1.5 py-0.5">
                    R$ {service.accepted_quote.amount.toLocaleString('pt-BR')}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right text-xs sm:text-sm text-muted-foreground flex-shrink-0">
              <p className="text-xs">Criado</p>
              <p className="font-medium">
                {format(new Date(service.created_at), "dd/MM", { locale: ptBR })}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {service.description}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
              <span className="truncate">{service.city}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${urgencyInfo.color.replace('text-', 'bg-')}`} />
              <span className="truncate">Urgência {urgencyInfo.label}</span>
            </div>
            
            {service.client_profile && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{service.client_profile.full_name}</span>
              </div>
            )}
            
            {service.preferred_date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-600 flex-shrink-0" />
                <span className="truncate">{format(new Date(service.preferred_date), "dd/MM", { locale: ptBR })}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center pt-3 border-t">
            {service.status !== 'pending' && (
              <ServiceStatusFlow 
                currentStatus={service.status} 
                showDescription={false}
                showProgress={true}
                compact={true}
              />
            )}
            
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 sm:ml-auto">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => navigate(`/service-request/${service.id}`)}
                className="gap-2 w-full sm:w-auto"
              >
                <Eye className="w-4 h-4" />
                Acompanhar
              </Button>
              {getActionButton(service)}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/")}
                className="gap-2 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden xs:inline">Início</span>
              </Button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-primary truncate">Meus Serviços</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Gerencie suas oportunidades e atendimentos
                </p>
              </div>
            </div>
            <Button 
              onClick={() => navigate("/available-requests")}
              className="gap-2 w-full sm:w-auto flex-shrink-0"
              size="sm"
            >
              <Search className="w-4 h-4" />
              <span className="sm:hidden">Buscar</span>
              <span className="hidden sm:inline">Buscar Serviços</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="available" className="flex items-center gap-1 px-2 sm:px-3">
                <Search className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Disponíveis</span>
                {availableServices.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs px-1 min-w-[16px] h-4">
                    {availableServices.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center gap-1 px-2 sm:px-3">
                <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Ativos</span>
                {activeServices.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs px-1 min-w-[16px] h-4">
                    {activeServices.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-1 px-2 sm:px-3">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Concluídos</span>
                {completedServices.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs px-1 min-w-[16px] h-4">
                    {completedServices.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="space-y-4">
              {availableServices.length === 0 ? (
                <Card className="text-center py-16">
                  <CardContent>
                    <div className="w-24 h-24 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                      <Search className="w-12 h-12 text-primary" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-3">Nenhuma oportunidade disponível</h3>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                      Não há novos pedidos de serviço disponíveis no momento. 
                      Verifique novamente em alguns minutos.
                    </p>
                    <Button 
                      onClick={() => window.location.reload()}
                      size="lg"
                      className="gap-2"
                    >
                      <Search className="w-5 h-5" />
                      Atualizar Lista
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {availableServices.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {activeServices.length === 0 ? (
                <Card className="text-center py-16">
                  <CardContent>
                    <div className="w-24 h-24 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                      <Briefcase className="w-12 h-12 text-primary" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-3">Nenhum serviço ativo</h3>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                      Você não tem serviços ativos no momento. 
                      Envie orçamentos para pedidos disponíveis para começar.
                    </p>
                    <Button 
                      onClick={() => setActiveTab("available")}
                      size="lg"
                      className="gap-2"
                    >
                      <Search className="w-5 h-5" />
                      Ver Oportunidades
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {activeServices.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedServices.length === 0 ? (
                <Card className="text-center py-16">
                  <CardContent>
                    <div className="w-24 h-24 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-12 h-12 text-primary" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-3">Nenhum serviço concluído</h3>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                      Seus serviços concluídos aparecerão aqui. 
                      Complete alguns atendimentos para ver seu histórico.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {completedServices.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default MyServicesNew;