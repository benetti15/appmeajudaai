import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Clock, CheckCircle, AlertCircle, Calculator, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface QuoteCreationModalProps {
  requestId: string;
  clientId: string;
  requestTitle: string;
  trigger?: React.ReactNode;
  onQuoteSubmitted?: () => void;
}

interface QuoteFormData {
  amount: string;
  description: string;
  estimated_duration_hours: string;
  materials_included: boolean;
  notes: string;
}

export function QuoteCreationModal({ 
  requestId, 
  clientId, 
  requestTitle,
  trigger,
  onQuoteSubmitted 
}: QuoteCreationModalProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [quoteForm, setQuoteForm] = useState<QuoteFormData>({
    amount: "",
    description: "",
    estimated_duration_hours: "",
    materials_included: false,
    notes: ""
  });


  const resetForm = () => {
    setQuoteForm({
      amount: "",
      description: "",
      estimated_duration_hours: "",
      materials_included: false,
      notes: ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quoteForm.amount || !quoteForm.description) {
      toast.error("Preencha pelo menos o valor e descrição do orçamento");
      return;
    }

    const amount = parseFloat(quoteForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Digite um valor válido");
      return;
    }

    setSubmitting(true);

    try {
      // Converter estimated_duration_hours para número
      const durationHours = quoteForm.estimated_duration_hours ? parseFloat(quoteForm.estimated_duration_hours) : null;
      
      const { data: quoteData, error } = await supabase
        .from("quotes")
        .insert({
          request_id: requestId,
          professional_id: user?.id,
          amount: amount,
          description: quoteForm.description,
          estimated_duration_hours: durationHours,
          materials_included: quoteForm.materials_included,
          notes: quoteForm.notes || null
        })
        .select()
        .single();

      if (error) throw error;

      // Atualizar status do pedido para 'quoted' se necessário
      const { data: currentQuotes } = await supabase
        .from("quotes")
        .select("id")
        .eq("request_id", requestId);

      if (currentQuotes?.length === 1) { // First quote
        await supabase
          .from("service_requests")
          .update({ status: "quoted" })
          .eq("id", requestId);
      }

      // Enviar notificação ao cliente
      await supabase
        .from("notifications")
        .insert({
          user_id: clientId,
          title: "Novo orçamento recebido! 💰",
          message: `Você recebeu um orçamento de R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para "${requestTitle}". Acesse sua solicitação para analisar.`,
          type: "quote_received",
          related_id: quoteData.id
        });

      setShowSuccess(true);
      
      // Aguardar um momento antes de fechar
      setTimeout(() => {
        setShowSuccess(false);
        setOpen(false);
        resetForm();
        onQuoteSubmitted?.();
        toast.success("Orçamento enviado com sucesso!");
      }, 2000);

    } catch (error) {
      console.error("Error submitting quote:", error);
      toast.error("Erro ao enviar orçamento. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button size="lg" className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
      <DollarSign className="w-6 h-6" />
      Criar Orçamento
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {showSuccess ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-xl font-semibold mb-2 text-green-700">Orçamento Enviado!</h3>
            <p className="text-muted-foreground">
              Seu orçamento foi enviado com sucesso. O cliente será notificado e poderá analisá-lo.
            </p>
            <Badge className="mt-4 bg-green-100 text-green-800">
              Status: Orçamento Enviado
            </Badge>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Criar Orçamento
              </DialogTitle>
              <DialogDescription>
                Preencha os detalhes do seu orçamento para "{requestTitle}"
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Valor e Prazo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-medium">
                    Valor Total (R$) *
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="amount"
                      type="number"
                      value={quoteForm.amount}
                      onChange={(e) => setQuoteForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0,00"
                      className="pl-10"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="estimated_duration_hours" className="text-sm font-medium">
                    Prazo Estimado (horas)
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="estimated_duration_hours"
                      type="number"
                      value={quoteForm.estimated_duration_hours}
                      onChange={(e) => setQuoteForm(prev => ({ ...prev, estimated_duration_hours: e.target.value }))}
                      placeholder="Ex: 2, 8, 24"
                      className="pl-10"
                      min="0"
                      step="0.5"
                    />
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Descrição do Orçamento *
                </Label>
                <Textarea
                  id="description"
                  value={quoteForm.description}
                  onChange={(e) => setQuoteForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva detalhadamente o que será feito e o que está incluído no valor..."
                  rows={3}
                  required
                />
              </div>


              {/* Material incluído */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="materials"
                  checked={quoteForm.materials_included}
                  onCheckedChange={(checked) => 
                    setQuoteForm(prev => ({ ...prev, materials_included: !!checked }))
                  }
                />
                <Label htmlFor="materials" className="text-sm font-medium">
                  Material incluído no valor
                </Label>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Observações Adicionais
                </Label>
                <Textarea
                  id="notes"
                  value={quoteForm.notes}
                  onChange={(e) => setQuoteForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Informações extras sobre condições, garantia, forma de pagamento, etc..."
                  rows={2}
                />
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Enviar Orçamento
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}