import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Calendar, DollarSign, Clock, User, Home, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  budget_estimate: number | null;
  urgency_level: number;
  preferred_date: string | null;
  status: string;
  created_at: string;
  client_id: string;
  profiles?: {
    full_name: string;
    phone: string;
  };
}

interface Quote {
  id: string;
  professional_id: string;
  amount: number;
  description: string;
  estimated_duration_hours?: number;
  estimated_duration?: string;
  materials_included?: boolean;
  notes?: string;
  valid_until?: string;
  is_accepted: boolean;
  created_at: string;
  profiles?: {
    full_name: string;
    phone: string;
  };
}

export default function SimpleRequestDetails() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [quoteForm, setQuoteForm] = useState({
    amount: "",
    description: "",
    estimated_duration: ""
  });
  const [submittingQuote, setSubmittingQuote] = useState(false);

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
          profiles (
            full_name,
            phone
          )
        `)
        .eq("id", requestId)
        .single();

      if (requestError) throw requestError;
      setRequest(requestData);

      const { data: quotesData, error: quotesError } = await supabase
        .from("quotes")
        .select(`
          *,
          profiles (
            full_name,
            phone
          )
        `)
        .eq("request_id", requestId)
        .order("created_at", { ascending: false });

      if (quotesError) throw quotesError;
      setQuotes(quotesData || []);
    } catch (error) {
      console.error("Erro ao carregar detalhes:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes da solicitação",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quoteForm.amount || !quoteForm.description) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setSubmittingQuote(true);

    try {
      const { data: quoteData, error } = await supabase
        .from("quotes")
        .insert({
          request_id: requestId,
          professional_id: user?.id,
          amount: parseFloat(quoteForm.amount),
          description: quoteForm.description
        })
        .select()
        .single();

      if (error) throw error;

      // Enviar notificação para o cliente
      await supabase
        .from("notifications")
        .insert({
          user_id: request?.client_id,
          title: "Novo orçamento recebido",
          message: `Você recebeu um orçamento de R$ ${parseFloat(quoteForm.amount).toLocaleString('pt-BR')} para "${request?.title}"`,
          type: "quote_received",
          related_id: quoteData.id
        });

      toast({
        title: "Sucesso!",
        description: "Seu orçamento foi enviado"
      });

      setQuoteForm({ amount: "", description: "", estimated_duration: "" });
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

  const handleAcceptQuote = async (quoteId: string) => {
    try {
      const { error } = await supabase
        .from("quotes")
        .update({ is_accepted: true })
        .eq("id", quoteId);

      if (error) throw error;

      await supabase
        .from("service_requests")
        .update({ status: "accepted" })
        .eq("id", requestId);

      toast({
        title: "Sucesso!",
        description: "Orçamento aceito com sucesso"
      });

      fetchRequestDetails();
    } catch (error) {
      console.error("Erro ao aceitar orçamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível aceitar o orçamento",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Aguardando Orçamentos", variant: "secondary" as const },
      accepted: { label: "Orçamento Aceito", variant: "default" as const },
      in_progress: { label: "Em Andamento", variant: "default" as const },
      completed: { label: "Concluído", variant: "default" as const },
      cancelled: { label: "Cancelado", variant: "destructive" as const },
    };
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  const getUrgencyLabel = (level: number) => {
    const labels = {
      1: "Baixa",
      2: "Média", 
      3: "Alta"
    };
    return labels[level as keyof typeof labels] || "Baixa";
  };

  const isClient = request?.client_id === user?.id;
  const isProfessional = !isClient;
  const hasUserQuote = quotes.some(q => q.professional_id === user?.id);
  const acceptedQuote = quotes.find(q => q.is_accepted);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Solicitação não encontrada</p>
          <Button onClick={() => navigate("/")}>Voltar ao Início</Button>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(request.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-primary/5">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/")}
          >
            <Home className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Detalhes da Solicitação</h1>
            <p className="text-muted-foreground">{request.title}</p>
          </div>
        </div>

        {/* Request Details */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle>{request.title}</CardTitle>
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{request.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{request.address}, {request.city} - {request.state}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Urgência: {getUrgencyLabel(request.urgency_level)}</span>
              </div>
              
              {request.budget_estimate && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span>Orçamento estimado: R$ {request.budget_estimate.toLocaleString('pt-BR')}</span>
                </div>
              )}
              
              {request.preferred_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Data preferida: {format(new Date(request.preferred_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
              )}
            </div>

            {request.profiles && (
              <div className="flex items-center gap-2 pt-4 border-t">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Cliente: {request.profiles.full_name}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quote Form for Professionals */}
        {isProfessional && !hasUserQuote && request.status === "pending" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Enviar Orçamento</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitQuote} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor (R$) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={quoteForm.amount}
                      onChange={(e) => setQuoteForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="estimated_duration">Prazo Estimado</Label>
                    <Input
                      id="estimated_duration"
                      value={quoteForm.estimated_duration}
                      onChange={(e) => setQuoteForm(prev => ({ ...prev, estimated_duration: e.target.value }))}
                      placeholder="Ex: 2 dias, 1 semana..."
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição do Orçamento *</Label>
                  <Textarea
                    id="description"
                    value={quoteForm.description}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o que está incluído no seu orçamento..."
                    rows={3}
                    required
                  />
                </div>
                
                <Button type="submit" disabled={submittingQuote}>
                  {submittingQuote ? "Enviando..." : "Enviar Orçamento"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Quotes List */}
        {quotes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Orçamentos Recebidos ({quotes.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quotes.map((quote, index) => (
                <div key={quote.id}>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{quote.profiles?.full_name || 'Profissional'}</span>
                        {quote.is_accepted && <Badge>Aceito</Badge>}
                      </div>
                      <p className="text-2xl font-bold text-primary">R$ {quote.amount.toLocaleString('pt-BR')}</p>
                      {quote.estimated_duration && (
                        <p className="text-sm text-muted-foreground">Prazo: {quote.estimated_duration}</p>
                      )}
                      <p className="text-sm">{quote.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Enviado em {format(new Date(quote.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    
                    {isClient && !acceptedQuote && request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAcceptQuote(quote.id)}
                          size="sm"
                        >
                          Aceitar
                        </Button>
                      </div>
                    )}

                    {isClient && acceptedQuote && quote.is_accepted && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => navigate(`/professional-profile/${quote.professional_id}`)}
                          size="sm"
                          variant="outline"
                        >
                          Ver Perfil
                        </Button>
                        <Button
                          onClick={() => navigate(`/chat/${request.id}`)}
                          size="sm"
                          className="gap-2"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Chat
                        </Button>
                      </div>
                    )}

                    {isClient && !acceptedQuote && request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => navigate(`/professional-profile/${quote.professional_id}`)}
                          size="sm"
                          variant="outline"
                        >
                          Ver Perfil
                        </Button>
                        <Button
                          onClick={() => handleAcceptQuote(quote.id)}
                          size="sm"
                        >
                          Aceitar
                        </Button>
                      </div>
                    )}
                  </div>
                  {index < quotes.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}