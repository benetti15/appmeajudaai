import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  useEffect(() => {
    if (!user || profile?.user_type !== 'professional') {
      navigate("/");
      return;
    }
    fetchAvailableRequests();
  }, [user, profile, navigate]);

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
            service_categories (name)
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
          service_categories (name)
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando pedidos disponíveis...</p>
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
            <Card className="text-center py-12">
              <CardContent>
                <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Nenhum pedido disponível</h3>
                <p className="text-muted-foreground mb-6">
                  Não encontramos pedidos disponíveis para você no momento. Isso pode acontecer por alguns motivos:
                </p>
                <div className="text-left max-w-lg mx-auto space-y-3 mb-8">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-medium text-amber-800 mb-2">📋 Principais motivos:</h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• Você ainda não cadastrou suas especialidades profissionais</li>
                      <li>• Não há novos pedidos nas suas áreas de especialidade</li>
                      <li>• Sua localização ou área de atendimento pode estar limitada</li>
                      <li>• Os pedidos disponíveis já foram atendidos por outros profissionais</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">💡 O que você pode fazer:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Configure suas especialidades e áreas de atendimento</li>
                      <li>• Atualize sua localização</li>
                      <li>• Verifique se seu perfil está completo</li>
                      <li>• Volte mais tarde para ver novos pedidos</li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button 
                    onClick={() => navigate("/professional-profile")}
                    className="gap-2"
                  >
                    <User className="w-4 h-4" />
                    Configurar Perfil
                  </Button>
                  <Button 
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Atualizar Página
                  </Button>
                </div>
              </CardContent>
            </Card>
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