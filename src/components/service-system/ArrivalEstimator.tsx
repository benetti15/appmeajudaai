import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Car, MapPin } from "lucide-react";
import { toast } from "sonner";

interface ArrivalEstimatorProps {
  onEstimateSet: (minutes: number) => void;
  currentEstimate?: number;
  showEstimate?: boolean;
}

export function ArrivalEstimator({ onEstimateSet, currentEstimate, showEstimate = true }: ArrivalEstimatorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [estimatedMinutes, setEstimatedMinutes] = useState(currentEstimate || 30);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (currentEstimate && showEstimate) {
      setTimeRemaining(currentEstimate);
      
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 0) return null;
          return prev - 1;
        });
      }, 60000); // Update every minute

      return () => clearInterval(timer);
    }
  }, [currentEstimate, showEstimate]);

  const handleSetEstimate = () => {
    if (estimatedMinutes < 5 || estimatedMinutes > 120) {
      toast.error("Estimativa deve ser entre 5 e 120 minutos");
      return;
    }
    
    onEstimateSet(estimatedMinutes);
    setIsDialogOpen(false);
    toast.success(`Estimativa definida: ${estimatedMinutes} minutos`);
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <div className="space-y-4">
      {/* Set Estimate Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full gap-2">
            <Clock className="w-4 h-4" />
            {currentEstimate ? 'Atualizar Estimativa' : 'Definir Estimativa de Chegada'}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Estimativa de Chegada</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="minutes">Tempo estimado (minutos)</Label>
              <Input
                id="minutes"
                type="number"
                min="5"
                max="120"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Entre 5 e 120 minutos
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSetEstimate}>
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Current Estimate Display */}
      {showEstimate && timeRemaining !== null && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Car className="w-5 h-5 text-blue-600 animate-bounce" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">Profissional a caminho</span>
              </div>
              <div className="text-sm text-blue-700">
                Chegada estimada em: <strong>{formatTime(timeRemaining)}</strong>
              </div>
              {timeRemaining <= 5 && (
                <div className="text-xs text-orange-600 font-medium mt-1 animate-pulse">
                  ⚡ Chegando em breve!
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Quick Estimate Buttons */}
      {!isDialogOpen && (
        <div className="grid grid-cols-3 gap-2">
          {[15, 30, 45].map((minutes) => (
            <Button
              key={minutes}
              variant="outline"
              size="sm"
              onClick={() => onEstimateSet(minutes)}
              className="text-xs"
            >
              {formatTime(minutes)}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}