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
  Car,
  Clock,
  DollarSign
} from "lucide-react";
import { ArrivalEstimator } from "./ArrivalEstimator";
import { DetailedProfessionalStatus, getNextValidStatus } from "./ImprovedServiceStatusFlow";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ImprovedServiceActionsProps {
  requestId: string;
  currentStatus: DetailedProfessionalStatus;
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
  estimatedArrival?: number;
  onEstimateSet?: (minutes: number) => void;
}

export function ImprovedServiceActions({
  requestId,
  currentStatus,
  userRole,
  professionalInfo,
  clientInfo,
  onStatusUpdate,
  estimatedArrival,
  onEstimateSet
}: ImprovedServiceActionsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

  const updateServiceStatus = async (newStatus: DetailedProfessionalStatus, notes?: string) => {
    console.log("🔄 Atualizando status para:", { newStatus, requestId, userRole });
    setLoading(true);
    
    try {
      const updateData: any = { status: newStatus };
      if (notes) updateData.completion_notes = notes;

      const { data, error } = await supabase
        .from("service_requests")
        .update(updateData)
        .eq("id", requestId)
        .select();

      if (error) {
        console.error("❌ Erro na atualização:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error("Erro de permissão: você não tem autorização para atualizar este serviço.");
      }

      console.log("✅ Status atualizado:", data[0]);

      // Enviar notificação baseada no status
      await sendStatusNotification(newStatus);

      toast.success(`✅ Status atualizado com sucesso!`);
      
      setTimeout(() => {
        onStatusUpdate?.();
      }, 1000);
      
    } catch (error: any) {
      console.error("❌ Erro geral:", error);
      toast.error("❌ Erro ao atualizar status. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const sendStatusNotification = async (newStatus: DetailedProfessionalStatus) => {
    const otherUserId = userRole === 'client' ? professionalInfo?.id : clientInfo?.id;
    if (!otherUserId) return;

    const notifications: Partial<Record<DetailedProfessionalStatus, { title: string; message: string; type: string }>> = {
      on_way: {
        title: "🚗 Profissional a Caminho!",
        message: "Seu profissional está indo até o local. Prepare-se para recebê-lo.",
        type: "professional_on_way"
      },
      arrived: {
        title: "📍 Profissional Chegou!",
        message: "O profissional chegou no local do serviço.",
        type: "professional_arrived"
      },
      service_started: {
        title: "🚀 Serviço Iniciado!",
        message: "O atendimento foi iniciado. O profissional está trabalhando.",
        type: "service_started"
      },
      in_progress: {
        title: "⚙️ Serviço em Execução",
        message: "O profissional está executando o serviço conforme combinado.",
        type: "service_progress"
      },
      awaiting_confirmation: {
        title: "✋ Aguardando Sua Confirmação",
        message: "Serviço finalizado! Confirme a conclusão e efetue o pagamento.",
        type: "payment_required"
      },
      completed: {
        title: "🎉 Serviço Concluído!",
        message: "Parabéns! Seu serviço foi finalizado com sucesso.",
        type: "service_completed"
      }
    };

    const notification = notifications[newStatus];
    if (!notification) return;

    try {
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
      } else {
        console.log("✅ Notificação enviada com sucesso");
      }
    } catch (error) {
      console.error("❌ Erro no sistema de notificações:", error);
    }
  };

  // Actions para Profissionais
  if (userRole === 'professional') {
    return (
      <div className="space-y-4">
        
        {/* Orçamento Aceito - Iniciar Atendimento */}
        {currentStatus === 'accepted' && (
          <div className="space-y-4">
            <ArrivalEstimator
              onEstimateSet={(minutes) => {
                console.log('Estimativa definida:', minutes);
                onEstimateSet?.(minutes);
                updateServiceStatus('on_way');
                toast.success(`Estimativa definida: ${minutes} minutos. Cliente notificado!`);
              }}
              currentEstimate={estimatedArrival}
              showEstimate={false}
            />
            
            <Button 
              onClick={() => {
                updateServiceStatus('on_way');
                toast.info('📍 Compartilhamento de localização iniciado automaticamente');
              }} 
              disabled={loading} 
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Car className="w-5 h-5 mr-2" />
              {loading ? 'Iniciando...' : 'Iniciar Atendimento - Indo ao Local'}
            </Button>
          </div>
        )}

        {/* A Caminho - Chegou no Local */}
        {currentStatus === 'on_way' && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800 mb-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="font-medium">🚗 A Caminho do Cliente</span>
            </div>
            <p className="text-sm text-blue-700 mb-3">
              Vá até o local do serviço. Clique em "Chegou no Local" quando chegar.
            </p>
            {estimatedArrival && (
              <p className="text-xs text-blue-600 mb-3">
                Tempo estimado: {estimatedArrival} minutos
              </p>
            )}
            <Button 
              className="w-full"
              onClick={() => updateServiceStatus('arrived')}
              disabled={loading}
            >
              📍 Chegou no Local
            </Button>
          </div>
        )}

        {/* Chegou - Iniciar Serviço */}
        {currentStatus === 'arrived' && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-purple-800 mb-3">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">📍 Chegou no Local</span>
            </div>
            <p className="text-sm text-purple-700 mb-3">
              Você chegou no local! Quando estiver pronto para começar o trabalho, clique em "Iniciar Serviço".
            </p>
            <Button 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={() => updateServiceStatus('service_started')}
              disabled={loading}
            >
              🚀 Iniciar Serviço
            </Button>
          </div>
        )}

        {/* Serviço Iniciado - Em Execução */}
        {currentStatus === 'service_started' && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800 mb-3">
              <Play className="w-4 h-4" />
              <span className="font-medium">🚀 Serviço Iniciado!</span>
            </div>
            <p className="text-sm text-green-700 mb-3">
              Serviço iniciado com sucesso! Continue executando conforme combinado.
            </p>
            <Button 
              className="w-full"
              onClick={() => updateServiceStatus('in_progress')}
              disabled={loading}
            >
              ⚙️ Marcar como "Em Execução"
            </Button>
          </div>
        )}

        {/* Em Execução - Finalizar */}
        {currentStatus === 'in_progress' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-800">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="font-medium">⚙️ Serviço em Execução</span>
              </div>
              <p className="text-sm text-orange-700 mt-1">
                Continue executando o serviço conforme acordado. Marque como concluído quando finalizar.
              </p>
            </div>

            <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
              <DialogTrigger asChild>
                <Button 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
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
                      onClick={() => {
                        updateServiceStatus('awaiting_confirmation', completionNotes);
                        setShowCompletionDialog(false);
                        setCompletionNotes("");
                      }} 
                      disabled={loading} 
                      className="flex-1"
                    >
                      Finalizar Serviço
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Aguardando Confirmação */}
        {currentStatus === 'awaiting_confirmation' && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <Clock className="w-4 h-4" />
              <span className="font-medium">⏳ Aguardando Confirmação do Cliente</span>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              Serviço finalizado! O cliente foi notificado para confirmar e efetuar o pagamento.
            </p>
          </div>
        )}

        {/* Informações do Cliente */}
        {clientInfo && currentStatus !== 'pending' && (
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

  // Actions para Clientes
  return (
    <div className="space-y-4">
      
      {/* Orçamentos Disponíveis */}
      {currentStatus === 'quoted' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <DollarSign className="w-4 h-4" />
            <span className="font-medium">💰 Orçamentos Disponíveis</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Você recebeu orçamentos! Analise as propostas e escolha a melhor opção.
          </p>
        </div>
      )}

      {/* Orçamento Aceito */}
      {currentStatus === 'accepted' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">✅ Orçamento Aceito</span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            Orçamento aceito com sucesso! O profissional foi notificado e iniciará o atendimento em breve.
          </p>
        </div>
      )}

      {/* Profissional a Caminho */}
      {(currentStatus === 'on_way' || currentStatus === 'arrived') && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <Car className="w-4 h-4" />
            <span className="font-medium">🚗 Profissional a Caminho</span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            Seu profissional está indo até o local. Prepare-se para recebê-lo.
          </p>
          {estimatedArrival && currentStatus === 'on_way' && (
            <ArrivalEstimator
              currentEstimate={estimatedArrival}
              showEstimate={true}
              onEstimateSet={() => {}} // Read-only para cliente
            />
          )}
          {currentStatus === 'arrived' && (
            <div className="mt-2 p-2 bg-blue-100 rounded text-sm text-blue-800">
              📍 O profissional chegou no local!
            </div>
          )}
        </div>
      )}

      {/* Serviço Iniciado */}
      {currentStatus === 'service_started' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-purple-800">
            <Play className="w-4 h-4" />
            <span className="font-medium">🚀 Serviço Iniciado</span>
          </div>
          <p className="text-sm text-purple-700 mt-1">
            O profissional iniciou o trabalho! Acompanhe o progresso.
          </p>
        </div>
      )}

      {/* Em Execução */}
      {currentStatus === 'in_progress' && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-orange-800">
            <Play className="w-4 h-4" />
            <span className="font-medium">⚙️ Serviço em Execução</span>
          </div>
          <p className="text-sm text-orange-700 mt-1">
            O profissional está executando o serviço. Acompanhe o progresso e entre em contato se precisar.
          </p>
        </div>
      )}

      {/* Aguardando Cliente */}
      {(currentStatus === 'awaiting_confirmation' || currentStatus === 'awaiting_payment') && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-800">
            <Clock className="w-4 h-4" />
            <span className="font-medium">✋ Aguardando Você</span>
          </div>
          <p className="text-sm text-amber-700 mt-1">
            Serviço finalizado! Confirme a conclusão e efetue o pagamento para finalizar.
          </p>
          <Button 
            className="mt-3 w-full"
            onClick={() => updateServiceStatus('completed')}
            disabled={loading}
          >
            ✅ Confirmar e Finalizar
          </Button>
        </div>
      )}

      {/* Concluído */}
      {currentStatus === 'completed' && (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-emerald-800">
              <Star className="w-4 h-4" />
              <span className="font-medium">🎉 Serviço Concluído</span>
            </div>
            <p className="text-sm text-emerald-700 mt-1">
              Parabéns! Seu serviço foi concluído com sucesso.
            </p>
          </div>
          
          <Button size="lg" className="w-full gap-2">
            <Star className="w-5 h-5" />
            Avaliar Profissional
          </Button>
        </div>
      )}

      {/* Informações do Profissional */}
      {professionalInfo && ['accepted', 'on_way', 'arrived', 'service_started', 'in_progress', 'awaiting_confirmation', 'completed'].includes(currentStatus) && (
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
    </div>
  );
}