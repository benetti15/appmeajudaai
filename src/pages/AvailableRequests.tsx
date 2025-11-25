import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ProfileCompletionChecklist } from "@/components/ui/profile-completion-checklist";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, MapPin, DollarSign, Clock, Send, Briefcase, Image, User, Home, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RequestAnalyzer } from "@/components/ai/RequestAnalyzer";
import { QuoteAssistant } from "@/components/ai/QuoteAssistant";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

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
  images_urls: string[] | null;
  service_categories: { name: string } | null;
}

const AvailableRequests = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingRequest, setAnalyzingRequest] = useState<string | null>(null);
  const [creatingQuote, setCreatingQuote] = useState<string | null>(null);
  const [profileCompletion, setProfileCompletion] = useState({
    hasPhoto: false,
    hasSpecialties: false,
    hasLocation: false,
    isVerified: false
  });

  useEffect(() => {
    if (!user || profile?.user_type !== 'professional') {
      navigate("/");
      return;
    }
    fetchAvailableRequests();
    checkProfileCompletion();
  }, [user, profile, navigate]);

  const checkProfileCompletion = async () => {
    if (!user) return;

    // Check photo
    const hasPhoto = !!profile?.avatar_url;

    // Check specialties
    const { data: specialties } = await supabase
      .from("professional_specialties")
      .select("id")
      .eq("professional_id", user.id);
    const hasSpecialties = (specialties?.length || 0) >= 2;

    // Check location
    const hasLocation = !!(profile?.city && profile?.state);

    // Check verification (simplified)
    const isVerified = false; // You can implement proper verification check

    setProfileCompletion({
      hasPhoto,
      hasSpecialties,
      hasLocation,
      isVerified
    });
  };

  const fetchAvailableRequests = async () => {
    try {
      console.log("Buscando pedidos para profissional:", user?.id);
      
      // Primeiro, buscar as especialidades do profissional
      const { data: specialties, error: specialtiesError } = await supabase
        .from("professional_specialties")
        .select("category_id")
        .eq("professional_id", user?.id);

      console.log("Especialidades encontradas:", specialties);
      if (specialtiesError) {
        console.error("Erro ao buscar especialidades:", specialtiesError);
        throw specialtiesError;
      }

      if (!specialties || specialties.length === 0) {
        console.log("Nenhuma especialidade encontrada. Buscando todos os pedidos...");
        // Se não tem especialidades cadastradas, mostrar todos os pedidos
        const { data: allRequests, error: allRequestsError } = await supabase
          .from("service_requests")
          .select(`
            *,
            service_categories!service_requests_category_id_fkey (name)
          `)
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (allRequestsError) {
          console.error("Erro ao buscar todos os pedidos:", allRequestsError);
          throw allRequestsError;
        }

        console.log("Todos os pedidos encontrados:", allRequests);
        setRequests(allRequests || []);
        setLoading(false);
        return;
      }

      const categoryIds = specialties.map(s => s.category_id);
      console.log("Categorias do profissional:", categoryIds);

      // Buscar pedidos apenas das categorias do profissional
      const { data, error } = await supabase
        .from("service_requests")
        .select(`
          *,
          service_categories!service_requests_category_id_fkey (name)
        `)
        .eq("status", "pending")
        .in("category_id", categoryIds)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar pedidos das categorias:", error);
        throw error;
      }
      
      console.log("Pedidos carregados para as categorias:", data);
      setRequests(data || []);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (level: number) => {
    if (level >= 3) return "text-destructive";
    if (level === 2) return "text-warning";
    return "text-success";
  };

  const getUrgencyBorderColor = (level: number) => {
    if (level >= 3) return "border-l-destructive";
    if (level === 2) return "border-l-warning";
    return "border-l-success";
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
        <Clock className="w-3 h-3" />
        {urgencyInfo.label}
      </Badge>
    );
  };


  if (loading) {
    return <LoadingSpinner message="Buscando oportunidades..." fullScreen />;
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
              <Home className="w-4 h-4" />
              Início
            </Button>
            <h1 className="text-2xl font-bold text-primary">Serviços Disponíveis</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {requests.length === 0 ? (
            <div className="space-y-6">
              <Card className="text-center py-12 border-2 border-dashed">
                <CardContent>
                  <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Nenhum pedido disponível</h3>
                  <p className="text-muted-foreground mb-6">
                    Não encontramos pedidos disponíveis para você no momento.
                  </p>
                </CardContent>
              </Card>

              {/* Profile Completion Checklist */}
              <ProfileCompletionChecklist
                items={[
                  {
                    id: 'photo',
                    label: 'Adicionar foto de perfil',
                    completed: profileCompletion.hasPhoto,
                    action: () => navigate('/professional-profile'),
                    actionLabel: 'Adicionar'
                  },
                  {
                    id: 'specialties',
                    label: 'Cadastrar especialidades (mínimo 2)',
                    completed: profileCompletion.hasSpecialties,
                    action: () => navigate('/professional-profile?tab=specialties'),
                    actionLabel: 'Configurar'
                  },
                  {
                    id: 'location',
                    label: 'Configurar cidade e estado',
                    completed: profileCompletion.hasLocation,
                    action: () => navigate('/professional-profile'),
                    actionLabel: 'Configurar'
                  },
                  {
                    id: 'verification',
                    label: 'Enviar documento de verificação',
                    completed: profileCompletion.isVerified,
                    action: () => navigate('/professional-profile?tab=verification'),
                    actionLabel: 'Verificar'
                  }
                ]}
                title="Complete seu Perfil para Mais Oportunidades"
                description="Profissionais com perfil completo recebem até 5x mais pedidos"
              />

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-6">
                  <h4 className="font-medium text-blue-800 mb-3">💡 Dicas para Aumentar suas Chances</h4>
                  <ul className="text-sm text-blue-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>Adicione mais especialidades para aparecer em mais buscas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>Expanda sua área de cobertura para alcançar mais clientes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>Responda rapidamente aos pedidos para melhorar sua reputação</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={() => navigate("/professional-profile")}
                  size="lg"
                  className="gap-2"
                >
                  <User className="w-5 h-5" />
                  Configurar Perfil Agora
                </Button>
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Atualizar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <p className="text-lg text-muted-foreground">
                  {requests.length} {requests.length === 1 ? 'pedido disponível' : 'pedidos disponíveis'}
                </p>
              </div>

              {requests.map((request) => (
                <Card 
                  key={request.id} 
                  className={`
                    group relative overflow-hidden
                    border-l-4 ${getUrgencyBorderColor(request.urgency_level)}
                    transition-all duration-300 ease-out
                    hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1
                    hover:border-l-8
                    cursor-pointer
                  `}
                  onClick={() => navigate(`/request-details/${request.id}`)}
                >
                  {/* Animated gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  <CardHeader className="relative">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-2 flex-1 min-w-0">
                        <CardTitle className="text-lg sm:text-xl group-hover:text-primary transition-colors duration-200 truncate">
                          {request.title}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="animate-fade-in">
                            <Badge variant="secondary" className="gap-1.5">
                              <Briefcase className="w-3 h-3" />
                              Novo
                            </Badge>
                          </div>
                          <div className="animate-fade-in" style={{ animationDelay: '50ms' }}>
                            {getUrgencyBadge(request.urgency_level)}
                          </div>
                          {request.service_categories && (
                            <Badge 
                              variant="outline" 
                              className="animate-fade-in transition-transform duration-200 hover:scale-110"
                              style={{ animationDelay: '100ms' }}
                            >
                              {request.service_categories.name}
                            </Badge>
                          )}
                          {request.images_urls && request.images_urls.length > 0 && (
                            <Badge 
                              variant="outline" 
                              className="gap-1 text-primary border-primary animate-fade-in transition-transform duration-200 hover:scale-110"
                              style={{ animationDelay: '150ms' }}
                            >
                              <Image className="w-3 h-3" />
                              {request.images_urls.length} foto{request.images_urls.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right text-xs text-muted-foreground">
                          <p className="font-medium">Publicado</p>
                          <p className="text-lg font-bold text-foreground">
                            {format(new Date(request.created_at), "dd/MM", { locale: ptBR })}
                          </p>
                        </div>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/service-request-details/${request.id}`);
                          }}
                          className="gap-1.5 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 group/btn"
                        >
                          <Send className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform duration-200" />
                          Enviar Orçamento
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAnalyzingRequest(request.id);
                          }}
                          className="gap-2"
                        >
                          <Sparkles className="w-4 h-4 text-primary" />
                          Analisar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 relative">
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {request.description}
                    </p>
                    
                    {/* Key Info - Grid with animations */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5">
                        <div className="p-2 rounded-lg bg-background">
                          <MapPin className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Localização</p>
                          <p className="text-sm font-semibold truncate">{request.city}, {request.state}</p>
                        </div>
                      </div>
                      
                      {request.budget_estimate && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 hover:bg-success/20 transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5">
                          <div className="p-2 rounded-lg bg-background">
                            <DollarSign className="w-4 h-4 text-success" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Orçamento</p>
                            <p className="text-sm font-semibold">R$ {request.budget_estimate.toLocaleString('pt-BR')}</p>
                          </div>
                        </div>
                      )}
                      
                      {request.preferred_date && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5">
                          <div className="p-2 rounded-lg bg-background">
                            <Calendar className="w-4 h-4 text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Data Preferida</p>
                            <p className="text-sm font-semibold truncate">
                              {format(new Date(request.preferred_date), "dd/MM/yy", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Dialogs do Toninho */}
      <Dialog open={!!analyzingRequest} onOpenChange={() => setAnalyzingRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Análise do Toninho</DialogTitle>
          {analyzingRequest && (
            <RequestAnalyzer
              requestId={analyzingRequest}
              requestTitle={requests.find(r => r.id === analyzingRequest)?.title || ''}
              requestDescription={requests.find(r => r.id === analyzingRequest)?.description || ''}
              onCreateQuote={() => {
                setCreatingQuote(analyzingRequest);
                setAnalyzingRequest(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!creatingQuote} onOpenChange={() => setCreatingQuote(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>Criar Orçamento com Toninho</DialogTitle>
          {creatingQuote && (
            <QuoteAssistant
              requestDescription={requests.find(r => r.id === creatingQuote)?.description || ''}
              onSubmit={(quoteData) => {
                console.log('Quote created:', quoteData);
                setCreatingQuote(null);
                toast({
                  title: "Orçamento enviado!",
                  description: "Seu orçamento foi enviado ao cliente.",
                });
              }}
              onCancel={() => setCreatingQuote(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AvailableRequests;