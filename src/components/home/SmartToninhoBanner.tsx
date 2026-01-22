import { X, ChevronRight, ChevronLeft, Zap } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useSmartTips } from "@/hooks/useSmartTips";

interface SmartToninhoBannerProps {
  dismissible?: boolean;
}

export function SmartToninhoBanner({ dismissible = true }: SmartToninhoBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();
  
  const { currentTip, totalTips, currentIndex, nextTip, prevTip } = useSmartTips();

  if (!isVisible || !currentTip) return null;

  const variantStyles = {
    info: "from-blue-50 to-blue-50/50 border-blue-200",
    tip: "from-secondary to-secondary/50 border-primary/20",
    warning: "from-amber-50 to-amber-50/50 border-amber-200",
    success: "from-secondary to-secondary/50 border-primary/30",
    premium: "from-gradient-start/10 to-gradient-end/10 border-primary/40"
  };

  const categoryIcons: Record<string, string> = {
    onboarding: '🎯',
    engagement: '💡',
    growth: '📈',
    reminder: '⏰',
    celebration: '🎉'
  };

  const handleAction = () => {
    if (currentTip.actionPath) {
      navigate(currentTip.actionPath);
    }
  };

  const handleNavigation = (direction: 'next' | 'prev') => {
    setIsAnimating(true);
    setTimeout(() => {
      if (direction === 'next') {
        nextTip();
      } else {
        prevTip();
      }
      setTimeout(() => setIsAnimating(false), 50);
    }, 150);
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-2xl border backdrop-blur-sm",
        "bg-gradient-to-r",
        variantStyles[currentTip.variant],
        "transition-all duration-300",
        isHovered && "shadow-lg scale-[1.01]"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Subtle shimmer */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_4s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      
      {/* Premium glow for celebration tips */}
      {currentTip.variant === 'premium' && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5 animate-pulse" />
      )}
      
      <div className="relative flex items-center gap-3 md:gap-4 p-3 md:p-4">
        {/* Navigation arrows (left) - only show on hover for desktop */}
        {totalTips > 1 && (
          <button
            onClick={() => handleNavigation('prev')}
            className={cn(
              "flex-shrink-0 p-1.5 rounded-full bg-foreground/5 hover:bg-foreground/10 transition-all",
              "opacity-0 group-hover:opacity-100 md:opacity-100"
            )}
            aria-label="Dica anterior"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {/* Toninho IA Avatar */}
        <div className="flex-shrink-0 relative">
          <img 
            src="/toninho-ia-logo.png" 
            alt="Toninho IA" 
            className={cn(
              "w-10 h-10 md:w-12 md:h-12 rounded-2xl shadow-md",
              "transition-transform duration-200",
              isHovered && "scale-105"
            )}
          />
          {/* Category indicator */}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-background rounded-full border-2 border-background flex items-center justify-center text-xs">
            {categoryIcons[currentTip.category] || '💚'}
          </div>
        </div>

        {/* Content */}
        <div className={cn(
          "flex-1 min-w-0 transition-all duration-150",
          isAnimating && "opacity-0 translate-x-2"
        )}>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Toninho IA
            </span>
            <span className={cn(
              "px-1.5 py-0.5 text-[10px] font-bold rounded-full",
              currentTip.variant === 'warning' 
                ? "bg-amber-100 text-amber-700"
                : currentTip.variant === 'premium'
                ? "bg-gradient-to-r from-primary/20 to-accent/20 text-primary"
                : "bg-primary/10 text-primary"
            )}>
              {currentTip.category === 'reminder' ? 'LEMBRETE' : 
               currentTip.category === 'celebration' ? 'PARABÉNS' :
               currentTip.category === 'warning' ? 'ATENÇÃO' : 'DICA'}
            </span>
            {/* Tip counter */}
            {totalTips > 1 && (
              <span className="text-[10px] text-muted-foreground ml-auto hidden md:block">
                {currentIndex + 1}/{totalTips}
              </span>
            )}
          </div>
          <p className="text-sm font-medium leading-relaxed text-foreground line-clamp-2">
            {currentTip.message}
          </p>
          
          {currentTip.action && (
            <button
              onClick={handleAction}
              className="mt-1.5 md:mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
            >
              {currentTip.action}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        {/* Navigation arrows (right) */}
        {totalTips > 1 && (
          <button
            onClick={() => handleNavigation('next')}
            className="flex-shrink-0 p-1.5 rounded-full bg-foreground/5 hover:bg-foreground/10 transition-all"
            aria-label="Próxima dica"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {/* Dismiss button */}
        {dismissible && (
          <button
            onClick={() => setIsVisible(false)}
            className="flex-shrink-0 p-1.5 md:p-2 rounded-xl hover:bg-foreground/5 transition-colors group"
            aria-label="Dispensar"
          >
            <X className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        )}
      </div>

      {/* Progress dots for mobile */}
      {totalTips > 1 && (
        <div className="flex justify-center gap-1.5 pb-2 md:hidden">
          {Array.from({ length: Math.min(totalTips, 5) }).map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                idx === currentIndex % 5
                  ? "bg-primary w-3"
                  : "bg-primary/30"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
