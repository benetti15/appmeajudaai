import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExperienceStars } from "@/components/ui/experience-stars";
import { 
  GripVertical, 
  Pencil, 
  Trash2, 
  Award,
  Zap, 
  Wrench, 
  Snowflake, 
  Home, 
  Paintbrush, 
  HardHat, 
  Sparkles, 
  Leaf,
  Crown
} from "lucide-react";

export interface Specialty {
  id: string;
  category_id: string;
  category_name: string;
  experience_years: number | null;
  description: string | null;
  certifications: string | null;
  hourly_rate: number | null;
  display_order?: number;
}

interface VisualSpecialtyCardProps {
  specialty: Specialty;
  index: number;
  onEdit: (specialty: Specialty) => void;
  onDelete: (id: string) => void;
  isDragging?: boolean;
}

const categoryIcons: Record<string, React.ComponentType<any>> = {
  "Elétrica": Zap,
  "Encanamento": Wrench,
  "Ar Condicionado": Snowflake,
  "Pequenos Reparos": Home,
  "Pintura": Paintbrush,
  "Marcenaria": HardHat,
  "Limpeza": Sparkles,
  "Jardinagem": Leaf,
};

const categoryColors: Record<string, string> = {
  "Elétrica": "from-amber-500/20 to-orange-500/20 border-amber-500/30",
  "Encanamento": "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
  "Ar Condicionado": "from-sky-500/20 to-blue-500/20 border-sky-500/30",
  "Pequenos Reparos": "from-emerald-500/20 to-green-500/20 border-emerald-500/30",
  "Pintura": "from-purple-500/20 to-pink-500/20 border-purple-500/30",
  "Marcenaria": "from-orange-500/20 to-amber-500/20 border-orange-500/30",
  "Limpeza": "from-teal-500/20 to-emerald-500/20 border-teal-500/30",
  "Jardinagem": "from-green-500/20 to-lime-500/20 border-green-500/30",
};

const categoryIconColors: Record<string, string> = {
  "Elétrica": "text-amber-500",
  "Encanamento": "text-blue-500",
  "Ar Condicionado": "text-sky-500",
  "Pequenos Reparos": "text-emerald-500",
  "Pintura": "text-purple-500",
  "Marcenaria": "text-orange-500",
  "Limpeza": "text-teal-500",
  "Jardinagem": "text-green-500",
};

export function VisualSpecialtyCard({ 
  specialty, 
  index, 
  onEdit, 
  onDelete,
}: VisualSpecialtyCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: specialty.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComponent = categoryIcons[specialty.category_name] || Home;
  const gradientClass = categoryColors[specialty.category_name] || "from-primary/20 to-secondary/20 border-primary/30";
  const iconColorClass = categoryIconColors[specialty.category_name] || "text-primary";

  const hasCertifications = specialty.certifications && specialty.certifications.trim().length > 0;
  const isPrincipal = index === 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-xl border-2 bg-gradient-to-br p-4 transition-all duration-300",
        gradientClass,
        isDragging 
          ? "scale-105 shadow-2xl ring-2 ring-primary z-50 rotate-2" 
          : "hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1",
        "backdrop-blur-sm"
      )}
    >
      {/* Principal Badge */}
      {isPrincipal && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
            <Crown className="w-3 h-3" />
            Principal
          </div>
        </div>
      )}

      {/* Drag Handle */}
      <button
        className={cn(
          "absolute top-2 left-2 p-1.5 rounded-lg transition-all duration-200",
          "text-muted-foreground/50 hover:text-primary hover:bg-background/50",
          "cursor-grab active:cursor-grabbing touch-none",
          "opacity-0 group-hover:opacity-100 focus:opacity-100"
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Actions */}
      <div className={cn(
        "absolute top-2 right-2 flex gap-1 transition-all duration-200",
        isPrincipal ? "top-6" : "",
        "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
      )}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 bg-background/80 hover:bg-background shadow-sm"
          onClick={() => onEdit(specialty)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 bg-background/80 hover:bg-destructive hover:text-destructive-foreground shadow-sm"
          onClick={() => onDelete(specialty.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Content */}
      <div className="pt-6">
        {/* Icon and Title */}
        <div className="flex items-start gap-3 mb-3">
          <div className={cn(
            "p-3 rounded-xl bg-background/80 shadow-sm transition-transform duration-200",
            "group-hover:scale-110"
          )}>
            <IconComponent className={cn("h-6 w-6", iconColorClass)} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-base leading-tight mb-1 truncate">
              {specialty.category_name}
            </h4>
            {specialty.experience_years && (
              <ExperienceStars 
                years={specialty.experience_years} 
                size="sm"
                showLabel={true}
              />
            )}
          </div>
        </div>

        {/* Description */}
        {specialty.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {specialty.description}
          </p>
        )}

        {/* Certifications */}
        {hasCertifications && (
          <div className="flex items-center gap-1.5 pt-2 border-t border-border/50">
            <Award className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
            <span className="text-xs text-muted-foreground truncate">
              {specialty.certifications}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
