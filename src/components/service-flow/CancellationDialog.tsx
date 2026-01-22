import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle } from "lucide-react";

interface CancellationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: 'client' | 'professional';
  onConfirm: (reason: string) => Promise<void>;
}

const CLIENT_REASONS = [
  "Não preciso mais do serviço",
  "Encontrei outro profissional",
  "Mudei de ideia sobre o serviço",
  "Problema pessoal/imprevisto",
  "Outro motivo"
];

const PROFESSIONAL_REASONS = [
  "Não consigo atender neste horário",
  "Problema de saúde/imprevisto",
  "Distância muito grande",
  "Serviço fora da minha especialidade",
  "Outro motivo"
];

export function CancellationDialog({
  open,
  onOpenChange,
  userRole,
  onConfirm
}: CancellationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  
  const reasons = userRole === 'client' ? CLIENT_REASONS : PROFESSIONAL_REASONS;
  
  const handleConfirm = async () => {
    const finalReason = selectedReason === "Outro motivo" 
      ? customReason || "Motivo não especificado"
      : selectedReason;
    
    if (!finalReason) return;
    
    setLoading(true);
    try {
      await onConfirm(finalReason);
    } finally {
      setLoading(false);
      setSelectedReason("");
      setCustomReason("");
    }
  };
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <AlertDialogTitle>Cancelar serviço?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            {userRole === 'client' 
              ? "O profissional será notificado sobre o cancelamento. Esta ação não pode ser desfeita."
              : "O cliente será notificado que você não poderá realizar o serviço."
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4">
          <p className="text-sm font-medium mb-3">Motivo do cancelamento:</p>
          <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
            {reasons.map((reason) => (
              <div key={reason} className="flex items-center space-x-2 py-1.5">
                <RadioGroupItem value={reason} id={reason} />
                <Label htmlFor={reason} className="text-sm cursor-pointer">
                  {reason}
                </Label>
              </div>
            ))}
          </RadioGroup>
          
          {selectedReason === "Outro motivo" && (
            <Textarea
              placeholder="Descreva o motivo..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="mt-3 min-h-[80px]"
            />
          )}
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Voltar</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading || !selectedReason || (selectedReason === "Outro motivo" && !customReason)}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Confirmar Cancelamento
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
