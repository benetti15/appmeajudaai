// Extended status types for the complete service flow
export type ExtendedServiceStatus = 
  | 'pending'           // Aguardando orçamentos
  | 'quoted'            // Orçamentos recebidos
  | 'accepted'          // Orçamento aceito
  | 'on_way'            // Profissional a caminho
  | 'arrived'           // Chegou no local
  | 'in_progress'       // Serviço em execução
  | 'awaiting_client_confirmation' // Aguardando confirmação do cliente
  | 'payment_confirmed' // Pagamento confirmado
  | 'completed'         // Finalizado
  // Exception states
  | 'cancelled_by_client'
  | 'cancelled_by_professional'
  | 'client_absent'
  | 'reschedule_requested'
  | 'rescheduled'
  | 'disputed'
  | 'payment_failed';

export interface StatusConfig {
  label: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  progress: number;
  clientMessage?: string;
  professionalMessage?: string;
}

export const STATUS_CONFIG: Record<ExtendedServiceStatus, StatusConfig> = {
  pending: {
    label: "Aguardando Orçamentos",
    description: "Profissionais estão sendo notificados",
    icon: "Clock",
    color: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-200",
    progress: 0,
    clientMessage: "Aguardando propostas de profissionais...",
    professionalMessage: "Envie seu orçamento para este serviço"
  },
  quoted: {
    label: "Orçamentos Recebidos",
    description: "Analise as propostas e escolha o melhor profissional",
    icon: "FileText",
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    progress: 10,
    clientMessage: "Você tem orçamentos para analisar",
    professionalMessage: "Aguardando resposta do cliente..."
  },
  accepted: {
    label: "Orçamento Aceito",
    description: "Aguardando profissional iniciar o atendimento",
    icon: "CheckCircle",
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
    progress: 20,
    clientMessage: "Aguardando o profissional iniciar o atendimento",
    professionalMessage: "O cliente aceitou seu orçamento! Inicie o atendimento"
  },
  on_way: {
    label: "Profissional a Caminho",
    description: "O profissional está se deslocando até o local",
    icon: "Navigation",
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    progress: 35,
    clientMessage: "🚗 O profissional está a caminho!",
    professionalMessage: "Você está a caminho do local"
  },
  arrived: {
    label: "Chegou no Local",
    description: "O profissional chegou no endereço",
    icon: "MapPin",
    color: "text-purple-600",
    bgColor: "bg-purple-50 border-purple-200",
    progress: 50,
    clientMessage: "📍 O profissional chegou!",
    professionalMessage: "Você chegou! Inicie o serviço quando estiver pronto"
  },
  in_progress: {
    label: "Serviço em Execução",
    description: "O trabalho está sendo realizado",
    icon: "Wrench",
    color: "text-primary",
    bgColor: "bg-primary/10 border-primary/20",
    progress: 65,
    clientMessage: "🔧 Serviço em execução...",
    professionalMessage: "Você está executando o serviço"
  },
  awaiting_client_confirmation: {
    label: "Aguardando Confirmação",
    description: "Profissional finalizou, aguardando confirmação do cliente",
    icon: "ClipboardCheck",
    color: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-200",
    progress: 80,
    clientMessage: "✅ Serviço finalizado! Confirme a conclusão",
    professionalMessage: "Aguardando cliente confirmar e pagar"
  },
  payment_confirmed: {
    label: "Pagamento Confirmado",
    description: "O cliente confirmou o pagamento",
    icon: "CreditCard",
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
    progress: 95,
    clientMessage: "💳 Pagamento confirmado!",
    professionalMessage: "💳 Pagamento confirmado pelo cliente!"
  },
  completed: {
    label: "Finalizado",
    description: "Serviço concluído com sucesso",
    icon: "CheckCircle2",
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
    progress: 100,
    clientMessage: "🎉 Serviço finalizado com sucesso!",
    professionalMessage: "🎉 Parabéns! Serviço concluído!"
  },
  // Exception states
  cancelled_by_client: {
    label: "Cancelado pelo Cliente",
    description: "O cliente cancelou este serviço",
    icon: "XCircle",
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
    progress: 0,
    clientMessage: "Você cancelou este serviço",
    professionalMessage: "O cliente cancelou este serviço"
  },
  cancelled_by_professional: {
    label: "Cancelado pelo Profissional",
    description: "O profissional cancelou este serviço",
    icon: "XCircle",
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
    progress: 0,
    clientMessage: "O profissional cancelou este serviço",
    professionalMessage: "Você cancelou este serviço"
  },
  client_absent: {
    label: "Cliente Ausente",
    description: "O profissional chegou mas o cliente não está no local",
    icon: "UserX",
    color: "text-orange-600",
    bgColor: "bg-orange-50 border-orange-200",
    progress: 50,
    clientMessage: "⚠️ O profissional não conseguiu te encontrar",
    professionalMessage: "Cliente ausente no local"
  },
  reschedule_requested: {
    label: "Reagendamento Solicitado",
    description: "Uma das partes solicitou reagendamento",
    icon: "CalendarClock",
    color: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-200",
    progress: 20,
    clientMessage: "Solicitação de reagendamento pendente",
    professionalMessage: "Solicitação de reagendamento pendente"
  },
  rescheduled: {
    label: "Reagendado",
    description: "Nova data confirmada",
    icon: "Calendar",
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    progress: 20,
    clientMessage: "Serviço reagendado",
    professionalMessage: "Serviço reagendado"
  },
  disputed: {
    label: "Em Disputa",
    description: "Há um problema a ser resolvido",
    icon: "AlertTriangle",
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
    progress: 80,
    clientMessage: "Disputa em análise pelo suporte",
    professionalMessage: "Disputa em análise pelo suporte"
  },
  payment_failed: {
    label: "Falha no Pagamento",
    description: "Houve um problema com o pagamento",
    icon: "CreditCard",
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
    progress: 80,
    clientMessage: "❌ Problema no pagamento. Tente novamente",
    professionalMessage: "⚠️ Falha no pagamento do cliente"
  }
};

// Valid transitions map
export const VALID_TRANSITIONS: Record<ExtendedServiceStatus, { next: ExtendedServiceStatus[]; allowedBy: ('client' | 'professional' | 'system')[] }> = {
  pending: { next: ['quoted', 'cancelled_by_client'], allowedBy: ['system', 'client'] },
  quoted: { next: ['accepted', 'cancelled_by_client'], allowedBy: ['client'] },
  accepted: { next: ['on_way', 'cancelled_by_client', 'cancelled_by_professional', 'reschedule_requested'], allowedBy: ['professional', 'client'] },
  on_way: { next: ['arrived', 'cancelled_by_professional', 'reschedule_requested'], allowedBy: ['professional'] },
  arrived: { next: ['in_progress', 'client_absent'], allowedBy: ['professional'] },
  in_progress: { next: ['awaiting_client_confirmation'], allowedBy: ['professional'] },
  awaiting_client_confirmation: { next: ['payment_confirmed', 'disputed', 'payment_failed'], allowedBy: ['client', 'system'] },
  payment_confirmed: { next: ['completed'], allowedBy: ['system'] },
  completed: { next: [], allowedBy: [] },
  // Exception states
  cancelled_by_client: { next: [], allowedBy: [] },
  cancelled_by_professional: { next: [], allowedBy: [] },
  client_absent: { next: ['arrived', 'cancelled_by_professional', 'reschedule_requested'], allowedBy: ['professional', 'client'] },
  reschedule_requested: { next: ['rescheduled', 'cancelled_by_client', 'cancelled_by_professional'], allowedBy: ['client', 'professional'] },
  rescheduled: { next: ['on_way'], allowedBy: ['professional'] },
  disputed: { next: ['completed', 'cancelled_by_client'], allowedBy: ['system'] },
  payment_failed: { next: ['payment_confirmed', 'disputed'], allowedBy: ['client', 'system'] }
};

// Error messages for invalid transitions
export const TRANSITION_ERROR_MESSAGES: Record<string, string> = {
  CANNOT_START_WITHOUT_ACCEPTANCE: "Aguarde o cliente aceitar seu orçamento antes de iniciar.",
  CANNOT_ARRIVE_WITHOUT_START: "Você precisa iniciar o atendimento antes de confirmar chegada.",
  CANNOT_EXECUTE_WITHOUT_ARRIVAL: "Confirme sua chegada no local antes de iniciar o serviço.",
  CANNOT_COMPLETE_WITHOUT_EXECUTION: "O serviço precisa estar em execução para ser marcado como concluído.",
  CANNOT_PAY_WITHOUT_COMPLETION: "O profissional ainda não finalizou o serviço.",
  CANNOT_CANCEL_IN_PROGRESS: "Não é possível cancelar após o serviço ter iniciado. Entre em contato com o suporte.",
  ONLY_PROFESSIONAL_CAN_UPDATE: "Apenas o profissional contratado pode atualizar o status do serviço.",
  ONLY_CLIENT_CAN_CONFIRM: "Apenas o cliente pode confirmar a conclusão e pagamento.",
  INVALID_TRANSITION: "Esta transição de status não é permitida."
};

// Timeline steps for visual display
export const TIMELINE_STEPS: { status: ExtendedServiceStatus; label: string }[] = [
  { status: 'accepted', label: 'Orçamento Aceito' },
  { status: 'on_way', label: 'A Caminho' },
  { status: 'arrived', label: 'Chegou no Local' },
  { status: 'in_progress', label: 'Em Execução' },
  { status: 'awaiting_client_confirmation', label: 'Aguardando Confirmação' },
  { status: 'payment_confirmed', label: 'Pagamento Confirmado' },
  { status: 'completed', label: 'Finalizado' }
];

// Helper function to check if a transition is valid
export function isValidTransition(
  currentStatus: ExtendedServiceStatus,
  newStatus: ExtendedServiceStatus,
  userRole: 'client' | 'professional'
): { valid: boolean; error?: string } {
  const transition = VALID_TRANSITIONS[currentStatus];
  
  if (!transition.next.includes(newStatus)) {
    return { valid: false, error: TRANSITION_ERROR_MESSAGES.INVALID_TRANSITION };
  }
  
  if (!transition.allowedBy.includes(userRole) && !transition.allowedBy.includes('system')) {
    if (userRole === 'client') {
      return { valid: false, error: TRANSITION_ERROR_MESSAGES.ONLY_PROFESSIONAL_CAN_UPDATE };
    }
    return { valid: false, error: TRANSITION_ERROR_MESSAGES.ONLY_CLIENT_CAN_CONFIRM };
  }
  
  return { valid: true };
}

// Get the next valid status for CTA buttons
export function getNextStatus(
  currentStatus: ExtendedServiceStatus,
  userRole: 'client' | 'professional'
): ExtendedServiceStatus | null {
  const transition = VALID_TRANSITIONS[currentStatus];
  
  // Filter for main flow transitions (not cancellation/exception states)
  const mainFlowNext = transition.next.filter(s => 
    !s.includes('cancelled') && 
    !s.includes('absent') && 
    !s.includes('reschedule') &&
    !s.includes('disputed') &&
    !s.includes('failed')
  );
  
  if (mainFlowNext.length === 0) return null;
  
  // Check if user can trigger this transition
  if (!transition.allowedBy.includes(userRole) && !transition.allowedBy.includes('system')) {
    return null;
  }
  
  return mainFlowNext[0];
}
