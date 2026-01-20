import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DollarSign, Clock, CheckCircle, Send, Sparkles, Package, Zap, Trophy, Star, Hourglass } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Confetti } from "@/components/ui/confetti";

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
  const [showConfetti, setShowConfetti] = useState(false);
  const [xpAnimating, setXpAnimating] = useState(false);
  const [hasExistingQuote, setHasExistingQuote] = useState(false);
  const [checkingQuote, setCheckingQuote] = useState(true);
  
  const [quoteForm, setQuoteForm] = useState<QuoteFormData>({
    amount: "",
    description: "",
    estimated_duration_hours: "",
    materials_included: false
  });

  // Check if professional already sent a quote for this request
  useEffect(() => {
    const checkExistingQuote = async () => {
      if (!user?.id || !requestId) {
        setCheckingQuote(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("quotes")
          .select("id")
          .eq("request_id", requestId)
          .eq("professional_id", user.id)
          .maybeSingle();

        if (!error && data) {
          setHasExistingQuote(true);
        }
      } catch (err) {
        console.error("Error checking existing quote:", err);
      } finally {
        setCheckingQuote(false);
      }
    };

    checkExistingQuote();
  }, [user?.id, requestId]);

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
      setShowConfetti(true);
      setHasExistingQuote(true);
      
      // Start XP animation after a brief delay
      setTimeout(() => setXpAnimating(true), 300);
      
      setTimeout(() => {
        setShowSuccess(false);
        setShowConfetti(false);
        setXpAnimating(false);
        setOpen(false);
        resetForm();
        onQuoteSubmitted?.();
        toast.success("🎉 Proposta enviada com sucesso!");
      }, 2500);

    } catch (error) {
      console.error("Error submitting quote:", error);
      toast.error("Erro ao enviar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const defaultTrigger = hasExistingQuote ? (
    <div className="relative w-full group">
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-500 animate-pulse" />
      
      <Button 
        size="lg" 
        disabled 
        className="relative w-full h-auto min-h-14 py-3 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-semibold shadow-xl rounded-2xl cursor-default border border-white/20 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-center gap-2"
      >
        <div className="flex items-center gap-2">
          <div className="relative flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping" />
          </div>
          <span className="text-base whitespace-nowrap">Proposta enviada</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 rounded-full text-xs sm:text-sm flex-shrink-0">
          <Hourglass className="w-3 h-3 animate-[spin_3s_linear_infinite]" />
          <span>Aguardando</span>
        </div>
      </Button>
    </div>
  ) : (
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
        {/* Confetti overlay */}
        <Confetti isActive={showConfetti} pieceCount={80} duration={2500} />
        
        {showSuccess ? (
          <div className="text-center py-12 px-6 relative overflow-hidden">
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-yellow-500/10 animate-pulse" />
            
            {/* Success icon with bounce animation */}
            <div className="relative">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 flex items-center justify-center shadow-2xl animate-[scale-in_0.5s_ease-out] ring-4 ring-emerald-200/50">
                <Trophy className="w-12 h-12 text-white drop-shadow-lg" />
              </div>
              
              {/* Floating stars */}
              <Star className="absolute top-0 left-1/4 w-5 h-5 text-yellow-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
              <Star className="absolute top-4 right-1/4 w-4 h-4 text-yellow-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
              <Sparkles className="absolute bottom-0 right-1/3 w-5 h-5 text-emerald-400 animate-bounce" style={{ animationDelay: '0.6s' }} />
            </div>
            
            <h3 className="text-2xl font-bold mb-2 text-foreground animate-fade-in">
              🎉 Proposta Enviada!
            </h3>
            <p className="text-muted-foreground text-sm animate-fade-in" style={{ animationDelay: '0.2s' }}>
              O cliente foi notificado e logo entrará em contato.
            </p>
            
            {/* XP Badge with animation */}
            <div 
              className={cn(
                "mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold shadow-lg transition-all duration-500",
                xpAnimating ? "scale-110 animate-pulse" : "scale-100"
              )}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-lg">+10 XP</span>
            </div>
            
            {/* Progress hint */}
            <p className="mt-4 text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: '0.4s' }}>
              Continue enviando propostas para subir de nível! 🚀
            </p>
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
                
              </div>

              {/* Material - Toggle visual */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  Material no orçamento
                </Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setQuoteForm(prev => ({ ...prev, materials_included: true }))}
                    className={cn(
                      "flex-1 h-11 rounded-xl text-sm font-medium transition-all duration-200 border-2 flex items-center justify-center gap-1.5",
                      quoteForm.materials_included 
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm" 
                        : "bg-muted/30 border-transparent text-muted-foreground hover:border-border hover:bg-muted/50"
                    )}
                  >
                    <CheckCircle className={cn("w-4 h-4", quoteForm.materials_included ? "text-emerald-500" : "text-muted-foreground/50")} />
                    Incluído
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuoteForm(prev => ({ ...prev, materials_included: false }))}
                    className={cn(
                      "flex-1 h-11 rounded-xl text-sm font-medium transition-all duration-200 border-2 flex items-center justify-center gap-1.5",
                      !quoteForm.materials_included 
                        ? "bg-orange-50 border-orange-400 text-orange-700 shadow-sm" 
                        : "bg-muted/30 border-transparent text-muted-foreground hover:border-border hover:bg-muted/50"
                    )}
                  >
                    <Package className={cn("w-4 h-4", !quoteForm.materials_included ? "text-orange-500" : "text-muted-foreground/50")} />
                    Não incluso
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
