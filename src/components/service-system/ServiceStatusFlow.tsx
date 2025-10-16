import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, DollarSign, Play, Users, Star, Car, MapPin, Clock3, CreditCard } from "lucide-react";

// Status types that match current database enum
export type ServiceStatus = 
  | 'pending'
  | 'quoted' 
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed';

// Extended status for UI flow (includes intermediate states)
export type ExtendedServiceStatus = ServiceStatus 
  | 'on_way'
  | 'arrived'
  | 'awaiting_client_confirmation'
  | 'payment_confirmed';

export interface ServiceStatusInfo {
  label: string;
  description: string;
  progress: number;
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: typeof Clock;
  color: string;
}

export const SERVICE_STATUS_CONFIG: Record<ExtendedServiceStatus, ServiceStatusInfo> = {
  pending: {
    label: "Aguardando Orçamentos",
    description: "Seu pedido foi publicado e profissionais podem enviar orçamentos",
    progress: 10,
    variant: "secondary",
    icon: Clock,
    color: "text-blue-600"
  },
  quoted: {
    label: "Orçamentos Recebidos", 
    description: "Você recebeu orçamentos. Analise e escolha o melhor",
    progress: 25,
    variant: "default",
    icon: DollarSign,
    color: "text-green-600"
  },
  accepted: {
    label: "Orçamento Aceito",
    description: "Orçamento aceito! O profissional foi notificado",
    progress: 35,
    variant: "default", 
    icon: CheckCircle,
    color: "text-indigo-600"
  },
  on_way: {
    label: "A Caminho",
    description: "O profissional está a caminho do local do serviço",
    progress: 50,
    variant: "default",
    icon: Car,
    color: "text-blue-600"
  },
  arrived: {
    label: "Chegou no Local",
    description: "O profissional chegou no local e iniciará o serviço",
    progress: 60,
    variant: "default",
    icon: MapPin,
    color: "text-purple-600"
  },
  in_progress: {
    label: "Serviço em Execução",
    description: "O profissional está executando o serviço no local",
    progress: 75,
    variant: "default",
    icon: Play,
    color: "text-orange-600"
  },
  awaiting_client_confirmation: {
    label: "Aguardando Confirmação",
    description: "Profissional finalizou. Aguardando confirmação do cliente",
    progress: 85,
    variant: "default",
    icon: Clock3,
    color: "text-amber-600"
  },
  payment_confirmed: {
    label: "Pagamento Confirmado",
    description: "Pagamento confirmado. Serviço será finalizado",
    progress: 95,
    variant: "default",
    icon: CreditCard,
    color: "text-green-600"
  },
  completed: {
    label: "Serviço Concluído",
    description: "Serviço finalizado com sucesso! Avalie o profissional",
    progress: 100,
    variant: "default",
    icon: Star,
    color: "text-emerald-600"
  },
  cancelled: {
    label: "Cancelado",
    description: "Este serviço foi cancelado",
    progress: 0,
    variant: "destructive",
    icon: Clock,
    color: "text-red-600"
  },
  disputed: {
    label: "Em Disputa",
    description: "Há uma disputa ativa. Nosso suporte está mediando",
    progress: 0,
    variant: "destructive",
    icon: Users,
    color: "text-red-600"
  }
};

interface ServiceStatusFlowProps {
  currentStatus: ExtendedServiceStatus;
  showDescription?: boolean;
  showProgress?: boolean;
  compact?: boolean;
}

export function ServiceStatusFlow({ 
  currentStatus, 
  showDescription = true, 
  showProgress = true,
  compact = false 
}: ServiceStatusFlowProps) {
  const statusInfo = SERVICE_STATUS_CONFIG[currentStatus];
  const Icon = statusInfo.icon;

  // Current Status Display with Dynamic Progress
  const getStatusProgress = () => {
    switch(currentStatus) {
      case 'pending': return 10;
      case 'quoted': return 25;  
      case 'accepted': return 35;
      case 'on_way': return 50;
      case 'arrived': return 60;
      case 'in_progress': return 75;
      case 'awaiting_client_confirmation': return 85;
      case 'payment_confirmed': return 95;
      case 'completed': return 100;
      case 'cancelled': return 0;
      case 'disputed': return 0;
      default: return 0;
    }
  };
  const flowSteps: ExtendedServiceStatus[] = ['pending', 'quoted', 'accepted', 'on_way', 'arrived', 'in_progress', 'awaiting_client_confirmation', 'payment_confirmed', 'completed'];
  
  const getCurrentStepIndex = () => {
    return flowSteps.indexOf(currentStatus);
  };

  const currentStepIndex = getCurrentStepIndex();
  const dynamicProgress = getStatusProgress();

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${statusInfo.color}`} />
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-current ${statusInfo.color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold">{statusInfo.label}</h3>
            {showDescription && (
              <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
            )}
          </div>
        </div>
        <Badge variant={statusInfo.variant}>{dynamicProgress}%</Badge>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <Progress value={dynamicProgress} className="h-2" />
      )}

      {/* Flow Steps */}
      <div className="space-y-3">
        {flowSteps.map((step, index) => {
          const stepInfo = SERVICE_STATUS_CONFIG[step];
          const StepIcon = stepInfo.icon;
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          
          return (
            <div key={step} className="relative">
              <div className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                isCurrent 
                  ? `bg-current/10 border-2 ${stepInfo.color} border-current/30` 
                  : isCompleted
                  ? "bg-primary/5 border border-primary/20"
                  : "bg-muted/50 border border-muted"
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isCompleted 
                    ? "bg-primary text-primary-foreground" 
                    : isCurrent
                    ? `${stepInfo.color} border-2 border-current bg-background`
                    : "bg-muted border border-muted-foreground"
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <StepIcon className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1">
                  <span className={`text-sm font-medium ${
                    isCurrent ? stepInfo.color : isCompleted ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {stepInfo.label}
                  </span>
                </div>
                {isCurrent && (
                  <div className="text-xs font-medium text-current px-2 py-1 bg-current/10 rounded-full">
                    Atual
                  </div>
                )}
              </div>
              {index < flowSteps.length - 1 && (
                <div className={`w-0.5 h-4 ml-7 ${
                  isCompleted ? 'bg-primary' : 'bg-muted'
                } transition-colors`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function getNextValidStatus(currentStatus: ExtendedServiceStatus, userRole: 'client' | 'professional'): ExtendedServiceStatus | null {
  const transitions: Record<ExtendedServiceStatus, { client?: ExtendedServiceStatus; professional?: ExtendedServiceStatus }> = {
    pending: {}, // Only system can move from pending to quoted
    quoted: {
      client: 'accepted' // Client can accept a quote
    },
    accepted: {
      professional: 'on_way' // Professional can start going to the location
    },
    on_way: {
      professional: 'arrived' // Professional arrives at location
    },
    arrived: {
      professional: 'in_progress' // Professional starts the actual service
    },
    in_progress: {
      professional: 'awaiting_client_confirmation' // Professional finishes and waits for client confirmation
    },
    awaiting_client_confirmation: {
      client: 'payment_confirmed' // Client confirms completion and payment
    },
    payment_confirmed: {
      // Both can finalize, but system will handle the final completion
      client: 'completed',
      professional: 'completed'
    },
    completed: {}, // No transitions from completed
    cancelled: {}, // No transitions from cancelled
    disputed: {} // Only system/support can resolve disputes
  };

  return transitions[currentStatus]?.[userRole] || null;
}