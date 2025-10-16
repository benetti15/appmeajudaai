import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Star, CreditCard, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface MutualConfirmationProps {
  userRole: 'client' | 'professional';
  currentStatus: string;
  onProfessionalComplete: (notes?: string) => void;
  onClientConfirm: () => void;
  onPaymentConfirm: () => void;
  professionalName?: string;
  clientName?: string;
  serviceAmount?: number;
  loading?: boolean;
}

export function MutualConfirmation({
  userRole,
  currentStatus,
  onProfessionalComplete,
  onClientConfirm,
  onPaymentConfirm,
  professionalName,
  clientName,
  serviceAmount,
  loading = false
}: MutualConfirmationProps) {
  const [completionNotes, setCompletionNotes] = useState("");
  const [showNotesDialog, setShowNotesDialog] = useState(false);

  const handleProfessionalComplete = () => {
    onProfessionalComplete(completionNotes);
    setShowNotesDialog(false);
    setCompletionNotes("");
    toast.success("Serviço marcado como concluído! Aguardando confirmação do cliente.");
  };

  const handleClientConfirm = () => {
    onClientConfirm();
    toast.success("Serviço confirmado! Obrigado por usar nossos serviços.");
  };

  const handlePaymentConfirm = () => {
    onPaymentConfirm();
    toast.success("Pagamento confirmado! O serviço foi finalizado com sucesso.");
  };

  // Professional view - Service completion
  if (userRole === 'professional' && currentStatus === 'in_progress') {
    return (
      <Card className="p-6 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
            <div>
              <h3 className="font-semibold text-emerald-800">Finalizar Serviço</h3>
              <p className="text-sm text-emerald-700">
                Marque como concluído quando terminar o trabalho
              </p>
            </div>
          </div>

          <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={loading}
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
                  Descreva o que foi realizado e aguarde a confirmação do cliente.
                </p>
                <Textarea
                  placeholder="Descreva o serviço executado (opcional)"
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowNotesDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleProfessionalComplete}
                    disabled={loading}
                  >
                    Finalizar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>
    );
  }

  // Client view - Awaiting confirmation
  if (userRole === 'client' && currentStatus === 'awaiting_client_confirmation') {
    return (
      <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-amber-600" />
            <div>
              <h3 className="font-semibold text-amber-800">Confirmar Conclusão</h3>
              <p className="text-sm text-amber-700">
                O profissional {professionalName} finalizou o serviço. Confirme se está tudo ok.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              disabled={loading}
            >
              <MessageCircle className="w-4 h-4" />
              Conversar
            </Button>
            <Button 
              size="lg" 
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleClientConfirm}
              disabled={loading}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Confirmar Conclusão
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Payment confirmation stage
  if (currentStatus === 'payment_confirmed') {
    return (
      <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">Confirmar Pagamento</h3>
              <p className="text-sm text-green-700">
                Confirme que o pagamento foi realizado
                {serviceAmount && (
                  <span className="font-medium"> (R$ {serviceAmount.toFixed(2)})</span>
                )}
              </p>
            </div>
          </div>

          <Button 
            size="lg" 
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={handlePaymentConfirm}
            disabled={loading}
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Confirmar Pagamento Realizado
          </Button>

          <div className="text-xs text-muted-foreground text-center">
            * Por enquanto, este é apenas um registro manual do pagamento
          </div>
        </div>
      </Card>
    );
  }

  // Status indicators for other stages
  if (currentStatus === 'awaiting_client_confirmation' && userRole === 'professional') {
    return (
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-600 animate-pulse" />
          <div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              Aguardando Confirmação
            </Badge>
            <p className="text-sm text-blue-700 mt-1">
              O cliente {clientName} está verificando o serviço
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (currentStatus === 'completed') {
    return (
      <Card className="p-4 bg-emerald-50 border-emerald-200">
        <div className="flex items-center gap-3">
          <Star className="w-5 h-5 text-emerald-600" />
          <div>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
              Serviço Concluído
            </Badge>
            <p className="text-sm text-emerald-700 mt-1">
              Serviço finalizado com sucesso! 
              {userRole === 'client' && ' Avalie o profissional para ajudar outros usuários.'}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return null;
}