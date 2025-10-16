import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { MapComponent } from "@/components/MapComponent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Professional {
  id: string;
  name: string;
  category: string;
  rating: number;
  location: string;
  coordinates: [number, number];
  price_range: string;
  availability: 'available' | 'busy' | 'offline';
  distance?: number;
  verified: boolean;
}

export default function MapView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleProfessionalSelect = (professional: Professional) => {
    setSelectedProfessional(professional);
    toast({
      title: "Profissional selecionado",
      description: `${professional.name} - ${professional.category}`,
    });
  };

  const handleRequestQuote = () => {
    if (selectedProfessional) {
      // Simula navegação para solicitação de orçamento
      toast({
        title: "Redirecionando",
        description: "Você será direcionado para solicitar um orçamento.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-primary/5">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Mapa de Profissionais
            </h1>
            <p className="text-muted-foreground">
              Encontre profissionais próximos a você
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MapComponent 
              onProfessionalSelect={handleProfessionalSelect}
              height="600px"
            />
          </div>
          
          <div className="space-y-4">
            {selectedProfessional ? (
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Profissional Selecionado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedProfessional.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedProfessional.category}</p>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Avaliação:</span>
                      <span className="font-medium">{selectedProfessional.rating} ⭐</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Preço:</span>
                      <span className="font-medium">{selectedProfessional.price_range}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Distância:</span>
                      <span className="font-medium">{selectedProfessional.distance?.toFixed(1)} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={`font-medium ${
                        selectedProfessional.availability === 'available' ? 'text-green-600' :
                        selectedProfessional.availability === 'busy' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {selectedProfessional.availability === 'available' ? 'Disponível' :
                         selectedProfessional.availability === 'busy' ? 'Ocupado' : 'Offline'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                      onClick={handleRequestQuote}
                    >
                      Solicitar Orçamento
                    </Button>
                    <Button variant="outline" className="w-full">
                      Ver Perfil Completo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed border-2 border-muted-foreground/20">
                <CardContent className="p-6 text-center">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium text-muted-foreground mb-2">
                    Selecione um Profissional
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Clique em um marcador no mapa para ver detalhes
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Dicas do Mapa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Disponível</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Ocupado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span>Offline</span>
                </div>
                <p className="text-muted-foreground mt-3">
                  Use os filtros para encontrar profissionais específicos ou por distância.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}