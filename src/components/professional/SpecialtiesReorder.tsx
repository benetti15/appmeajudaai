import { useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, ArrowUp, ArrowDown, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Zap, Wrench, Snowflake, Home, Paintbrush, HardHat, Sparkles, Leaf } from "lucide-react";

interface Specialty {
  id: string;
  category_id: string;
  category_name: string;
  experience_years: number | null;
  description: string | null;
  certifications: string | null;
  display_order: number;
}

interface SpecialtiesReorderProps {
  specialties: Specialty[];
  onReorder: (reorderedSpecialties: Specialty[]) => void;
  onEdit: (specialty: Specialty) => void;
  onDelete: (id: string) => void;
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

function SortableItem({ 
  specialty, 
  index, 
  totalCount, 
  onMoveUp, 
  onMoveDown, 
  onEdit, 
  onDelete 
}: { 
  specialty: Specialty;
  index: number;
  totalCount: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
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
    opacity: isDragging ? 0.5 : 1,
  };

  const IconComponent = categoryIcons[specialty.category_name] || Home;

  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      className={`border-2 transition-all ${isDragging ? 'border-primary shadow-lg' : 'hover:border-primary/50'}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <button
            className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>

          {/* Icon */}
          <div className="p-2 bg-primary/10 rounded-lg">
            <IconComponent className="h-6 w-6 text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-lg">{specialty.category_name}</h4>
              {index === 0 && (
                <Badge variant="default" className="text-xs">
                  Principal
                </Badge>
              )}
            </div>
            <div className="flex gap-2 mb-2">
              {specialty.experience_years && (
                <Badge variant="secondary" className="text-xs">
                  {specialty.experience_years} {specialty.experience_years === 1 ? "ano" : "anos"}
                </Badge>
              )}
            </div>
            {specialty.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {specialty.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1">
            {/* Mobile arrows */}
            <div className="flex md:hidden gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveUp}
                disabled={index === 0}
                className="h-8 w-8 p-0"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveDown}
                disabled={index === totalCount - 1}
                className="h-8 w-8 p-0"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Edit and Delete */}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-8 w-8 p-0"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive/90"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SpecialtiesReorder({ 
  specialties, 
  onReorder, 
  onEdit, 
  onDelete 
}: SpecialtiesReorderProps) {
  const [items, setItems] = useState(specialties);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      await saveOrder(newItems);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newItems = arrayMove(items, index, index - 1);
    setItems(newItems);
    await saveOrder(newItems);
  };

  const handleMoveDown = async (index: number) => {
    if (index === items.length - 1) return;
    const newItems = arrayMove(items, index, index + 1);
    setItems(newItems);
    await saveOrder(newItems);
  };

  const saveOrder = async (orderedItems: Specialty[]) => {
    setIsSaving(true);
    try {
      const updates = orderedItems.map((item, index) => ({
        id: item.id,
        display_order: index,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('professional_specialties')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (error) throw error;
      }

      onReorder(orderedItems);
      toast.success("Ordem atualizada com sucesso!");
    } catch (error) {
      console.error("Error saving order:", error);
      toast.error("Erro ao salvar ordem");
      setItems(specialties); // Revert on error
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-muted/50 p-4 rounded-lg border">
        <p className="text-sm text-muted-foreground">
          📌 <strong>Dica:</strong> A primeira especialidade é destacada como sua <strong>principal</strong> no perfil público. 
          Arraste para reordenar ou use os botões ↑/↓ no mobile.
        </p>
      </div>

      {isSaving && (
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground">Salvando ordem...</p>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {items.map((specialty, index) => (
              <SortableItem
                key={specialty.id}
                specialty={specialty}
                index={index}
                totalCount={items.length}
                onMoveUp={() => handleMoveUp(index)}
                onMoveDown={() => handleMoveDown(index)}
                onEdit={() => onEdit(specialty)}
                onDelete={() => onDelete(specialty.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}