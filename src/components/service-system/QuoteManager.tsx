import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  User, 
  MessageCircle, 
  Star,
  Award,
  MapPin
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Quote {
  id: string;
  professional_id: string;
  amount: number;
  description: string;
  estimated_duration?: string;
  materials_included: boolean;
  notes?: string;
  valid_until?: string;
  is_accepted: boolean;
  created_at: string;
  profiles?: {
    full_name: string;
    phone?: string;
    avatar_url?: string;
  };
}

interface QuoteManagerProps {
  requestId: string;
  clientId: string;
  currentStatus: string;
  userRole: 'client' | 'professional';
  onQuoteAccepted?: () => void;
}

interface QuoteFormData {
  amount: string;
  description: string;
  estimated_duration: string;
  materials_included: boolean;
  notes: string;
  valid_until: string;
}

export function QuoteManager({ 
  requestId, 
  clientId, 
  currentStatus, 
  userRole,
  onQuoteAccepted 
}: QuoteManagerProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  
  const [quoteForm, setQuoteForm] = useState<QuoteFormData>({
    amount: "",
    description: "",
    estimated_duration: "",
    materials_included: false,
    notes: "",
    valid_until: ""
  });

  useEffect(() => {
    fetchQuotes();
  }, [requestId]);

  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from("quotes")
        .select(`
          *,
          profiles:professional_id (
            full_name,
            phone,
            avatar_url
          )
        `)
        .eq("request_id", requestId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      toast.error("Erro ao carregar orçamentos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quoteForm.amount || !quoteForm.description) {
      toast.error("Preencha pelo menos o valor e descrição");
      return;
    }

    setSubmitting(true);

    try {
      const { data: quoteData, error } = await supabase
        .from("quotes")
        .insert({
          request_id: requestId,
          professional_id: user?.id,
          amount: parseFloat(quoteForm.amount),
          description: quoteForm.description,
          estimated_duration: quoteForm.estimated_duration || null,
          materials_included: quoteForm.materials_included,
          notes: quoteForm.notes || null,
          valid_until: quoteForm.valid_until || null
        })
        .select()
        .single();

      if (error) throw error;

      // Update request status to 'quoted' if this is the first quote
      const { data: currentQuotes } = await supabase
        .from("quotes")
        .select("id")
        .eq("request_id", requestId);

      if (currentQuotes?.length === 0) {
        await supabase
          .from("service_requests")
          .update({ status: "quoted" })
          .eq("id", requestId);
      }

      // Send notification to client with specific quote information
      await supabase
        .from("notifications")
        .insert({
          user_id: clientId,
          title: "Novo orçamento recebido! 💰",
          message: `Você recebeu um orçamento de R$ ${parseFloat(quoteForm.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Acesse sua solicitação para analisar e aceitar.`,
          type: "quote_received",
          related_id: quoteData.id
        });

      toast.success("Orçamento enviado com sucesso!");
      setShowQuoteForm(false);
      setQuoteForm({
        amount: "",
        description: "",
        estimated_duration: "",
        materials_included: false,
        notes: "",
        valid_until: ""
      });
      fetchQuotes();
    } catch (error) {
      console.error("Error submitting quote:", error);
      toast.error("Erro ao enviar orçamento");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptQuote = async (quoteId: string) => {
    try {
      // Mark quote as accepted
      const { error: quoteError } = await supabase
        .from("quotes")
        .update({ is_accepted: true })
        .eq("id", quoteId);

      if (quoteError) throw quoteError;

      // Update request status to 'accepted'
      const { error: requestError } = await supabase
        .from("service_requests")
        .update({ status: "accepted" })
        .eq("id", requestId);

      if (requestError) throw requestError;

      // Send notification to professional
      const acceptedQuote = quotes.find(q => q.id === quoteId);
      if (acceptedQuote) {
        await supabase
          .from("notifications")
          .insert({
            user_id: acceptedQuote.professional_id,
            title: "🎉 Orçamento aceito!",
            message: `Parabéns! Seu orçamento de R$ ${acceptedQuote.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} foi aceito. Prepare-se para iniciar o atendimento.`,
            type: "quote_accepted",
            related_id: requestId
          });
      }

      toast.success("Orçamento aceito com sucesso!");
      fetchQuotes();
      onQuoteAccepted?.();
    } catch (error) {
      console.error("Error accepting quote:", error);
      toast.error("Erro ao aceitar orçamento");
    }
  };

  const userQuote = quotes.find(q => q.professional_id === user?.id);
  const acceptedQuote = quotes.find(q => q.is_accepted);
  const canSendQuote = userRole === 'professional' && !userQuote && currentStatus === 'pending';
  // Simplificar a lógica - mostrar botão para clientes quando há orçamentos não aceitos
  const canAcceptQuotes = userRole === 'client' && !acceptedQuote;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Carregando orçamentos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">

      {/* Quotes List - Only show for clients */}
      {userRole === 'client' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Orçamentos {quotes.length > 0 && `(${quotes.length})`}
            </CardTitle>
          </CardHeader>
        <CardContent>
          {quotes.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {currentStatus === 'pending' 
                  ? "Aguardando profissionais enviarem orçamentos"
                  : "Nenhum orçamento disponível"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {quotes.map((quote, index) => (
                <div key={quote.id}>
                  <div className="space-y-4">
                    {/* Quote Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={quote.profiles?.avatar_url} />
                          <AvatarFallback>
                            <User className="w-6 h-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{quote.profiles?.full_name || 'Profissional'}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {format(new Date(quote.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                      {quote.is_accepted && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <Award className="w-3 h-3 mr-1" />
                          Aceito
                        </Badge>
                      )}
                    </div>

                    {/* Quote Details */}
                    <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <span className="text-2xl sm:text-3xl font-bold text-primary">
                          R$ {quote.amount.toLocaleString('pt-BR')}
                        </span>
                        {quote.estimated_duration && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{quote.estimated_duration}</span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-sm break-words">{quote.description}</p>
                      
                      {quote.notes && (
                        <div className="text-xs text-muted-foreground bg-background/50 p-2 rounded">
                          <strong>Observações:</strong> <span className="break-words">{quote.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Quote Actions */}
                    <div className="flex gap-2 flex-col sm:flex-row mt-4">
                      {canAcceptQuotes && !quote.is_accepted && (
                        <Button
                          onClick={() => handleAcceptQuote(quote.id)}
                          size="default"
                          className="gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                        >
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                          <span className="truncate">Aceitar Orçamento</span>
                        </Button>
                      )}
                      
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 h-9 flex-1 sm:flex-none"
                          onClick={() => navigate(`/professional-profile/${quote.professional_id}`)}
                        >
                          <User className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">Ver Perfil</span>
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 h-9 flex-1 sm:flex-none"
                          onClick={() => navigate(`/chat/${requestId}`)}
                        >
                          <MessageCircle className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">Conversar</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {index < quotes.length - 1 && <Separator className="my-6" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
        </Card>
      )}
    </div>
  );
}