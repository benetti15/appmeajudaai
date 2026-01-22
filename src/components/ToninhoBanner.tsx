import { X } from "lucide-react";
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
    info: "bg-muted border-border text-foreground",
    tip: "bg-secondary border-primary/20 text-foreground",
    warning: "bg-[hsl(48_96%_89%)] border-warning/30 text-[hsl(28_72%_35%)]",
    success: "bg-secondary border-primary/30 text-foreground"
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 animate-fade-in",
        variantStyles[variant]
      )}
    >
      <div className="relative flex items-start gap-3">
        {/* Toninho IA Icon */}
        <img 
          src="/toninho-ia-logo.png" 
          alt="Toninho IA" 
          className="flex-shrink-0 w-10 h-10 rounded-xl shadow-sm"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-relaxed">
            {message}
          </p>
          
          {action && onActionClick && (
            <button
              onClick={onActionClick}
              className="mt-2 text-sm font-semibold text-primary hover:text-primary-hover underline hover:no-underline transition-all"
            >
              {action}
            </button>
          )}
        </div>

        {/* Dismiss button */}
        {dismissible && (
          <button
            onClick={() => setIsVisible(false)}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-foreground/5 transition-colors"
            aria-label="Dispensar"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}