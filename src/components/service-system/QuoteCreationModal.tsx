import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DollarSign, Clock, CheckCircle, Send, Sparkles, Package, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    materials_included: false
  });

  const resetForm = () => {
    setQuoteForm({
      amount: "",
      description: "",
      estimated_duration_hours: "",
      materials_included: false
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quoteForm.amount || !quoteForm.description) {
      toast.error("Preencha o valor e descrição");
      return;
    }

    const amount = parseFloat(quoteForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Digite um valor válido");
      return;
    }

    setSubmitting(true);

    try {
      const durationHours = quoteForm.estimated_duration_hours ? parseFloat(quoteForm.estimated_duration_hours) : null;
      
      const { data: quoteData, error } = await supabase
        .from("quotes")
        .insert({
          request_id: requestId,
          professional_id: user?.id,
          amount: amount,
          description: quoteForm.description,
          estimated_time: durationHours ? `${durationHours}h` : null,
          materials_included: quoteForm.materials_included
        })
        .select()
        .single();

      if (error) throw error;

      const { data: currentQuotes } = await supabase
        .from("quotes")
        .select("id")
        .eq("request_id", requestId);

      if (currentQuotes?.length === 1) {
        await supabase
          .from("service_requests")
          .update({ status: "quoted" })
          .eq("id", requestId);
      }

      await supabase
        .from("notifications")
        .insert({
          user_id: clientId,
          title: "Novo orçamento recebido! 💰",
          message: `Você recebeu um orçamento de R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para "${requestTitle}".`,
          type: "quote_received",
          related_id: quoteData.id
        });

      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        setOpen(false);
        resetForm();
        onQuoteSubmitted?.();
        toast.success("Orçamento enviado!");
      }, 1500);

    } catch (error) {
      console.error("Error submitting quote:", error);
      toast.error("Erro ao enviar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button size="lg" className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] rounded-2xl">
      <Zap className="w-5 h-5" />
      Enviar Proposta
    </Button>
  );

  const isFormValid = quoteForm.amount && quoteForm.description;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-3xl border-0 bg-gradient-to-b from-background to-muted/30">
        {showSuccess ? (
          <div className="text-center py-12 px-6">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center animate-scale-in shadow-lg">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-foreground">Proposta Enviada!</h3>
            <p className="text-muted-foreground text-sm">
              O cliente foi notificado e logo entrará em contato.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-emerald-600">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">+10 XP conquistados</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Nova Proposta</h2>
                  <p className="text-white/80 text-xs truncate max-w-[280px]">{requestTitle}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Valor - Destaque */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  Seu Valor
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">R$</span>
                  <Input
                    type="number"
                    value={quoteForm.amount}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0,00"
                    className="pl-16 h-14 text-2xl font-bold rounded-2xl border-2 focus:border-emerald-500 transition-colors"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              {/* Prazo e Material - Grid compacto */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Prazo (horas)
                  </Label>
                  <Input
                    type="number"
                    value={quoteForm.estimated_duration_hours}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, estimated_duration_hours: e.target.value }))}
                    placeholder="Ex: 2"
                    className="h-11 rounded-xl text-sm"
                    min="0"
                    step="0.5"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    Material
                  </Label>
                  <button
                    type="button"
                    onClick={() => setQuoteForm(prev => ({ ...prev, materials_included: !prev.materials_included }))}
                    className={cn(
                      "w-full h-11 rounded-xl text-sm font-medium transition-all duration-200 border-2",
                      quoteForm.materials_included 
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700" 
                        : "bg-muted/50 border-transparent text-muted-foreground hover:border-border"
                    )}
                  >
                    {quoteForm.materials_included ? "✓ Incluído" : "Não incluso"}
                  </button>
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">O que está incluso?</Label>
                <Textarea
                  value={quoteForm.description}
                  onChange={(e) => setQuoteForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva brevemente o serviço..."
                  rows={3}
                  className="rounded-xl resize-none text-sm"
                  required
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting || !isFormValid}
                className={cn(
                  "w-full h-14 rounded-2xl text-base font-bold transition-all duration-300",
                  isFormValid 
                    ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Enviar Proposta
                  </div>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
