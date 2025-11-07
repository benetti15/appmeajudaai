import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Navigation, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfessionalTracking } from "@/hooks/useProfessionalTracking";
import { useGeolocation } from "@/hooks/useGeolocation";
import { initializeMapbox } from "@/lib/mapbox";

interface ProfessionalMiniMapProps {
  clientAddress: string;
  clientLatitude: number;
  clientLongitude: number;
  requestId: string;
  professionalId: string;
  status: string;
}

export function ProfessionalMiniMap({
  clientAddress,
  clientLatitude,
  clientLongitude,
  requestId,
  professionalId,
  status,
}: ProfessionalMiniMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const { latitude, longitude, getCurrentPosition } = useGeolocation(true);
  
  const { isTracking } = useProfessionalTracking(
    requestId,
    professionalId,
    { 
      autoStart: ["on_way", "arrived", "service_started"].includes(status),
      silentMode: true 
    }
  );

  // Calculate distance
  useEffect(() => {
    if (latitude && longitude) {
      const R = 6371; // Earth radius in km
      const dLat = (clientLatitude - latitude) * Math.PI / 180;
      const dLon = (clientLongitude - longitude) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(latitude * Math.PI / 180) * Math.cos(clientLatitude * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      setDistance(R * c);
    }
  }, [latitude, longitude, clientLatitude, clientLongitude]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    // Verificar se coordenadas do cliente existem
    if (!clientLatitude || !clientLongitude) {
      setMapError('Coordenadas do cliente não disponíveis');
      setIsLoadingMap(false);
      return;
    }

    const initMap = async () => {
      try {
        setIsLoadingMap(true);
        const token = await initializeMapbox();
        mapboxgl.accessToken = token;

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/light-v11",
          center: [clientLongitude, clientLatitude],
          zoom: 14,
          interactive: false,
        });

        // Add client marker
        const clientEl = document.createElement('div');
        clientEl.className = 'w-8 h-8';
        clientEl.innerHTML = `
          <div class="w-full h-full flex items-center justify-center bg-primary rounded-full shadow-lg animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>
        `;

        new mapboxgl.Marker(clientEl)
          .setLngLat([clientLongitude, clientLatitude])
          .addTo(map.current);
        
        setMapError(null);
        setIsLoadingMap(false);
      } catch (error) {
        console.error('Erro ao inicializar mapa:', error);
        setMapError('Não foi possível carregar o mapa');
        setIsLoadingMap(false);
      }
    };

    initMap();

    return () => {
      map.current?.remove();
    };
  }, [clientLatitude, clientLongitude]);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5 animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Localização do Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoadingMap ? (
          <div className="w-full h-[200px] rounded-lg border border-primary/10 shadow-sm flex items-center justify-center bg-muted/30">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Carregando mapa...</p>
            </div>
          </div>
        ) : mapError ? (
          <Alert variant="default" className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <p className="font-medium">{mapError}</p>
              <p className="text-sm mt-1">Endereço: {clientAddress}</p>
            </AlertDescription>
          </Alert>
        ) : (
          <div 
            ref={mapContainer} 
            className="w-full h-[200px] rounded-lg border border-primary/10 shadow-sm"
          />
        )}
        
        <div className="flex items-center justify-between text-sm bg-muted/50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-foreground">{clientAddress}</span>
          </div>
          {distance && (
            <span className="text-primary font-semibold">{distance.toFixed(1)} km</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isTracking ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground">Compartilhando localização automaticamente</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Compartilhamento inativo</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
