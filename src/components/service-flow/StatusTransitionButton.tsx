import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  Navigation, 
  MapPin, 
  Wrench, 
  CheckCircle2, 
  CreditCard,
  Star,
  Loader2,
  AlertTriangle,
  XCircle,
  Calendar
} from "lucide-react";
import { ExtendedServiceStatus, getNextStatus, STATUS_CONFIG, isValidTransition } from "./types";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

interface StatusTransitionButtonProps {
  currentStatus: ExtendedServiceStatus;
  userRole: 'client' | 'professional';
  onTransition: (newStatus: ExtendedServiceStatus, notes?: string) => Promise<void>;
  serviceAmount?: number;
  disabled?: boolean;
  className?: string;
  showSecondaryActions?: boolean;
  onCancel?: () => void;
  onReschedule?: () => void;
  onDispute?: () => void;
}

const STATUS_BUTTON_CONFIG: Record<ExtendedServiceStatus, {
  professionalButton?: { label: string; icon: React.ElementType; variant?: 'default' | 'destructive' };
  clientButton?: { label: string; icon: React.ElementType; variant?: 'default' | 'destructive' };
  nextStatus?: ExtendedServiceStatus;
}> = {
  accepted: {
    professionalButton: { label: "Iniciar Atendimento", icon: Play },
    nextStatus: 'on_way'
  },
  on_way: {
    professionalButton: { label: "Chegou ao Local", icon: MapPin },
    nextStatus: 'arrived'
  },
  arrived: {
    professionalButton: { label: "Iniciar Serviço", icon: Wrench },
    nextStatus: 'in_progress'
  },
  in_progress: {
    professionalButton: { label: "Marcar como Concluído", icon: CheckCircle2 },
    nextStatus: 'awaiting_client_confirmation'
  },
  awaiting_client_confirmation: {
    clientButton: { label: "Confirmar e Pagar", icon: CreditCard },
    nextStatus: 'payment_confirmed'
  },
  payment_confirmed: {
    professionalButton: { label: "Finalizar Serviço", icon: CheckCircle2 },
    nextStatus: 'completed'
  },
  completed: {
    clientButton: { label: "Avaliar Profissional", icon: Star }
  },
  // Other states
  pending: {},
  quoted: {},
  cancelled_by_client: {},
  cancelled_by_professional: {},
  client_absent: {
    professionalButton: { label: "Tentar Novamente", icon: MapPin },
    nextStatus: 'arrived'
  },
  reschedule_requested: {},
  rescheduled: {
    professionalButton: { label: "Iniciar Atendimento", icon: Play },
    nextStatus: 'on_way'
  },
  disputed: {},
  payment_failed: {
    clientButton: { label: "Tentar Novamente", icon: CreditCard },
    nextStatus: 'payment_confirmed'
  }
};

export function StatusTransitionButton({
  currentStatus,
  userRole,
  onTransition,
  serviceAmount,
  disabled,
  className,
  showSecondaryActions = true,
  onCancel,
  onReschedule,
  onDispute
}: StatusTransitionButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [notes, setNotes] = useState("");
  const [pendingStatus, setPendingStatus] = useState<ExtendedServiceStatus | null>(null);
  
  const config = STATUS_BUTTON_CONFIG[currentStatus];
  const buttonConfig = userRole === 'professional' ? config?.professionalButton : config?.clientButton;
  const nextStatus = config?.nextStatus;
  
  // Check if user can perform this action
  const canPerformAction = nextStatus ? isValidTransition(currentStatus, nextStatus, userRole).valid : false;
  
  const handleClick = () => {
    if (!nextStatus) return;
    
    // Show confirmation for important transitions
    if (currentStatus === 'in_progress' || currentStatus === 'awaiting_client_confirmation') {
      setPendingStatus(nextStatus);
      setShowConfirmDialog(true);
    } else {
      performTransition(nextStatus);
    }
  };
  
  const performTransition = async (status: ExtendedServiceStatus) => {
    setLoading(true);
    try {
      await onTransition(status, notes);
      setNotes("");
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
      setPendingStatus(null);
    }
  };
  
  // No button to show
  if (!buttonConfig || !canPerformAction) {
    // Show waiting message instead
    const statusConfig = STATUS_CONFIG[currentStatus];
    const message = userRole === 'client' 
      ? statusConfig.clientMessage 
      : statusConfig.professionalMessage;
    
    // Check if this is a terminal state
    if (currentStatus === 'completed' || currentStatus.includes('cancelled')) {
      return null;
    }
    
    // Show secondary actions only
    if (showSecondaryActions && (onCancel || onReschedule || onDispute)) {
      const canCancel = ['accepted', 'on_way', 'arrived'].includes(currentStatus);
      const canReschedule = ['accepted', 'on_way'].includes(currentStatus);
      const canDispute = currentStatus === 'awaiting_client_confirmation';
      
      return (
        <div className={cn("space-y-2", className)}>
          {message && (
            <p className="text-sm text-muted-foreground text-center py-2">
              {message}
            </p>
          )}
          <div className="flex gap-2">
            {canReschedule && onReschedule && userRole === 'professional' && (
              <Button variant="outline" className="flex-1 gap-2" onClick={onReschedule}>
                <Calendar className="w-4 h-4" />
                Reagendar
              </Button>
            )}
            {canCancel && onCancel && (
              <Button variant="outline" className="flex-1 gap-2 text-destructive" onClick={onCancel}>
                <XCircle className="w-4 h-4" />
                Cancelar
              </Button>
            )}
            {canDispute && onDispute && userRole === 'client' && (
              <Button variant="outline" className="flex-1 gap-2 text-destructive" onClick={onDispute}>
                <AlertTriangle className="w-4 h-4" />
                Reportar Problema
              </Button>
            )}
          </div>
        </div>
      );
    }
    
    if (message) {
      return (
        <div className={cn("text-center py-3 px-4 rounded-xl bg-muted/50", className)}>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      );
    }
    
    return null;
  }
  
  const Icon = buttonConfig.icon;
  const label = currentStatus === 'awaiting_client_confirmation' && serviceAmount
    ? `${buttonConfig.label} - R$ ${serviceAmount.toLocaleString('pt-BR')}`
    : buttonConfig.label;
  
  return (
    <>
      <div className={cn("space-y-2", className)}>
        <Button
          className={cn(
            "w-full h-14 text-base gap-2 rounded-xl",
            buttonConfig.variant === 'destructive' && "bg-destructive hover:bg-destructive/90"
          )}
          onClick={handleClick}
          disabled={disabled || loading}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Icon className="w-5 h-5" />
          )}
          {label}
        </Button>
        
        {/* Secondary actions */}
        {showSecondaryActions && (
          <div className="flex gap-2">
            {['accepted', 'on_way'].includes(currentStatus) && onReschedule && userRole === 'professional' && (
              <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={onReschedule}>
                <Calendar className="w-3 h-3 mr-1" />
                Reagendar
              </Button>
            )}
            {['accepted', 'on_way', 'arrived'].includes(currentStatus) && onCancel && (
              <Button variant="ghost" size="sm" className="flex-1 text-xs text-muted-foreground" onClick={onCancel}>
                <XCircle className="w-3 h-3 mr-1" />
                {userRole === 'client' ? 'Cancelar' : 'Desistir'}
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {currentStatus === 'in_progress' 
                ? "Confirmar conclusão do serviço?" 
                : "Confirmar pagamento?"
              }
            </AlertDialogTitle>
            <AlertDialogDescription>
              {currentStatus === 'in_progress' 
                ? "O cliente será notificado para confirmar a conclusão e efetuar o pagamento."
                : `Confirme que o serviço foi concluído satisfatoriamente e o pagamento de R$ ${serviceAmount?.toLocaleString('pt-BR') || '---'} foi realizado.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {currentStatus === 'in_progress' && (
            <div className="py-2">
              <label className="text-sm font-medium mb-2 block">
                Observações (opcional)
              </label>
              <Textarea
                placeholder="Adicione detalhes sobre o serviço realizado..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => pendingStatus && performTransition(pendingStatus)}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
