import { X, Sparkles } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ToninhoBannerProps {
  message: string;
  action?: string;
  dismissible?: boolean;
  variant?: "info" | "tip" | "warning" | "success";
  onActionClick?: () => void;
}

export function ToninhoBanner({
  message,
  action,
  dismissible = true,
  variant = "info",
  onActionClick
}: ToninhoBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const variantStyles = {
    info: "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20 text-blue-900",
    tip: "bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 text-primary",
    warning: "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-900",
    success: "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20 text-green-900"
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-xl border-2 p-4 backdrop-blur-sm animate-fade-in shadow-lg",
        variantStyles[variant]
      )}
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
      
      <div className="relative flex items-start gap-3">
        {/* Toninho Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg animate-pulse">
          <Sparkles className="w-5 h-5 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-relaxed">
            {message}
          </p>
          
          {action && onActionClick && (
            <button
              onClick={onActionClick}
              className="mt-2 text-sm font-semibold underline hover:no-underline transition-all"
            >
              {action}
            </button>
          )}
        </div>

        {/* Dismiss button */}
        {dismissible && (
          <button
            onClick={() => setIsVisible(false)}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
            aria-label="Dispensar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
