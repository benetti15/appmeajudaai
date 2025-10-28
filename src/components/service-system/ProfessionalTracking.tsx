import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation, MapPin } from "lucide-react";
import { useProfessionalTracking } from "@/hooks/useProfessionalTracking";
import { Badge } from "@/components/ui/badge";

interface ProfessionalTrackingProps {
  requestId: string;
  professionalId: string;
  isActive: boolean; // Only show when service is "on_way" or "in_progress"
}

export function ProfessionalTracking({
  requestId,
  professionalId,
  isActive,
}: ProfessionalTrackingProps) {
  const { isTracking, error, startTracking, stopTracking } = useProfessionalTracking(
    requestId,
    professionalId
  );

  if (!isActive) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Compartilhar Localização
            </CardTitle>
            <CardDescription>
              Permita que o cliente acompanhe seu deslocamento em tempo real
            </CardDescription>
          </div>
          {isTracking && (
            <Badge variant="outline" className="gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Ativo
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
          <MapPin className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-medium mb-1">Como funciona</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Sua localização será compartilhada automaticamente</li>
              <li>• O cliente verá sua posição em tempo real no mapa</li>
              <li>• A distância e tempo estimado são calculados automaticamente</li>
              <li>• Você pode parar o compartilhamento a qualquer momento</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-2">
          {!isTracking ? (
            <Button
              onClick={startTracking}
              className="w-full gap-2"
              size="lg"
            >
              <Navigation className="h-4 w-4" />
              Iniciar Compartilhamento
            </Button>
          ) : (
            <Button
              onClick={stopTracking}
              variant="outline"
              className="w-full gap-2"
              size="lg"
            >
              Parar Compartilhamento
            </Button>
          )}
        </div>

        {isTracking && (
          <div className="text-xs text-center text-muted-foreground">
            <p>💡 Mantenha o navegador aberto para continuar compartilhando sua localização</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
