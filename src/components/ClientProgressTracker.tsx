import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  Clock, 
  DollarSign, 
  Truck, 
  Play, 
  CheckSquare, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  MessageCircle,
  MapPin,
  Calendar,
  Star
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProgressTrackerProps {
  requestId: string;
  currentStatus: string;
  professionalId?: string;
  userRole: 'client' | 'professional';
}

interface TimelineEvent {
  id: string;
  status: string;
  timestamp: string;
  message: string;
  icon: typeof Clock;
}

export const ClientProgressTracker = ({ 
  requestId, 
  currentStatus, 
  professionalId, 
  userRole 
}: ProgressTrackerProps) => {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [professionalInfo, setProfessionalInfo] = useState<any>(null);

  useEffect(() => {
    fetchTimeline();
    if (professionalId) {
      fetchProfessionalInfo();
    }
    
    // Real-time subscription for status updates
    const subscription = supabase
      .channel(`progress-${requestId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'service_requests',
        filter: `id=eq.${requestId}`
      }, (payload) => {
        if (payload.new.status !== currentStatus) {
          addTimelineEvent(payload.new.status, new Date().toISOString());
          
          // Show notification for clients
          if (userRole === 'client') {
            showProgressNotification(payload.new.status);
          }
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [requestId, professionalId, userRole]);

  const fetchTimeline = async () => {
    // Create timeline based on current status
    const events: TimelineEvent[] = [];
    const now = new Date().toISOString();
    
    events.push({
      id: '1',
      status: 'pending',
      timestamp: now,
      message: 'Pedido criado e publicado',
      icon: Clock
    });

    if (['quoted', 'heading_to_client', 'in_progress', 'awaiting_confirmation', 'awaiting_payment', 'completed'].includes(currentStatus)) {
      events.push({
        id: '2',
        status: 'quoted',
        timestamp: now,
        message: 'Orçamentos recebidos',
        icon: DollarSign
      });
    }

    if (['heading_to_client', 'in_progress', 'awaiting_confirmation', 'awaiting_payment', 'completed'].includes(currentStatus)) {
      events.push({
        id: '3',
        status: 'heading_to_client',
        timestamp: now,
        message: 'Profissional iniciou atendimento',
        icon: Truck
      });
    }

    if (['in_progress', 'awaiting_confirmation', 'awaiting_payment', 'completed'].includes(currentStatus)) {
      events.push({
        id: '4',
        status: 'in_progress',
        timestamp: now,
        message: 'Serviço em execução',
        icon: Play
      });
    }

    if (['awaiting_confirmation', 'awaiting_payment', 'completed'].includes(currentStatus)) {
      events.push({
        id: '5',
        status: 'awaiting_confirmation',
        timestamp: now,
        message: 'Trabalho finalizado',
        icon: CheckSquare
      });
    }

    if (['completed'].includes(currentStatus)) {
      events.push({
        id: '6',
        status: 'completed',
        timestamp: now,
        message: 'Serviço concluído',
        icon: CheckCircle
      });
    }

    setTimeline(events);
  };

  const fetchProfessionalInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, avatar_url')
        .eq('id', professionalId)
        .single();

      if (!error && data) {
        setProfessionalInfo(data);
      }
    } catch (error) {
      console.error('Error fetching professional info:', error);
    }
  };

  const addTimelineEvent = (status: string, timestamp: string) => {
    const iconMap: Record<string, typeof Clock> = {
      pending: Clock,
      quoted: DollarSign,
      heading_to_client: Truck,
      in_progress: Play,
      awaiting_confirmation: CheckSquare,
      awaiting_payment: CreditCard,
      completed: CheckCircle
    };

    const messageMap: Record<string, string> = {
      heading_to_client: 'Profissional está a caminho',
      in_progress: 'Serviço sendo executado',
      awaiting_confirmation: 'Aguardando confirmação',
      awaiting_payment: 'Aguardando pagamento',
      completed: 'Serviço finalizado'
    };

    const newEvent: TimelineEvent = {
      id: Date.now().toString(),
      status,
      timestamp,
      message: messageMap[status] || 'Status atualizado',
      icon: iconMap[status] || Clock
    };

    setTimeline(prev => [...prev, newEvent]);
  };

  const showProgressNotification = (status: string) => {
    const notifications = {
      'heading_to_client': {
        title: '🚚 Profissional a Caminho!',
        message: 'Seu profissional iniciou o atendimento e está se dirigindo ao local.',
      },
      'in_progress': {
        title: '🔧 Serviço em Andamento!',
        message: 'O profissional chegou ao local e iniciou o trabalho.',
      },
      'awaiting_confirmation': {
        title: '✅ Trabalho Concluído!',
        message: 'O profissional finalizou o trabalho. Confirme a conclusão.',
      },
      'completed': {
        title: '🎉 Serviço Finalizado!',
        message: 'Parabéns! Seu serviço foi concluído com sucesso.',
      }
    };

    const notification = notifications[status as keyof typeof notifications];
    if (notification) {
      toast.success(notification.title, {
        description: notification.message,
        duration: 6000,
      });
    }
  };

  const getStatusProgress = (status: string) => {
    const progressMap: Record<string, number> = {
      pending: 10,
      quoted: 25,
      heading_to_client: 50,
      in_progress: 75,
      awaiting_confirmation: 90,
      awaiting_payment: 95,
      completed: 100
    };
    return progressMap[status] || 0;
  };

  return (
    <div className="space-y-6">
      {/* Professional Info Card - Only for clients when professional is assigned */}
      {userRole === 'client' && professionalInfo && ['heading_to_client', 'in_progress', 'awaiting_confirmation', 'awaiting_payment', 'completed'].includes(currentStatus) && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Seu Profissional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-lg">{professionalInfo.full_name}</p>
                {professionalInfo.phone && (
                  <p className="text-muted-foreground">Tel: {professionalInfo.phone}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat
                </Button>
                <Button variant="outline" size="sm">
                  <Star className="w-4 h-4 mr-2" />
                  Avaliar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso do Atendimento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Progresso</span>
              <span className="text-sm text-muted-foreground">
                {getStatusProgress(currentStatus)}%
              </span>
            </div>
            <Progress value={getStatusProgress(currentStatus)} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Linha do Tempo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timeline.map((event, index) => {
              const Icon = event.icon;
              const isActive = event.status === currentStatus;
              const isCompleted = timeline.findIndex(e => e.status === currentStatus) >= index;
              
              return (
                <div key={event.id} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    isActive 
                      ? "bg-primary border-primary text-primary-foreground animate-pulse" 
                      : isCompleted
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-muted border-muted-foreground/20 text-muted-foreground"
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${
                      isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {event.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    {isActive && (
                      <Badge variant="default" className="mt-1 text-xs">
                        Em andamento
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};