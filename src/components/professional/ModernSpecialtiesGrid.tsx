import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VisualSpecialtyCard, Specialty } from "./VisualSpecialtyCard";
import { SpecialtySheet } from "./SpecialtySheet";
import { toast } from "sonner";
import { Loader2, Plus, Award, Sparkles, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string | null;
}

export function ModernSpecialtiesGrid() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("service_categories")
        .select("*")
        .order("name");

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      const { data: specialtiesData, error: specialtiesError } = await supabase
        .from("professional_specialties")
        .select(`
          id,
          category_id,
          experience_years,
          description,
          certifications,
          hourly_rate,
          display_order,
          service_categories!professional_specialties_category_id_fkey(name)
        `)
        .eq("professional_id", user?.id)
        .order("display_order");

      if (specialtiesError) throw specialtiesError;
      
      const formattedSpecialties = specialtiesData?.map((item: any) => ({
        id: item.id,
        category_id: item.category_id,
        category_name: item.service_categories?.name || "",
        experience_years: item.experience_years,
        description: item.description,
        certifications: item.certifications,
        hourly_rate: item.hourly_rate,
        display_order: item.display_order || 0,
      })) || [];
      
      setSpecialties(formattedSpecialties);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar especialidades");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = specialties.findIndex((item) => item.id === active.id);
      const newIndex = specialties.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(specialties, oldIndex, newIndex);
      setSpecialties(newItems);
      
      // Save new order
      try {
        const updates = newItems.map((item, index) => ({
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

        toast.success("Ordem atualizada!");
      } catch (error) {
        console.error("Error saving order:", error);
        toast.error("Erro ao salvar ordem");
        fetchData(); // Revert on error
      }
    }
  };

  const handleAddClick = () => {
    setEditingSpecialty(null);
    setIsSheetOpen(true);
  };

  const handleEditClick = (specialty: Specialty) => {
    setEditingSpecialty(specialty);
    setIsSheetOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    try {
      const { error } = await supabase
        .from("professional_specialties")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Especialidade removida!");
      await fetchData();
    } catch (error) {
      console.error("Error deleting specialty:", error);
      toast.error("Erro ao remover especialidade");
    }
  };

  const handleSave = async (formData: {
    category_id: string;
    experience_years: string;
    description: string;
    certifications: string;
  }) => {
    if (!formData.category_id) {
      toast.error("Selecione uma categoria");
      return;
    }

    if (!formData.experience_years || parseInt(formData.experience_years) <= 0) {
      toast.error("Informe os anos de experiência");
      return;
    }

    if (!formData.description || formData.description.trim() === "") {
      toast.error("Informe uma descrição");
      return;
    }

    setSaving(true);
    try {
      const specialtyData = {
        professional_id: user?.id,
        category_id: formData.category_id,
        experience_years: parseInt(formData.experience_years),
        description: formData.description,
        certifications: formData.certifications || null,
        display_order: editingSpecialty ? editingSpecialty.display_order : specialties.length,
      };

      if (editingSpecialty) {
        const { error } = await supabase
          .from("professional_specialties")
          .update(specialtyData)
          .eq("id", editingSpecialty.id);

        if (error) throw error;
        toast.success("Especialidade atualizada!");
      } else {
        const { error } = await supabase
          .from("professional_specialties")
          .insert(specialtyData);

        if (error) throw error;
        toast.success("Especialidade adicionada!");
      }

      setIsSheetOpen(false);
      setEditingSpecialty(null);
      await fetchData();
    } catch (error) {
      console.error("Error saving specialty:", error);
      toast.error("Erro ao salvar especialidade");
    } finally {
      setSaving(false);
    }
  };

  const availableCategories = categories.filter(
    cat => !specialties.some(spec => spec.category_id === cat.id)
  );

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando especialidades...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="h-5 w-5 text-primary" />
                Minhas Especialidades
              </CardTitle>
              <CardDescription>
                Adicione suas áreas de atuação para aparecer nas buscas dos clientes
              </CardDescription>
            </div>
            <Button
              onClick={handleAddClick}
              disabled={availableCategories.length === 0}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {specialties.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/20">
              <Award className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma especialidade cadastrada</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Adicione suas especialidades para que os clientes encontrem você nas buscas e conheçam sua experiência
              </p>
              <Button 
                onClick={handleAddClick}
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar primeira especialidade
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Drag hint */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <GripVertical className="h-4 w-4" />
                <span>
                  <strong>Dica:</strong> Arraste os cards para reordenar. A primeira especialidade aparece em destaque.
                </span>
              </div>

              {/* Grid with Drag and Drop */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={specialties.map(item => item.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className={cn(
                    "grid gap-4",
                    specialties.length === 1 
                      ? "grid-cols-1" 
                      : "grid-cols-1 md:grid-cols-2"
                  )}>
                    {specialties.map((specialty, index) => (
                      <VisualSpecialtyCard
                        key={specialty.id}
                        specialty={specialty}
                        index={index}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Add more hint */}
              {availableCategories.length > 0 && (
                <button
                  onClick={handleAddClick}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 border-dashed border-muted-foreground/20",
                    "text-muted-foreground hover:text-primary hover:border-primary/50",
                    "transition-all duration-200 hover:bg-primary/5",
                    "flex items-center justify-center gap-2"
                  )}
                >
                  <Plus className="h-5 w-5" />
                  <span className="font-medium">Adicionar mais especialidades</span>
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <SpecialtySheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        specialty={editingSpecialty}
        categories={categories}
        availableCategories={availableCategories}
        saving={saving}
        onSave={handleSave}
      />
    </>
  );
}
