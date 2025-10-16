import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, Filter, Star, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Professional {
  id: string;
  name: string;
  category: string;
  rating: number;
  location: string;
  coordinates: [number, number]; // [longitude, latitude]
  price_range: string;
  availability: 'available' | 'busy' | 'offline';
  distance?: number; // em km
  verified: boolean;
}

interface MapComponentProps {
  professionals?: Professional[];
  onProfessionalSelect?: (professional: Professional) => void;
  showControls?: boolean;
  height?: string;
}

export function MapComponent({ 
  professionals = [], 
  onProfessionalSelect,
  showControls = true,
  height = "400px"
}: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [radiusFilter, setRadiusFilter] = useState<string>('10');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const { toast } = useToast();

  // Mock professionals data for demonstration
  const mockProfessionals: Professional[] = [
    {
      id: "1",
      name: "João Silva",
      category: "Elétrica",
      rating: 4.8,
      location: "São Paulo, SP",
      coordinates: [-46.6333, -23.5505],
      price_range: "R$ 80-120/h",
      availability: 'available',
      distance: 2.5,
      verified: true
    },
    {
      id: "2",
      name: "Maria Santos", 
      category: "Limpeza",
      rating: 4.9,
      location: "São Paulo, SP",
      coordinates: [-46.6520, -23.5475],
      price_range: "R$ 60-90/h",
      availability: 'available',
      distance: 3.2,
      verified: true
    },
    {
      id: "3",
      name: "Carlos Oliveira",
      category: "Encanamento",
      rating: 4.7,
      location: "São Paulo, SP", 
      coordinates: [-46.6256, -23.5629],
      price_range: "R$ 90-150/h",
      availability: 'busy',
      distance: 4.1,
      verified: false
    }
  ];

  const allProfessionals = [...professionals, ...mockProfessionals];

  useEffect(() => {
    // Check for stored token first
    const storedToken = localStorage.getItem('mapbox_token');
    if (storedToken) {
      setMapboxToken(storedToken);
      initializeMap(storedToken);
    } else {
      // Request token from user
      toast({
        title: "Token Mapbox necessário",
        description: "Para usar o mapa, insira seu token público do Mapbox.",
      });
    }
  }, []);

  useEffect(() => {
    if (mapboxToken && !map.current) {
      initializeMap(mapboxToken);
    }
  }, [mapboxToken]);

  useEffect(() => {
    if (map.current) {
      updateMarkers();
      applyFilters();
    }
  }, [allProfessionals, radiusFilter, categoryFilter, availabilityFilter, userLocation]);

  const initializeMap = (token: string) => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = token;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-46.6333, -23.5505], // São Paulo coordinates
      zoom: 12,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add geolocate control
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    });

    map.current.addControl(geolocate, 'top-right');

    // Listen for user location
    geolocate.on('geolocate', (e: any) => {
      setUserLocation([e.coords.longitude, e.coords.latitude]);
    });

    map.current.on('load', () => {
      updateMarkers();
    });
  };

  const updateMarkers = () => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each professional
    filteredProfessionals.forEach(professional => {
      const availabilityColor = {
        'available': '#22c55e',
        'busy': '#eab308', 
        'offline': '#6b7280'
      }[professional.availability];

      // Create marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';
      markerElement.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: ${availabilityColor};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
      `;
      markerElement.textContent = professional.name.charAt(0);

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-3 min-w-[250px]">
          <h3 class="font-bold mb-2">${professional.name}</h3>
          <div class="space-y-1 text-sm">
            <div class="flex items-center gap-2">
              <span class="font-medium">Categoria:</span>
              <span>${professional.category}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-medium">Avaliação:</span>
              <span>${professional.rating} ⭐</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-medium">Preço:</span>
              <span>${professional.price_range}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-medium">Distância:</span>
              <span>${professional.distance?.toFixed(1)} km</span>
            </div>
          </div>
          <button 
            onclick="window.selectProfessional('${professional.id}')"
            class="mt-3 w-full bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
          >
            Solicitar Orçamento
          </button>
        </div>
      `);

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat(professional.coordinates)
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);

      // Add click handler
      markerElement.addEventListener('click', () => {
        onProfessionalSelect?.(professional);
      });
    });

    // Make selectProfessional globally available for popup
    (window as any).selectProfessional = (id: string) => {
      const professional = allProfessionals.find(p => p.id === id);
      if (professional) {
        onProfessionalSelect?.(professional);
      }
    };
  };

  const applyFilters = () => {
    let filtered = allProfessionals;

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    // Filter by availability
    if (availabilityFilter !== 'all') {
      filtered = filtered.filter(p => p.availability === availabilityFilter);
    }

    // Filter by radius (if user location is available)
    if (userLocation && radiusFilter !== 'all') {
      const maxDistance = parseInt(radiusFilter);
      filtered = filtered.filter(p => {
        if (!p.distance) return true;
        return p.distance <= maxDistance;
      });
    }

    setFilteredProfessionals(filtered);
  };

  const handleTokenSubmit = (token: string) => {
    if (token.trim()) {
      setMapboxToken(token.trim());
      localStorage.setItem('mapbox_token', token.trim());
      toast({
        title: "Token salvo",
        description: "Mapa carregando...",
      });
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
          setUserLocation(coords);
          if (map.current) {
            map.current.flyTo({ center: coords, zoom: 14 });
          }
          toast({
            title: "Localização obtida",
            description: "Mostrando profissionais próximos a você.",
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Erro de localização",
            description: "Não foi possível obter sua localização.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const categories = ['all', ...new Set(allProfessionals.map(p => p.category))];

  if (!mapboxToken) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Configurar Mapa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Para usar o mapa, você precisa de um token público do Mapbox. 
            Você pode obter um em{" "}
            <a 
              href="https://account.mapbox.com/access-tokens/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              mapbox.com
            </a>
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Cole seu token público do Mapbox aqui"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTokenSubmit((e.target as HTMLInputElement).value);
                }
              }}
            />
            <Button 
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                handleTokenSubmit(input.value);
              }}
            >
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {showControls && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={getUserLocation}
                className="flex items-center gap-2"
              >
                <Navigation className="h-4 w-4" />
                Minha Localização
              </Button>

              <Select value={radiusFilter} onValueChange={setRadiusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Raio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="1">1 km</SelectItem>
                  <SelectItem value="5">5 km</SelectItem>
                  <SelectItem value="10">10 km</SelectItem>
                  <SelectItem value="20">20 km</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'Todas' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="busy">Ocupado</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>

              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {filteredProfessionals.length} profissionais
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div 
          ref={mapContainer} 
          className="w-full"
          style={{ height }}
        />
      </Card>
    </div>
  );
}