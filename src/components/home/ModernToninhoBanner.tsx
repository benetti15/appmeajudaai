import { X, ChevronRight, Zap } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface ModernToninhoBannerProps {
  message: string;
  action?: string;
  actionPath?: string;
  dismissible?: boolean;
  variant?: "info" | "tip" | "warning" | "success" | "premium";
  onActionClick?: () => void;
}

export function ModernToninhoBanner({
  message,
  action,
  actionPath,
  dismissible = true,
  variant = "tip",
  onActionClick
}: ModernToninhoBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  if (!isVisible) return null;

  const variantStyles = {
    info: "from-blue-50 to-blue-50/50 border-blue-200",
    tip: "from-secondary to-secondary/50 border-primary/20",
    warning: "from-amber-50 to-amber-50/50 border-amber-200",
    success: "from-secondary to-secondary/50 border-primary/30",
    premium: "from-secondary to-secondary/50 border-primary/30"
  };

  const handleAction = () => {
    if (onActionClick) {
      onActionClick();
    } else if (actionPath) {
      navigate(actionPath);
    }
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-2xl border backdrop-blur-sm animate-fade-in",
        "bg-gradient-to-r",
        variantStyles[variant],
        "transition-all duration-200",
        isHovered && "shadow-md"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Subtle shimmer */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_4s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      
      <div className="relative flex items-center gap-4 p-4">
        {/* Toninho IA Avatar */}
        <div className="flex-shrink-0 relative">
          <img 
            src="/toninho-ia-logo.png" 
            alt="Toninho IA" 
            className={cn(
              "w-12 h-12 rounded-2xl shadow-md",
              "transition-transform duration-200",
              isHovered && "scale-105"
            )}
          />
          {/* Online indicator */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background flex items-center justify-center">
            <Zap className="w-2 h-2 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Toninho IA
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-full">
              DICA
            </span>
          </div>
          <p className="text-sm font-medium leading-relaxed text-foreground">
            {message}
          </p>
          
          {action && (
            <button
              onClick={handleAction}
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover transition-colors group"
            >
              {action}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        {/* Dismiss button */}
        {dismissible && (
          <button
            onClick={() => setIsVisible(false)}
            className="flex-shrink-0 p-2 rounded-xl hover:bg-foreground/5 transition-colors group"
            aria-label="Dispensar"
          >
            <X className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        )}
      </div>
    </div>
  );
}