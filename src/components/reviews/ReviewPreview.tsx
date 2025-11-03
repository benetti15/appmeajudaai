import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

interface ReviewPreviewProps {
  rating: number;
  serviceQuality: number;
  communication: number;
  punctuality: number;
  priceValue: number;
  comment: string;
  images: string[];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

export function ReviewPreview({
  rating,
  serviceQuality,
  communication,
  punctuality,
  priceValue,
  comment,
  images,
}: ReviewPreviewProps) {
  return (
    <Card className="bg-muted/30 p-4">
      <h4 className="font-semibold mb-3">Preview da sua avaliação:</h4>
      <div className="space-y-3">
        {/* Overall Rating */}
        <div className="flex items-center gap-2">
          <StarRating rating={rating} />
          <span className="text-sm font-medium">
            {rating.toFixed(1)} de 5 estrelas
          </span>
        </div>

        {/* Detailed Ratings */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Qualidade:</span>
            <StarRating rating={serviceQuality} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Comunicação:</span>
            <StarRating rating={communication} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Pontualidade:</span>
            <StarRating rating={punctuality} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Custo-benefício:</span>
            <StarRating rating={priceValue} />
          </div>
        </div>

        {/* Comment */}
        {comment && (
          <div>
            <h5 className="text-sm font-medium mb-1">Comentário:</h5>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {comment}
            </p>
          </div>
        )}

        {/* Images */}
        {images.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground">
              📷 {images.length} foto{images.length > 1 ? 's' : ''} anexada{images.length > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}