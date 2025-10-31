import { useState } from "react";
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
  DollarSign
} from "lucide-react";
import { ArrivalEstimator } from "./ArrivalEstimator";
import { ServiceStatus, SERVICE_STATUS_CONFIG, getNextValidStatus, ExtendedServiceStatus } from "./ServiceStatusFlow";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ServiceActionsProps {
  requestId: string;
  currentStatus: ServiceStatus;
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
  onStatusUpdate?: () => void;
  onOptimisticStatusChange?: (status: ExtendedServiceStatus | null) => void;
  estimatedArrival?: number;
  onEstimateSet?: (minutes: number) => void;
}

export function ServiceActions({
  requestId,
  currentStatus,
  userRole,
  professionalInfo,
  clientInfo,
  onStatusUpdate,
  onOptimisticStatusChange,
  estimatedArrival,
  onEstimateSet
}: ServiceActionsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<ExtendedServiceStatus | null>(null);

  const updateServiceStatus = async (newStatus: ServiceStatus, notes?: string) => {
    console.log("🔄 Status Transition:", {
      from: currentStatus,
      to: newStatus,
      userRole,
      requestId,
      timestamp: new Date().toISOString()
    });
    setLoading(true);
    
    // Optimistic update - muda o status imediatamente na UI
    setOptimisticStatus(newStatus);
    onOptimisticStatusChange?.(newStatus);
    
    try {
      console.log("📝 Atualizando para status:", newStatus);

      // Fallback para update direto com melhor tratamento de erro
      const updateData: any = { status: newStatus };
      if (notes) updateData.completion_notes = notes;

      const { data, error } = await supabase
        .from("service_requests")
        .update(updateData)
        .eq("id", requestId)
        .select();

      if (error) {
        console.error("❌ Erro na atualização do banco:", error);
        // Mensagem mais específica baseada no erro
        if (error.code === '42501' || error.message?.includes('policy')) {
          throw new Error("Erro de permissão: você não tem autorização para atualizar este serviço.");
        }
        throw new Error("Erro ao atualizar o status do serviço. Tente novamente.");
      }

      if (!data || data.length === 0) {
        console.error("⚠️ Nenhuma linha foi atualizada - possível problema de RLS");
        throw new Error("Não foi possível atualizar o serviço. Verifique se você tem permissão.");
      }

      console.log("✅ Status atualizado com sucesso:", data[0]);

      // Send notifications based on status change
      let notificationData = null;
      const otherUserId = userRole === 'client' ? professionalInfo?.id : clientInfo?.id;

      switch (newStatus) {
        case 'in_progress':
          notificationData = {
            title: "🚀 Atendimento Iniciado!",
            message: `O profissional ${user?.user_metadata?.full_name || 'responsável'} iniciou o atendimento no local.`,
            type: "service_started"
          };
          break;
        case 'completed':
          notificationData = {
            title: userRole === 'client' ? "✅ Serviço confirmado!" : "🎯 Serviço finalizado!",
            message: userRole === 'client' 
              ? "Obrigado por confirmar! Não esqueça de avaliar o profissional."
              : "Serviço marcado como concluído. Aguardando confirmação do cliente.",
            type: "service_completed"
          };
          break;
      }

      // Send notification to client immediately
      if (notificationData && otherUserId) {
        console.log("📢 Enviando notificação para:", otherUserId);
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            user_id: otherUserId,
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type,
            related_id: requestId
          });

        if (notificationError) {
          console.error("❌ Erro ao enviar notificação:", notificationError);
        } else {
          console.log("✅ Notificação enviada com sucesso");
        }
      }

      // Show success
      const statusInfo = SERVICE_STATUS_CONFIG[newStatus];
      toast.success(`✅ ${statusInfo.label} - Cliente notificado!`);

      // Trigger parent component update
      setTimeout(() => {
        onStatusUpdate?.();
        setOptimisticStatus(null);
        onOptimisticStatusChange?.(null);
      }, 1000);
      
    } catch (error) {
      console.error("❌ Erro geral na atualização:", error);
      toast.error("❌ Erro ao atualizar status. Tente novamente.");
      
      // Revert optimistic update on error
      setOptimisticStatus(null);
      onOptimisticStatusChange?.(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStartService = () => {
    // Primeiro marcamos como "a caminho" quando clica em iniciar atendimento
    setOptimisticStatus('on_way');
    toast.success('🚗 Status atualizado: Indo para o cliente!');
    
    // Não atualizamos o banco ainda, apenas o status visual
    // O status será atualizado quando marcar "chegou no local"
  };

  const handleCompleteService = () => {
    updateServiceStatus('completed', completionNotes);
    setShowCompletionDialog(false);
    setCompletionNotes("");
  };

  const handleConfirmPayment = () => {
    // In a real app, this would integrate with payment systems
    toast.success("Pagamento confirmado! O serviço foi finalizado.");
    setShowPaymentDialog(false);
  };

  const displayStatus = optimisticStatus || currentStatus;
  const nextStatus = getNextValidStatus(displayStatus, userRole);

  // Professional Actions
  if (userRole === 'professional') {
    return (
      <div className="space-y-4">
        {/* Arrival Estimator for accepted services */}
        {(currentStatus === 'accepted' || displayStatus === 'on_way') && (
          <ArrivalEstimator
            onEstimateSet={(minutes) => {
              console.log('Estimativa definida:', minutes);
              onEstimateSet?.(minutes);
              setOptimisticStatus('on_way');
              toast.success(`Estimativa definida: ${minutes} minutos. Cliente notificado!`);
            }}
            currentEstimate={estimatedArrival}
            showEstimate={displayStatus === 'on_way' || !!estimatedArrival}
          />
        )}

        {/* Primary Action Button - Iniciar Atendimento */}
        {currentStatus === 'accepted' && !optimisticStatus && (
          <Button 
            onClick={handleStartService} 
            disabled={loading} 
            size="lg"
            className="w-full relative overflow-hidden transition-all duration-500 hover:scale-105 group"
          >
            <div className={`flex items-center justify-center transition-all duration-300 ${loading ? 'animate-pulse' : ''}`}>
              <Play className={`w-5 h-5 mr-2 transition-all duration-500 ${loading ? 'animate-spin scale-110' : 'group-hover:scale-110'}`} />
              {loading ? 'Iniciando Atendimento...' : 'Iniciar Atendimento'}
            </div>
            {loading && (
              <div className="absolute inset-0 bg-primary/20 animate-pulse"></div>
            )}
          </Button>
        )}

        {/* Enhanced Status Display with Arrival Info */}
        {displayStatus === 'on_way' && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 animate-fade-in">
            <div className="flex items-center gap-2 text-blue-800">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="font-medium">🚗 A Caminho do Cliente</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Vá até o local do serviço. Clique em "Chegou no Local" quando chegar.
            </p>
            <Button 
              className="mt-3 w-full"
              onClick={() => {
                setOptimisticStatus('arrived');
                toast.success('Status atualizado: Chegou no local!');
              }}
            >
              📍 Chegou no Local
            </Button>
          </div>
        )}

        {displayStatus === 'arrived' && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 animate-fade-in">
            <div className="flex items-center gap-2 text-purple-800">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="font-medium">📍 Chegou no Local</span>
            </div>
            <p className="text-sm text-purple-700 mt-1">
              Você chegou no local! Inicie a execução do serviço.
            </p>
            <Button 
              className="mt-3 w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={() => {
                // Agora sim, atualizamos o status no banco para "in_progress"
                updateServiceStatus('in_progress');
              }}
              disabled={loading}
            >
              🚀 Iniciar Execução do Serviço
            </Button>
          </div>
        )}
        {optimisticStatus === 'in_progress' && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 animate-fade-in">
            <div className="flex items-center gap-2 text-green-800">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">✅ Atendimento Iniciado!</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Execute o serviço conforme acordado. Quando finalizar, marque como concluído.
            </p>
          </div>
        )}

        {/* Status de progresso quando realmente em progresso */}
        {currentStatus === 'in_progress' && !optimisticStatus && (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="font-medium">🔄 Serviço em Execução</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Continue executando o serviço. Marque como concluído quando finalizar.
            </p>
          </div>
        )}

        {/* Botão para Marcar como Concluído */}
        {displayStatus === 'in_progress' && (
          <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                className="w-full hover:scale-105 transition-all duration-300 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Marcar como Concluído
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Finalizar Serviço</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Confirme que o serviço foi executado conforme acordado.
                </p>
                <Textarea
                  placeholder="Descreva o que foi realizado (opcional)"
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCompletionDialog(false)} 
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCompleteService} 
                    disabled={loading} 
                    className="flex-1"
                  >
                    Finalizar Serviço
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
    <div className="space-y-4">
      {/* Primary Action Button */}
      {currentStatus === 'completed' && (
        <Button size="lg" className="w-full gap-2">
          <Star className="w-5 h-5" />
          Avaliar Profissional
        </Button>
      )}

      {/* Enhanced Client View - Show arrival info */}
      {estimatedArrival && displayStatus === 'on_way' && (
        <ArrivalEstimator
          currentEstimate={estimatedArrival}
          showEstimate={true}
          onEstimateSet={() => {}} // Read-only for client
        />
      )}

      {/* Professional Contact Info */}
      {professionalInfo && ['accepted', 'in_progress', 'completed'].includes(currentStatus) && (
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
            Orçamento aceito com sucesso! O profissional foi notificado e iniciará o atendimento em breve.
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
            O profissional está executando o serviço. Acompanhe o progresso e entre em contato se precisar.
          </p>
        </div>
      )}

      {currentStatus === 'completed' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-emerald-800">
            <Star className="w-4 h-4" />
            <span className="font-medium">Serviço Concluído</span>
          </div>
          <p className="text-sm text-emerald-700 mt-1">
            Parabéns! Seu serviço foi concluído. Avalie o profissional para ajudar outros usuários.
          </p>
        </div>
      )}

      {/* Support Action */}
      <Button 
        variant="outline" 
        className="w-full gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
      >
        <AlertTriangle className="w-4 h-4" />
        Precisa de Ajuda? Contate o Suporte
      </Button>
    </div>
  );
}