import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Phone, MessageCircle, Navigation } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

interface Professional {
  id: string;
  full_name: string;
  avatar_url?: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  average_rating: number;
  total_reviews: number;
  city: string;
  state: string;
}

interface ProfessionalsMapProps {
  professionals: Professional[];
  userLocation?: { latitude: number; longitude: number };
  onProfessionalSelect?: (professional: Professional) => void;
  className?: string;
}

export function ProfessionalsMap({ 
  professionals, 
  userLocation,
  onProfessionalSelect,
  className = "" 
}: ProfessionalsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!mapContainer.current) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
    if (!mapboxToken) {
      console.warn("Mapbox token not configured");
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    // Initialize map centered on user location or first professional
    const center: [number, number] = userLocation 
      ? [userLocation.longitude, userLocation.latitude]
      : professionals.length > 0 
      ? [professionals[0].longitude, professionals[0].latitude]
      : [-47.9292, -15.7801]; // Brasília default

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: center,
      zoom: 12,
      pitch: 45,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      "top-right"
    );

    // Add scale control
    map.current.addControl(
      new mapboxgl.ScaleControl({
        maxWidth: 100,
        unit: "metric"
      }),
      "bottom-left"
    );

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add user location marker
    if (userLocation) {
      const userMarkerEl = document.createElement("div");
      userMarkerEl.className = "w-5 h-5 bg-blue-500 border-2 border-white rounded-full shadow-lg";
      
      new mapboxgl.Marker(userMarkerEl)
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class="p-2"><strong>Sua localização</strong></div>`
          )
        )
        .addTo(map.current);
    }

    // Add professional markers
    professionals.forEach((prof) => {
      const markerEl = document.createElement("div");
      markerEl.className = "relative cursor-pointer";
      markerEl.innerHTML = `
        <div class="w-10 h-10 bg-primary border-3 border-white rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform">
          <span class="text-white font-bold text-xs">${prof.average_rating.toFixed(1)}</span>
        </div>
      `;

      markerEl.addEventListener("click", () => {
        setSelectedProfessional(prof);
        onProfessionalSelect?.(prof);
      });

      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([prof.longitude, prof.latitude])
        .addTo(map.current!);

      markers.current.push(marker);
    });

    // Fit bounds to show all markers
    if (professionals.length > 0 || userLocation) {
      const bounds = new mapboxgl.LngLatBounds();
      
      if (userLocation) {
        bounds.extend([userLocation.longitude, userLocation.latitude]);
      }
      
      professionals.forEach((prof) => {
        bounds.extend([prof.longitude, prof.latitude]);
      });

      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15,
        duration: 1000
      });
    }
  }, [professionals, userLocation, onProfessionalSelect]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="w-full h-[500px] rounded-lg shadow-lg" />
      
      {/* Selected Professional Card */}
      {selectedProfessional && (
        <Card className="absolute bottom-4 left-4 right-4 md:right-auto md:w-80 p-4 shadow-xl z-10 bg-white/95 backdrop-blur">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary">
              <AvatarImage src={selectedProfessional.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {selectedProfessional.full_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h3 className="font-semibold leading-tight">{selectedProfessional.full_name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{selectedProfessional.average_rating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">
                    ({selectedProfessional.total_reviews})
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  <Navigation className="h-3 w-3 mr-1" />
                  {selectedProfessional.distance_km.toFixed(1)} km
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedProfessional.city}, {selectedProfessional.state}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/professional-profile/${selectedProfessional.id}`)}
            >
              Ver Perfil
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => {
                /* Navigate to chat or quote request */
                navigate(`/professional-profile/${selectedProfessional.id}`);
              }}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Contatar
            </Button>
          </div>
        </Card>
      )}
      
      {/* Professionals count badge */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-lg px-3 py-2 shadow-lg">
        <span className="text-sm font-medium">
          {professionals.length} profissiona{professionals.length !== 1 ? "is" : "l"} próximo{professionals.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
