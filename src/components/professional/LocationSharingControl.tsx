import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Navigation, Battery, AlertTriangle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LocationSharingControlProps {
  requestId: string;
  professionalId: string;
  isActive: boolean;
  onToggle: (active: boolean) => void;
}

export function LocationSharingControl({
  requestId,
  professionalId,
  isActive,
  onToggle,
}: LocationSharingControlProps) {
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [battery, setBattery] = useState<number | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [updateInterval, setUpdateInterval] = useState(10000); // 10s default
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Check battery status
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((batteryManager: any) => {
        setBattery(Math.round(batteryManager.level * 100));
        
        batteryManager.addEventListener('levelchange', () => {
          setBattery(Math.round(batteryManager.level * 100));
        });
      });
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [isActive, updateInterval]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não suportada neste dispositivo");
      return;
    }

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, heading, speed, accuracy: posAccuracy } = position.coords;
        
        setAccuracy(Math.round(posAccuracy));
        setLastUpdate(new Date());

        // Update location in database
        try {
          const { error } = await supabase
            .from('professional_live_location')
            .upsert({
              request_id: requestId,
              professional_id: professionalId,
              latitude,
              longitude,
              heading: heading || null,
              speed: speed || null,
              updated_at: new Date().toISOString(),
            });

          if (error) {
            console.error("Error updating location:", error);
          }
        } catch (error) {
          console.error("Error updating location:", error);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Erro ao obter localização");
        onToggle(false);
      },
      {
        enableHighAccuracy: updateInterval <= 10000,
        maximumAge: updateInterval,
        timeout: 5000,
      }
    );

    setWatchId(id);
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  const recalibrateGPS = () => {
    stopTracking();
    toast.info("Recalibrando GPS...");
    setTimeout(() => {
      if (isActive) {
        startTracking();
      }
    }, 1000);
  };

  const toggleBatterySavingMode = (enabled: boolean) => {
    setUpdateInterval(enabled ? 30000 : 10000); // 30s vs 10s
    toast.success(
      enabled 
        ? "Modo economia ativado (atualização a cada 30s)"
        : "Modo normal ativado (atualização a cada 10s)"
    );
  };

  const getAccuracyColor = (acc: number | null) => {
    if (!acc) return "text-muted-foreground";
    if (acc <= 10) return "text-green-600";
    if (acc <= 30) return "text-yellow-600";
    return "text-red-600";
  };

  const getAccuracyLabel = (acc: number | null) => {
    if (!acc) return "Desconhecida";
    if (acc <= 10) return "Excelente";
    if (acc <= 30) return "Boa";
    return "Baixa";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Compartilhamento de Localização
            </CardTitle>
            <CardDescription>
              Permita que o cliente acompanhe sua localização em tempo real
            </CardDescription>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={onToggle}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isActive && (
          <>
            {/* Status Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className={`w-4 h-4 ${getAccuracyColor(accuracy)}`} />
                  <span className="text-xs text-muted-foreground">Precisão GPS</span>
                </div>
                <div className={`font-semibold ${getAccuracyColor(accuracy)}`}>
                  {accuracy ? `±${accuracy}m` : "---"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {getAccuracyLabel(accuracy)}
                </div>
              </div>

              {battery !== null && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Battery className={`w-4 h-4 ${
                      battery > 50 ? "text-green-600" : battery > 20 ? "text-yellow-600" : "text-red-600"
                    }`} />
                    <span className="text-xs text-muted-foreground">Bateria</span>
                  </div>
                  <div className="font-semibold">
                    {battery}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {battery <= 20 && "Considere modo economia"}
                  </div>
                </div>
              )}
            </div>

            {/* Last Update */}
            {lastUpdate && (
              <div className="text-xs text-muted-foreground text-center">
                Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
              </div>
            )}

            {/* Warnings */}
            {accuracy && accuracy > 30 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Precisão do GPS está baixa. Tente recalibrar ou mova-se para um local com melhor visão do céu.
                </AlertDescription>
              </Alert>
            )}

            {battery && battery <= 20 && (
              <Alert>
                <Battery className="h-4 w-4" />
                <AlertDescription>
                  Bateria baixa detectada. Ative o modo economia para prolongar o rastreamento.
                </AlertDescription>
              </Alert>
            )}

            {/* Controls */}
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={recalibrateGPS}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recalibrar GPS
              </Button>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Battery className="w-4 h-4" />
                  <div>
                    <p className="text-sm font-medium">Modo Economia de Bateria</p>
                    <p className="text-xs text-muted-foreground">
                      Atualiza a cada 30s em vez de 10s
                    </p>
                  </div>
                </div>
                <Switch
                  checked={updateInterval === 30000}
                  onCheckedChange={toggleBatterySavingMode}
                />
              </div>
            </div>

            {/* Info */}
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p className="font-medium mb-1">ℹ️ Informações:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Mantenha o app aberto para melhor precisão</li>
                <li>GPS funciona melhor em ambientes externos</li>
                <li>O rastreamento para automaticamente ao finalizar o serviço</li>
              </ul>
            </div>
          </>
        )}

        {!isActive && (
          <div className="text-center py-6 text-muted-foreground">
            <Navigation className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              Ative o compartilhamento para que o cliente<br />
              possa acompanhar sua localização
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
