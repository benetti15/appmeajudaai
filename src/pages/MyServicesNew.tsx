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
  Play,
  CheckCircle,
  Briefcase,
  Search,
  DollarSign,
  Eye,
  User
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
  const [completedServices, setCompletedServices] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    // Guard de tipo removido - agora é controlado pelo ProfessionalRoute no App.tsx
    console.log("MyServicesNew - useEffect executado", { user: user?.id, profileType: profile?.user_type });
    
    if (user) {
      console.log("MyServicesNew - Iniciando fetchServices");
      fetchServices();
    }
  }, [user, profile]);

  const fetchServices = async () => {
    console.log("MyServicesNew - fetchServices iniciado");
    
    try {
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

      setActiveServices((activeData || []) as any);
      setCompletedServices((completedData || []) as any);
      
      console.log("MyServicesNew - fetchServices concluído com sucesso");
    } catch (error) {
      console.error("MyServicesNew - Erro geral ao carregar serviços:", error);
    } finally {
      setLoading(false);
      console.log("MyServicesNew - Loading finalizado");
    }
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

  const getUrgencyBadge = (level: number) => {
    const config = {
      1: { label: "Baixa", variant: "success" as const },
      2: { label: "Média", variant: "warning" as const },
      3: { label: "Alta", variant: "destructive" as const }
    };
    const urgencyInfo = config[level as keyof typeof config] || config[1];
    
    return (
      <Badge variant={urgencyInfo.variant} className="gap-1">
        <User className="w-3 h-3" />
        {urgencyInfo.label}
      </Badge>
    );
  };

  const updateServiceStatus = async (serviceId: string, newStatus: ServiceStatus) => {
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
    const statusConfig = SERVICE_STATUS_CONFIG[service.status];
    const StatusIcon = statusConfig.icon;
    
    return (
      <Card 
        className={`
          group relative overflow-hidden
          border-l-4 ${getStatusBorderColor(service.status)}
          transition-all duration-300 ease-out
          hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1
          hover:border-l-8
          cursor-pointer
        `}
        onClick={() => navigate(`/service-request/${service.id}`)}
      >
        {/* Animated gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        <CardHeader className="pb-3 relative">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg sm:text-xl mb-3 truncate group-hover:text-primary transition-colors duration-200">
                {service.title}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <div className="animate-fade-in">
                  <Badge variant="outline" className={`gap-1.5 ${statusConfig.color} border-current`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </Badge>
                </div>
                <div className="animate-fade-in" style={{ animationDelay: '50ms' }}>
                  {getUrgencyBadge(service.urgency_level)}
                </div>
                {service.service_categories && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs animate-fade-in transition-transform duration-200 hover:scale-110"
                    style={{ animationDelay: '100ms' }}
                  >
                    {service.service_categories.name}
                  </Badge>
                )}
                {service.accepted_quote && (
                  <Badge 
                    variant="default" 
                    className="gap-1 animate-fade-in transition-transform duration-200 hover:scale-110"
                    style={{ animationDelay: '150ms' }}
                  >
                    <DollarSign className="w-3 h-3" />
                    R$ {service.accepted_quote.amount.toLocaleString('pt-BR')}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-right text-xs text-muted-foreground">
                <p className="font-medium">Criado</p>
                <p className="text-lg font-bold text-foreground">
                  {format(new Date(service.created_at), "dd/MM", { locale: ptBR })}
                </p>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/service-request/${service.id}`);
                }}
                className="gap-1.5 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 group/btn"
              >
                <Eye className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform duration-200" />
                Detalhes
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 relative">
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {service.description}
          </p>
          
          {/* Key Info - Grid with animations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5">
              <div className="p-2 rounded-lg bg-background">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Localização</p>
                <p className="text-sm font-semibold truncate">{service.city}</p>
              </div>
            </div>
            
            {service.client_profile && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5">
                <div className="p-2 rounded-lg bg-background">
                  <User className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="text-sm font-semibold truncate">{service.client_profile.full_name}</p>
                </div>
              </div>
            )}
            
            {service.preferred_date && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5">
                <div className="p-2 rounded-lg bg-background">
                  <Calendar className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Data Preferida</p>
                  <p className="text-sm font-semibold truncate">
                    {format(new Date(service.preferred_date), "dd/MM/yy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}
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
              onClick={() => setTimeout(() => navigate("/available-requests"), 100)}
              className="gap-2 w-full sm:w-auto flex-shrink-0"
              size="sm"
            >
              <Search className="w-4 h-4" />
              Buscar Novos Serviços
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                <span>Em Andamento</span>
                {activeServices.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeServices.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Concluídos</span>
                {completedServices.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {completedServices.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeServices.length === 0 ? (
                <Card className="text-center py-16 border-2 border-dashed">
                  <CardContent>
                    <div className="w-20 sm:w-24 h-20 sm:h-24 mx-auto mb-6 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
                      <Briefcase className="w-10 sm:w-12 h-10 sm:h-12 text-white" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-3">Nenhum serviço em andamento</h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-md mx-auto">
                      Você não tem serviços ativos no momento. 
                      Busque novos serviços disponíveis para começar.
                    </p>
                    <Button 
                      onClick={() => navigate("/available-requests")}
                      size="lg"
                      className="gap-2 shadow-lg hover-lift"
                    >
                      <Search className="w-5 h-5" />
                      Buscar Serviços
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
                <Card className="text-center py-16 border-2 border-dashed">
                  <CardContent>
                    <div className="w-20 sm:w-24 h-20 sm:h-24 mx-auto mb-6 bg-gradient-success rounded-2xl flex items-center justify-center shadow-glow">
                      <CheckCircle className="w-10 sm:w-12 h-10 sm:h-12 text-white" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-3">Nenhum serviço concluído</h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-md mx-auto">
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