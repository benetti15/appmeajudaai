import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ProfileCompletionChecklist } from "@/components/ui/profile-completion-checklist";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, MapPin, DollarSign, Clock, Send, Briefcase, Image, User, Home } from "lucide-react";
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
  images_urls: string[] | null;
  service_categories: { name: string } | null;
}

const AvailableRequests = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
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
    if (level === 2) return "text-amber-600";
    return "text-muted-foreground";
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/professional-dashboard")}
              className="gap-2"
            >
              <Briefcase className="w-4 h-4" />
              Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-primary">Pedidos Disponíveis</h1>
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
                <Card key={request.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <CardTitle className="text-xl">{request.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Novo Pedido</Badge>
                          {request.service_categories && (
                            <Badge variant="outline">
                              {request.service_categories.name}
                            </Badge>
                          )}
                          {request.images_urls && request.images_urls.length > 0 && (
                            <Badge variant="outline" className="text-blue-600 border-blue-600">
                              <Image className="w-3 h-3 mr-1" />
                              {request.images_urls.length} foto{request.images_urls.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>Publicado em</p>
                        <p className="font-medium">
                          {format(new Date(request.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{request.description}</p>
                    
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

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${getUrgencyColor(request.urgency_level)}`} />
                        <span className="text-sm">
                          Urgência: {request.urgency_level === 1 ? "Baixa" : 
                                   request.urgency_level === 2 ? "Média" : "Alta"}
                        </span>
                      </div>
                      
                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/request-details/${request.id}`)}
                        >
                          Ver Detalhes
                        </Button>
                        {request.images_urls && request.images_urls.length > 0 && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="gap-2 text-blue-600 border-blue-600 hover:bg-blue-50"
                            onClick={() => navigate(`/request-details/${request.id}#images`)}
                          >
                            <Image className="w-4 h-4" />
                            Ver Fotos ({request.images_urls.length})
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          className="gap-2"
                          onClick={() => navigate(`/request-details/${request.id}`)}
                        >
                          <Send className="w-4 h-4" />
                          Ver e Enviar Orçamento
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AvailableRequests;