import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface QuickAction {
  icon: LucideIcon;
  title: string;
  description?: string;
  onClick: () => void;
  variant?: "default" | "primary" | "accent" | "gradient";
  badge?: string;
  level?: number;
  xp?: number;
}

interface ModernQuickActionsProps {
  actions: QuickAction[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function ModernQuickActions({ 
  actions, 
  columns = 3,
  className 
}: ModernQuickActionsProps) {
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
  };

  return (
    <div className={cn("grid gap-5", gridCols[columns], className)}>
      {actions.map((action, index) => (
        <ModernActionCard key={index} {...action} index={index} />
      ))}
    </div>
  );
}

interface ModernActionCardProps extends QuickAction {
  index: number;
}

function ModernActionCard({
  icon: Icon,
  title,
  description,
  onClick,
  variant = "default",
  badge,
  level,
  xp,
  index
}: ModernActionCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  const baseStyles = "relative overflow-hidden cursor-pointer transition-all duration-300 rounded-2xl border-2 p-6 group";
  
  const variantStyles = {
    default: "bg-background/60 backdrop-blur-xl border-border/50 hover:border-primary/40 hover:shadow-[0_8px_30px_hsl(var(--primary)/0.15)]",
    primary: "bg-gradient-to-br from-primary to-primary/80 text-white border-primary/50 hover:shadow-[0_8px_30px_hsl(var(--primary)/0.4)]",
    accent: "bg-gradient-to-br from-accent to-accent/80 text-white border-accent/50 hover:shadow-[0_8px_30px_hsl(var(--accent)/0.4)]",
    gradient: "bg-gradient-to-br from-primary via-accent to-primary bg-[length:200%_200%] animate-gradient text-white border-0 hover:shadow-[0_8px_30px_hsl(var(--primary)/0.5)]"
  };

  const iconVariantStyles = {
    default: "bg-gradient-to-br from-primary/15 to-accent/15 text-primary group-hover:from-primary/25 group-hover:to-accent/25",
    primary: "bg-white/20 text-white group-hover:bg-white/30",
    accent: "bg-white/20 text-white group-hover:bg-white/30",
    gradient: "bg-white/20 text-white group-hover:bg-white/30"
  };

  return (
    <div
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={cn(
        baseStyles,
        variantStyles[variant],
        "hover:-translate-y-2 active:scale-[0.98]",
        isPressed && "scale-[0.98]"
      )}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      {/* Glow effect on hover */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity -z-10" />

      <div className="relative space-y-4">
        {/* Header with icon and badge */}
        <div className="flex items-start justify-between">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
            iconVariantStyles[variant]
          )}>
            <Icon className="w-7 h-7" />
          </div>
          
          <div className="flex flex-col items-end gap-1">
            {badge && (
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-500 text-white shadow-lg animate-pulse">
                {badge}
              </span>
            )}
            {level && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                <span className="text-xs font-bold text-yellow-600">Nv.{level}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <h3 className={cn(
            "font-semibold text-lg leading-tight",
            variant === "default" ? "text-foreground" : "text-white"
          )}>
            {title}
          </h3>
          {description && (
            <p className={cn(
              "text-sm leading-relaxed",
              variant === "default" ? "text-muted-foreground" : "text-white/80"
            )}>
              {description}
            </p>
          )}
        </div>

        {/* XP bar gamification */}
        {xp !== undefined && (
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={variant === "default" ? "text-muted-foreground" : "text-white/70"}>
                Progresso
              </span>
              <span className={cn("font-semibold", variant === "default" ? "text-primary" : "text-white")}>
                +{xp} XP
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500"
                style={{ width: `${Math.min(xp, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Corner decoration */}
      <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}