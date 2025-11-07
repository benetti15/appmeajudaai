import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Navigation, Loader2, AlertCircle } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { initializeMapbox } from "@/lib/mapbox";

interface ClientLocationMapProps {
  clientAddress: string;
  clientLatitude: number;
  clientLongitude: number;
  showDistance?: boolean;
  mapHeight?: string;
}

export function ClientLocationMap({
  clientAddress,
  clientLatitude,
  clientLongitude,
  showDistance = true,
  mapHeight = "200px",
}: ClientLocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const { latitude, longitude } = useGeolocation(true);

  // Calculate distance
  useEffect(() => {
    if (latitude && longitude && showDistance) {
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
  }, [latitude, longitude, clientLatitude, clientLongitude, showDistance]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    console.log('🗺️ Inicializando mapa com coordenadas:', { clientLatitude, clientLongitude });
    
    if (!clientLatitude || !clientLongitude) {
      console.error('❌ Coordenadas não disponíveis');
      setMapError('Coordenadas do cliente não disponíveis');
      setIsLoadingMap(false);
      return;
    }

    const initMap = async () => {
      try {
        console.log('📍 Buscando token do Mapbox...');
        setIsLoadingMap(true);
        const token = await initializeMapbox();
        console.log('✅ Token do Mapbox obtido');
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
    <div className="space-y-3 animate-fade-in">
      {/* Address with distance */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="font-medium text-foreground truncate">{clientAddress}</span>
        </div>
        {showDistance && distance && (
          <span className="text-primary font-semibold flex-shrink-0 ml-2">{distance.toFixed(1)} km</span>
        )}
      </div>

      {/* Map */}
      {isLoadingMap ? (
        <div 
          className="w-full rounded-lg border border-primary/10 shadow-sm flex items-center justify-center bg-muted/30"
          style={{ height: mapHeight }}
        >
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
          className="w-full rounded-lg border border-primary/10 shadow-sm"
          style={{ height: mapHeight }}
        />
      )}
    </div>
  );
}
