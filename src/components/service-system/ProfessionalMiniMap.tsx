import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Navigation, Loader2, AlertCircle, Clock, Route } from "lucide-react";
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
  const routeLineRef = useRef<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [eta, setEta] = useState<string | null>(null);
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

  // Fetch route from Mapbox Directions API
  const fetchRoute = async (profLng: number, profLat: number) => {
    if (!map.current) return;

    try {
      const token = await initializeMapbox();
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${profLng},${profLat};${clientLongitude},${clientLatitude}?geometries=geojson&access_token=${token}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const routeGeometry = route.geometry;
        
        // Set distance and duration
        setDistance(route.distance / 1000); // Convert meters to km
        setDuration(route.duration / 60); // Convert seconds to minutes
        
        // Calculate ETA
        const now = new Date();
        const etaTime = new Date(now.getTime() + route.duration * 1000);
        setEta(etaTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

        // Remove existing route layer if any
        if (routeLineRef.current && map.current.getLayer(routeLineRef.current)) {
          map.current.removeLayer(routeLineRef.current);
          map.current.removeSource(routeLineRef.current);
        }

        // Add route source and layer
        const routeId = 'route-line';
        routeLineRef.current = routeId;

        map.current.addSource(routeId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: routeGeometry
          }
        });

        map.current.addLayer({
          id: routeId,
          type: 'line',
          source: routeId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': 'hsl(var(--primary))',
            'line-width': 4,
            'line-opacity': 0.8
          }
        });

        // Fit map to show both points and route
        const coordinates = routeGeometry.coordinates;
        const bounds = coordinates.reduce((bounds: mapboxgl.LngLatBounds, coord: [number, number]) => {
          return bounds.extend(coord as [number, number]);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

        map.current.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 }
        });
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  // Update route when professional location changes
  useEffect(() => {
    if (latitude && longitude && map.current) {
      fetchRoute(longitude, latitude);
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
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-foreground line-clamp-1">{clientAddress}</span>
            </div>
            {distance && (
              <span className="text-primary font-semibold whitespace-nowrap ml-2">{distance.toFixed(1)} km</span>
            )}
          </div>

          {duration && eta && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-sm bg-primary/10 p-3 rounded-lg border border-primary/20">
                <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Tempo estimado</p>
                  <p className="font-semibold text-primary truncate">{Math.ceil(duration)} min</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm bg-green-50 dark:bg-green-950/30 p-3 rounded-lg border border-green-200 dark:border-green-900">
                <Route className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Chegada prevista</p>
                  <p className="font-semibold text-green-600 dark:text-green-400 truncate">{eta}</p>
                </div>
              </div>
            </div>
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
