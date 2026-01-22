import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Clock, 
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Send,
  User,
  ChevronRight,
  Sparkles,
  Star,
  Phone
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ServiceExecutionView, ExtendedServiceStatus } from "@/components/service-flow";

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  neighborhood?: string;
  budget_estimate: number | null;
  urgency_level: number;
  preferred_date: string | null;
  status: string;
  extended_status?: ExtendedServiceStatus;
  created_at: string;
  client_id: string;
  images_urls?: string[];
  service_categories?: {
    name: string;
    icon?: string;
  };
  profiles?: {
    full_name: string;
    phone: string;
    avatar_url?: string;
  };
}

interface Quote {
  id: string;
  professional_id: string;
  amount: number;
  description: string;
  estimated_time?: string;
  materials_included?: boolean;
  is_accepted: boolean;
  created_at: string;
  profiles?: {
    full_name: string;
    phone: string;
    avatar_url?: string;
  };
}

export default function SimpleRequestDetails() {
  const { id: requestId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingQuote, setAcceptingQuote] = useState<string | null>(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [quoteData, setQuoteData] = useState({ amount: "", description: "" });

  const userType = profile?.user_type || 'client';
  const isProfessional = userType === 'professional';

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchRequestDetails();
  }, [user, requestId, navigate]);

  const fetchRequestDetails = async () => {
    try {
      const { data: requestData, error: requestError } = await supabase
        .from("service_requests")
        .select(`
          *,
          service_categories!service_requests_category_id_fkey (name, icon),
          profiles!service_requests_client_id_fkey (full_name, phone, avatar_url)
        `)
        .eq("id", requestId)
        .maybeSingle();

      if (requestError) throw requestError;
      if (!requestData) {
        toast({
          title: "Não encontrado",
          description: "Solicitação não encontrada",
          variant: "destructive"
        });
        navigate("/");
        return;
      }
      
      setRequest(requestData as any);

      const { data: quotesData } = await supabase
        .from("quotes")
        .select(`
          *,
          profiles (full_name, phone, avatar_url)
        `)
        .eq("request_id", requestId)
        .order("created_at", { ascending: false });

      setQuotes((quotesData || []) as any);
    } catch (error) {
      console.error("Erro ao carregar detalhes:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuote = async (quoteId: string, professionalId: string) => {
    setAcceptingQuote(quoteId);
    try {
      const { error } = await supabase
        .from("quotes")
        .update({ is_accepted: true })
        .eq("id", quoteId);

      if (error) throw error;

      // Update service request with extended_status = 'accepted'
      await supabase
        .from("service_requests")
        .update({ 
          status: "accepted",
          extended_status: "accepted"
        })
        .eq("id", requestId);

      // Notify professional
      await supabase.from("notifications").insert({
        user_id: professionalId,
        title: "Orçamento aceito! 🎉",
        message: `Seu orçamento para "${request?.title}" foi aceito! Inicie o atendimento quando estiver pronto.`,
        type: "quote_accepted",
        related_id: requestId
      });

      // Log to status history
      await supabase.from("service_status_history").insert({
        request_id: requestId,
        status: "accepted",
        changed_by: user?.id,
        notes: "Cliente aceitou orçamento"
      });

      toast({
        title: "Orçamento aceito!",
        description: "O profissional foi notificado para iniciar o atendimento"
      });

      fetchRequestDetails();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível aceitar o orçamento",
        variant: "destructive"
      });
    } finally {
      setAcceptingQuote(null);
    }
  };

  const handleSubmitQuote = async () => {
    if (!quoteData.amount || !quoteData.description) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o valor e a descrição do orçamento",
        variant: "destructive"
      });
      return;
    }

    setSubmittingQuote(true);
    try {
      const { error } = await supabase
        .from("quotes")
        .insert({
          request_id: requestId,
          professional_id: user?.id,
          amount: parseFloat(quoteData.amount),
          description: quoteData.description
        });

      if (error) throw error;

      // Notificar cliente
      await supabase.from("notifications").insert({
        user_id: request?.client_id,
        title: "Novo orçamento recebido! 💰",
        message: `Você recebeu um orçamento para "${request?.title}"`,
        type: "new_quote",
        related_id: requestId
      });

      toast({
        title: "Orçamento enviado!",
        description: "O cliente será notificado"
      });

      setShowQuoteForm(false);
      setQuoteData({ amount: "", description: "" });
      fetchRequestDetails();
    } catch (error) {
      console.error("Erro ao enviar orçamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o orçamento",
        variant: "destructive"
      });
    } finally {
      setSubmittingQuote(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
      pending: { 
        label: "Aguardando orçamentos", 
        color: "text-amber-600", 
        icon: <Clock className="w-4 h-4" />,
        bg: "bg-amber-50 border-amber-200"
      },
      accepted: { 
        label: "Profissional contratado", 
        color: "text-blue-600", 
        icon: <CheckCircle2 className="w-4 h-4" />,
        bg: "bg-blue-50 border-blue-200"
      },
      in_progress: { 
        label: "Serviço em andamento", 
        color: "text-primary", 
        icon: <Sparkles className="w-4 h-4" />,
        bg: "bg-primary/10 border-primary/20"
      },
      completed: { 
        label: "Serviço concluído", 
        color: "text-green-600", 
        icon: <CheckCircle2 className="w-4 h-4" />,
        bg: "bg-green-50 border-green-200"
      },
      cancelled: { 
        label: "Cancelado", 
        color: "text-red-600", 
        icon: <AlertCircle className="w-4 h-4" />,
        bg: "bg-red-50 border-red-200"
      }
    };
    return configs[status] || configs.pending;
  };

  const getUrgencyConfig = (level: number) => {
    const configs: Record<number, { label: string; color: string }> = {
      1: { label: "Flexível", color: "text-green-600" },
      2: { label: "Em breve", color: "text-amber-600" },
      3: { label: "Urgente", color: "text-red-600" }
    };
    return configs[level] || configs[1];
  };

  const isClient = request?.client_id === user?.id;
  const acceptedQuote = quotes.find(q => q.is_accepted);
  const myQuote = isProfessional ? quotes.find(q => q.professional_id === user?.id) : null;
  
  // Determine if we're in execution mode (after quote accepted)
  const isExecutionMode = acceptedQuote && (
    request?.extended_status === 'accepted' ||
    request?.extended_status === 'on_way' ||
    request?.extended_status === 'arrived' ||
    request?.extended_status === 'in_progress' ||
    request?.extended_status === 'awaiting_client_confirmation' ||
    request?.extended_status === 'payment_confirmed' ||
    request?.extended_status === 'completed' ||
    request?.extended_status === 'client_absent' ||
    request?.extended_status === 'reschedule_requested' ||
    request?.extended_status === 'rescheduled' ||
    request?.extended_status === 'disputed' ||
    request?.extended_status === 'payment_failed'
  );
  
  // Check if professional is the contracted one
  const isContractedProfessional = isProfessional && acceptedQuote?.professional_id === user?.id;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold mb-2">Não encontrado</h2>
          <p className="text-muted-foreground mb-6">Esta solicitação não existe ou foi removida</p>
          <Button onClick={() => navigate("/")} className="w-full">
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(request.status);
  const urgencyConfig = getUrgencyConfig(request.urgency_level);

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(isProfessional ? '/available-requests' : '/my-requests')}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground truncate">{request.title}</h1>
            <p className="text-xs text-muted-foreground">
              {format(new Date(request.created_at), "dd MMM yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
      </header>

      <main className="pb-24">
        {/* EXECUTION MODE - After quote accepted */}
        {isExecutionMode && (isClient || isContractedProfessional) && (
          <div className="px-4 mt-4">
            <ServiceExecutionView
              requestId={request.id}
              currentStatus={(request.extended_status || 'accepted') as ExtendedServiceStatus}
              userRole={isClient ? 'client' : 'professional'}
              serviceAmount={acceptedQuote?.amount || 0}
              professionalInfo={acceptedQuote?.profiles ? {
                id: acceptedQuote.professional_id,
                full_name: acceptedQuote.profiles.full_name || 'Profissional',
                phone: acceptedQuote.profiles.phone,
                avatar_url: acceptedQuote.profiles.avatar_url
              } : undefined}
              clientInfo={request.profiles ? {
                id: request.client_id,
                full_name: request.profiles.full_name || 'Cliente',
                phone: request.profiles.phone
              } : undefined}
              address={`${request.address}, ${request.city} - ${request.state}`}
              onStatusChange={fetchRequestDetails}
            />
          </div>
        )}

        {/* NEGOTIATION MODE - Before quote accepted */}
        {!isExecutionMode && (
          <>
            {/* Status Banner - hide when quote is accepted */}
            {!quotes.some(q => q.is_accepted) && (
              <div className={`mx-4 mt-4 p-4 rounded-2xl border ${statusConfig.bg}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full bg-background ${statusConfig.color}`}>
                    {statusConfig.icon}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${statusConfig.color}`}>{statusConfig.label}</p>
                    {request.status === 'pending' && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {quotes.length === 0 
                          ? "Profissionais serão notificados" 
                          : `${quotes.length} orçamento${quotes.length > 1 ? 's' : ''} recebido${quotes.length > 1 ? 's' : ''}`
                        }
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

        {/* Quick Info Pills */}
        <div className="flex gap-2 px-4 mt-4 overflow-x-auto pb-1 scrollbar-hide">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-full text-sm shrink-0">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-foreground">{request.neighborhood || request.city}</span>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-full text-sm shrink-0 ${urgencyConfig.color}`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{urgencyConfig.label}</span>
          </div>
          {request.budget_estimate && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-full text-sm shrink-0">
              <DollarSign className="w-3.5 h-3.5 text-green-600" />
              <span className="text-foreground">R$ {request.budget_estimate.toLocaleString('pt-BR')}</span>
            </div>
          )}
          {request.preferred_date && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-full text-sm shrink-0">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-foreground">{format(new Date(request.preferred_date), "dd/MM", { locale: ptBR })}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="px-4 mt-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Descrição</h2>
          <p className="text-foreground leading-relaxed">{request.description}</p>
        </div>

        {/* Images */}
        {request.images_urls && request.images_urls.length > 0 && (
          <div className="px-4 mt-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Fotos</h2>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {request.images_urls.map((url, idx) => (
                <img 
                  key={idx}
                  src={url} 
                  alt={`Foto ${idx + 1}`}
                  className="w-24 h-24 rounded-xl object-cover shrink-0 border"
                />
              ))}
            </div>
          </div>
        )}

        {/* Accepted Quote - Professional Card */}
        {acceptedQuote && (
          <div className="px-4 mt-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Profissional contratado</h2>
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-4 border border-primary/20">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border-2 border-primary/20">
                  <AvatarImage src={acceptedQuote.profiles?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {acceptedQuote.profiles?.full_name?.charAt(0) || 'P'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {acceptedQuote.profiles?.full_name || 'Profissional'}
                  </p>
                  <p className="text-lg font-bold text-primary">
                    R$ {acceptedQuote.amount.toLocaleString('pt-BR')}
                  </p>
                </div>
                <Button
                  size="icon"
                  className="shrink-0 rounded-full"
                  onClick={() => navigate(`/chat/${request.id}`)}
                >
                  <MessageCircle className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="flex gap-2 mt-3">
                {acceptedQuote.profiles?.phone && (
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => window.open(`tel:${acceptedQuote.profiles?.phone}`, '_self')}
                  >
                    <Phone className="w-4 h-4" />
                    Ligar
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => navigate(`/chat/${request.id}`)}
                >
                  <MessageCircle className="w-4 h-4" />
                  Conversar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quotes List - Only for clients with pending quotes */}
        {isClient && !acceptedQuote && quotes.length > 0 && (
          <div className="px-4 mt-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Orçamentos recebidos
            </h2>
            <div className="space-y-3">
              {quotes.map((quote) => (
                <div 
                  key={quote.id}
                  className="bg-card rounded-2xl p-4 border shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={quote.profiles?.avatar_url} />
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        {quote.profiles?.full_name?.charAt(0) || 'P'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-foreground truncate">
                          {quote.profiles?.full_name || 'Profissional'}
                        </p>
                        <p className="text-lg font-bold text-primary shrink-0">
                          R$ {quote.amount.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      {quote.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {quote.description}
                        </p>
                      )}
                      {quote.estimated_time && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Prazo: {quote.estimated_time}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/professional-profile/${quote.professional_id}`)}
                    >
                      Ver perfil
                    </Button>
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => handleAcceptQuote(quote.id, quote.professional_id)}
                      disabled={acceptingQuote === quote.id}
                    >
                      {acceptingQuote === quote.id ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Aceitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state for no quotes - Clients */}
        {isClient && quotes.length === 0 && request.status === 'pending' && (
          <div className="px-4 mt-8">
            <div className="text-center py-8 px-4 bg-muted/30 rounded-2xl border border-dashed">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Send className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Aguardando propostas</h3>
              <p className="text-sm text-muted-foreground">
                Profissionais da sua região estão sendo notificados sobre sua solicitação
              </p>
            </div>
          </div>
        )}

        {/* Professional Actions - Send Quote */}
        {isProfessional && !acceptedQuote && request.status === 'pending' && (
          <div className="px-4 mt-6">
            {myQuote ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-green-700">Orçamento enviado</p>
                    <p className="text-sm text-green-600">
                      R$ {myQuote.amount.toLocaleString('pt-BR')} - Aguardando resposta do cliente
                    </p>
                  </div>
                </div>
              </div>
            ) : showQuoteForm ? (
              <div className="bg-card rounded-2xl p-4 border shadow-sm space-y-4">
                <h3 className="font-semibold text-foreground">Enviar Orçamento</h3>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Valor (R$)</label>
                  <input
                    type="number"
                    placeholder="Ex: 150"
                    value={quoteData.amount}
                    onChange={(e) => setQuoteData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Descrição</label>
                  <textarea
                    placeholder="Descreva o que está incluso no orçamento..."
                    value={quoteData.description}
                    onChange={(e) => setQuoteData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg bg-background min-h-[80px]"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowQuoteForm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={handleSubmitQuote}
                    disabled={submittingQuote}
                  >
                    {submittingQuote ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Enviar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                className="w-full h-12 text-base gap-2 rounded-xl"
                onClick={() => setShowQuoteForm(true)}
              >
                <DollarSign className="w-5 h-5" />
                Enviar Orçamento
              </Button>
            )}
          </div>
        )}

        {/* Address Section */}
        <div className="px-4 mt-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Endereço</h2>
          <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
            <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <p className="text-foreground text-sm">
              {request.address}, {request.city} - {request.state}
            </p>
          </div>
        </div>

        {/* Category Badge */}
        {request.service_categories?.name && (
          <div className="px-4 mt-6">
            <Badge variant="secondary" className="text-sm py-1.5 px-3">
              {request.service_categories.name}
            </Badge>
          </div>
        )}
          </>
        )}
      </main>

      {/* Bottom Action Bar - Only show in negotiation mode */}
      {!isExecutionMode && isClient && acceptedQuote && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t safe-area-pb">
          <Button 
            className="w-full h-12 text-base gap-2 rounded-xl"
            onClick={() => navigate(`/chat/${request.id}`)}
          >
            <MessageCircle className="w-5 h-5" />
            Conversar com o profissional
          </Button>
        </div>
      )}

    </div>
  );
}
