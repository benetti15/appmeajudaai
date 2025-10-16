import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, DollarSign, Play, Users, Star, Car, MapPin, Clock3, CreditCard } from "lucide-react";

// Novos status simplificados para o cliente
export type SimplifiedClientStatus = 
  | 'pending'
  | 'quoted' 
  | 'accepted'
  | 'professional_on_way'  // Agrupa "A caminho" e "Chegou"
  | 'service_started'      // Novo status "Iniciar serviço"
  | 'service_in_progress'
  | 'awaiting_client'      // Agrupa "Aguardando Confirmação" e "Aguardando Pagamento"
  | 'completed'
  | 'cancelled'
  | 'disputed';

// Status completos para profissionais (mantém granularidade)
export type DetailedProfessionalStatus = 
  | 'pending'
  | 'quoted' 
  | 'accepted'
  | 'on_way'
  | 'arrived'
  | 'service_started'      // Novo status explícito
  | 'in_progress'
  | 'awaiting_confirmation'
  | 'awaiting_payment'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export interface ServiceStatusInfo {
  label: string;
  description: string;
  progress: number;
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: typeof Clock;
  color: string;
  clientMessage?: string; // Mensagem específica para o cliente
  professionalMessage?: string; // Mensagem específica para o profissional
}

// Configuração simplificada para clientes
export const CLIENT_STATUS_CONFIG: Record<SimplifiedClientStatus, ServiceStatusInfo> = {
  pending: {
    label: "Aguardando Orçamentos",
    description: "Seu pedido foi publicado e profissionais podem enviar orçamentos",
    progress: 10,
    variant: "secondary",
    icon: Clock,
    color: "text-blue-600",
    clientMessage: "Seu pedido está ativo! Aguarde os orçamentos."
  },
  quoted: {
    label: "Orçamentos Recebidos", 
    description: "Você recebeu orçamentos. Analise e escolha o melhor",
    progress: 25,
    variant: "default",
    icon: DollarSign,
    color: "text-green-600",
    clientMessage: "Orçamentos disponíveis! Escolha o que mais se adequa."
  },
  accepted: {
    label: "Orçamento Aceito",
    description: "Orçamento aceito! O profissional foi notificado",
    progress: 35,
    variant: "default", 
    icon: CheckCircle,
    color: "text-indigo-600",
    clientMessage: "Orçamento aceito! O profissional iniciará o atendimento."
  },
  professional_on_way: {
    label: "Profissional a Caminho",
    description: "O profissional está indo até o local do serviço",
    progress: 50,
    variant: "default",
    icon: Car,
    color: "text-blue-600",
    clientMessage: "Seu profissional está a caminho! Prepare-se para recebê-lo."
  },
  service_started: {
    label: "Serviço Iniciado",
    description: "O profissional chegou e iniciou o trabalho",
    progress: 60,
    variant: "default",
    icon: Play,
    color: "text-purple-600",
    clientMessage: "Serviço iniciado! O profissional está trabalhando."
  },
  service_in_progress: {
    label: "Serviço em Execução",
    description: "O profissional está executando o serviço",
    progress: 75,
    variant: "default",
    icon: Play,
    color: "text-orange-600",
    clientMessage: "Trabalho em andamento! Acompanhe o progresso."
  },
  awaiting_client: {
    label: "Aguardando Cliente",
    description: "Serviço finalizado. Aguardando confirmação e pagamento",
    progress: 90,
    variant: "default",
    icon: Clock3,
    color: "text-amber-600",
    clientMessage: "Serviço finalizado! Confirme a conclusão e efetue o pagamento."
  },
  completed: {
    label: "Serviço Concluído",
    description: "Serviço finalizado com sucesso! Avalie o profissional",
    progress: 100,
    variant: "default",
    icon: Star,
    color: "text-emerald-600",
    clientMessage: "Concluído com sucesso! Não esqueça de avaliar o profissional."
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

// Configuração detalhada para profissionais
export const PROFESSIONAL_STATUS_CONFIG: Record<DetailedProfessionalStatus, ServiceStatusInfo> = {
  pending: {
    label: "Aguardando Orçamentos",
    description: "Cliente aguarda orçamentos dos profissionais",
    progress: 10,
    variant: "secondary",
    icon: Clock,
    color: "text-blue-600",
    professionalMessage: "Envie seu orçamento para este cliente."
  },
  quoted: {
    label: "Orçamento Enviado",
    description: "Aguardando o cliente aceitar seu orçamento",
    progress: 25,
    variant: "default",
    icon: DollarSign,
    color: "text-green-600",
    professionalMessage: "Orçamento enviado! Aguarde a resposta do cliente."
  },
  accepted: {
    label: "Orçamento Aceito",
    description: "Cliente aceitou seu orçamento. Prepare-se para o atendimento",
    progress: 35,
    variant: "default",
    icon: CheckCircle,
    color: "text-indigo-600",
    professionalMessage: "Parabéns! Seu orçamento foi aceito. Inicie o atendimento."
  },
  on_way: {
    label: "A Caminho",
    description: "Você está indo para o local do serviço",
    progress: 45,
    variant: "default",
    icon: Car,
    color: "text-blue-600",
    professionalMessage: "Vá até o local. Clique em 'Chegou' quando chegar."
  },
  arrived: {
    label: "Chegou no Local",
    description: "Você chegou no local. Pronto para iniciar?",
    progress: 55,
    variant: "default",
    icon: MapPin,
    color: "text-purple-600",
    professionalMessage: "Chegou! Clique em 'Iniciar Serviço' quando começar o trabalho."
  },
  service_started: {
    label: "Serviço Iniciado",
    description: "Você iniciou a execução do serviço",
    progress: 65,
    variant: "default",
    icon: Play,
    color: "text-purple-600",
    professionalMessage: "Serviço iniciado! Execute conforme combinado."
  },
  in_progress: {
    label: "Em Execução",
    description: "Executando o serviço conforme combinado",
    progress: 75,
    variant: "default",
    icon: Play,
    color: "text-orange-600",
    professionalMessage: "Continue o trabalho. Marque como concluído quando finalizar."
  },
  awaiting_confirmation: {
    label: "Aguardando Confirmação",
    description: "Aguardando cliente confirmar a conclusão",
    progress: 85,
    variant: "default",
    icon: Clock3,
    color: "text-amber-600",
    professionalMessage: "Trabalho finalizado! Aguarde confirmação do cliente."
  },
  awaiting_payment: {
    label: "Aguardando Pagamento",
    description: "Cliente confirmou. Aguardando pagamento",
    progress: 95,
    variant: "default",
    icon: CreditCard,
    color: "text-green-600",
    professionalMessage: "Cliente confirmou! Aguarde o pagamento ser processado."
  },
  completed: {
    label: "Concluído",
    description: "Serviço finalizado e pago com sucesso",
    progress: 100,
    variant: "default",
    icon: Star,
    color: "text-emerald-600",
    professionalMessage: "Parabéns! Serviço concluído com sucesso."
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
    description: "Há uma disputa ativa sendo mediada",
    progress: 0,
    variant: "destructive",
    icon: Users,
    color: "text-red-600"
  }
};

interface ImprovedServiceStatusFlowProps {
  currentStatus: DetailedProfessionalStatus;
  userRole: 'client' | 'professional';
  showDescription?: boolean;
  showProgress?: boolean;
  compact?: boolean;
}

// Mapeamento de status detalhado para simplificado (para clientes)
export function mapToClientStatus(professionalStatus: DetailedProfessionalStatus): SimplifiedClientStatus {
  const mapping: Record<DetailedProfessionalStatus, SimplifiedClientStatus> = {
    pending: 'pending',
    quoted: 'quoted',
    accepted: 'accepted',
    on_way: 'professional_on_way',
    arrived: 'professional_on_way', // Agrupa com "a caminho"
    service_started: 'service_started',
    in_progress: 'service_in_progress',
    awaiting_confirmation: 'awaiting_client', // Agrupa aguardando
    awaiting_payment: 'awaiting_client', // Agrupa aguardando
    completed: 'completed',
    cancelled: 'cancelled',
    disputed: 'disputed'
  };
  
  return mapping[professionalStatus];
}

export function ImprovedServiceStatusFlow({ 
  currentStatus, 
  userRole,
  showDescription = true, 
  showProgress = true,
  compact = false 
}: ImprovedServiceStatusFlowProps) {
  
  // Usa configuração apropriada baseada no tipo de usuário
  const statusConfig = userRole === 'client' ? CLIENT_STATUS_CONFIG : PROFESSIONAL_STATUS_CONFIG;
  const displayStatus = userRole === 'client' ? mapToClientStatus(currentStatus) : currentStatus;
  const statusInfo = statusConfig[displayStatus as keyof typeof statusConfig];
  const Icon = statusInfo.icon;

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
              <p className="text-sm text-muted-foreground">
                {userRole === 'client' ? statusInfo.clientMessage : statusInfo.professionalMessage}
              </p>
            )}
          </div>
        </div>
        <Badge variant={statusInfo.variant}>{statusInfo.progress}%</Badge>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <Progress value={statusInfo.progress} className="h-2" />
      )}

      {/* Simplified Flow Steps for Client */}
      {userRole === 'client' && (
        <div className="space-y-3">
          {Object.entries(CLIENT_STATUS_CONFIG).slice(0, -2).map(([step, stepInfo], index) => {
            const StepIcon = stepInfo.icon;
            const isCompleted = stepInfo.progress <= statusInfo.progress;
            const isCurrent = step === displayStatus;
            
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
                {index < Object.keys(CLIENT_STATUS_CONFIG).length - 3 && (
                  <div className={`w-0.5 h-4 ml-7 ${
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  } transition-colors`} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Flow Steps for Professional */}
      {userRole === 'professional' && (
        <div className="space-y-3">
          {Object.entries(PROFESSIONAL_STATUS_CONFIG).slice(0, -2).map(([step, stepInfo], index) => {
            const StepIcon = stepInfo.icon;
            const isCompleted = stepInfo.progress <= statusInfo.progress;
            const isCurrent = step === currentStatus;
            
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
                {index < Object.keys(PROFESSIONAL_STATUS_CONFIG).length - 3 && (
                  <div className={`w-0.5 h-4 ml-7 ${
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  } transition-colors`} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Função para determinar próximo status válido
export function getNextValidStatus(currentStatus: DetailedProfessionalStatus, userRole: 'client' | 'professional'): DetailedProfessionalStatus | null {
  const transitions: Record<DetailedProfessionalStatus, { client?: DetailedProfessionalStatus; professional?: DetailedProfessionalStatus }> = {
    pending: {},
    quoted: {
      client: 'accepted'
    },
    accepted: {
      professional: 'on_way'
    },
    on_way: {
      professional: 'arrived'
    },
    arrived: {
      professional: 'service_started' // Novo status explícito
    },
    service_started: {
      professional: 'in_progress'
    },
    in_progress: {
      professional: 'awaiting_confirmation'
    },
    awaiting_confirmation: {
      client: 'awaiting_payment'
    },
    awaiting_payment: {
      client: 'completed',
      professional: 'completed'
    },
    completed: {},
    cancelled: {},
    disputed: {}
  };

  return transitions[currentStatus]?.[userRole] || null;
}