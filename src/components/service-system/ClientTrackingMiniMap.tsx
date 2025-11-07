import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Navigation, MapPin, Clock, Loader2, AlertCircle, Route } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { initializeMapbox } from "@/lib/mapbox";
import { useProximityAlerts } from "@/hooks/useProximityAlerts";

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
  const [isLoadingMap, setIsLoadingMap] = useState(true);

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

  // Use proximity alerts
  useProximityAlerts(distance, eta, (message) => {
    console.log('🔔 Proximity alert:', message);
  });

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
    if (!mapContainer.current || map.current) {
      console.log('🗺️ [ClientTrackingMiniMap] Pulando inicialização:', {
        hasContainer: !!mapContainer.current,
        hasMap: !!map.current
      });
      return;
    }
    
    // Verificar se coordenadas do cliente existem
    if (!clientLatitude || !clientLongitude) {
      console.error('❌ [ClientTrackingMiniMap] Coordenadas do cliente não disponíveis');
      setMapError('Coordenadas do cliente não disponíveis');
      return;
    }

    console.log('🗺️ [ClientTrackingMiniMap] Iniciando mapa...', {
      clientLat: clientLatitude,
      clientLng: clientLongitude
    });

    const initMap = async () => {
      try {
        console.log('📡 [ClientTrackingMiniMap] Obtendo token Mapbox...');
        const token = await initializeMapbox();
        console.log('✅ [ClientTrackingMiniMap] Token obtido com sucesso');
        
        mapboxgl.accessToken = token;

        console.log('🗺️ [ClientTrackingMiniMap] Criando instância do mapa...');
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [clientLongitude, clientLatitude],
          zoom: 13,
        });

        console.log('⏳ [ClientTrackingMiniMap] Aguardando evento "load"...');

        // CRITICAL: Wait for map to load before adding any content
        map.current.on('load', () => {
          console.log('✅ [ClientTrackingMiniMap] Mapa carregado! Adicionando conteúdo...');

          if (!map.current) {
            console.error('❌ [ClientTrackingMiniMap] Referência do mapa perdida após load');
            return;
          }

          // Add navigation controls
          console.log('🧭 [ClientTrackingMiniMap] Adicionando controles de navegação...');
          map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

          // Add client marker (home icon)
          console.log('📍 [ClientTrackingMiniMap] Adicionando marcador do cliente...');
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
          
          console.log('✅ [ClientTrackingMiniMap] Mapa totalmente inicializado!');
          setMapError(null);
          setIsLoadingMap(false);
        });

        // Error handling
        map.current.on('error', (e) => {
          console.error('❌ [ClientTrackingMiniMap] Erro no mapa:', e);
          setMapError('Erro ao carregar o mapa');
          setIsLoadingMap(false);
        });
        
      } catch (error) {
        console.error('❌ [ClientTrackingMiniMap] Erro ao inicializar mapa:', error);
        setMapError('Não foi possível carregar o mapa');
        setIsLoadingMap(false);
      }
    };

    initMap();

    return () => {
      if (map.current) {
        console.log('🧹 [ClientTrackingMiniMap] Limpando mapa...');
        map.current.remove();
        map.current = null;
      }
    };
  }, [clientLatitude, clientLongitude]); // Removed hasActiveTracking from dependencies

  // Update professional marker
  useEffect(() => {
    if (!map.current || !professionalLocation || !hasActiveTracking) {
      console.log('🔄 [ClientTrackingMiniMap] Pulando atualização de marcador:', {
        hasMap: !!map.current,
        hasLocation: !!professionalLocation,
        hasTracking: hasActiveTracking
      });
      return;
    }

    console.log('🔄 [ClientTrackingMiniMap] Atualizando marcador do profissional...', {
      lat: professionalLocation.latitude,
      lng: professionalLocation.longitude
    });

    const { latitude, longitude } = professionalLocation;

    if (professionalMarker.current) {
      console.log('📍 [ClientTrackingMiniMap] Atualizando posição do marcador existente...');
      professionalMarker.current.setLngLat([longitude, latitude]);
    } else {
      console.log('📍 [ClientTrackingMiniMap] Criando novo marcador do profissional...');
      const profEl = document.createElement('div');
      profEl.className = 'w-12 h-12';
      profEl.innerHTML = `
        <div class="relative w-full h-full">
          <div class="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
          <div class="relative w-full h-full flex items-center justify-center bg-green-600 rounded-full shadow-xl border-2 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        </div>
      `;

      professionalMarker.current = new mapboxgl.Marker(profEl)
        .setLngLat([longitude, latitude])
        .addTo(map.current);
    }

    // Draw route line
    console.log('🛣️ [ClientTrackingMiniMap] Atualizando linha de rota...');
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
      console.log('🔄 [ClientTrackingMiniMap] Source "route" encontrada, atualizando dados...');
      (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData(routeGeoJSON as any);
    } else {
      console.log('➕ [ClientTrackingMiniMap] Criando source e layer "route"...');
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
          'line-opacity': 0.85,
          'line-dasharray': [2, 1]
        }
      });
    }

    // Fit bounds
    console.log('🎯 [ClientTrackingMiniMap] Ajustando bounds do mapa...');
    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend([longitude, latitude]);
    bounds.extend([clientLongitude, clientLatitude]);
    
    map.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15,
    });
    
    console.log('✅ [ClientTrackingMiniMap] Atualização completa!');
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

  return (
    <Card className={hasActiveTracking 
      ? "border-green-500/30 bg-gradient-to-br from-background via-green-50/20 to-emerald-50/30 shadow-lg animate-fade-in overflow-hidden"
      : "border-primary/20 bg-gradient-to-br from-background via-primary/5 to-primary/10 shadow-lg animate-fade-in overflow-hidden"
    }>
      {/* Header com badge animado */}
      <CardHeader className={hasActiveTracking 
        ? "pb-3 bg-gradient-to-r from-green-500/5 to-emerald-500/5"
        : "pb-3 bg-gradient-to-r from-primary/5 to-primary/10"
      }>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className={hasActiveTracking 
              ? "p-1.5 bg-green-500/10 rounded-lg"
              : "p-1.5 bg-primary/10 rounded-lg"
            }>
              {hasActiveTracking ? (
                <Navigation className="w-4 h-4 text-green-600 animate-pulse" />
              ) : (
                <MapPin className="w-4 h-4 text-primary" />
              )}
            </div>
            <span className={hasActiveTracking 
              ? "bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold"
              : "text-foreground font-bold"
            }>
              {hasActiveTracking ? "Profissional a Caminho" : "Localização do Atendimento"}
            </span>
          </CardTitle>
          {hasActiveTracking && (
            <Badge variant="outline" className="bg-green-500 text-white border-green-600 animate-pulse shadow-md hover:shadow-lg transition-shadow">
              <span className="w-1.5 h-1.5 bg-white rounded-full mr-1.5 animate-ping" />
              <span className="relative">AO VIVO</span>
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Info cards com animação - só mostra se houver tracking ativo */}
        {hasActiveTracking && (
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center gap-1.5 p-3 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-105">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <MapPin className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground font-medium">Distância</p>
              <p className="font-bold text-sm text-green-600">
                {distance ? `${distance.toFixed(1)} km` : '...'}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1.5 p-3 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/50 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-105">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground font-medium">Chegada em</p>
              <p className="font-bold text-sm text-blue-600">
                {eta ? `${eta} min` : '...'}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1.5 p-3 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/50 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-105">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Route className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground font-medium">Rota</p>
              <p className="font-bold text-sm text-purple-600">
                Ativa
              </p>
            </div>
          </div>
        </div>
        )}
        
        {/* Mapa ou erro */}
        {isLoadingMap ? (
          <div className="w-full h-[280px] rounded-xl border-2 border-primary/10 shadow-lg flex items-center justify-center bg-muted/30">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Carregando mapa...</p>
            </div>
          </div>
        ) : mapError ? (
          <Alert variant="default" className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 animate-fade-in">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <p className="font-medium">{mapError}</p>
              <p className="text-sm mt-1">Verifique sua conexão e tente novamente</p>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="relative rounded-xl overflow-hidden border-2 border-green-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div 
              ref={mapContainer} 
              className="w-full h-[280px]"
            />
            {/* Overlay com gradiente */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>
        )}
        
        {/* Status bar */}
        {hasActiveTracking ? (
          professionalLocation && (
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-xl animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-600"></span>
                </span>
                <span className="text-xs font-medium text-green-700">Localização ao vivo</span>
              </div>
              <span className="text-xs font-semibold text-green-600">
                {new Date(professionalLocation.updated_at).toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center p-3 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Aguardando profissional iniciar deslocamento</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
