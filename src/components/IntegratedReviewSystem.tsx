import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Star, 
  Camera, 
  Shield, 
  Award, 
  ThumbsUp, 
  MessageCircle,
  Filter,
  TrendingUp,
  Users
} from "lucide-react";
import { PhotoUpload } from "@/components/ui/photo-upload";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ExtendedReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  images_urls: string[] | null;
  service_quality: number;
  punctuality: number;
  communication: number;
  price_value: number;
  would_recommend: boolean;
  reviewer: {
    full_name: string;
    avatar_url?: string;
    verification_status: 'verified' | 'pending' | 'none';
  };
  service_info: {
    category: string;
    completion_date: string;
  };
}

interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: { [key: number]: number };
  recommendation_rate: number;
  response_rate: number;
  categories_breakdown: { [category: string]: number };
}

interface IntegratedReviewSystemProps {
  professionalId: string;
  requestId?: string;
  canReview?: boolean;
  showFilters?: boolean;
  mandatoryReview?: boolean;
}

export function IntegratedReviewSystem({ 
  professionalId, 
  requestId, 
  canReview = false, 
  showFilters = true,
  mandatoryReview = false
}: IntegratedReviewSystemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [reviews, setReviews] = useState<ExtendedReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterRating, setFilterRating] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  
  // Form states
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [detailedRatings, setDetailedRatings] = useState({
    service_quality: 0,
    punctuality: 0,
    communication: 0,
    price_value: 0
  });
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);

  // Mock data para demonstração
  useEffect(() => {
    // Simular dados de avaliações
    const mockReviews: ExtendedReview[] = [
      {
        id: '1',
        rating: 5,
        comment: 'Excelente profissional! Muito pontual, educado e fez um trabalho impecável. Recomendo para todos!',
        created_at: '2024-01-20T10:00:00Z',
        images_urls: ['/placeholder.svg'],
        service_quality: 5,
        punctuality: 5,
        communication: 5,
        price_value: 4,
        would_recommend: true,
        reviewer: {
          full_name: 'Maria Silva',
          avatar_url: '/placeholder.svg',
          verification_status: 'verified'
        },
        service_info: {
          category: 'Elétrica Residencial',
          completion_date: '2024-01-18T18:00:00Z'
        }
      },
      {
        id: '2',
        rating: 4,
        comment: 'Bom atendimento, chegou no horário e resolveu o problema rapidamente.',
        created_at: '2024-01-15T14:30:00Z',
        images_urls: null,
        service_quality: 4,
        punctuality: 5,
        communication: 4,
        price_value: 4,
        would_recommend: true,
        reviewer: {
          full_name: 'João Santos',
          verification_status: 'pending'
        },
        service_info: {
          category: 'Encanamento',
          completion_date: '2024-01-14T16:00:00Z'
        }
      }
    ];

    const mockStats: ReviewStats = {
      total_reviews: 47,
      average_rating: 4.8,
      rating_distribution: { 5: 32, 4: 10, 3: 3, 2: 1, 1: 1 },
      recommendation_rate: 96,
      response_rate: 89,
      categories_breakdown: {
        'Elétrica Residencial': 25,
        'Encanamento': 15,
        'Automação': 7
      }
    };

    setReviews(mockReviews);
    setStats(mockStats);
  }, [professionalId]);

  const StarRating = ({ 
    value, 
    onChange, 
    readonly = false, 
    size = "default" 
  }: { 
    value: number; 
    onChange?: (value: number) => void; 
    readonly?: boolean;
    size?: "small" | "default" | "large";
  }) => {
    const sizeClass = {
      small: "w-4 h-4",
      default: "w-5 h-5",
      large: "w-6 h-6"
    }[size];

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} cursor-pointer transition-colors ${
              star <= value ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            }`}
            onClick={() => !readonly && onChange?.(star)}
          />
        ))}
      </div>
    );
  };

  const submitReview = async () => {
    if (!user || rating === 0) return;

    setLoading(true);
    try {
      // Simular envio
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Avaliação enviada!",
        description: "Sua avaliação foi registrada com sucesso.",
      });

      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Erro ao enviar avaliação",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRating(0);
    setComment("");
    setImages([]);
    setDetailedRatings({
      service_quality: 0,
      punctuality: 0,
      communication: 0,
      price_value: 0
    });
    setWouldRecommend(null);
  };

  const getVerificationBadge = (status: ExtendedReview['reviewer']['verification_status']) => {
    switch (status) {
      case 'verified':
        return (
          <Badge variant="default" className="gap-1 bg-green-100 text-green-700 border-green-200">
            <Shield className="h-3 w-3" />
            Verificado
          </Badge>
        );
      case 'pending':
        return <Badge variant="secondary">Em análise</Badge>;
      default:
        return null;
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (filterRating === "all") return true;
    return review.rating === parseInt(filterRating);
  });

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Review Statistics */}
      <Card className="border-0 shadow-glow bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Avaliações e Reputação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Overall Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {stats.average_rating.toFixed(1)}
              </div>
              <StarRating value={stats.average_rating} readonly size="large" />
              <div className="text-sm text-muted-foreground mt-2">
                {stats.total_reviews} avaliações
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = stats.rating_distribution[stars] || 0;
                const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-2 text-sm">
                    <span className="w-8">{stars} ★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Additional Stats */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  Recomendariam
                </span>
                <span className="font-medium">{stats.recommendation_rate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  Taxa de resposta
                </span>
                <span className="font-medium">{stats.response_rate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Clientes atendidos
                </span>
                <span className="font-medium">{stats.total_reviews}</span>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Experiência por Categoria</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.categories_breakdown).map(([category, count]) => (
                <Badge key={category} variant="outline" className="gap-2">
                  {category}
                  <span className="bg-muted px-1.5 py-0.5 rounded text-xs">{count}</span>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Form (Mandatory if specified) */}
      {(canReview || mandatoryReview) && (
        <Card className={mandatoryReview ? "border-orange-500 bg-orange-50/50" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              {mandatoryReview ? "Avaliação Obrigatória" : "Avaliar Profissional"}
            </CardTitle>
            {mandatoryReview && (
              <p className="text-sm text-orange-700">
                Para finalizar o serviço, é necessário avaliar o profissional
              </p>
            )}
          </CardHeader>
          <CardContent>
            <Dialog open={dialogOpen || mandatoryReview} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                {!mandatoryReview && (
                  <Button className="w-full">
                    <Star className="w-4 h-4 mr-2" />
                    Deixar Avaliação
                  </Button>
                )}
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Avaliar Profissional</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Overall Rating */}
                  <div className="text-center">
                    <div className="mb-2 text-sm text-muted-foreground">Avaliação Geral</div>
                    <StarRating value={rating} onChange={setRating} size="large" />
                  </div>

                  {/* Detailed Ratings */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Avaliações Detalhadas</h4>
                    
                    {[
                      { key: 'service_quality', label: 'Qualidade do Serviço' },
                      { key: 'punctuality', label: 'Pontualidade' },
                      { key: 'communication', label: 'Comunicação' },
                      { key: 'price_value', label: 'Custo-Benefício' }
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm">{label}</span>
                        <StarRating 
                          value={detailedRatings[key as keyof typeof detailedRatings]} 
                          onChange={(value) => setDetailedRatings(prev => ({ ...prev, [key]: value }))}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Recommendation */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Você recomendaria este profissional?</h4>
                    <div className="flex gap-4">
                      <Button
                        variant={wouldRecommend === true ? "default" : "outline"}
                        onClick={() => setWouldRecommend(true)}
                        className="flex-1"
                      >
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        Sim, recomendo
                      </Button>
                      <Button
                        variant={wouldRecommend === false ? "destructive" : "outline"}
                        onClick={() => setWouldRecommend(false)}
                        className="flex-1"
                      >
                        Não recomendo
                      </Button>
                    </div>
                  </div>
                  
                  {/* Comment */}
                  <Textarea
                    placeholder="Conte sobre sua experiência (opcional)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                  />

                  {/* Photos */}
                  <div>
                    <div className="mb-2 text-sm font-medium">Fotos do resultado (opcional)</div>
                    <PhotoUpload
                      onImageUploaded={(url) => setImages(prev => [...prev, url])}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!mandatoryReview && (
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                    )}
                    <Button 
                      className="flex-1"
                      onClick={submitReview}
                      disabled={loading || rating === 0 || wouldRecommend === null}
                    >
                      {loading ? "Enviando..." : "Enviar Avaliação"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as avaliações</SelectItem>
                  <SelectItem value="5">5 estrelas</SelectItem>
                  <SelectItem value="4">4 estrelas</SelectItem>
                  <SelectItem value="3">3 estrelas</SelectItem>
                  <SelectItem value="2">2 estrelas</SelectItem>
                  <SelectItem value="1">1 estrela</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Mais recentes</SelectItem>
                  <SelectItem value="helpful">Mais úteis</SelectItem>
                  <SelectItem value="rating_high">Maior avaliação</SelectItem>
                  <SelectItem value="rating_low">Menor avaliação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <Card key={review.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={review.reviewer.avatar_url} />
                  <AvatarFallback>
                    {review.reviewer.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{review.reviewer.full_name}</span>
                    {getVerificationBadge(review.reviewer.verification_status)}
                    <Badge variant="outline" className="text-xs">
                      {review.service_info.category}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-2">
                    <StarRating value={review.rating} readonly />
                    <span className="text-sm text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  {/* Detailed ratings */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-xs">
                    <div>Qualidade: <StarRating value={review.service_quality} readonly size="small" /></div>
                    <div>Pontualidade: <StarRating value={review.punctuality} readonly size="small" /></div>
                    <div>Comunicação: <StarRating value={review.communication} readonly size="small" /></div>
                    <div>Custo-benefício: <StarRating value={review.price_value} readonly size="small" /></div>
                  </div>
                  
                  {review.comment && (
                    <p className="text-sm text-gray-700 mb-3">{review.comment}</p>
                  )}

                  {review.would_recommend && (
                    <div className="flex items-center gap-1 mb-3">
                      <ThumbsUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">Recomenda este profissional</span>
                    </div>
                  )}
                  
                  {review.images_urls && review.images_urls.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {review.images_urls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Foto da avaliação ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}