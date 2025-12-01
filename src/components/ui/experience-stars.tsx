import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExperienceStarsProps {
  years: number;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ExperienceStars({ 
  years, 
  maxStars = 5, 
  size = "md",
  showLabel = true,
  className 
}: ExperienceStarsProps) {
  // Map years to stars: 1-2 years = 1 star, 3-4 = 2 stars, 5-7 = 3 stars, 8-10 = 4 stars, 11+ = 5 stars
  const getStarCount = (years: number) => {
    if (years <= 2) return 1;
    if (years <= 4) return 2;
    if (years <= 7) return 3;
    if (years <= 10) return 4;
    return 5;
  };

  const filledStars = Math.min(getStarCount(years), maxStars);
  
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  const gapClasses = {
    sm: "gap-0.5",
    md: "gap-1",
    lg: "gap-1.5"
  };

  return (
    <div className={cn("flex items-center", gapClasses[size], className)}>
      <div className="flex">
        {Array.from({ length: maxStars }).map((_, index) => (
          <Star
            key={index}
            className={cn(
              sizeClasses[size],
              "transition-all duration-200",
              index < filledStars 
                ? "fill-amber-400 text-amber-400" 
                : "fill-muted text-muted-foreground/30"
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground ml-1">
          {years} {years === 1 ? "ano" : "anos"}
        </span>
      )}
    </div>
  );
}
