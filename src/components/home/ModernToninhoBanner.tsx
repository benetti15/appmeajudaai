import { X, Sparkles, ChevronRight, Zap } from "lucide-react";
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
    info: "from-blue-500/10 via-cyan-500/5 to-blue-500/10 border-blue-500/20",
    tip: "from-primary/10 via-accent/5 to-primary/10 border-primary/20",
    warning: "from-amber-500/10 via-orange-500/5 to-amber-500/10 border-amber-500/20",
    success: "from-green-500/10 via-emerald-500/5 to-green-500/10 border-green-500/20",
    premium: "from-purple-500/10 via-pink-500/5 to-purple-500/10 border-purple-500/20"
  };

  const iconColors = {
    info: "from-blue-500 to-cyan-500",
    tip: "from-primary to-accent",
    warning: "from-amber-500 to-orange-500",
    success: "from-green-500 to-emerald-500",
    premium: "from-purple-500 to-pink-500"
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
        "relative overflow-hidden rounded-2xl border-2 backdrop-blur-xl animate-fade-in",
        "bg-gradient-to-r",
        variantStyles[variant],
        "transition-all duration-300",
        isHovered && "shadow-lg scale-[1.01]"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background shimmer */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full animate-float"
            style={{
              left: `${20 + i * 20}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      
      <div className="relative flex items-center gap-4 p-4">
        {/* Toninho Avatar with animation */}
        <div className="flex-shrink-0 relative">
          <div className={cn(
            "w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg",
            iconColors[variant],
            "transition-transform duration-300",
            isHovered && "scale-110 rotate-3"
          )}>
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          {/* Pulse ring */}
          <div className={cn(
            "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-50 animate-ping",
            iconColors[variant]
          )} style={{ animationDuration: '2s' }} />
          
          {/* Online indicator */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
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
          <p className="text-sm font-medium leading-relaxed text-foreground/90">
            {message}
          </p>
          
          {action && (
            <button
              onClick={handleAction}
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
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