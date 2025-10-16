import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Star, Camera } from "lucide-react";
import { PhotoUpload } from "@/components/ui/photo-upload";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  images_urls: string[] | null;
  reviewer: {
    full_name: string;
  };
}

interface ReviewSystemProps {
  requestId?: string;
  professionalId: string;
  canReview?: boolean;
  showReviews?: boolean;
}

export function ReviewSystem({ requestId, professionalId, canReview = false, showReviews = true }: ReviewSystemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (showReviews) {
      fetchReviews();
    }
  }, [professionalId, showReviews]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          comment,
          created_at,
          images_urls,
          reviewer:profiles!reviews_reviewer_id_fkey(full_name)
        `)
        .eq("reviewed_id", professionalId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error("Erro ao buscar avaliações:", error);
    }
  };

  const submitReview = async () => {
    if (!user || rating === 0) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("reviews")
        .insert({
          reviewer_id: user.id,
          reviewed_id: professionalId,
          request_id: requestId,
          rating,
          comment: comment.trim() || null,
          images_urls: images.length > 0 ? images : null,
        });

      if (error) throw error;

      toast({
        title: "Avaliação enviada!",
        description: "Sua avaliação foi registrada com sucesso.",
      });

      setDialogOpen(false);
      setRating(0);
      setComment("");
      setImages([]);
      fetchReviews();
    } catch (error) {
      console.error("Erro ao enviar avaliação:", error);
      toast({
        title: "Erro ao enviar avaliação",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const StarRating = ({ value, onChange, readonly = false }: { value: number, onChange?: (value: number) => void, readonly?: boolean }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-6 h-6 cursor-pointer transition-colors ${
            star <= value ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          }`}
          onClick={() => !readonly && onChange?.(star)}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Review Summary */}
      {showReviews && reviews.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{averageRating.toFixed(1)}</div>
              <StarRating value={averageRating} readonly />
              <div className="text-sm text-muted-foreground mt-1">
                {reviews.length} avaliação{reviews.length !== 1 ? 'ões' : ''}
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviews.filter(r => r.rating === stars).length;
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-2 text-sm">
                    <span className="w-12">{stars} ★</span>
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
          </div>
        </Card>
      )}

      {/* Add Review Button */}
      {canReview && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Star className="w-4 h-4 mr-2" />
              Avaliar Profissional
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Avaliar Profissional</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="text-center">
                <div className="mb-2 text-sm text-muted-foreground">Como foi o serviço?</div>
                <StarRating value={rating} onChange={setRating} />
              </div>
              
              <Textarea
                placeholder="Conte sobre sua experiência (opcional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />

              <div>
                <div className="mb-2 text-sm font-medium">Fotos do resultado (opcional)</div>
                <PhotoUpload
                  onImageUploaded={(url) => setImages(prev => [...prev, url])}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1"
                  onClick={submitReview}
                  disabled={loading || rating === 0}
                >
                  {loading ? "Enviando..." : "Enviar Avaliação"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Reviews List */}
      {showReviews && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-medium">
                    {review.reviewer.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{review.reviewer.full_name}</span>
                    <StarRating value={review.rating} readonly />
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {new Date(review.created_at).toLocaleDateString('pt-BR')}
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-700 mb-3">{review.comment}</p>
                  )}
                  {review.images_urls && review.images_urls.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {review.images_urls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Foto da avaliação ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
          
          {reviews.length === 0 && showReviews && (
            <Card className="p-8 text-center">
              <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-muted-foreground">
                Ainda não há avaliações para este profissional.
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}