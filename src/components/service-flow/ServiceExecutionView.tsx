import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Phone, MessageCircle, MapPin, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ServiceTimeline } from "./ServiceTimeline";
import { StatusTransitionButton } from "./StatusTransitionButton";
import { ExtendedServiceStatus, STATUS_CONFIG, isValidTransition } from "./types";
import { cn } from "@/lib/utils";
import { CancellationDialog } from "./CancellationDialog";
import { RescheduleDialog } from "./RescheduleDialog";
import { DisputeDialog } from "./DisputeDialog";

interface ServiceExecutionViewProps {
  requestId: string;
  currentStatus: ExtendedServiceStatus;
  userRole: 'client' | 'professional';
  serviceAmount: number;
  professionalInfo?: {
    id: string;
    full_name: string;
    phone?: string;
    avatar_url?: string;
  };
  clientInfo?: {
    id: string;
    full_name: string;
    phone?: string;
  };
  address: string;
  onStatusChange?: () => void;
}

export function ServiceExecutionView({
  requestId,
  currentStatus,
  userRole,
  serviceAmount,
  professionalInfo,
  clientInfo,
  address,
  onStatusChange
}: ServiceExecutionViewProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<ExtendedServiceStatus>(currentStatus);
  const [timestamps, setTimestamps] = useState<Record<string, string>>({});
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  
  // Real-time status subscription
  useEffect(() => {
    const channel = supabase
      .channel(`service-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests',
          filter: `id=eq.${requestId}`
        },
        (payload) => {
          const newStatus = payload.new.extended_status as ExtendedServiceStatus;
          if (newStatus && newStatus !== status) {
            setStatus(newStatus);
            onStatusChange?.();
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, status, onStatusChange]);
  
  // Fetch status history for timestamps
  useEffect(() => {
    fetchStatusHistory();
  }, [requestId]);
  
  const fetchStatusHistory = async () => {
    const { data } = await supabase
      .from('service_status_history')
      .select('status, created_at')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });
    
    if (data) {
      const ts: Record<string, string> = {};
      data.forEach(entry => {
        ts[entry.status] = entry.created_at;
      });
      setTimestamps(ts);
    }
  };
  
  const handleTransition = async (newStatus: ExtendedServiceStatus, notes?: string) => {
    // Validate transition
    const validation = isValidTransition(status, newStatus, userRole);
    if (!validation.valid) {
      toast({
        title: "Ação não permitida",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Update service request status
      const { error: updateError } = await supabase
        .from('service_requests')
        .update({ 
          extended_status: newStatus,
          status: mapToLegacyStatus(newStatus),
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);
      
      if (updateError) throw updateError;
      
      // Log to status history
      const { error: historyError } = await supabase
        .from('service_status_history')
        .insert({
          request_id: requestId,
          status: newStatus,
          changed_by: userRole === 'client' ? clientInfo?.id : professionalInfo?.id,
          notes
        });
      
      if (historyError) console.error('Failed to log status history:', historyError);
      
      // Send notification to other party
      await sendStatusNotification(newStatus);
      
      // Update local state
      setStatus(newStatus);
      setTimestamps(prev => ({ ...prev, [newStatus]: new Date().toISOString() }));
      
      toast({
        title: "Status atualizado",
        description: STATUS_CONFIG[newStatus].label
      });
      
      onStatusChange?.();
      
      // Auto-complete after payment
      if (newStatus === 'payment_confirmed') {
        setTimeout(() => {
          handleTransition('completed');
        }, 2000);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive"
      });
    }
  };
  
  const sendStatusNotification = async (newStatus: ExtendedServiceStatus) => {
    const targetUserId = userRole === 'client' ? professionalInfo?.id : clientInfo?.id;
    if (!targetUserId) return;
    
    const config = STATUS_CONFIG[newStatus];
    const message = userRole === 'client' 
      ? config.professionalMessage 
      : config.clientMessage;
    
    await supabase.from('notifications').insert({
      user_id: targetUserId,
      title: config.label,
      message: message || config.description,
      type: 'service_status',
      related_id: requestId
    });
  };
  
  const mapToLegacyStatus = (extStatus: ExtendedServiceStatus): string => {
    const mapping: Record<ExtendedServiceStatus, string> = {
      pending: 'pending',
      quoted: 'pending',
      accepted: 'accepted',
      on_way: 'in_progress',
      arrived: 'in_progress',
      in_progress: 'in_progress',
      awaiting_client_confirmation: 'in_progress',
      payment_confirmed: 'in_progress',
      completed: 'completed',
      cancelled_by_client: 'cancelled',
      cancelled_by_professional: 'cancelled',
      client_absent: 'in_progress',
      reschedule_requested: 'accepted',
      rescheduled: 'accepted',
      disputed: 'in_progress',
      payment_failed: 'in_progress'
    };
    return mapping[extStatus] || 'pending';
  };
  
  const handleCancel = async (reason: string) => {
    const cancelStatus = userRole === 'client' ? 'cancelled_by_client' : 'cancelled_by_professional';
    await handleTransition(cancelStatus as ExtendedServiceStatus, reason);
    setShowCancelDialog(false);
  };
  
  const handleReschedule = async (newDate: Date, reason: string) => {
    await handleTransition('reschedule_requested', `Nova data: ${newDate.toLocaleDateString('pt-BR')} - ${reason}`);
    setShowRescheduleDialog(false);
  };
  
  const handleDispute = async (reason: string) => {
    await handleTransition('disputed', reason);
    setShowDisputeDialog(false);
  };
  
  const statusConfig = STATUS_CONFIG[status];
  const contactInfo = userRole === 'client' ? professionalInfo : clientInfo;
  const contactLabel = userRole === 'client' ? 'Profissional' : 'Cliente';
  
  return (
    <div className="space-y-4">
      {/* Status Banner */}
      <div className={cn(
        "p-4 rounded-2xl border",
        statusConfig.bgColor
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-full bg-background",
            statusConfig.color
          )}>
            <div className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className={cn("font-semibold", statusConfig.color)}>
              {statusConfig.label}
            </p>
            <p className="text-sm text-muted-foreground">
              {userRole === 'client' ? statusConfig.clientMessage : statusConfig.professionalMessage}
            </p>
          </div>
        </div>
      </div>
      
      {/* Action Button - MOVED TO TOP */}
      <div className="pt-2">
        <StatusTransitionButton
          currentStatus={status}
          userRole={userRole}
          onTransition={handleTransition}
          serviceAmount={serviceAmount}
          showSecondaryActions={true}
          onCancel={() => setShowCancelDialog(true)}
          onReschedule={() => setShowRescheduleDialog(true)}
          onDispute={() => setShowDisputeDialog(true)}
        />
      </div>
      
      {/* Completed - Review CTA */}
      {status === 'completed' && userRole === 'client' && (
        <Button 
          className="w-full gap-2"
          variant="outline"
          onClick={() => navigate(`/review/${requestId}`)}
        >
          <Star className="w-4 h-4" />
          Avaliar Profissional
        </Button>
      )}
      
      {/* Service Info Card - Client details, address and amount */}
      <Card className="p-4 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <h3 className="font-medium text-sm text-muted-foreground mb-3">
          Detalhes do Serviço
        </h3>
        
        {/* Client/Professional Name */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="w-10 h-10 border-2 border-primary/20">
            <AvatarImage src={userRole === 'client' ? professionalInfo?.avatar_url : undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
              {contactInfo?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">
              {contactInfo?.full_name || (userRole === 'client' ? 'Profissional' : 'Cliente')}
            </p>
            <p className="text-xs text-muted-foreground">
              {userRole === 'client' ? 'Profissional contratado' : 'Cliente'}
            </p>
          </div>
        </div>
        
        {/* Address */}
        <div className="flex items-start gap-3 mb-3 p-3 rounded-xl bg-background/50">
          <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-foreground text-sm">{address}</p>
        </div>
        
        {/* Accepted Quote Amount */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10">
          <span className="text-sm text-muted-foreground">Valor acordado</span>
          <span className="text-lg font-bold text-primary">
            R$ {serviceAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </Card>
      
      {/* Timeline */}
      <Card className="p-4">
        <h3 className="font-medium text-sm text-muted-foreground mb-4">
          Progresso do Serviço
        </h3>
        <ServiceTimeline 
          currentStatus={status}
          userRole={userRole}
          timestamps={timestamps}
        />
      </Card>
      
      {/* Contact Card */}
      {contactInfo && (
        <Card className="p-4">
          <h3 className="font-medium text-sm text-muted-foreground mb-3">
            {contactLabel}
          </h3>
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border">
              <AvatarImage src={userRole === 'client' ? professionalInfo?.avatar_url : undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {contactInfo.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{contactInfo.full_name}</p>
              <p className="text-sm text-primary font-semibold">
                R$ {serviceAmount.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-3">
            {contactInfo.phone && (
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => window.open(`tel:${contactInfo.phone}`, '_self')}
              >
                <Phone className="w-4 h-4" />
                Ligar
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => navigate(`/chat/${requestId}`)}
            >
              <MessageCircle className="w-4 h-4" />
              Conversar
            </Button>
          </div>
        </Card>
      )}
      
      {/* Dialogs */}
      <CancellationDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        userRole={userRole}
        onConfirm={handleCancel}
      />
      
      <RescheduleDialog
        open={showRescheduleDialog}
        onOpenChange={setShowRescheduleDialog}
        onConfirm={handleReschedule}
      />
      
      <DisputeDialog
        open={showDisputeDialog}
        onOpenChange={setShowDisputeDialog}
        onConfirm={handleDispute}
      />
    </div>
  );
}
