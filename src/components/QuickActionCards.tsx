import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuickAction {
  icon: LucideIcon;
  title: string;
  description?: string;
  onClick: () => void;
  variant?: "default" | "primary" | "accent";
  badge?: string;
}

interface QuickActionCardsProps {
  actions: QuickAction[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function QuickActionCards({ 
  actions, 
  columns = 3,
  className 
}: QuickActionCardsProps) {
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {actions.map((action, index) => (
        <QuickActionCard key={index} {...action} />
      ))}
    </div>
  );
}

function QuickActionCard({
  icon: Icon,
  title,
  description,
  onClick,
  variant = "default",
  badge
}: QuickAction) {
  const variantStyles = {
    default: "hover:border-primary/50 hover:shadow-primary/10",
    primary: "bg-gradient-to-br from-primary to-primary/80 text-white border-primary hover:shadow-primary/30",
    accent: "bg-gradient-to-br from-accent to-accent/80 text-white border-accent hover:shadow-accent/30"
  };

  const iconVariantStyles = {
    default: "bg-gradient-to-br from-primary/10 to-accent/10 text-primary",
    primary: "bg-white/20 text-white",
    accent: "bg-white/20 text-white"
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden cursor-pointer transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-xl",
        "border-2 p-6",
        variantStyles[variant]
      )}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative space-y-3">
        {/* Icon with badge */}
        <div className="flex items-start justify-between">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
            iconVariantStyles[variant]
          )}>
            <Icon className="w-6 h-6" />
          </div>
          
          {badge && (
            <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-500 text-white animate-pulse">
              {badge}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="space-y-1">
          <h3 className="font-semibold text-lg leading-tight">
            {title}
          </h3>
          {description && (
            <p className={cn(
              "text-sm",
              variant === "default" ? "text-muted-foreground" : "text-white/80"
            )}>
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Hover effect shine */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    </Card>
  );
}
