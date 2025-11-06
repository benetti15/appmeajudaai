import { useEffect } from "react";
import { useProfessionalTracking } from "@/hooks/useProfessionalTracking";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AutoLocationSharingProps {
  requestId: string;
  professionalId: string;
  status: string;
  isActive: boolean;
}

export function AutoLocationSharing({
  requestId,
  professionalId,
  status,
  isActive,
}: AutoLocationSharingProps) {
  const shouldTrack = status === "on_way" || status === "arrived" || status === "in_progress";
  
  const { isTracking, startTracking, stopTracking } = useProfessionalTracking(
    requestId,
    professionalId,
    { 
      autoStart: shouldTrack && isActive,
      silentMode: false 
    }
  );

  // Stop tracking when service is completed or cancelled
  useEffect(() => {
    if (!shouldTrack && isTracking) {
      stopTracking(true);
    }
  }, [shouldTrack, isTracking, stopTracking]);

  if (!isActive) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {isTracking ? (
              <Radio className="w-5 h-5 text-green-600 animate-pulse" />
            ) : (
              <MapPin className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-sm">Compartilhamento de Localização</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isTracking 
                  ? "Sua localização está sendo compartilhada em tempo real com o cliente"
                  : "O compartilhamento iniciará automaticamente quando você estiver a caminho"
                }
              </p>
            </div>

            {shouldTrack && (
              <div className="flex gap-2">
                {!isTracking ? (
                  <Button 
                    size="sm" 
                    onClick={() => startTracking(false)}
                    className="text-xs"
                  >
                    <MapPin className="w-3 h-3 mr-1" />
                    Iniciar Agora
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => stopTracking(false)}
                    className="text-xs"
                  >
                    Pausar Compartilhamento
                  </Button>
                )}
              </div>
            )}

            {isTracking && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                Ao vivo
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
