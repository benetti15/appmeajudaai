import { useState, useEffect } from "react";
import { Heart, Star, MapPin, Clock, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Professional {
  id: string;
  name: string;
  avatar_url?: string;
  category: string;
  rating: number;
  location: string;
  price_range: string;
  verified: boolean;
  availability: 'available' | 'busy' | 'offline';
  distance?: string;
  phone?: string;
  email?: string;
  description?: string;
}

interface FavoritesSystemProps {
  professionalId?: string;
  onToggleFavorite?: (professionalId: string, isFavorite: boolean) => void;
}

export function FavoritesSystem({ professionalId, onToggleFavorite }: FavoritesSystemProps) {
  const [favorites, setFavorites] = useState<Professional[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadFavorites();
    if (professionalId) {
      checkIsFavorite(professionalId);
    }
  }, [professionalId]);

  const loadFavorites = () => {
    if (!user) return;
    
    const savedFavorites = localStorage.getItem(`favorites_${user.id}`);
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  };

  const checkIsFavorite = (id: string) => {
    if (!user) return;
    
    const savedFavorites = localStorage.getItem(`favorites_${user.id}`);
    if (savedFavorites) {
      const favs = JSON.parse(savedFavorites) as Professional[];
      setIsFavorite(favs.some(fav => fav.id === id));
    }
  };

  const toggleFavorite = (professional?: Professional) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para salvar favoritos.",
        variant: "destructive",
      });
      return;
    }

    if (!professional && !professionalId) return;

    const targetId = professional?.id || professionalId!;
    const savedFavorites = localStorage.getItem(`favorites_${user.id}`);
    let currentFavorites: Professional[] = savedFavorites ? JSON.parse(savedFavorites) : [];
    
    const existingIndex = currentFavorites.findIndex(fav => fav.id === targetId);
    
    if (existingIndex >= 0) {
      // Remove from favorites
      currentFavorites.splice(existingIndex, 1);
      setIsFavorite(false);
      toast({
        title: "Removido dos favoritos",
        description: "Profissional removido da sua lista de favoritos.",
      });
    } else {
      // Add to favorites
      const newFavorite: Professional = professional || {
        id: targetId,
        name: "Profissional",
        category: "Serviços",
        rating: 0,
        location: "Localização não informada",
        price_range: "A combinar",
        verified: false,
        availability: 'offline' as const,
      };
      
      currentFavorites.unshift(newFavorite);
      setIsFavorite(true);
      toast({
        title: "Adicionado aos favoritos",
        description: "Profissional salvo na sua lista de favoritos.",
      });
    }
    
    localStorage.setItem(`favorites_${user.id}`, JSON.stringify(currentFavorites));
    setFavorites(currentFavorites);
    onToggleFavorite?.(targetId, !isFavorite);
  };

  const getAvailabilityColor = (availability: Professional['availability']) => {
    switch (availability) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getAvailabilityText = (availability: Professional['availability']) => {
    switch (availability) {
      case 'available': return 'Disponível';
      case 'busy': return 'Ocupado';
      case 'offline': return 'Offline';
      default: return 'Indisponível';
    }
  };

  // Mock data for demonstration
  const mockProfessionals: Professional[] = [
    {
      id: "1",
      name: "João Silva",
      avatar_url: undefined,
      category: "Elétrica",
      rating: 4.8,
      location: "São Paulo, SP",
      price_range: "R$ 80-120/h",
      verified: true,
      availability: 'available',
      distance: "2.5 km",
      phone: "(11) 99999-9999",
      email: "joao@email.com",
      description: "Especialista em instalações elétricas residenciais e comerciais."
    },
    {
      id: "2", 
      name: "Maria Santos",
      avatar_url: undefined,
      category: "Limpeza",
      rating: 4.9,
      location: "Rio de Janeiro, RJ",
      price_range: "R$ 60-90/h",
      verified: true,
      availability: 'busy',
      distance: "1.2 km",
      phone: "(21) 88888-8888",
      email: "maria@email.com",
      description: "Serviços de limpeza residencial e pós-obra."
    }
  ];

  if (professionalId) {
    // Render favorite button for a specific professional
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleFavorite()}
        className={`${isFavorite ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-red-500'}`}
      >
        <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
      </Button>
    );
  }

  // Render favorites list
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Meus Favoritos
        </h2>
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
          {favorites.length} profissionais
        </Badge>
      </div>

      {favorites.length === 0 ? (
        <Card className="p-8 text-center border-dashed border-2 border-muted-foreground/20">
          <Heart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Nenhum favorito ainda
          </h3>
          <p className="text-sm text-muted-foreground">
            Adicione profissionais aos seus favoritos para acessá-los rapidamente.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {favorites.concat(mockProfessionals.slice(0, 2)).map((professional) => (
            <Card key={professional.id} className="hover:shadow-glow transition-all duration-300 border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16 border-2 border-primary/20">
                      <AvatarImage src={professional.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {professional.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background ${getAvailabilityColor(professional.availability)}`} />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{professional.name}</h3>
                          {professional.verified && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                              <Star className="h-3 w-3 mr-1 fill-current" />
                              Verificado
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{professional.category}</p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(professional)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Heart className="h-4 w-4 fill-current" />
                      </Button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span>{professional.rating.toFixed(1)} estrelas</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className={getAvailabilityColor(professional.availability).replace('bg-', 'text-')}>
                          {getAvailabilityText(professional.availability)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{professional.location}</span>
                        {professional.distance && (
                          <Badge variant="outline" className="text-xs">
                            {professional.distance}
                          </Badge>
                        )}
                      </div>

                      <div className="text-muted-foreground">
                        <span className="font-medium">{professional.price_range}</span>
                      </div>
                    </div>

                    {professional.description && (
                      <p className="text-sm text-muted-foreground">
                        {professional.description}
                      </p>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                        Solicitar Orçamento
                      </Button>
                      
                      {professional.phone && (
                        <Button variant="outline" size="sm">
                          <Phone className="h-4 w-4 mr-1" />
                          Ligar
                        </Button>
                      )}
                      
                      {professional.email && (
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4 mr-1" />
                          Email
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}