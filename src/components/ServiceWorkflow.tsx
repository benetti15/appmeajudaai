import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Play, 
  CheckCircle, 
  DollarSign, 
  Star, 
  MessageCircle, 
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  Users
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ReviewSystem } from "@/components/ReviewSystem";
import { useNavigate } from "react-router-dom";

interface ServiceWorkflowProps {
  requestId: string;
  request: any;
  userRole: 'client' | 'professional';
  onStatusUpdate?: () => void;
}

interface ServiceProgress {
  status: string;
  completion_notes?: string;
}

const SERVICE_STATUSES = {
  quoted: { label: "Orçamento Aceito", progress: 20, color: "bg-blue-500" },
  confirmed: { label: "Serviço Confirmado", progress: 30, color: "bg-indigo-500" },
  heading_to_client: { label: "Indo para o Cliente", progress: 50, color: "bg-yellow-500" },
  in_progress: { label: "Em Execução", progress: 70, color: "bg-orange-500" },
  awaiting_confirmation: { label: "Aguardando Confirmação", progress: 85, color: "bg-purple-500" },
  awaiting_payment: { label: "Aguardando Pagamento", progress: 90, color: "bg-green-500" },
  completed: { label: "Concluído", progress: 100, color: "bg-emerald-500" }
};

export function ServiceWorkflow({ requestId, request, userRole, onStatusUpdate }: ServiceWorkflowProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ServiceProgress | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  useEffect(() => {
    fetchServiceProgress();
  }, [requestId]);

  const fetchServiceProgress = async () => {
    try {
      const { data, error } = await supabase
        .from("service_requests")
        .select("status")
        .eq("id", requestId)
        .single();

      if (error) throw error;
      setProgress({ status: data.status });
    } catch (error) {
      console.error("Error fetching service progress:", error);
    }
  };

  const updateServiceStatus = async (newStatus: string, additionalData: any = {}) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("service_requests")
        .update({
          status: newStatus,
          ...additionalData
        })
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: "Status atualizado!",
        description: `Serviço marcado como: ${SERVICE_STATUSES[newStatus as keyof typeof SERVICE_STATUSES]?.label}`,
      });

      fetchServiceProgress();
      onStatusUpdate?.();
    } catch (error) {
      console.error("Error updating service status:", error);
      toast({
        title: "Erro ao atualizar status",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartService = () => {
    updateServiceStatus("heading_to_client");
  };

  const handleArriveAtClient = () => {
    updateServiceStatus("in_progress");
  };

  const handleCompleteService = async () => {
    // For client or professional completing, we move to awaiting_confirmation
    // In a real app, this would track individual confirmations
    const newStatus = userRole === 'client' ? "awaiting_payment" : "awaiting_confirmation";
    
    await updateServiceStatus(newStatus);
    setShowCompletionDialog(false);
    setCompletionNotes("");
    
    toast({
      title: userRole === 'client' ? "Serviço confirmado!" : "Conclusão registrada!",
      description: userRole === 'client' 
        ? "Proceda com o pagamento conforme acordado."
        : "Aguardando confirmação do cliente.",
    });
  };

  const handlePaymentConfirmation = () => {
    updateServiceStatus("completed");
  };

  const handleContactSupport = () => {
    // Open support chat - could be implemented as a dedicated support chat system
    toast({
      title: "Suporte Contactado",
      description: "Nossa equipe de suporte entrará em contato em breve.",
    });
  };

  const getStatusInfo = (status: string) => {
    return SERVICE_STATUSES[status as keyof typeof SERVICE_STATUSES] || SERVICE_STATUSES.quoted;
  };

  const renderServiceControls = () => {
    if (!progress) return null;

    const statusInfo = getStatusInfo(progress.status);

    return (
      <div className="space-y-4">
        {/* Status Progress */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${statusInfo.color}`} />
                {statusInfo.label}
              </CardTitle>
              <Badge variant="outline">{statusInfo.progress}% Concluído</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={statusInfo.progress} className="mb-4" />
            
            {/* Professional Controls */}
            {userRole === 'professional' && (
              <div className="space-y-3">
                {progress.status === 'quoted' && (
                  <Button onClick={handleStartService} disabled={loading} className="w-full">
                    <Play className="w-4 h-4 mr-2" />
                    Iniciar Atendimento (Indo ao Cliente)
                  </Button>
                )}
                
                {progress.status === 'heading_to_client' && (
                  <Button onClick={handleArriveAtClient} disabled={loading} className="w-full">
                    <MapPin className="w-4 h-4 mr-2" />
                    Cheguei no Local - Iniciar Serviço
                  </Button>
                )}
                
                {progress.status === 'in_progress' && (
                  <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Marcar Serviço como Concluído
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirmar Conclusão do Serviço</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Descreva o que foi realizado (opcional)"
                          value={completionNotes}
                          onChange={(e) => setCompletionNotes(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setShowCompletionDialog(false)} className="flex-1">
                            Cancelar
                          </Button>
                          <Button onClick={handleCompleteService} disabled={loading} className="flex-1">
                            Confirmar Conclusão
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}

            {/* Client Controls */}
            {userRole === 'client' && (
              <div className="space-y-3">
                {(progress.status === 'in_progress' || progress.status === 'awaiting_confirmation') && (
                  <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirmar Serviço Concluído
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirmar Recebimento do Serviço</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Confirme que o serviço foi realizado conforme acordado.
                        </p>
                        <Textarea
                          placeholder="Comentários sobre o serviço (opcional)"
                          value={completionNotes}
                          onChange={(e) => setCompletionNotes(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setShowCompletionDialog(false)} className="flex-1">
                            Cancelar
                          </Button>
                          <Button onClick={handleCompleteService} disabled={loading} className="flex-1">
                            Confirmar Recebimento
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {progress.status === 'awaiting_payment' && (
                  <Button onClick={handlePaymentConfirmation} disabled={loading} className="w-full">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Confirmar Pagamento
                  </Button>
                )}

                {progress.status === 'completed' && (
                  <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Star className="w-4 h-4 mr-2" />
                        Avaliar Profissional
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Avaliar Serviço</DialogTitle>
                      </DialogHeader>
                      <ReviewSystem
                        requestId={requestId}
                        professionalId={request.professional_id}
                        canReview={true}
                        showReviews={false}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}

            {/* Status Messages */}
            {progress.status === 'awaiting_confirmation' && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    {userRole === 'client' 
                      ? "O profissional marcou o serviço como concluído. Confirme se tudo está correto."
                      : "Aguardando o cliente confirmar o recebimento do serviço."
                    }
                  </span>
                </div>
              </div>
            )}

            {progress.status === 'awaiting_payment' && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    {userRole === 'client' 
                      ? "Serviço confirmado! Proceda com o pagamento conforme acordado."
                      : "Serviço confirmado pelo cliente. Aguardando confirmação de pagamento."
                    }
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat and Support Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Comunicação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/chat/${requestId}`)}
              className="w-full justify-start"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat com {userRole === 'client' ? 'Profissional' : 'Cliente'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleContactSupport}
              className="w-full justify-start text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Contactar Suporte
            </Button>
          </CardContent>
        </Card>

        {/* Service Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Linha do Tempo do Serviço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Orçamento aceito</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${['heading_to_client', 'in_progress', 'awaiting_confirmation', 'awaiting_payment', 'completed'].includes(progress.status) ? 'text-green-500' : 'text-gray-300'}`} />
              <span className="text-sm">Profissional se dirigindo ao local</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${['in_progress', 'awaiting_confirmation', 'awaiting_payment', 'completed'].includes(progress.status) ? 'text-green-500' : 'text-gray-300'}`} />
              <span className="text-sm">Serviço em execução</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${['awaiting_payment', 'completed'].includes(progress.status) ? 'text-green-500' : 'text-gray-300'}`} />
              <span className="text-sm">Serviço concluído</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${progress.status === 'completed' ? 'text-green-500' : 'text-gray-300'}`} />
              <span className="text-sm">Pagamento confirmado</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (!progress) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return renderServiceControls();
}