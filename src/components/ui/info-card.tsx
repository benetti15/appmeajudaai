import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  iconColor?: string;
  className?: string;
}

export function InfoCard({ icon: Icon, label, value, iconColor = "text-primary", className }: InfoCardProps) {
  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-lg bg-muted/50", className)}>
      <div className={cn("p-2 rounded-lg bg-background", iconColor)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold truncate">{value}</p>
      </div>
    </div>
  );
}
