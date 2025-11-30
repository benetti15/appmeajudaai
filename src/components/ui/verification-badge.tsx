import { CheckCircle2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationBadgeProps {
  level: "bronze" | "silver" | "gold" | "verified";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

const levelConfig = {
  bronze: {
    label: "Bronze",
    icon: Shield,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    gradient: "from-orange-400 to-orange-600",
  },
  silver: {
    label: "Prata",
    icon: Shield,
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-300",
    gradient: "from-gray-400 to-gray-600",
  },
  gold: {
    label: "Ouro",
    icon: Shield,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    gradient: "from-yellow-400 to-yellow-600",
  },
  verified: {
    label: "Verificado",
    icon: CheckCircle2,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
    gradient: "from-primary to-accent",
  },
};

const sizeConfig = {
  sm: { icon: "w-4 h-4", text: "text-xs", padding: "px-2 py-1" },
  md: { icon: "w-5 h-5", text: "text-sm", padding: "px-3 py-1.5" },
  lg: { icon: "w-6 h-6", text: "text-base", padding: "px-4 py-2" },
};

export function VerificationBadge({
  level,
  size = "md",
  showLabel = true,
  animated = true,
  className = "",
}: VerificationBadgeProps) {
  const config = levelConfig[level];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 font-medium",
        config.bg,
        config.border,
        sizeStyles.padding,
        animated && "animate-bounce-in hover-scale",
        className
      )}
    >
      <Icon className={cn(sizeStyles.icon, config.color)} />
      {showLabel && (
        <span className={cn(sizeStyles.text, config.color)}>{config.label}</span>
      )}
    </div>
  );
}
