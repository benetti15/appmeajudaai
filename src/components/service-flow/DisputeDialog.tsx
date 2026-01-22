import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle } from "lucide-react";

interface DisputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<void>;
}

const DISPUTE_REASONS = [
  "Serviço não foi concluído corretamente",
  "Qualidade abaixo do esperado",
  "Profissional não compareceu",
  "Cobrança diferente do combinado",
  "Danos causados durante o serviço",
  "Outro problema"
];

export function DisputeDialog({
  open,
  onOpenChange,
  onConfirm
}: DisputeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [details, setDetails] = useState("");
  
  const handleConfirm = async () => {
    const finalReason = `${selectedReason}${details ? `: ${details}` : ''}`;
    
    if (!selectedReason) return;
    
    setLoading(true);
    try {
      await onConfirm(finalReason);
    } finally {
      setLoading(false);
      setSelectedReason("");
      setDetails("");
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle>Reportar Problema</DialogTitle>
          </div>
          <DialogDescription>
            Descreva o problema encontrado. Nossa equipe analisará e entrará em contato.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div>
            <p className="text-sm font-medium mb-3">Tipo de problema:</p>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {DISPUTE_REASONS.map((reason) => (
                <div key={reason} className="flex items-center space-x-2 py-1.5">
                  <RadioGroupItem value={reason} id={reason} />
                  <Label htmlFor={reason} className="text-sm cursor-pointer">
                    {reason}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div>
            <p className="text-sm font-medium mb-2">Detalhes adicionais:</p>
            <Textarea
              placeholder="Descreva o problema com mais detalhes..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm} 
            disabled={loading || !selectedReason}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Enviar Reclamação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
