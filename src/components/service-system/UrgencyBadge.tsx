import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Zap } from "lucide-react";

interface UrgencyBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function UrgencyBadge({ 
  level, 
  size = 'md', 
  showIcon = true, 
  className = "" 
}: UrgencyBadgeProps) {
  const getUrgencyConfig = (urgencyLevel: number) => {
    switch (urgencyLevel) {
      case 1:
        return {
          label: "Baixa Urgência",
          variant: "secondary" as const,
          icon: Clock,
          bgColor: "bg-green-100 border-green-300",
          textColor: "text-green-800",
          iconColor: "text-green-600"
        };
      case 2:
        return {
          label: "Urgência Média",
          variant: "default" as const,
          icon: AlertTriangle,
          bgColor: "bg-amber-100 border-amber-300",
          textColor: "text-amber-800",
          iconColor: "text-amber-600"
        };
      case 3:
        return {
          label: "Alta Urgência",
          variant: "destructive" as const,
          icon: Zap,
          bgColor: "bg-red-100 border-red-300",
          textColor: "text-red-800",
          iconColor: "text-red-600"
        };
      default:
        return {
          label: "Urgência Não Definida",
          variant: "outline" as const,
          icon: Clock,
          bgColor: "bg-gray-100 border-gray-300",
          textColor: "text-gray-800",
          iconColor: "text-gray-600"
        };
    }
  };

  const config = getUrgencyConfig(level);
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5", 
    lg: "text-base px-4 py-2"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  // Para alta urgência, aplicar animação
  const animationClass = level === 3 ? "animate-pulse" : "";

  return (
    <Badge 
      className={`
        ${config.bgColor} 
        ${config.textColor} 
        ${sizeClasses[size]} 
        ${animationClass}
        border-2 
        font-semibold 
        gap-1.5 
        ${className}
      `}
    >
      {showIcon && <Icon className={`${iconSizes[size]} ${config.iconColor}`} />}
      {level === 3 ? "URGENTE!" : config.label}
    </Badge>
  );
}