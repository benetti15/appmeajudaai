import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ProfessionalsMap } from "@/components/geo/ProfessionalsMap";
import { useGeolocation } from "@/hooks/useGeolocation";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MapPin, Loader2, List, Map } from "lucide-react";
import { toast } from "sonner";

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

export default function NearbyProfessionals() {
  const navigate = useNavigate();
  const { latitude, longitude, loading: geoLoading, error: geoError, getCurrentPosition } = useGeolocation();
  
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [maxDistance, setMaxDistance] = useState(10);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (latitude && longitude) {
      fetchNearbyProfessionals();
    }
  }, [latitude, longitude, maxDistance, categoryFilter]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("service_categories")
      .select("id, name")
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching categories:", error);
      return;
    }

    setCategories(data || []);
  };

  const fetchNearbyProfessionals = async () => {
    if (!latitude || !longitude) return;

    setLoading(true);
    try {
      const categoryId = categoryFilter === "all" ? null : categoryFilter;
      
      const { data, error } = await supabase
        .rpc("find_nearby_professionals", {
          user_lat: latitude,
          user_lon: longitude,
          max_distance_km: maxDistance,
          category_filter: categoryId
        });

      if (error) throw error;

      setProfessionals(data || []);
      
      if (data && data.length === 0) {
        toast.info(`Nenhum profissional encontrado em ${maxDistance}km`);
      }
    } catch (error) {
      console.error("Error fetching nearby professionals:", error);
      toast.error("Erro ao buscar profissionais próximos");
    } finally {
      setLoading(false);
    }
  };

  if (geoLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Obtendo sua localização...</p>
              <p className="text-sm text-muted-foreground text-center">
                Certifique-se de permitir o acesso à localização
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (geoError || (!latitude && !longitude)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Localização necessária
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {geoError || "Para encontrar profissionais próximos, precisamos da sua localização."}
            </p>
            <Button onClick={getCurrentPosition} className="w-full">
              <MapPin className="h-4 w-4 mr-2" />
              Permitir Localização
            </Button>
            <Button variant="outline" onClick={() => navigate("/")} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Profissionais Próximos</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === "map" ? "list" : "map")}
          >
            {viewMode === "map" ? <List className="h-5 w-5" /> : <Map className="h-5 w-5" />}
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Categoria</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Distância máxima: {maxDistance} km
                </label>
                <Slider
                  value={[maxDistance]}
                  onValueChange={(values) => setMaxDistance(values[0])}
                  min={1}
                  max={50}
                  step={1}
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map or List View */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : viewMode === "map" ? (
          <ProfessionalsMap
            professionals={professionals}
            userLocation={{ latitude, longitude }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {professionals.map((prof) => (
              <Card
                key={prof.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/professional-profile/${prof.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold">
                        {prof.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{prof.full_name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {prof.city}, {prof.state}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      ⭐ {prof.average_rating.toFixed(1)} ({prof.total_reviews})
                    </Badge>
                    <Badge variant="outline">
                      <MapPin className="h-3 w-3 mr-1" />
                      {prof.distance_km.toFixed(1)} km
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
