import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Navigation, Loader2, AlertCircle, Home } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { initializeMapbox } from "@/lib/mapbox";
import { InfoCard } from "@/components/ui/info-card";
import { cn } from "@/lib/utils";

interface EnhancedLocationCardProps {
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  showDistance?: boolean;
  mapHeight?: string;
  title?: string;
  variant?: "professional" | "client";
}

export function EnhancedLocationCard({
  address,
  city,
  state,
  latitude,
  longitude,
  showDistance = true,
  mapHeight = "280px",
  title = "Localização do Cliente",
  variant = "professional",
}: EnhancedLocationCardProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const { latitude: myLat, longitude: myLng } = useGeolocation(showDistance);

  const fullAddress = `${address}, ${city} - ${state}`;

  // Calculate distance
  useEffect(() => {
    if (myLat && myLng && showDistance) {
      const R = 6371; // Earth radius in km
      const dLat = (latitude - myLat) * Math.PI / 180;
      const dLon = (longitude - myLng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(myLat * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      setDistance(R * c);
    }
  }, [myLat, myLng, latitude, longitude, showDistance]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    if (!latitude || !longitude) {
      setMapError('Coordenadas não disponíveis');
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
          center: [longitude, latitude],
          zoom: 14,
          interactive: true,
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Client marker with animation
        const clientEl = document.createElement('div');
        clientEl.className = 'w-10 h-10 animate-bounce';
        clientEl.innerHTML = `
          <div class="w-full h-full flex items-center justify-center bg-primary rounded-full shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>
        `;

        new mapboxgl.Marker(clientEl)
          .setLngLat([longitude, latitude])
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
      map.current = null;
    };
  }, [latitude, longitude]);

  return (
    <Card className={cn(
      "overflow-hidden hover-lift animate-fade-in border-primary/10",
      "bg-gradient-to-br from-card via-card to-primary/5"
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            {title}
          </CardTitle>
          {distance && (
            <Badge 
              variant="secondary" 
              className="animate-fade-in bg-primary/10 text-primary border-primary/20"
            >
              <Navigation className="w-3 h-3 mr-1" />
              {distance.toFixed(1)} km
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Address Info */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-start gap-3">
            <Home className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{address}</p>
              <p className="text-xs text-muted-foreground mt-1">{city} - {state}</p>
            </div>
          </div>
        </div>

        {/* Map */}
        {isLoadingMap ? (
          <div 
            className="w-full rounded-lg border border-primary/20 bg-gradient-to-br from-muted/30 to-primary/5 flex items-center justify-center animate-pulse"
            style={{ height: mapHeight }}
          >
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground font-medium">Carregando mapa...</p>
            </div>
          </div>
        ) : mapError ? (
          <Alert variant="default" className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <p className="font-medium">{mapError}</p>
              <p className="text-sm mt-1">{fullAddress}</p>
            </AlertDescription>
          </Alert>
        ) : (
          <div 
            ref={mapContainer} 
            className="w-full rounded-lg border border-primary/20 shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            style={{ height: mapHeight }}
          />
        )}

        {/* Additional Info for Professional */}
        {variant === "professional" && distance && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <InfoCard
              icon={Navigation}
              label="Distância"
              value={`${distance.toFixed(1)} km`}
              iconColor="text-primary"
              className="hover-scale"
            />
            <InfoCard
              icon={MapPin}
              label="Cidade"
              value={city}
              iconColor="text-accent"
              className="hover-scale"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
