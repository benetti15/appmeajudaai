import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Navigation, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProximityAlerts } from "@/hooks/useProximityAlerts";
import { toast as sonnerToast } from "sonner";

interface LiveTrackingMapProps {
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

export function LiveTrackingMap({
  requestId,
  clientLatitude,
  clientLongitude,
  clientAddress,
}: LiveTrackingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const professionalMarker = useRef<mapboxgl.Marker | null>(null);
  const clientMarker = useRef<mapboxgl.Marker | null>(null);
  const [professionalLocation, setProfessionalLocation] = useState<ProfessionalLocation | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setETA] = useState<number | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const { toast } = useToast();

  // Setup proximity alerts
  useProximityAlerts(distance, eta, (message) => {
    sonnerToast.info(message, {
      duration: 5000,
      icon: "📍",
    });
  });

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Fetch route from Mapbox Directions API
  const fetchRoute = async (profLng: number, profLat: number, clientLng: number, clientLat: number) => {
    const mapboxToken = localStorage.getItem('mapbox_token');
    if (!mapboxToken) return null;

    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${profLng},${profLat};${clientLng},${clientLat}?geometries=geojson&access_token=${mapboxToken}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        return {
          coordinates: route.geometry.coordinates,
          duration: Math.round(route.duration / 60), // em minutos
          distance: (route.distance / 1000).toFixed(1) // em km
        };
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    }

    return null;
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = localStorage.getItem('mapbox_token');
    
    if (!mapboxToken) {
      toast({
        title: "Token Mapbox necessário",
        description: "Configure o token do Mapbox para visualizar o mapa",
        variant: "destructive",
      });
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [clientLongitude, clientLatitude],
      zoom: 14,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add client marker
    const clientEl = document.createElement('div');
    clientEl.className = 'client-marker';
    clientEl.style.width = '40px';
    clientEl.style.height = '40px';
    clientEl.style.backgroundImage = 'url(https://api.iconify.design/mdi:home-map-marker.svg?color=%234f46e5)';
    clientEl.style.backgroundSize = 'cover';

    clientMarker.current = new mapboxgl.Marker(clientEl)
      .setLngLat([clientLongitude, clientLatitude])
      .setPopup(new mapboxgl.Popup().setHTML(`<strong>Seu endereço</strong><br/>${clientAddress}`))
      .addTo(map.current);

    return () => {
      map.current?.remove();
    };
  }, [clientLatitude, clientLongitude, clientAddress, toast]);

  // Load initial location data
  useEffect(() => {
    const loadInitialLocation = async () => {
      const { data, error } = await supabase
        .from('professional_live_location')
        .select('*')
        .eq('request_id', requestId)
        .single();

      if (data && !error) {
        setProfessionalLocation(data as ProfessionalLocation);
        
        // Calculate initial distance and ETA
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
      }
    };

    loadInitialLocation();
  }, [requestId, clientLatitude, clientLongitude]);

  // Subscribe to real-time location updates
  useEffect(() => {
    const channel = supabase
      .channel('professional-location')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'professional_live_location',
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newLocation = payload.new as ProfessionalLocation;
            setProfessionalLocation(newLocation);

            // Calculate distance and ETA
            const dist = calculateDistance(
              newLocation.latitude,
              newLocation.longitude,
              clientLatitude,
              clientLongitude
            );
            setDistance(dist);

            // Estimate time of arrival (assuming average speed of 30 km/h in city)
            const avgSpeed = newLocation.speed ? newLocation.speed * 3.6 : 30; // Convert m/s to km/h or use default
            const estimatedTime = (dist / avgSpeed) * 60; // in minutes
            setETA(Math.round(estimatedTime));
          } else if (payload.eventType === 'DELETE') {
            setProfessionalLocation(null);
            setDistance(null);
            setETA(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, clientLatitude, clientLongitude]);

  // Update professional marker and route line on map
  useEffect(() => {
    if (!map.current || !professionalLocation) return;

    const { latitude, longitude, heading } = professionalLocation;

    // Fetch route data for better ETA
    fetchRoute(longitude, latitude, clientLongitude, clientLatitude).then(route => {
      if (route) {
        setRouteData(route);
        setETA(route.duration);
      }
    });

    if (professionalMarker.current) {
      professionalMarker.current.setLngLat([longitude, latitude]);
      
      // Update rotation if heading is available
      if (heading) {
        const markerEl = professionalMarker.current.getElement();
        markerEl.style.transform = `rotate(${heading}deg)`;
      }
    } else {
      const profEl = document.createElement('div');
      profEl.className = 'professional-marker';
      profEl.style.width = '40px';
      profEl.style.height = '40px';
      profEl.style.backgroundImage = 'url(https://api.iconify.design/mdi:account-arrow-right.svg?color=%2310b981)';
      profEl.style.backgroundSize = 'cover';
      profEl.style.transition = 'transform 0.3s ease';
      
      if (heading) {
        profEl.style.transform = `rotate(${heading}deg)`;
      }

      professionalMarker.current = new mapboxgl.Marker(profEl)
        .setLngLat([longitude, latitude])
        .setPopup(new mapboxgl.Popup().setHTML('<strong>Profissional</strong><br/>A caminho'))
        .addTo(map.current);
    }

    // Add or update route line with actual route from Mapbox
    const routeGeoJSON = {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: routeData?.coordinates || [
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
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#10b981',
          'line-width': 4,
          'line-opacity': 0.8
        }
      });
    }

    // Fit map to show both markers
    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend([longitude, latitude]);
    bounds.extend([clientLongitude, clientLatitude]);
    
    map.current.fitBounds(bounds, {
      padding: 100,
      maxZoom: 15,
    });
  }, [professionalLocation, clientLatitude, clientLongitude]);

  if (!professionalLocation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Rastreamento em Tempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Aguardando profissional iniciar o deslocamento...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Rastreamento em Tempo Real
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Distância</p>
              <p className="font-semibold">
                {distance ? `${distance.toFixed(1)} km` : 'Calculando...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Tempo estimado</p>
              <p className="font-semibold">
                {eta ? `${eta} min` : 'Calculando...'}
              </p>
            </div>
          </div>
        </div>
        
        <div 
          ref={mapContainer} 
          className="w-full h-[400px] rounded-lg border"
        />
        
        <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span>🟢 Localização em tempo real</span>
            <span className="font-medium">{new Date(professionalLocation.updated_at).toLocaleTimeString('pt-BR')}</span>
          </div>
          {routeData && (
            <div className="flex items-center justify-between text-primary">
              <span>📍 Rota otimizada calculada</span>
              <span className="font-medium">{routeData.distance} km</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
