import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  CheckCircle, 
  MessageCircle, 
  Phone, 
  MapPin, 
  Star,
  AlertTriangle,
  DollarSign,
  Car,
  Clock,
  CreditCard
} from "lucide-react";
import { ServiceStatus, ExtendedServiceStatus, SERVICE_STATUS_CONFIG, getNextValidStatus } from "./ServiceStatusFlow";
import { ArrivalEstimator } from "./ArrivalEstimator";
import { MutualConfirmation } from "./MutualConfirmation";

import { TemporarySupportSystem } from "../TemporarySupportSystem";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface EnhancedServiceActionsProps {
  requestId: string;
  currentStatus: ExtendedServiceStatus;
  userRole: 'client' | 'professional';
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
  serviceAmount?: number;
  onStatusUpdate?: () => void;
  onOptimisticStatusChange?: (status: ExtendedServiceStatus | null) => void;
}

export function EnhancedServiceActions({
  requestId,
  currentStatus,
  userRole,
  professionalInfo,
  clientInfo,
  serviceAmount,
  onStatusUpdate,
  onOptimisticStatusChange
}: EnhancedServiceActionsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [arrivalEstimate, setArrivalEstimate] = useState<number | null>(null);
  const [optimisticStatus, setOptimisticStatus] = useState<ExtendedServiceStatus | null>(null);

  // Fetch extended_status from database on mount
  useEffect(() => {
    fetchExtendedStatus();
  }, [requestId]);

  const fetchExtendedStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("service_requests")
        .select("extended_status")
        .eq("id", requestId)
        .single();

      if (error) throw error;
      
      if (data?.extended_status) {
        setOptimisticStatus(data.extended_status as ExtendedServiceStatus);
      }
    } catch (error) {
      console.error("Erro ao buscar status estendido:", error);
    }
  };

  const updateServiceStatus = async (newStatus: ExtendedServiceStatus, additionalData?: any) => {
    console.log("🔄 Iniciando atualização de status:", { newStatus, requestId, userRole, userId: user?.id });
    setLoading(true);
    
    // Optimistic update
    setOptimisticStatus(newStatus);
    onOptimisticStatusChange?.(newStatus);
    
    try {
      // First, verify user has permission by checking if they have an accepted quote for this request
      if (userRole === 'professional') {
        const { data: quoteCheck, error: quoteError } = await supabase
          .from("quotes")
          .select("id, professional_id")
          .eq("request_id", requestId)
          .eq("professional_id", user?.id)
          .eq("is_accepted", true)
          .single();

        if (quoteError || !quoteCheck) {
          console.error("❌ Usuário não tem quote aceito para este serviço:", quoteError);
          throw new Error("Você não tem permissão para atualizar este serviço. Apenas o profissional com orçamento aceito pode realizar esta ação.");
        }

        console.log("✅ Verificação de permissão aprovada:", quoteCheck);
      }

      // Map extended status to database status
      const mapStatusForDatabase = (status: ExtendedServiceStatus): ServiceStatus => {
        switch (status) {
          case 'on_way':
          case 'arrived':
            return 'in_progress'; // Both intermediate states map to in_progress
          case 'awaiting_client_confirmation':
          case 'payment_confirmed':
            return 'completed'; // Both completion states map to completed
          default:
            return status as ServiceStatus; // Direct mapping for other statuses
        }
      };

      const dbStatus = mapStatusForDatabase(newStatus);
      const updateData = { 
        status: dbStatus,
        extended_status: newStatus, // Store extended status in database
        updated_at: new Date().toISOString(),
        ...additionalData 
      };

      console.log("📝 Atualizando status no banco:", { requestId, newStatus, dbStatus, updateData });

      const { data, error } = await supabase
        .from("service_requests")
        .update(updateData)
        .eq("id", requestId)
        .select("id, status, updated_at");

      if (error) {
        console.error("❌ Erro de database:", error);
        if (error.code === '42501' || error.message?.includes('policy')) {
          throw new Error("Erro de permissão: você não tem autorização para atualizar este serviço.");
        }
        throw new Error(`Erro no banco de dados: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.error("⚠️ Nenhuma linha foi atualizada - possível problema de RLS");
        throw new Error("Não foi possível atualizar o serviço. Verifique suas permissões.");
      }

      console.log("✅ Status atualizado com sucesso:", data[0]);

      // Insert status history
      await supabase
        .from("service_status_history")
        .insert({
          request_id: requestId,
          status: newStatus,
          changed_by: user?.id
        });

      // Send notifications
      await sendStatusNotification(newStatus);

      const statusInfo = SERVICE_STATUS_CONFIG[newStatus];
      toast.success(`✅ ${statusInfo.label}!`);

      // Update parent component
      setTimeout(() => {
        onStatusUpdate?.();
        setOptimisticStatus(null);
        onOptimisticStatusChange?.(null);
      }, 1000);
      
    } catch (error: any) {
      console.error("❌ Erro geral na atualização:", error);
      
      // Show specific error message
      const errorMessage = error.message || "Erro ao atualizar status. Tente novamente.";
      toast.error(`❌ ${errorMessage}`);
      
      // Revert optimistic update
      setOptimisticStatus(null);
      onOptimisticStatusChange?.(null);
    } finally {
      setLoading(false);
    }
  };

  const sendStatusNotification = async (newStatus: ExtendedServiceStatus) => {
    const otherUserId = userRole === 'client' ? professionalInfo?.id : clientInfo?.id;
    if (!otherUserId) return;

    const notificationMessages: Record<ExtendedServiceStatus, { title: string; message: string; type: string }> = {
      on_way: {
        title: "🚗 Profissional a caminho!",
        message: `${user?.user_metadata?.full_name || 'O profissional'} está indo para o local do serviço.`,
        type: "professional_on_way"
      },
      arrived: {
        title: "📍 Profissional chegou!",
        message: `${user?.user_metadata?.full_name || 'O profissional'} chegou no local e iniciará o serviço.`,
        type: "professional_arrived"
      },
      in_progress: {
        title: "🔧 Serviço iniciado!",
        message: `O serviço está sendo executado no local.`,
        type: "service_started"
      },
      awaiting_client_confirmation: {
        title: "✅ Serviço finalizado!",
        message: `O profissional finalizou o trabalho. Por favor, confirme se está tudo ok.`,
        type: "awaiting_confirmation"
      },
      payment_confirmed: {
        title: "💳 Pagamento confirmado!",
        message: `O cliente confirmou o pagamento. Serviço finalizado com sucesso!`,
        type: "payment_confirmed"
      },
      completed: {
        title: "🎉 Serviço concluído!",
        message: `Serviço finalizado com sucesso! Não se esqueça de avaliar.`,
        type: "service_completed"
      }
    } as any;

    const notification = notificationMessages[newStatus];
    if (!notification) return;

    const { error } = await supabase
      .from("notifications")
      .insert({
        user_id: otherUserId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        related_id: requestId
      });

    if (error) {
      console.error("❌ Erro ao enviar notificação:", error);
    }
  };

  const displayStatus: ExtendedServiceStatus = optimisticStatus || currentStatus;

  // Professional Actions
  if (userRole === 'professional') {
    return (
      <div className="space-y-6">
        
        {/* 1. INICIAR ATENDIMENTO - Status: A Caminho */}
        {currentStatus === 'accepted' && !optimisticStatus && (
          <Button 
            onClick={() => updateServiceStatus('on_way')}
            disabled={loading} 
            size="lg"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Car className={`w-5 h-5 mr-2 ${loading ? 'animate-pulse' : ''}`} />
            {loading ? 'Iniciando atendimento...' : 'Iniciar Atendimento'}
          </Button>
        )}

        {/* 2. CHEGOU AO LOCAL - Status: Chegou no Local */}
        {displayStatus === 'on_way' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-800">
                <Car className="w-4 h-4" />
                <span className="font-medium">A caminho do cliente</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Você iniciou o atendimento. Dirija-se ao local do serviço.
              </p>
            </div>
            <Button 
              onClick={() => updateServiceStatus('arrived')}
              disabled={loading} 
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold"
            >
              <MapPin className="w-5 h-5 mr-2" />
              {loading ? 'Confirmando chegada...' : 'Chegou ao Local'}
            </Button>
          </div>
        )}

        {/* 3. INICIAR EXECUÇÃO DO SERVIÇO - Status: Serviço em Execução */}
        {displayStatus === 'arrived' && (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-800">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">Chegou no local</span>
              </div>
              <p className="text-sm text-purple-700 mt-1">
                Você chegou no local. Agora pode iniciar a execução do serviço.
              </p>
            </div>
            <Button 
              onClick={() => updateServiceStatus('in_progress')}
              disabled={loading} 
              size="lg"
              className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold"
            >
              <Play className="w-5 h-5 mr-2" />
              {loading ? 'Iniciando execução...' : 'Iniciar Execução do Serviço'}
            </Button>
          </div>
        )}

        {/* 4. MARCAR COMO CONCLUÍDO - Status: Aguardando Confirmação */}
        {displayStatus === 'in_progress' && (
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-800">
                <Play className="w-4 h-4" />
                <span className="font-medium">Serviço em execução</span>
              </div>
              <p className="text-sm text-orange-700 mt-1">
                Você está executando o serviço. Marque como concluído quando finalizar.
              </p>
            </div>
            <Button 
              onClick={() => updateServiceStatus('awaiting_client_confirmation')}
              disabled={loading} 
              size="lg"
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {loading ? 'Marcando como concluído...' : 'Marcar como Concluído'}
            </Button>
          </div>
        )}

        {/* AGUARDANDO CONFIRMAÇÃO DO CLIENTE */}
        {displayStatus === 'awaiting_client_confirmation' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <Clock className="w-4 h-4" />
              <span className="font-medium">Aguardando confirmação do cliente</span>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              Você marcou o serviço como concluído. Aguarde a confirmação e pagamento do cliente.
            </p>
          </div>
        )}

        {/* PAGAMENTO CONFIRMADO */}
        {displayStatus === 'payment_confirmed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CreditCard className="w-4 h-4" />
              <span className="font-medium">Pagamento confirmado</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              O cliente confirmou o pagamento. O serviço será finalizado automaticamente.
            </p>
          </div>
        )}

        {/* SERVIÇO CONCLUÍDO */}
        {displayStatus === 'completed' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-emerald-800">
              <Star className="w-4 h-4" />
              <span className="font-medium">Serviço concluído com sucesso!</span>
            </div>
            <p className="text-sm text-emerald-700 mt-1">
              Parabéns! O serviço foi finalizado com sucesso.
            </p>
          </div>
        )}


        {/* Client Contact Info */}
        {clientInfo && displayStatus !== 'pending' && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Informações do Cliente
            </h4>
            <div className="space-y-2 text-sm">
              <p><strong>Nome:</strong> {clientInfo.full_name}</p>
              {clientInfo.phone && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Phone className="w-4 h-4" />
                    {clientInfo.phone}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Chat
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Client Actions  
  return (
    <div className="space-y-6">
      
      {/* CONFIRMAÇÃO DO CLIENTE - Status: Pagamento Confirmado */}
      {currentStatus === 'awaiting_client_confirmation' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Serviço finalizado pelo profissional</span>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              {professionalInfo?.full_name} marcou o serviço como concluído. Confirme se está tudo ok e efetue o pagamento.
            </p>
          </div>
          <Button 
            onClick={() => updateServiceStatus('payment_confirmed')}
            disabled={loading} 
            size="lg"
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            {loading ? 'Confirmando pagamento...' : 'Confirmar Pagamento'}
          </Button>
        </div>
      )}

      {/* PAGAMENTO CONFIRMADO - Status: Serviço Concluído */}
      {currentStatus === 'payment_confirmed' && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CreditCard className="w-4 h-4" />
              <span className="font-medium">Pagamento confirmado</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Você confirmou o pagamento. O serviço será finalizado automaticamente.
            </p>
          </div>
          <Button 
            onClick={() => updateServiceStatus('completed')}
            disabled={loading} 
            size="lg"
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold"
          >
            <Star className="w-5 h-5 mr-2" />
            {loading ? 'Finalizando serviço...' : 'Finalizar Serviço'}
          </Button>
        </div>
      )}

      {/* Professional Contact Info */}
      {professionalInfo && ['accepted', 'on_way', 'arrived', 'in_progress', 'awaiting_client_confirmation', 'completed'].includes(currentStatus) && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Seu Profissional
          </h4>
          <div className="space-y-3">
            <p><strong>Nome:</strong> {professionalInfo.full_name}</p>
            <div className="flex gap-2">
              {professionalInfo.phone && (
                <Button variant="outline" size="sm" className="gap-2">
                  <Phone className="w-4 h-4" />
                  Ligar
                </Button>
              )}
              <Button variant="outline" size="sm" className="gap-2">
                <MessageCircle className="w-4 h-4" />
                Chat
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Service Status Messages */}
      {currentStatus === 'quoted' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <DollarSign className="w-4 h-4" />
            <span className="font-medium">Orçamentos Disponíveis</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Você recebeu orçamentos! Analise as propostas e escolha a melhor opção.
          </p>
        </div>
      )}

      {currentStatus === 'accepted' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">Orçamento Aceito</span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            Orçamento aceito! O profissional foi notificado e iniciará o atendimento em breve.
          </p>
        </div>
      )}

      {currentStatus === 'on_way' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <Car className="w-4 h-4" />
            <span className="font-medium">Profissional a Caminho</span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            O profissional está indo para o local do serviço. Aguarde sua chegada.
          </p>
        </div>
      )}

      {currentStatus === 'arrived' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-purple-800">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">Profissional no Local</span>
          </div>
          <p className="text-sm text-purple-700 mt-1">
            O profissional chegou no local e iniciará a execução do serviço.
          </p>
        </div>
      )}

      {currentStatus === 'in_progress' && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-orange-800">
            <Play className="w-4 h-4" />
            <span className="font-medium">Serviço em Execução</span>
          </div>
          <p className="text-sm text-orange-700 mt-1">
            O profissional está executando o serviço. Acompanhe o progresso.
          </p>
        </div>
      )}


      {/* Support Action */}
      <TemporarySupportSystem 
        requestId={requestId}
        currentStatus={displayStatus}
      />
    </div>
  );
}