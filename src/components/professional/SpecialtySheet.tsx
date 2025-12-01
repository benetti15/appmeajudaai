import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ExperienceStars } from "@/components/ui/experience-stars";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Save, 
  Zap, 
  Wrench, 
  Snowflake, 
  Home, 
  Paintbrush, 
  HardHat, 
  Sparkles, 
  Leaf,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string | null;
}

interface Specialty {
  id: string;
  category_id: string;
  category_name: string;
  experience_years: number | null;
  description: string | null;
  certifications: string | null;
  hourly_rate: number | null;
}

interface SpecialtySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specialty: Specialty | null;
  categories: ServiceCategory[];
  availableCategories: ServiceCategory[];
  saving: boolean;
  onSave: (data: {
    category_id: string;
    experience_years: string;
    description: string;
    certifications: string;
  }) => void;
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
  "Elétrica": "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  "Encanamento": "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  "Ar Condicionado": "border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  "Pequenos Reparos": "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  "Pintura": "border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-400",
  "Marcenaria": "border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-400",
  "Limpeza": "border-teal-500 bg-teal-500/10 text-teal-700 dark:text-teal-400",
  "Jardinagem": "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400",
};

export function SpecialtySheet({
  open,
  onOpenChange,
  specialty,
  categories,
  availableCategories,
  saving,
  onSave,
}: SpecialtySheetProps) {
  const [formData, setFormData] = useState({
    category_id: "",
    experience_years: "",
    description: "",
    certifications: "",
  });

  useEffect(() => {
    if (specialty) {
      setFormData({
        category_id: specialty.category_id,
        experience_years: specialty.experience_years?.toString() || "",
        description: specialty.description || "",
        certifications: specialty.certifications || "",
      });
    } else {
      setFormData({
        category_id: "",
        experience_years: "",
        description: "",
        certifications: "",
      });
    }
  }, [specialty, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const isEditing = !!specialty;
  const categoriesToShow = isEditing ? categories : availableCategories;
  const experienceYears = parseInt(formData.experience_years) || 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl">
            {isEditing ? "Editar Especialidade" : "Nova Especialidade"}
          </SheetTitle>
          <SheetDescription>
            {isEditing 
              ? "Atualize os detalhes da sua especialidade"
              : "Adicione uma nova área de atuação ao seu perfil"
            }
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Categoria {!isEditing && <span className="text-destructive">*</span>}
            </Label>
            
            {isEditing ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                {(() => {
                  const cat = categories.find(c => c.id === formData.category_id);
                  const IconComponent = categoryIcons[cat?.name || ""] || Home;
                  return (
                    <>
                      <IconComponent className="h-5 w-5 text-primary" />
                      <span className="font-medium">{cat?.name}</span>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {categoriesToShow.map((cat) => {
                  const IconComponent = categoryIcons[cat.name] || Home;
                  const isSelected = formData.category_id === cat.id;
                  const colorClass = categoryColors[cat.name] || "border-primary bg-primary/10";

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, category_id: cat.id })}
                      className={cn(
                        "relative flex items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200",
                        "hover:scale-[1.02] active:scale-[0.98]",
                        isSelected 
                          ? cn(colorClass, "ring-2 ring-offset-2 ring-primary")
                          : "border-border hover:border-muted-foreground/50 bg-background"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground rounded-full p-0.5">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                      <IconComponent className={cn(
                        "h-5 w-5 flex-shrink-0",
                        isSelected ? "" : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "text-sm font-medium truncate",
                        isSelected ? "" : "text-muted-foreground"
                      )}>
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Experience Years with Stars Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="experience" className="text-sm font-medium">
                Anos de Experiência <span className="text-destructive">*</span>
              </Label>
              {experienceYears > 0 && (
                <ExperienceStars years={experienceYears} size="md" showLabel={false} />
              )}
            </div>
            <div className="relative">
              <Input
                id="experience"
                type="number"
                min="1"
                max="50"
                placeholder="Ex: 5"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                className="pr-16"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                anos
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Quanto mais experiência, mais estrelas você ganha no perfil
            </p>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-sm font-medium">
              Descrição da Experiência <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Descreva sua experiência nesta área, tipos de serviços que realiza, projetos relevantes..."
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="resize-none"
              required
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Seja específico sobre seus pontos fortes</span>
              <span>{formData.description.length}/500</span>
            </div>
          </div>

          {/* Certifications */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="certifications" className="text-sm font-medium">
                Certificações
              </Label>
              <Badge variant="outline" className="text-xs">
                Opcional
              </Badge>
            </div>
            <Textarea
              id="certifications"
              placeholder="Ex: NR-10, NR-35, Curso de Eletricista Industrial SENAI..."
              rows={3}
              value={formData.certifications}
              onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Certificações aumentam a confiança dos clientes
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || !formData.category_id || !formData.experience_years || !formData.description}
              className="flex-1 bg-gradient-to-r from-primary to-primary/80"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? "Atualizar" : "Adicionar"}
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
