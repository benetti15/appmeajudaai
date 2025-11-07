import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Navigation, MapPin, Clock, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { initializeMapbox } from "@/lib/mapbox";

interface ClientTrackingMiniMapProps {
  requestId: string;
  clientLatitude: number;
  clientLongitude: number;
  clientAddress: string;
}

interface ProfessionalLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  updated_at: string;
}

export function ClientTrackingMiniMap({
  requestId,
  clientLatitude,
  clientLongitude,
  clientAddress,
}: ClientTrackingMiniMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const professionalMarker = useRef<mapboxgl.Marker | null>(null);
  const [professionalLocation, setProfessionalLocation] = useState<ProfessionalLocation | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setETA] = useState<number | null>(null);
  const [hasActiveTracking, setHasActiveTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Check if tracking is active
  useEffect(() => {
    const checkTracking = async () => {
      const { data, error } = await supabase
        .from('professional_live_location')
        .select('*')
        .eq('request_id', requestId)
        .maybeSingle();
      
      if (data) {
        setHasActiveTracking(true);
        setProfessionalLocation(data as ProfessionalLocation);
        
        const dist = calculateDistance(
          data.latitude,
          data.longitude,
          clientLatitude,
          clientLongitude
        );
        setDistance(dist);
        
        const avgSpeed = data.speed ? data.speed * 3.6 : 30;
        const estimatedTime = (dist / avgSpeed) * 60;
        setETA(Math.round(estimatedTime));
      } else {
        setHasActiveTracking(false);
      }
      
      setIsLoading(false);
    };

    checkTracking();

    // Subscribe to changes
    const channel = supabase
      .channel(`tracking-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'professional_live_location',
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setHasActiveTracking(false);
            setProfessionalLocation(null);
          } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setHasActiveTracking(true);
            const newLocation = payload.new as ProfessionalLocation;
            setProfessionalLocation(newLocation);
            
            const dist = calculateDistance(
              newLocation.latitude,
              newLocation.longitude,
              clientLatitude,
              clientLongitude
            );
            setDistance(dist);
            
            const avgSpeed = newLocation.speed ? newLocation.speed * 3.6 : 30;
            const estimatedTime = (dist / avgSpeed) * 60;
            setETA(Math.round(estimatedTime));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, clientLatitude, clientLongitude]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current || !hasActiveTracking) return;
    
    // Verificar se coordenadas do cliente existem
    if (!clientLatitude || !clientLongitude) {
      setMapError('Coordenadas do cliente não disponíveis');
      return;
    }

    const initMap = async () => {
      try {
        const token = await initializeMapbox();
        mapboxgl.accessToken = token;

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [clientLongitude, clientLatitude],
          zoom: 13,
        });

        map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

        // Add client marker (home icon)
        const clientEl = document.createElement('div');
        clientEl.className = 'w-10 h-10';
        clientEl.innerHTML = `
          <div class="w-full h-full flex items-center justify-center bg-primary rounded-full shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>
        `;

        new mapboxgl.Marker(clientEl)
          .setLngLat([clientLongitude, clientLatitude])
          .addTo(map.current);
        
        setMapError(null);
      } catch (error) {
        console.error('Erro ao inicializar mapa:', error);
        setMapError('Não foi possível carregar o mapa');
      }
    };

    initMap();

    return () => {
      map.current?.remove();
    };
  }, [clientLatitude, clientLongitude, hasActiveTracking]);

  // Update professional marker
  useEffect(() => {
    if (!map.current || !professionalLocation || !hasActiveTracking) return;

    const { latitude, longitude } = professionalLocation;

    if (professionalMarker.current) {
      professionalMarker.current.setLngLat([longitude, latitude]);
    } else {
      const profEl = document.createElement('div');
      profEl.className = 'w-10 h-10';
      profEl.innerHTML = `
        <div class="w-full h-full flex items-center justify-center bg-green-500 rounded-full shadow-lg animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      `;

      professionalMarker.current = new mapboxgl.Marker(profEl)
        .setLngLat([longitude, latitude])
        .addTo(map.current);
    }

    // Draw route line
    const routeGeoJSON = {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [longitude, latitude],
          [clientLongitude, clientLatitude]
        ]
      }
    };

    if (map.current.getSource('route')) {
      (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData(routeGeoJSON as any);
    } else {
      map.current.addSource('route', {
        type: 'geojson',
        data: routeGeoJSON as any
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        paint: {
          'line-color': '#10b981',
          'line-width': 3,
          'line-opacity': 0.7
        }
      });
    }

    // Fit bounds
    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend([longitude, latitude]);
    bounds.extend([clientLongitude, clientLatitude]);
    
    map.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15,
    });
  }, [professionalLocation, clientLatitude, clientLongitude, hasActiveTracking]);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Verificando localização...</p>
        </CardContent>
      </Card>
    );
  }

  if (!hasActiveTracking) {
    return null; // Don't show anything if tracking is not active
  }

  return (
    <Card className="border-green-200 bg-gradient-to-br from-background to-green-50/30 animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Navigation className="w-4 h-4 text-green-600" />
            Profissional a Caminho
          </CardTitle>
          <Badge variant="outline" className="bg-green-500 text-white border-green-600 animate-pulse">
            <span className="w-1.5 h-1.5 bg-white rounded-full mr-1.5" />
            AO VIVO
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Distância</p>
              <p className="font-semibold text-sm">
                {distance ? `${distance.toFixed(1)} km` : '...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Chegada</p>
              <p className="font-semibold text-sm">
                {eta ? `${eta} min` : '...'}
              </p>
            </div>
          </div>
        </div>
        
        {mapError ? (
          <Alert variant="default" className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <p className="font-medium">{mapError}</p>
              <p className="text-sm mt-1">Verifique sua conexão e tente novamente</p>
            </AlertDescription>
          </Alert>
        ) : (
          <div 
            ref={mapContainer} 
            className="w-full h-[250px] rounded-lg border shadow-sm"
          />
        )}
        
        {professionalLocation && (
          <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg flex items-center justify-between">
            <span>Última atualização</span>
            <span className="font-medium">
              {new Date(professionalLocation.updated_at).toLocaleTimeString('pt-BR')}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
