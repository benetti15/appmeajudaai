import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  Sparkles,
  Star,
  Phone,
  Trophy,
  Zap,
  Shield,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Gift
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ServiceExecutionView, ExtendedServiceStatus } from "@/components/service-flow";
import { cn } from "@/lib/utils";

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

// Animated Counter Component
function AnimatedCounter({ value, prefix = "" }: { value: number; prefix?: string }) {
  return (
    <span className="tabular-nums font-bold text-2xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
      {prefix}{value.toLocaleString('pt-BR')}
    </span>
  );
}

// Progress Ring Component
function ProgressRing({ progress, size = 60 }: { progress: number; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-muted/30"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-primary transition-all duration-500"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-primary">{progress}%</span>
      </div>
    </div>
  );
}

// Gamification Badge Component
function GamificationBadge({ icon: Icon, label, value, variant = "default" }: { 
  icon: any; 
  label: string; 
  value: string | number;
  variant?: "default" | "success" | "warning" | "premium"
}) {
  const variants = {
    default: "bg-muted/50 text-foreground border-border",
    success: "bg-green-500/10 text-green-600 border-green-500/20",
    warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    premium: "bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary border-primary/20"
  };

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-xl border backdrop-blur-sm transition-all hover:scale-105",
      variants[variant]
    )}>
      <Icon className="w-4 h-4" />
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wide opacity-70">{label}</span>
        <span className="text-sm font-semibold">{value}</span>
      </div>
    </div>
  );
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
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [expandedImages, setExpandedImages] = useState(false);

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

      await supabase
        .from("service_requests")
        .update({ 
          status: "accepted",
          extended_status: "accepted"
        })
        .eq("id", requestId);

      await supabase.from("notifications").insert({
        user_id: professionalId,
        title: "Orçamento aceito! 🎉",
        message: `Seu orçamento para "${request?.title}" foi aceito! Inicie o atendimento quando estiver pronto.`,
        type: "quote_accepted",
        related_id: requestId
      });

      await supabase.from("service_status_history").insert({
        request_id: requestId,
        status: "accepted",
        changed_by: user?.id,
        notes: "Cliente aceitou orçamento"
      });

      toast({
        title: "🎉 Orçamento aceito!",
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

      await supabase.from("notifications").insert({
        user_id: request?.client_id,
        title: "Novo orçamento recebido! 💰",
        message: `Você recebeu um orçamento para "${request?.title}"`,
        type: "new_quote",
        related_id: requestId
      });

      toast({
        title: "✅ Orçamento enviado!",
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
    const configs: Record<string, { 
      label: string; 
      color: string; 
      icon: React.ReactNode; 
      bgGradient: string;
      progress: number;
    }> = {
      pending: { 
        label: "Aguardando orçamentos", 
        color: "text-amber-500", 
        icon: <Clock className="w-5 h-5" />,
        bgGradient: "from-amber-500/20 via-amber-500/10 to-transparent",
        progress: 20
      },
      quoted: { 
        label: "Orçamentos recebidos", 
        color: "text-blue-500", 
        icon: <DollarSign className="w-5 h-5" />,
        bgGradient: "from-blue-500/20 via-blue-500/10 to-transparent",
        progress: 40
      },
      accepted: { 
        label: "Profissional contratado", 
        color: "text-primary", 
        icon: <CheckCircle2 className="w-5 h-5" />,
        bgGradient: "from-primary/20 via-primary/10 to-transparent",
        progress: 50
      },
      in_progress: { 
        label: "Serviço em andamento", 
        color: "text-purple-500", 
        icon: <Sparkles className="w-5 h-5" />,
        bgGradient: "from-purple-500/20 via-purple-500/10 to-transparent",
        progress: 75
      },
      completed: { 
        label: "Serviço concluído", 
        color: "text-green-500", 
        icon: <Trophy className="w-5 h-5" />,
        bgGradient: "from-green-500/20 via-green-500/10 to-transparent",
        progress: 100
      },
      cancelled: { 
        label: "Cancelado", 
        color: "text-red-500", 
        icon: <AlertCircle className="w-5 h-5" />,
        bgGradient: "from-red-500/20 via-red-500/10 to-transparent",
        progress: 0
      }
    };
    return configs[status] || configs.pending;
  };

  const getUrgencyConfig = (level: number) => {
    const configs: Record<number, { label: string; color: string; icon: any; variant: "default" | "success" | "warning" }> = {
      1: { label: "Flexível", color: "text-green-500", icon: Clock, variant: "success" },
      2: { label: "Em breve", color: "text-amber-500", icon: Zap, variant: "warning" },
      3: { label: "Urgente", color: "text-red-500", icon: Zap, variant: "warning" }
    };
    return configs[level] || configs[1];
  };

  const isClient = request?.client_id === user?.id;
  const acceptedQuote = quotes.find(q => q.is_accepted);
  const myQuote = isProfessional ? quotes.find(q => q.professional_id === user?.id) : null;
  
  const effectiveExtendedStatus: ExtendedServiceStatus | undefined = 
    request?.extended_status || 
    (acceptedQuote ? 'accepted' : undefined);
  
  const executionStatuses: ExtendedServiceStatus[] = [
    'accepted', 'on_way', 'arrived', 'in_progress', 
    'awaiting_client_confirmation', 'payment_confirmed', 'completed',
    'client_absent', 'reschedule_requested', 'rescheduled', 'disputed', 'payment_failed'
  ];
  
  const isExecutionMode = acceptedQuote && effectiveExtendedStatus && 
    executionStatuses.includes(effectiveExtendedStatus);
  
  const isContractedProfessional = isProfessional && acceptedQuote?.professional_id === user?.id;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">Carregando detalhes...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-red-500/5 flex items-center justify-center p-4">
        <Card className="text-center max-w-sm p-8 border-dashed">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Não encontrado</h2>
          <p className="text-muted-foreground mb-6">Esta solicitação não existe ou foi removida</p>
          <Button onClick={() => navigate("/")} className="w-full gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </Button>
        </Card>
      </div>
    );
  }

  const statusConfig = getStatusConfig(request.status);
  const urgencyConfig = getUrgencyConfig(request.urgency_level);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Modern Header with Glassmorphism */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(isProfessional ? '/available-requests' : '/my-requests')}
            className="shrink-0 rounded-xl hover:bg-primary/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-foreground truncate">{request.title}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(request.created_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}</span>
            </div>
          </div>
          {request.service_categories?.name && (
            <Badge variant="outline" className="shrink-0 rounded-full bg-primary/5 border-primary/20 text-primary">
              {request.service_categories.name}
            </Badge>
          )}
        </div>
      </header>

      <main className="pb-28">
        {/* EXECUTION MODE - Modern Service Flow */}
        {isExecutionMode && (isClient || isContractedProfessional) && (
          <div className="px-4 pt-4">
            <ServiceExecutionView
              requestId={request.id}
              currentStatus={effectiveExtendedStatus!}
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
            {/* Hero Status Card */}
            <div className="px-4 pt-4">
              <Card className={cn(
                "relative overflow-hidden border-0",
                "bg-gradient-to-br",
                statusConfig.bgGradient
              )}>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),transparent)]" />
                </div>
                
                <div className="relative p-5">
                  <div className="flex items-start gap-4">
                    {/* Progress Ring */}
                    <ProgressRing progress={statusConfig.progress} size={64} />
                    
                    {/* Status Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("font-bold text-lg", statusConfig.color)}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {quotes.length === 0 
                          ? "Aguardando propostas de profissionais" 
                          : `${quotes.length} orçamento${quotes.length > 1 ? 's' : ''} recebido${quotes.length > 1 ? 's' : ''}`
                        }
                      </p>
                      
                      {/* Mini Progress Bar */}
                      <div className="mt-3">
                        <Progress value={statusConfig.progress} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Stats Badges */}
            <div className="flex gap-2 px-4 mt-4 overflow-x-auto pb-1 scrollbar-hide">
              <GamificationBadge 
                icon={MapPin} 
                label="Local" 
                value={request.neighborhood || request.city}
              />
              <GamificationBadge 
                icon={urgencyConfig.icon} 
                label="Urgência" 
                value={urgencyConfig.label}
                variant={urgencyConfig.variant}
              />
              {request.budget_estimate && (
                <GamificationBadge 
                  icon={DollarSign} 
                  label="Orçamento" 
                  value={`R$ ${request.budget_estimate.toLocaleString('pt-BR')}`}
                  variant="success"
                />
              )}
              {request.preferred_date && (
                <GamificationBadge 
                  icon={Calendar} 
                  label="Data" 
                  value={format(new Date(request.preferred_date), "dd/MM", { locale: ptBR })}
                />
              )}
            </div>

            {/* Description Card */}
            <div className="px-4 mt-4">
              <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full bg-primary" />
                    Descrição do Serviço
                  </h2>
                  {request.description.length > 150 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setExpandedDescription(!expandedDescription)}
                      className="h-7 text-xs text-muted-foreground"
                    >
                      {expandedDescription ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
                <p className={cn(
                  "text-foreground leading-relaxed text-sm",
                  !expandedDescription && request.description.length > 150 && "line-clamp-3"
                )}>
                  {request.description}
                </p>
              </Card>
            </div>

            {/* Images Gallery */}
            {request.images_urls && request.images_urls.length > 0 && (
              <div className="px-4 mt-4">
                <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-primary" />
                      Fotos ({request.images_urls.length})
                    </h2>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {request.images_urls.map((url, idx) => (
                      <div 
                        key={idx}
                        className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 group cursor-pointer"
                      >
                        <img 
                          src={url} 
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Accepted Quote - Premium Card */}
            {acceptedQuote && (
              <div className="px-4 mt-4">
                <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-purple-500/5">
                  {/* Premium Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-primary/20 text-primary border-0 gap-1">
                      <Shield className="w-3 h-3" />
                      Contratado
                    </Badge>
                  </div>
                  
                  <div className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="w-16 h-16 border-2 border-primary/30 ring-2 ring-primary/10 ring-offset-2 ring-offset-background">
                          <AvatarImage src={acceptedQuote.profiles?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-purple-500 text-white text-lg font-bold">
                            {acceptedQuote.profiles?.full_name?.charAt(0) || 'P'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground truncate text-lg">
                          {acceptedQuote.profiles?.full_name || 'Profissional'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <AnimatedCounter value={acceptedQuote.amount} prefix="R$ " />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      {acceptedQuote.profiles?.phone && (
                        <Button
                          variant="outline"
                          className="flex-1 gap-2 rounded-xl border-primary/20 hover:bg-primary/5"
                          onClick={() => window.open(`tel:${acceptedQuote.profiles?.phone}`, '_self')}
                        >
                          <Phone className="w-4 h-4" />
                          Ligar
                        </Button>
                      )}
                      <Button
                        className="flex-1 gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 hover:opacity-90"
                        onClick={() => navigate(`/chat/${request.id}`)}
                      >
                        <MessageCircle className="w-4 h-4" />
                        Conversar
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Quotes List - Modernized */}
            {isClient && !acceptedQuote && quotes.length > 0 && (
              <div className="px-4 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Gift className="w-4 h-4 text-primary" />
                    Orçamentos Recebidos
                  </h2>
                  <Badge variant="secondary" className="rounded-full">
                    {quotes.length} proposta{quotes.length > 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {quotes.map((quote, index) => (
                    <Card 
                      key={quote.id}
                      className={cn(
                        "p-4 border-border/50 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
                        index === 0 && "ring-1 ring-primary/20"
                      )}
                    >
                      {index === 0 && (
                        <Badge className="absolute -top-2 right-4 bg-gradient-to-r from-amber-500 to-orange-500 border-0 text-white gap-1">
                          <Star className="w-3 h-3 fill-white" />
                          Menor preço
                        </Badge>
                      )}
                      
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12 border">
                          <AvatarImage src={quote.profiles?.avatar_url} />
                          <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                            {quote.profiles?.full_name?.charAt(0) || 'P'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-foreground truncate">
                                {quote.profiles?.full_name || 'Profissional'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(quote.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xl font-bold text-primary">
                                R$ {quote.amount.toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          
                          {quote.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {quote.description}
                            </p>
                          )}
                          
                          {quote.estimated_time && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>Prazo: {quote.estimated_time}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          className="flex-1 rounded-xl"
                          onClick={() => navigate(`/professional/${quote.professional_id}`)}
                        >
                          Ver perfil
                        </Button>
                        <Button
                          className="flex-1 gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80"
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
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State - Waiting for Quotes */}
            {isClient && quotes.length === 0 && request.status === 'pending' && (
              <div className="px-4 mt-8">
                <Card className="text-center py-10 px-6 border-dashed border-2 bg-gradient-to-br from-primary/5 to-transparent">
                  <div className="relative mx-auto w-20 h-20 mb-6">
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                      <Send className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-2">Aguardando propostas</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Profissionais qualificados da sua região serão notificados e enviarão orçamentos em breve
                  </p>
                  
                  {/* Mini gamification hint */}
                  <div className="mt-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-600 flex items-center justify-center gap-2">
                      <Zap className="w-4 h-4" />
                      Dica: Pedidos com fotos recebem 3x mais orçamentos!
                    </p>
                  </div>
                </Card>
              </div>
            )}

            {/* Professional Actions - Send Quote */}
            {isProfessional && !acceptedQuote && request.status === 'pending' && (
              <div className="px-4 mt-6">
                {myQuote ? (
                  <Card className="p-5 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-green-600">Orçamento enviado!</p>
                        <p className="text-sm text-green-600/80">
                          R$ {myQuote.amount.toLocaleString('pt-BR')} - Aguardando resposta
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full border-2 border-green-500/30 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-green-500 animate-pulse" />
                      </div>
                    </div>
                  </Card>
                ) : showQuoteForm ? (
                  <Card className="p-5 border-primary/20">
                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-primary" />
                      Enviar Orçamento
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Valor (R$)
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="number"
                            placeholder="Ex: 150"
                            value={quoteData.amount}
                            onChange={(e) => setQuoteData(prev => ({ ...prev, amount: e.target.value }))}
                            className="w-full pl-10 pr-4 py-3 border rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Descrição
                        </label>
                        <textarea
                          placeholder="Descreva o que está incluso no orçamento..."
                          value={quoteData.description}
                          onChange={(e) => setQuoteData(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-4 py-3 border rounded-xl bg-background min-h-[100px] focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                        />
                      </div>
                      
                      <div className="flex gap-3 pt-2">
                        <Button
                          variant="outline"
                          className="flex-1 rounded-xl"
                          onClick={() => setShowQuoteForm(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          className="flex-1 gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500"
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
                  </Card>
                ) : (
                  <Button
                    className="w-full h-14 text-base gap-3 rounded-2xl bg-gradient-to-r from-primary via-primary to-purple-500 hover:opacity-90 shadow-lg shadow-primary/25"
                    onClick={() => setShowQuoteForm(true)}
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    Enviar Orçamento
                  </Button>
                )}
              </div>
            )}

            {/* Address Section */}
            <div className="px-4 mt-6">
              <Card className="p-4 border-border/50 bg-card/50">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-primary" />
                  Endereço do Serviço
                </h2>
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium">
                      {request.address}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {request.neighborhood && `${request.neighborhood}, `}{request.city} - {request.state}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </main>

      {/* Fixed Bottom Action - Negotiation Mode */}
      {!isExecutionMode && isClient && acceptedQuote && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-xl border-t border-border/50 safe-area-pb">
          <Button 
            className="w-full h-14 text-base gap-3 rounded-2xl bg-gradient-to-r from-primary to-purple-500 shadow-lg shadow-primary/25"
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
