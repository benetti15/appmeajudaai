import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Plus, 
  Eye, 
  Clock,
  Star,
  Trophy,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Hourglass,
  MessageCircle,
  TrendingUp,
  Target,
  Zap,
  ChevronRight,
  Filter,
  FileText,
  DollarSign
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ServiceStatus, SERVICE_STATUS_CONFIG } from "@/components/service-system/ServiceStatusFlow";
import { cn } from "@/lib/utils";

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
  quotes_count?: number;
}

// Animated Progress Ring Component
function ProgressRing({ progress, size = 48, strokeWidth = 4 }: { progress: number; size?: number; strokeWidth?: number }) {
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
          className="text-primary transition-all duration-500 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="url(#progressGradient)"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-primary">{progress}%</span>
      </div>
    </div>
  );
}

// Animated Counter Component
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  return (
    <span className="font-bold text-2xl sm:text-3xl tabular-nums bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
      {value}{suffix}
    </span>
  );
}

// Stats Card Component
function StatsCard({ 
  icon: Icon, 
  label, 
  value, 
  trend,
  color = "primary" 
}: { 
  icon: any; 
  label: string; 
  value: number | string; 
  trend?: string;
  color?: "primary" | "success" | "warning" | "accent";
}) {
  const colorClasses = {
    primary: "from-primary/20 to-primary/5 border-primary/20",
    success: "from-success/20 to-success/5 border-success/20",
    warning: "from-warning/20 to-warning/5 border-warning/20",
    accent: "from-accent/20 to-accent/5 border-accent/20"
  };
  
  const iconColors = {
    primary: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    accent: "text-accent bg-accent/10"
  };

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border p-4 bg-gradient-to-br backdrop-blur-sm",
      "transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
      colorClasses[color]
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-success" />
              <span className="text-xs text-success font-medium">{trend}</span>
            </div>
          )}
        </div>
        <div className={cn("p-2.5 rounded-xl", iconColors[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {/* Decorative element */}
      <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-gradient-to-br from-white/10 to-transparent" />
    </div>
  );
}

// Request Card Component
function RequestCard({ 
  request, 
  onClick 
}: { 
  request: ServiceRequest; 
  onClick: () => void;
}) {
  const statusConfig = SERVICE_STATUS_CONFIG[request.status];
  const Icon = statusConfig?.icon || Clock;
  
  const getStatusProgress = (status: ServiceStatus): number => {
    const progressMap: Record<string, number> = {
      'pending': 15,
      'quoted': 30,
      'accepted': 50,
      'in_progress': 70,
      'completed': 100,
      'cancelled': 0,
      'disputed': 0
    };
    return progressMap[status] || 0;
  };

  const getUrgencyConfig = (level: number) => {
    const configs = {
      1: { label: "Baixa", color: "bg-success/10 text-success border-success/20", icon: Clock },
      2: { label: "Média", color: "bg-warning/10 text-warning border-warning/20", icon: AlertCircle },
      3: { label: "Alta", color: "bg-destructive/10 text-destructive border-destructive/20", icon: Zap }
    };
    return configs[level as keyof typeof configs] || configs[1];
  };

  const urgency = getUrgencyConfig(request.urgency_level);
  const UrgencyIcon = urgency.icon;
  const progress = getStatusProgress(request.status);
  const timeAgo = formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: ptBR });

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden cursor-pointer",
        "border border-border/50 bg-card/80 backdrop-blur-sm",
        "transition-all duration-300 ease-out",
        "hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30",
        "hover:-translate-y-1"
      )}
      onClick={onClick}
    >
      {/* Progress bar top indicator */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted/30 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-accent/0 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />

      <CardContent className="p-4 sm:p-5">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            {/* Category Badge */}
            {request.service_categories && (
              <Badge 
                variant="secondary" 
                className="mb-2 text-xs font-medium bg-secondary/50 hover:bg-secondary/70"
              >
                {request.service_categories.name}
              </Badge>
            )}
            
            {/* Title */}
            <h3 className="font-semibold text-base sm:text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {request.title}
            </h3>
          </div>

          {/* Progress Ring */}
          <div className="flex-shrink-0">
            <ProgressRing progress={progress} size={48} strokeWidth={4} />
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
          {request.description}
        </p>

        {/* Status and Urgency Row */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge 
            variant="outline" 
            className={cn(
              "gap-1.5 font-medium px-2.5 py-1",
              statusConfig?.color || "text-muted-foreground"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {statusConfig?.label || request.status}
          </Badge>
          
          <Badge 
            variant="outline"
            className={cn("gap-1 text-xs border", urgency.color)}
          >
            <UrgencyIcon className="w-3 h-3" />
            {urgency.label}
          </Badge>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <MapPin className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="truncate">{request.city}</span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="p-1.5 rounded-lg bg-accent/10">
              <Calendar className="w-3.5 h-3.5 text-accent" />
            </div>
            <span className="truncate">{timeAgo}</span>
          </div>

          {/* Budget if exists */}
          {request.budget_estimate && (
            <div className="flex items-center gap-2 text-sm col-span-2">
              <div className="p-1.5 rounded-lg bg-success/10">
                <DollarSign className="w-3.5 h-3.5 text-success" />
              </div>
              <span className="font-medium text-success">
                R$ {request.budget_estimate.toLocaleString('pt-BR')}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            {request.preferred_date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{format(new Date(request.preferred_date), "dd/MM", { locale: ptBR })}</span>
              </div>
            )}
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1.5 text-primary hover:text-primary hover:bg-primary/10 group-hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            Ver detalhes
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Filter Chip Component
function FilterChip({ 
  label, 
  count, 
  active, 
  onClick,
  color
}: { 
  label: string; 
  count: number; 
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full",
        "text-sm font-medium transition-all duration-200",
        "border",
        active 
          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
          : "bg-card hover:bg-muted/50 text-muted-foreground border-border/50 hover:border-primary/30"
      )}
    >
      <span>{label}</span>
      <span className={cn(
        "px-2 py-0.5 rounded-full text-xs font-bold",
        active ? "bg-white/20" : "bg-muted"
      )}>
        {count}
      </span>
    </button>
  );
}

// Empty State Component
function EmptyState({ onCreateRequest }: { onCreateRequest: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Animated illustration */}
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center animate-bounce-subtle">
          <FileText className="w-16 h-16 text-primary" />
        </div>
        {/* Floating decorations */}
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center animate-float">
          <Sparkles className="w-4 h-4 text-accent" />
        </div>
        <div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center animate-float" style={{ animationDelay: '0.5s' }}>
          <Star className="w-3 h-3 text-primary" />
        </div>
      </div>

      <h3 className="text-2xl font-bold mb-3 text-foreground">
        Nenhuma solicitação ainda
      </h3>
      <p className="text-muted-foreground mb-8 max-w-sm leading-relaxed">
        Comece agora! Crie sua primeira solicitação e receba orçamentos de profissionais verificados.
      </p>

      <Button 
        size="lg"
        onClick={onCreateRequest}
        className="gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
      >
        <Plus className="w-5 h-5" />
        Criar Primeira Solicitação
      </Button>

      {/* Tips */}
      <div className="mt-12 p-4 rounded-2xl bg-muted/30 border border-border/50 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-accent/10 flex-shrink-0">
            <Target className="w-4 h-4 text-accent" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground mb-1">Dica</p>
            <p className="text-xs text-muted-foreground">
              Quanto mais detalhes você fornecer, mais precisos serão os orçamentos recebidos!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Component
const MyRequestsNew = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchRequests();
  }, [user, navigate]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("service_requests")
        .select(`
          *,
          service_categories!service_requests_category_id_fkey (name)
        `)
        .eq("client_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests((data || []) as any);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => ['quoted', 'accepted', 'in_progress'].includes(r.status)).length,
    completed: requests.filter(r => r.status === 'completed').length,
  };

  // Calculate status counts for filters
  const statusCounts = requests.reduce((acc, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filter requests
  const filteredRequests = activeFilter === 'all' 
    ? requests 
    : requests.filter(r => r.status === activeFilter);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full border-4 border-muted animate-pulse" />
            <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-primary animate-spin" />
          </div>
          <p className="text-muted-foreground font-medium animate-pulse">
            Carregando suas solicitações...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 pb-24 sm:pb-8">
      {/* Header with glassmorphism */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate("/")}
                className="rounded-xl hover:bg-muted/50"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  Minhas Solicitações
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Acompanhe e gerencie seus pedidos
                </p>
              </div>
            </div>
            
            <Button 
              onClick={() => navigate("/categories")}
              className="gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nova Solicitação</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {requests.length === 0 ? (
            <EmptyState onCreateRequest={() => navigate("/categories")} />
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <StatsCard 
                  icon={FileText}
                  label="Total de Pedidos"
                  value={stats.total}
                  color="primary"
                />
                <StatsCard 
                  icon={Hourglass}
                  label="Aguardando"
                  value={stats.pending}
                  color="warning"
                />
                <StatsCard 
                  icon={Zap}
                  label="Em Andamento"
                  value={stats.inProgress}
                  color="accent"
                />
                <StatsCard 
                  icon={CheckCircle2}
                  label="Concluídos"
                  value={stats.completed}
                  trend={stats.completed > 0 ? `${Math.round((stats.completed / stats.total) * 100)}%` : undefined}
                  color="success"
                />
              </div>

              {/* Gamification Banner */}
              {stats.completed >= 3 && (
                <Card className="overflow-hidden border-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white">Cliente Premium! 🎉</p>
                      <p className="text-sm text-white/80">
                        Você já completou {stats.completed} serviços. Continue assim!
                      </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-1">
                      {[...Array(Math.min(stats.completed, 5))].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Filter Chips */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                <FilterChip 
                  label="Todos"
                  count={requests.length}
                  active={activeFilter === 'all'}
                  onClick={() => setActiveFilter('all')}
                />
                {Object.entries(statusCounts).map(([status, count]) => {
                  const config = SERVICE_STATUS_CONFIG[status as ServiceStatus];
                  return (
                    <FilterChip 
                      key={status}
                      label={config?.label || status}
                      count={count}
                      active={activeFilter === status}
                      onClick={() => setActiveFilter(status)}
                    />
                  );
                })}
              </div>

              {/* Request Cards */}
              <div className="space-y-4">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Filter className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma solicitação com este status</p>
                  </div>
                ) : (
                  filteredRequests.map((request, index) => (
                    <div 
                      key={request.id}
                      className="animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <RequestCard 
                        request={request}
                        onClick={() => navigate(`/service-request/${request.id}`)}
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Quick Tips */}
              <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">
                        Dica para melhores orçamentos
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Adicione fotos às suas solicitações! Pedidos com imagens recebem em média 3x mais propostas.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyRequestsNew;
