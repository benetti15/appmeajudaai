import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MapPin, Phone, Mail, Star, CheckCircle, Calendar } from "lucide-react";

interface ProfessionalProfile {
  id: string;
  full_name: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  created_at: string;
  user_type: string;
}

interface ServiceCategory {
  id: string;
  name: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  client_profile: {
    full_name: string;
    avatar_url: string | null;
  };
}

export default function ProfessionalPublicProfile() {
  const { professionalId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    if (!professionalId) {
      navigate("/");
      return;
    }
    fetchProfessionalData();
  }, [professionalId, navigate]);

  const fetchProfessionalData = async () => {
    try {
      // Buscar perfil do profissional
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", professionalId)
        .eq("user_type", "professional")
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Buscar categorias de serviço do profissional (simplificado)
      // Por enquanto, vamos usar dados mock até que a tabela seja criada
      const mockCategories: ServiceCategory[] = [
        { id: "1", name: "Encanamento" },
        { id: "2", name: "Elétrica" },
        { id: "3", name: "Pintura" }
      ];
      setCategories(mockCategories);

      // Buscar avaliações (simulado por agora)
      // const { data: reviewsData, error: reviewsError } = await supabase
      //   .from("reviews")
      //   .select(`
      //     *,
      //     client_profile:client_id(full_name, avatar_url)
      //   `)
      //   .eq("professional_id", professionalId)
      //   .order("created_at", { ascending: false })
      //   .limit(10);

      // Dados simulados de avaliações
      const mockReviews: Review[] = [
        {
          id: "1",
          rating: 5,
          comment: "Excelente profissional! Muito atencioso e trabalho de qualidade.",
          created_at: "2024-01-15T10:00:00Z",
          client_profile: {
            full_name: "Maria Silva",
            avatar_url: null
          }
        },
        {
          id: "2",
          rating: 4,
          comment: "Bom trabalho, pontual e organizado.",
          created_at: "2024-01-10T14:30:00Z",
          client_profile: {
            full_name: "João Santos",
            avatar_url: null
          }
        }
      ];

      setReviews(mockReviews);
      
      // Calcular média das avaliações
      if (mockReviews.length > 0) {
        const avg = mockReviews.reduce((sum, review) => sum + review.rating, 0) / mockReviews.length;
        setAverageRating(avg);
      }

    } catch (error) {
      console.error("Erro ao carregar dados do profissional:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-xl font-semibold mb-2">Profissional não encontrado</h3>
            <p className="text-muted-foreground mb-6">
              O perfil solicitado não foi encontrado.
            </p>
            <Button onClick={() => navigate(-1)}>
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-primary">Perfil do Profissional</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <Avatar className="w-24 h-24 border-4 border-primary/20">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl bg-primary/10">
                    {profile.full_name[0]}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-3xl font-bold">{profile.full_name}</h2>
                      {profile.is_verified && (
                        <Badge className="gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Verificado
                        </Badge>
                      )}
                    </div>
                    
                    {averageRating > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex">{renderStars(Math.round(averageRating))}</div>
                        <span className="text-sm text-muted-foreground">
                          ({averageRating.toFixed(1)}) • {reviews.length} avaliações
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {profile.city && profile.state && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{profile.city}, {profile.state}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary" />
                      <span>{profile.phone || "Não informado"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>
                        Desde {new Date(profile.created_at).toLocaleDateString('pt-BR', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          {categories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Especialidades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Badge key={category.id} variant="outline">
                      {category.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Avaliações dos Clientes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={review.client_profile.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {review.client_profile.full_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">{review.client_profile.full_name}</h5>
                          <div className="flex">{renderStars(review.rating)}</div>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}