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
import { Calendar } from "@/components/ui/calendar";
import { Loader2, CalendarClock } from "lucide-react";
import { ptBR } from "date-fns/locale";

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (newDate: Date, reason: string) => Promise<void>;
}

export function RescheduleDialog({
  open,
  onOpenChange,
  onConfirm
}: RescheduleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState("");
  
  const handleConfirm = async () => {
    if (!selectedDate) return;
    
    setLoading(true);
    try {
      await onConfirm(selectedDate, reason);
    } finally {
      setLoading(false);
      setSelectedDate(undefined);
      setReason("");
    }
  };
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100">
              <CalendarClock className="w-5 h-5 text-amber-600" />
            </div>
            <DialogTitle>Solicitar Reagendamento</DialogTitle>
          </div>
          <DialogDescription>
            Escolha uma nova data para o serviço. O cliente precisará aceitar a nova data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Nova data:</p>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ptBR}
              disabled={(date) => date < tomorrow}
              className="rounded-md border mx-auto"
            />
          </div>
          
          <div>
            <p className="text-sm font-medium mb-2">Motivo (opcional):</p>
            <Textarea
              placeholder="Explique o motivo do reagendamento..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading || !selectedDate}>
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Solicitar Reagendamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
